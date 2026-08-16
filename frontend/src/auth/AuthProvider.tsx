import { useCallback, useEffect, useMemo, useState, type ReactNode } from 'react'
import {
  browserLocalPersistence,
  onAuthStateChanged,
  sendPasswordResetEmail,
  setPersistence,
  signInWithEmailAndPassword,
  signOut as firebaseSignOut,
  type User,
} from 'firebase/auth'
import { getDataConnect } from 'firebase/data-connect'
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

export function AuthProvider({ children }: AuthProviderProps) {
  const [firebaseUser, setFirebaseUser] = useState<User | null>(null)
  const [profile, setProfile] = useState<UserProfile | null>(null)
  const [permissions, setPermissions] = useState<PermissionMap>({})
  const [status, setStatus] = useState<AuthStatus>('loading')
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    let cancelled = false

    const unsubscribe = onAuthStateChanged(auth, (user) => {
      void (async () => {
        if (cancelled) return
        setFirebaseUser(user)
        setError(null)

        if (!user) {
          setProfile(null)
          setPermissions({})
          setStatus('unauthenticated')
          return
        }

        setStatus('loading')

        try {
          await user.getIdToken()
          const [profileResult, accessResult] = await Promise.all([
            getCurrentUser(dataConnect),
            getCurrentUserAccess(dataConnect),
          ])
          if (cancelled) return

          const currentProfile = profileResult.data.user
          const accessUser = accessResult.data.user

          if (
            !currentProfile ||
            !accessUser ||
            !currentProfile.active ||
            !currentProfile.tenant.active ||
            !currentProfile.role.active
          ) {
            setProfile(null)
            setPermissions({})
            setStatus('unauthorized')
            setError('Usuário sem acesso ativo ao Insight Pad.')
            return
          }

          setProfile(currentProfile)
          setPermissions(resolvePermissions(accessUser))
          setStatus('authenticated')
        } catch (cause) {
          if (cancelled) return
          console.error('Falha ao validar perfil e permissões:', cause)
          setProfile(null)
          setPermissions({})
          setStatus('unauthorized')
          setError('Não foi possível validar o perfil do usuário.')
        }
      })()
    })

    return () => {
      cancelled = true
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
      await setPersistence(auth, browserLocalPersistence)
      await signInWithEmailAndPassword(auth, email.trim(), password)
    } catch {
      setStatus('unauthenticated')
      setError('E-mail ou senha inválidos.')
      throw new Error('E-mail ou senha inválidos.')
    }
  }

  async function signOut() {
    setStatus('loading')
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
