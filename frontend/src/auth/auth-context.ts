import { createContext } from 'react'
import type { User } from 'firebase/auth'
import type { GetCurrentUserData } from '@insightpad/dataconnect'
import type { PermissionMap } from './access-control'

export type UserProfile = NonNullable<GetCurrentUserData['user']>
export type AuthStatus =
  | 'loading'
  | 'authenticated'
  | 'unauthenticated'
  | 'unauthorized'

export interface AuthContextValue {
  firebaseUser: User | null
  profile: UserProfile | null
  permissions: PermissionMap
  status: AuthStatus
  error: string | null
  canAccess: (pageKey: string) => boolean
  signIn: (email: string, password: string) => Promise<void>
  signOut: () => Promise<void>
  resetPassword: (email: string) => Promise<void>
}

export const AuthContext = createContext<AuthContextValue | null>(null)
