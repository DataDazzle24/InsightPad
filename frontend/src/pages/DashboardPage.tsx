import { useState } from 'react'
import { useAuth } from '../auth/useAuth'

export function DashboardPage() {
  const { profile, signOut } = useAuth()
  const [leaving, setLeaving] = useState(false)
  const tenantName =
    profile?.tenant.tradeName ?? profile?.tenant.legalName ?? 'Sua empresa'

  async function handleSignOut() {
    setLeaving(true)
    try {
      await signOut()
    } finally {
      setLeaving(false)
    }
  }

  return (
    <main className="app-shell">
      <header className="app-header">
        <div className="brand-lockup">
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

        <div className="app-header__user">
          <div>
            <strong>{profile?.name}</strong>
            <span>{profile?.role.name}</span>
          </div>
          <button
            className="secondary-button"
            type="button"
            onClick={() => void handleSignOut()}
            disabled={leaving}
          >
            {leaving ? 'Saindo...' : 'Sair'}
          </button>
        </div>
      </header>

      <section className="dashboard">
        <div className="dashboard__intro">
          <span className="eyebrow">AMBIENTE DE DESENVOLVIMENTO</span>
          <h1>Olá, {profile?.name?.split(' ')[0]}.</h1>
          <p>
            Sua autenticação e seu vínculo com a empresa foram validados com
            sucesso.
          </p>
        </div>

        <div className="status-grid">
          <article className="status-card">
            <span className="status-card__icon">01</span>
            <div>
              <small>Empresa</small>
              <strong>{tenantName}</strong>
              <span className="status-badge">Ativa</span>
            </div>
          </article>

          <article className="status-card">
            <span className="status-card__icon">02</span>
            <div>
              <small>Perfil de acesso</small>
              <strong>{profile?.role.name}</strong>
              <span className="status-badge">Validado</span>
            </div>
          </article>

          <article className="status-card">
            <span className="status-card__icon">03</span>
            <div>
              <small>Infraestrutura</small>
              <strong>Firebase + PostgreSQL</strong>
              <span className="status-badge">Conectada</span>
            </div>
          </article>
        </div>

        <section className="next-step-card">
          <div>
            <span className="eyebrow">PRÓXIMA ETAPA</span>
            <h2>Fundação pronta para receber os módulos</h2>
            <p>
              A partir daqui, migraremos as páginas operacionais preservando as
              regras de negócio já mapeadas no Apps Script.
            </p>
          </div>
          <span className="next-step-card__number">01</span>
        </section>
      </section>
    </main>
  )
}
