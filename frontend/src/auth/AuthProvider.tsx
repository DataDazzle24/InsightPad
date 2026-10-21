import { useCallback, useEffect, useMemo, useRef, useState, type ReactNode } from 'react'
import {
  browserLocalPersistence,
  onIdTokenChanged,
  sendPasswordResetEmail,
  setPersistence,
  signInWithEmailAndPassword,
  signOut as firebaseSignOut,
  type User,
} from 'firebase/auth'
import { executeMutation, executeQuery, getDataConnect, mutationRef, queryRef } from 'firebase/data-connect'
import {
  connectorConfig,
  getCurrentUser,
  getCurrentUserAccess,
} from '@insightpad/dataconnect'
import { auth, firebaseApp } from '../lib/firebase'
import { resolvePermissions, type PermissionMap } from './access-control'
import {
  AuthContext,
  type AuthContextValue,
  type AuthStatus,
  type UserProfile,
} from './auth-context'

interface AuthProviderProps { children: ReactNode }

const dataConnect = getDataConnect(firebaseApp, connectorConfig)
const ACCESS_RECHECK_MS = 30_000
let pendingSessionClaim = false
let firebaseExit:Promise<void>|null=null
let signInAttempt:{generation:number;settled:Promise<void>}|null=null
let sessionGeneration = 0
// Revalidation must not compete with an actor whose logout is draining a claim.
let closingSession: {user:User|null;generation:number}|null = null
const isClosing=(user:User)=>closingSession?.generation===sessionGeneration&&closingSession.user===user
let sessionValidation: {uid:string;generation:number;promise:Promise<void>} | null = null
const deviceId=()=>{const key='insightpad.device.id';let value=localStorage.getItem(key);if(!value){value=`${crypto.randomUUID()}${crypto.randomUUID()}`;localStorage.setItem(key,value)}return value}
const sessionKey=(uid:string)=>`insightpad.device.session:${uid}`
const deviceName=()=>`${navigator.platform||'Dispositivo'} · ${navigator.userAgent.slice(0,120)}`
async function endFirebaseAuthentication(user:User|null,generation:number){
  if(generation!==sessionGeneration||auth.currentUser!==user)return
  const task=firebaseSignOut(auth);firebaseExit=task
  try{await task}finally{if(firebaseExit===task)firebaseExit=null}
}
async function releaseSession(token:string){
  const result=await executeMutation(mutationRef(dataConnect,'ReleaseDeviceSession',{sessionToken:token}))
  if((result.data as {_execute?:number})._execute!==1)throw new Error('Liberação remota não confirmada.')
}
async function validateExclusiveSession(user:User){
  if(sessionValidation?.uid===user.uid&&sessionValidation.generation===sessionGeneration)return sessionValidation.promise
  const generation=sessionGeneration
  const run=async()=>{
    const key=sessionKey(user.uid),token=localStorage.getItem(key)||''
    if(pendingSessionClaim){
      pendingSessionClaim=false
      const result=await executeMutation(mutationRef(dataConnect,'ClaimDeviceSession',{deviceId:deviceId(),deviceName:deviceName()}))
      const issued=(result.data as {query?:{issued?:{token?:unknown}}}).query?.issued?.token
      if(typeof issued!=='string'||!/^[a-f0-9]{64}$/.test(issued))throw new Error('DEVICE_SESSION_UNCONFIRMED')
      if(auth.currentUser?.uid!==user.uid){
        // A different actor cannot release this actor's lease. Its remote state is unknown.
        console.warn('Liberação da sessão emitida não confirmada: identidade alterada.')
        return
      }
      // Logout waits for this compensation while Firebase still authenticates the actor.
      if(generation!==sessionGeneration){await releaseSession(issued);return}
      localStorage.setItem(key,issued)
      return
    }
    // Restore/focus never reclaims a missing, legacy or displaced session.
    if(!/^[a-f0-9]{64}$/.test(token))throw new Error('DEVICE_SESSION_REPLACED')
    const result=await executeQuery(queryRef(dataConnect,'ValidateDeviceSession',{sessionToken:token,requestKey:crypto.randomUUID()}))
    const valid=(result.data as {_select?:Array<{valid?:boolean}>})._select?.[0]?.valid
    if(valid!==true)throw new Error(valid===false?'DEVICE_SESSION_REPLACED':'DEVICE_SESSION_UNCONFIRMED')
    if(generation!==sessionGeneration||auth.currentUser!==user||isClosing(user))return
    await executeMutation(mutationRef(dataConnect,'TouchDeviceSession',{sessionToken:token}))
  }
  const promise=run();sessionValidation={uid:user.uid,generation,promise}
  try{await promise}finally{if(sessionValidation?.promise===promise)sessionValidation=null}
}

export function AuthProvider({ children }: AuthProviderProps) {
  const [firebaseUser, setFirebaseUser] = useState<User | null>(null)
  const [profile, setProfile] = useState<UserProfile | null>(null)
  const [permissions, setPermissions] = useState<PermissionMap>({})
  const [status, setStatus] = useState<AuthStatus>('loading')
  const [error, setError] = useState<string | null>(null)
  const validationVersion = useRef(0)

  useEffect(() => {
    let disposed = false

    async function validateAccess(user: User | null, blocking = true) {
      if(user&&isClosing(user))return
      const generation=sessionGeneration
      const attempt=signInAttempt
      if(user&&attempt){
        await attempt.settled
        if(disposed||generation!==sessionGeneration||attempt.generation!==generation||auth.currentUser!==user||isClosing(user))return
      }
      const version = ++validationVersion.current

      if (!user) {
        setFirebaseUser(null)
        setProfile(null)
        setPermissions({})
        setError(null)
        setStatus('unauthenticated')
        return
      }

      setFirebaseUser(user)
      if (blocking) {
        setProfile(null)
        setPermissions({})
        setError(null)
        setStatus('loading')
      }

      try {
        await user.getIdToken()
        const [profileResult, accessResult] = await Promise.all([
          getCurrentUser(dataConnect),
          getCurrentUserAccess(dataConnect),
        ])

        // A troca de conta pode ocorrer enquanto a consulta anterior ainda está em voo.
        // Somente a resposta da identidade Firebase atualmente ativa pode alterar a UI.
        if (
          disposed ||
          version !== validationVersion.current ||
          generation !== sessionGeneration ||
          isClosing(user) ||
          auth.currentUser?.uid !== user.uid
        ) return

        const currentProfile = profileResult.data.user
        const accessUser = accessResult.data.user
        const active =
          Boolean(currentProfile) &&
          Boolean(accessUser) &&
          currentProfile?.id === user.uid &&
          accessUser?.id === user.uid &&
          currentProfile?.active === true &&
          currentProfile?.tenant.active === true &&
          currentProfile?.role.active === true

        if (!active) {
          setProfile(null)
          setPermissions({})
          setStatus('unauthorized')
          setError('Seu acesso ao Insight Pad foi inativado.')
          await endFirebaseAuthentication(user,generation)
          return
        }

        await validateExclusiveSession(user)
        if(disposed || version!==validationVersion.current || generation!==sessionGeneration || isClosing(user) || auth.currentUser!==user)return

        setProfile(currentProfile)
        setPermissions(resolvePermissions(accessUser!))
        setError(null)
        setStatus('authenticated')
      } catch (cause) {
        if (
          disposed ||
          version !== validationVersion.current ||
          generation !== sessionGeneration ||
          isClosing(user) ||
          auth.currentUser?.uid !== user.uid
        ) return

        console.error('Falha ao validar perfil, permissões ou dispositivo:', cause)
        setProfile(null)
        setPermissions({})
        setStatus('unauthorized')
        setError(cause instanceof Error&&cause.message==='DEVICE_SESSION_REPLACED'?'Sua sessão expirou ou foi encerrada. Entre novamente.':'Não foi possível validar o perfil do usuário.')
        await endFirebaseAuthentication(user,generation)
      }
    }

    const unsubscribe = onIdTokenChanged(auth, (user) => {
      void validateAccess(user, true)
    })

    const recheckCurrentAccess = () => {
      if (auth.currentUser) void validateAccess(auth.currentUser, false)
    }

    const onVisibilityChange = () => {
      if (document.visibilityState === 'visible') recheckCurrentAccess()
    }

    window.addEventListener('focus', recheckCurrentAccess)
    document.addEventListener('visibilitychange', onVisibilityChange)
    const interval = window.setInterval(recheckCurrentAccess, ACCESS_RECHECK_MS)

    return () => {
      disposed = true
      validationVersion.current += 1
      window.clearInterval(interval)
      window.removeEventListener('focus', recheckCurrentAccess)
      document.removeEventListener('visibilitychange', onVisibilityChange)
      unsubscribe()
    }
  }, [])

  const canAccess = useCallback(
    (pageKey: string) => permissions[pageKey]?.canAccess === true,
    [permissions],
  )

  async function signIn(email: string, password: string) {
    const generation=++sessionGeneration,previous=signInAttempt
    let settle!:()=>void
    const attempt={generation,settled:new Promise<void>(resolve=>{settle=resolve})}
    signInAttempt=attempt
    validationVersion.current++
    setError(null)
    setStatus('loading')
    try {
      pendingSessionClaim=true
      await setPersistence(auth, browserLocalPersistence)
      if(previous)await previous.settled
      if(firebaseExit)await firebaseExit
      if(generation!==sessionGeneration)return
      await signInWithEmailAndPassword(auth, email.trim(), password)
    } catch {
      if(generation!==sessionGeneration)return
      pendingSessionClaim=false
      setStatus('unauthenticated')
      setError('E-mail ou senha inválidos.')
      throw new Error('E-mail ou senha inválidos.')
    }finally{
      settle()
      if(signInAttempt===attempt)signInAttempt=null
    }
  }

  async function signOut() {
    setStatus('loading')
    const user=auth.currentUser,attempt=signInAttempt,generation=++sessionGeneration
    closingSession={user,generation}
    setProfile(null);setPermissions({})
    const key=user?sessionKey(user.uid):null,token=key?localStorage.getItem(key):null
    // Snapshot and remove only A's credential before any asynchronous work.
    // B can claim/store a new credential while A's remote release is in flight.
    if(key&&localStorage.getItem(key)===token)localStorage.removeItem(key)
    pendingSessionClaim=false;validationVersion.current++
    const validation=sessionValidation
    const pending=validation && validation.uid===user?.uid?validation.promise:null
    if(attempt)await attempt.settled
    if(pending){try{await pending}catch(cause){console.warn('Não foi possível concluir a liberação da sessão pendente.',cause)}}
    if(user&&token){try{await releaseSession(token)}catch(cause){console.warn('Não foi possível liberar a sessão do dispositivo.',cause)}}
    // A late success or failure must never sign out a newer B authentication.
    if(generation===sessionGeneration&&(auth.currentUser===user||attempt))await endFirebaseAuthentication(auth.currentUser,generation)
  }

  async function resetPassword(email: string) {
    await sendPasswordResetEmail(auth, email.trim())
  }

  const value = useMemo<AuthContextValue>(
    () => ({
      firebaseUser,
      profile,
      permissions,
      status,
      error,
      canAccess,
      signIn,
      signOut,
      resetPassword,
    }),
    [firebaseUser, profile, permissions, status, error, canAccess],
  )

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>
}
