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
      <div className="dashboard__intro">
        <span className="eyebrow">VISÃO GERAL</span>
        <h1>Olá, {profile?.name?.split(' ')[0]}.</h1>
        <p>{tenantName} · {profile?.role.name}</p>
      </div>

      {allowedPages.length ? (
        <div className="module-grid">
          {allowedPages.map(({ page }) => (
            <Link className="module-card" key={page.pageKey} to={page.route}>
              <span>{String(page.displayOrder).padStart(2, '0')}</span>
              <div>
                <small>{page.module}</small>
                <strong>{page.displayName}</strong>
                <p>Acesso liberado pelo seu perfil.</p>
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
