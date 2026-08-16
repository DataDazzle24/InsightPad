import { useState, type FormEvent } from 'react'
import { Navigate } from 'react-router-dom'
import { useAuth } from '../auth/useAuth'

export function LoginPage() {
  const { status, error, signIn, resetPassword } = useAuth()
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [message, setMessage] = useState<string | null>(null)
  const [submitting, setSubmitting] = useState(false)

  if (status === 'authenticated') return <Navigate to="/" replace />
  if (status === 'unauthorized') return <Navigate to="/acesso-negado" replace />

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault(); setMessage(null); setSubmitting(true)
    try { await signIn(email, password) } catch { /* contexto fornece mensagem segura */ } finally { setSubmitting(false) }
  }
  async function handlePasswordReset() {
    if (!email.trim()) { setMessage('Informe seu e-mail para solicitar uma nova senha.'); return }
    try { await resetPassword(email) } catch { /* resposta genérica */ }
    setMessage('Se o e-mail estiver cadastrado, você receberá as instruções de recuperação.')
  }
  const busy = submitting || status === 'loading'

  return (
    <main className="brand-login">
      <section className="brand-login__hero">
        <img className="brand-login__logo" src="/brand/insight-pad-logo-dark.png" alt="Insight Pad" />
        <div className="brand-login__statement"><span>GESTÃO INTELIGENTE</span><h1>Seu negócio.<br />Seus dados.<br /><em>Suas decisões.</em></h1><p>Dados para o presente. Insights para o futuro.</p></div>
        <footer><span>Um produto</span><img src="/brand/data-dazzle-logo-dark.png" alt="Data Dazzle" /></footer>
      </section>
      <section className="brand-login__access">
        <div className="login-hud">
          <span className="login-hud__corner login-hud__corner--tl" /><span className="login-hud__corner login-hud__corner--br" />
          <header><span className="eyebrow">ACESSO SEGURO</span><h2>Bem-vindo de volta</h2><p>Entre com as credenciais da sua empresa.</p></header>
          <form onSubmit={handleSubmit}>
            <label htmlFor="email">E-mail</label>
            <div className="hud-input"><span className="material-symbols-rounded">mail</span><input id="email" type="email" value={email} onChange={(e) => setEmail(e.target.value)} autoComplete="email" placeholder="voce@empresa.com.br" disabled={busy} required /></div>
            <div className="password-label"><label htmlFor="password">Senha</label><button type="button" onClick={() => void handlePasswordReset()} disabled={busy}>Esqueci minha senha</button></div>
            <div className="hud-input"><span className="material-symbols-rounded">lock</span><input id="password" type="password" value={password} onChange={(e) => setPassword(e.target.value)} autoComplete="current-password" placeholder="Digite sua senha" disabled={busy} required /></div>
            <div className="form-feedback" aria-live="polite">{error && <p className="form-feedback--error">{error}</p>}{message && <p className="form-feedback--info">{message}</p>}</div>
            <button className="login-submit" type="submit" disabled={busy}><span>{busy ? 'Validando acesso...' : 'Entrar'}</span><span className="material-symbols-rounded">arrow_forward</span></button>
          </form>
          <footer><span className="status-dot" />Ambiente protegido pelo Firebase</footer>
        </div>
      </section>
    </main>
  )
}
