import { Navigate } from 'react-router-dom'
import { useAuth } from '../auth/useAuth'

export function AccessDeniedPage() {
  const { status, error, signOut } = useAuth()

  if (status === 'unauthenticated') {
    return <Navigate to="/login" replace />
  }

  if (status === 'authenticated') {
    return <Navigate to="/" replace />
  }

  return (
    <main className="access-page">
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
