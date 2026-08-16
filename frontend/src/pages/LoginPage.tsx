import { useState, type FormEvent } from 'react'
import { Navigate } from 'react-router-dom'
import { useAuth } from '../auth/useAuth'

export function LoginPage() {
  const { status, error, signIn, resetPassword } = useAuth()
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [message, setMessage] = useState<string | null>(null)
  const [submitting, setSubmitting] = useState(false)

  if (status === 'authenticated') {
    return <Navigate to="/" replace />
  }

  if (status === 'unauthorized') {
    return <Navigate to="/acesso-negado" replace />
  }

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()
    setMessage(null)
    setSubmitting(true)

    try {
      await signIn(email, password)
    } catch {
      // O contexto fornece uma mensagem genérica para não expor detalhes da conta.
    } finally {
      setSubmitting(false)
    }
  }

  async function handlePasswordReset() {
    if (!email.trim()) {
      setMessage('Informe seu e-mail para solicitar uma nova senha.')
      return
    }

    try {
      await resetPassword(email)
    } catch {
      // A resposta permanece genérica para impedir enumeração de contas.
    }

    setMessage(
      'Se o e-mail estiver cadastrado, você receberá as instruções de recuperação.',
    )
  }

  const busy = submitting || status === 'loading'

  return (
    <main className="login-page">
      <section className="login-visual" aria-label="Apresentação do Insight Pad">
        <div className="login-visual__content">
          <img className="official-login-logo" src="https://drive.google.com/thumbnail?id=1cUQw1yH0k3fdMKIIeKBMaUkhD23oJ4Eh&sz=w2000" alt="Insight Pad" />

          <div className="login-visual__copy">
            <span className="eyebrow">GESTÃO QUE CABE NA SUA ROTINA</span>
            <h1>Seu negócio, mais simples de administrar.</h1>
            <p>
              Vendas, estoque e gestão conectados em um ambiente seguro e
              preparado para crescer com sua empresa.
            </p>
          </div>

          <div className="login-visual__footer"><img src="https://drive.google.com/thumbnail?id=1CLFb1HP_w1WITW7HlSmPV1JN6auYURHY&sz=w2000" alt="Data Dazzle" /><span>Um produto Data Dazzle</span></div>
        </div>
      </section>

      <section className="login-panel">
        <div className="login-card">
          <div className="brand-lockup brand-lockup--mobile">
            <div className="brand-mark" aria-hidden="true">
              <span />
              <span />
              <span />
            </div>
            <div>
              <strong>Insight Pad</strong>
              <small>by Data Dazzle</small>
            </div>
          </div>

          <header className="login-card__header">
            <span className="eyebrow">BEM-VINDO DE VOLTA</span>
            <h2>Acesse sua conta</h2>
            <p>Use as credenciais fornecidas pelo administrador.</p>
          </header>

          <form className="login-form" onSubmit={handleSubmit}>
            <label htmlFor="email">E-mail</label>
            <input
              id="email"
              type="email"
              value={email}
              onChange={(event) => setEmail(event.target.value)}
              autoComplete="email"
              placeholder="voce@empresa.com.br"
              disabled={busy}
              required
            />

            <div className="login-form__password-row">
              <label htmlFor="password">Senha</label>
              <button
                className="text-button"
                type="button"
                onClick={() => void handlePasswordReset()}
                disabled={busy}
              >
                Esqueci minha senha
              </button>
            </div>
            <input
              id="password"
              type="password"
              value={password}
              onChange={(event) => setPassword(event.target.value)}
              autoComplete="current-password"
              placeholder="Digite sua senha"
              disabled={busy}
              required
            />

            <div className="form-feedback" aria-live="polite">
              {error && <p className="form-feedback--error">{error}</p>}
              {message && <p className="form-feedback--info">{message}</p>}
            </div>

            <button className="primary-button" type="submit" disabled={busy}>
              {busy ? 'Validando acesso...' : 'Entrar no Insight Pad'}
            </button>
          </form>

          <footer className="login-card__footer">
            <span aria-hidden="true">●</span>
            Autenticação protegida pelo Firebase
          </footer>
        </div>
      </section>
    </main>
  )
}
