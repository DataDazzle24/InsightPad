import { createContext, useContext } from 'react'

export type AppTheme = 'dark' | 'light'
export type ThemeContextValue = { theme: AppTheme; setTheme: (theme: AppTheme) => void; toggleTheme: () => void }
export const ThemeContext = createContext<ThemeContextValue | null>(null)

export function useTheme() {
  const value = useContext(ThemeContext)
  if (!value) throw new Error('useTheme deve ser utilizado dentro de ThemeProvider.')
  return value
}
