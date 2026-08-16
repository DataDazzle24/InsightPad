import { useEffect, useMemo, useState, type ReactNode } from 'react'
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
} from '@insightpad/dataconnect'
import { auth, firebaseApp } from '../lib/firebase'
import {
  AuthContext,
  type AuthContextValue,
  type AuthStatus,
  type UserProfile,
} from './auth-context'

interface AuthProviderProps {
  children: ReactNode
}

const dataConnect = getDataConnect(firebaseApp, connectorConfig)

export function AuthProvider({ children }: AuthProviderProps) {
  const [firebaseUser, setFirebaseUser] = useState<User | null>(null)
  const [profile, setProfile] = useState<UserProfile | null>(null)
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
          setStatus('unauthenticated')
          return
        }

        setStatus('loading')

        try {
          // Garante que o token do Firebase Auth esteja disponível antes
          // de o SQL Connect avaliar expressões baseadas em auth.uid.
          await user.getIdToken()
          const result = await getCurrentUser(dataConnect)
          if (cancelled) return

          const currentProfile = result.data.user

          if (
            !currentProfile ||
            !currentProfile.active ||
            !currentProfile.tenant.active ||
            !currentProfile.role.active
          ) {
            setProfile(null)
            setStatus('unauthorized')
            setError('Usuário sem acesso ativo ao Insight Pad.')
            return
          }

          setProfile(currentProfile)
          setStatus('authenticated')
        } catch (cause) {
          if (cancelled) return

          console.error('Falha ao validar perfil no SQL Connect:', cause)
          setProfile(null)
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
      status,
      error,
      signIn,
      signOut,
      resetPassword,
    }),
    [firebaseUser, profile, status, error],
  )

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>
}
