import { Link } from 'react-router-dom'
import { useAuth } from '../auth/useAuth'

export function DashboardPage() {
  const { profile, permissions } = useAuth()
  const tenantName =
    profile?.tenant.tradeName ?? profile?.tenant.legalName ?? 'Sua empresa'
  const allowedPages = Object.values(permissions)
    .filter((permission) => permission.canAccess && permission.page.active)
    .sort((a, b) => a.page.displayOrder - b.page.displayOrder)

  return (
    <section className="dashboard">
      <div className="dashboard-hero">
        <div className="dashboard-hero__brand"><img src="https://drive.google.com/thumbnail?id=1cUQw1yH0k3fdMKIIeKBMaUkhD23oJ4Eh&sz=w2000" alt="Insight Pad" /><p>Dados para o presente.<br />Insights para o futuro.</p></div>
        <div className="dashboard__intro"><span className="eyebrow">BEM-VINDO AO INSIGHT PAD</span><h1>Olá, {profile?.name?.split(' ')[0]}.</h1><p>O que você quer fazer agora?</p><small>{tenantName} · {profile?.role.name}</small></div>
      </div>

      {allowedPages.length ? (
        <div className="module-grid">
          {allowedPages.map(({ page }) => (
            <Link className="module-card" key={page.pageKey} to={page.route}>
              <span>{page.module === 'Vendas' ? '▣' : page.module === 'Estoque' ? '◇' : page.module === 'Financeiro' ? '$' : page.module === 'Dashboards' ? '↗' : page.module === 'Configurações' ? '⚙' : '≡'}</span>
              <div>
                <small>{page.module}</small>
                <strong>{page.displayName}</strong>
                <p>Toque para acessar</p>
              </div>
            </Link>
          ))}
        </div>
      ) : (
        <section className="empty-access-card">
          <span className="eyebrow">CATÁLOGO DE ACESSOS</span>
          <h2>Nenhum módulo liberado</h2>
          <p>
            Seu login está ativo, mas ainda não existem páginas associadas ao
            seu perfil. Um administrador deverá configurar as permissões.
          </p>
        </section>
      )}
    </section>
  )
}
