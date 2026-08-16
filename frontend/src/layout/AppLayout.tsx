import { useMemo, useState } from 'react'
import { NavLink, Outlet, useLocation } from 'react-router-dom'
import { useAuth } from '../auth/useAuth'

const INSIGHT_LOGO = 'https://drive.google.com/thumbnail?id=1T6pWIpQeH-jPowvh63mPQDJVIjA3VJBJ&sz=w2000'
const moduleIcons: Record<string, string> = {
  Vendas: '▣', Estoque: '◇', Financeiro: '$', Cadastros: '≡', Dashboards: '↗', Configurações: '⚙',
}

export function AppLayout() {
  const { profile, permissions, signOut } = useAuth()
  const location = useLocation()
  const [leaving, setLeaving] = useState(false)
  const [profileOpen, setProfileOpen] = useState(false)

  const modules = useMemo(() => {
    const allowed = Object.values(permissions)
      .filter((permission) => permission.canAccess && permission.page.active)
      .sort((a, b) => a.page.displayOrder - b.page.displayOrder)
    const grouped = new Map<string, (typeof allowed)[number]>()
    for (const permission of allowed) if (!grouped.has(permission.page.module)) grouped.set(permission.page.module, permission)
    return [...grouped.entries()]
  }, [permissions])

  async function handleSignOut() {
    setLeaving(true)
    try { await signOut() } finally { setLeaving(false) }
  }

  const tenantName = profile?.tenant.tradeName ?? profile?.tenant.legalName
  if (location.pathname === '/') return <Outlet />
  const moduleTargets: Record<string, string> = { Vendas: '/menu/vendas', Cadastros: '/menu/cadastros', Dashboards: '/menu/dashboards' }
  const currentPage = Object.values(permissions).find((item) => item.page.route === location.pathname)?.page.displayName ?? (location.pathname.includes('/menu/') ? location.pathname.split('/').pop()?.toUpperCase() : 'INSIGHT PAD')

  return (
    <main className="workspace insight-shell">
      <header className="insight-header">
        <NavLink className="insight-header__brand" to="/" aria-label="Página inicial">
          <img src={INSIGHT_LOGO} alt="Insight Pad" />
        </NavLink>

        <nav className="insight-header__nav" aria-label="Navegação principal">
          <NavLink className="insight-nav-link" to="/" end title="Início"><span>⌂</span><small>Início</small></NavLink>
          {modules.map(([module, permission]) => (
            <NavLink className="insight-nav-link" key={module} to={moduleTargets[module] ?? permission.page.route} title={module}>
              <span>{moduleIcons[module] ?? '•'}</span><small>{module}</small>
            </NavLink>
          ))}
        </nav>

        <div className={`account-menu ${profileOpen ? 'open' : ''}`}>
          <button className="account-menu__trigger" onClick={() => setProfileOpen((current) => !current)} aria-expanded={profileOpen}>
            <span className="account-avatar">{profile?.name?.charAt(0).toUpperCase()}</span>
            <span><strong>{profile?.name}</strong><small>{profile?.role.name}</small></span>
          </button>
          {profileOpen && <div className="account-panel">
            <header><img src={INSIGHT_LOGO} alt="Insight Pad" /><button onClick={() => setProfileOpen(false)}>×</button></header>
            <div className="account-panel__identity"><span className="account-avatar account-avatar--large">{profile?.name?.charAt(0).toUpperCase()}</span><div><strong>{profile?.name}</strong><small>{profile?.role.name}</small></div></div>
            <div className="account-panel__info"><small>CLIENTE</small><strong>{tenantName}</strong></div>
            <div className="account-panel__info"><small>PÁGINAS LIBERADAS</small><strong>{Object.values(permissions).filter((item) => item.canAccess).length} páginas</strong></div>
            <footer><a href="https://wa.me/5521985795316" target="_blank" rel="noreferrer">Acionar suporte</a><button onClick={() => void handleSignOut()} disabled={leaving}>{leaving ? 'Saindo...' : 'Sair do sistema'}</button></footer>
          </div>}
        </div>
      </header>

      <section className="workspace__content">
        <div className="legacy-page-title">{currentPage}</div>
        <Outlet />
      </section>

      <nav className="mobile-app-nav" aria-label="Navegação do aplicativo">
        <NavLink to="/" end><span>⌂</span><small>Início</small></NavLink>
        {modules.slice(0, 4).map(([module, permission]) => <NavLink key={module} to={moduleTargets[module] ?? permission.page.route}><span>{moduleIcons[module] ?? '•'}</span><small>{module}</small></NavLink>)}
      </nav>
    </main>
  )
}
