import { Navigate } from 'react-router-dom'
import { useTheme } from '../theme/theme-context'
import { useAuth } from '../auth/useAuth'

export function AccessDeniedPage() {
  const { theme } = useTheme()
  const { status, error, signOut } = useAuth()

  if (status === 'unauthenticated') {
    return <Navigate to="/login" replace />
  }

  if (status === 'authenticated') {
    return <Navigate to="/" replace />
  }

  return (
    <main className="access-page ip-ui" data-theme={theme}>
      <section className="access-card">
        <div className="access-card__icon" aria-hidden="true">
          !
        </div>
        <span className="eyebrow">ACESSO RESTRITO</span>
        <h1>Não foi possível liberar seu acesso</h1>
        <p>
          {error ??
            'Seu usuário não possui um vínculo ativo com uma empresa do Insight Pad.'}
        </p>
        <button
          className="primary-button"
          type="button"
          onClick={() => void signOut()}
        >
          Voltar ao login
        </button>
      </section>
    </main>
  )
}
