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
let pendingSessionToken = ''
const deviceId=()=>{const key='insightpad.device.id';let value=localStorage.getItem(key);if(!value){value=`${crypto.randomUUID()}${crypto.randomUUID()}`;localStorage.setItem(key,value)}return value}
const sessionKey=(uid:string)=>`insightpad.device.session:${uid}`

async function validateExclusiveSession(user:User){
  const key=sessionKey(user.uid)
  let token=pendingSessionToken||localStorage.getItem(key)||''
  const mustClaim=Boolean(pendingSessionToken)||!token
  if(!token)token=`${crypto.randomUUID()}${crypto.randomUUID()}`
  if(mustClaim){
    localStorage.setItem(key,token)
    await executeMutation(mutationRef(dataConnect,'ClaimDeviceSession',{sessionToken:token,deviceId:deviceId(),deviceName:`${navigator.platform||'Dispositivo'} · ${navigator.userAgent.slice(0,120)}`}))
    pendingSessionToken=''
    return
  }
  const result=await executeQuery(queryRef(dataConnect,'ValidateDeviceSession',{sessionToken:token,requestKey:crypto.randomUUID()}))
  const valid=Boolean(((result.data as{_select?:Array<{valid?:boolean}>})._select??[])[0]?.valid)
  if(!valid)throw new Error('DEVICE_SESSION_REPLACED')
  await executeMutation(mutationRef(dataConnect,'TouchDeviceSession',{sessionToken:token}))
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
          await firebaseSignOut(auth)
          return
        }

        await validateExclusiveSession(user)

        setProfile(currentProfile)
        setPermissions(resolvePermissions(accessUser!))
        setError(null)
        setStatus('authenticated')
      } catch (cause) {
        if (
          disposed ||
          version !== validationVersion.current ||
          auth.currentUser?.uid !== user.uid
        ) return

        console.error('Falha ao validar perfil, permissões ou dispositivo:', cause)
        setProfile(null)
        setPermissions({})
        setStatus('unauthorized')
        setError(cause instanceof Error&&cause.message==='DEVICE_SESSION_REPLACED'?'Esta conta foi acessada em outro dispositivo. Esta sessão foi encerrada.':'Não foi possível validar o perfil do usuário.')
        await firebaseSignOut(auth)
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
    setError(null)
    setStatus('loading')
    try {
      pendingSessionToken=`${crypto.randomUUID()}${crypto.randomUUID()}`
      await setPersistence(auth, browserLocalPersistence)
      await signInWithEmailAndPassword(auth, email.trim(), password)
    } catch {
      pendingSessionToken=''
      setStatus('unauthenticated')
      setError('E-mail ou senha inválidos.')
      throw new Error('E-mail ou senha inválidos.')
    }
  }

  async function signOut() {
    setStatus('loading')
    const user=auth.currentUser,token=user?localStorage.getItem(sessionKey(user.uid)):null
    if(user&&token){try{await executeMutation(mutationRef(dataConnect,'ReleaseDeviceSession',{sessionToken:token}))}catch(cause){console.warn('Não foi possível liberar a sessão do dispositivo.',cause)}localStorage.removeItem(sessionKey(user.uid))}
    await firebaseSignOut(auth)
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
