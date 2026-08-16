import { useMemo, useState } from 'react'
import { NavLink, Outlet } from 'react-router-dom'
import { useAuth } from '../auth/useAuth'

export function AppLayout() {
  const { profile, permissions, signOut } = useAuth()
  const [leaving, setLeaving] = useState(false)

  const modules = useMemo(() => {
    const grouped = new Map<string, typeof permissions[string][]>()

    Object.values(permissions)
      .filter((permission) => permission.canAccess && permission.page.active)
      .sort((a, b) => a.page.displayOrder - b.page.displayOrder)
      .forEach((permission) => {
        const list = grouped.get(permission.page.module) ?? []
        list.push(permission)
        grouped.set(permission.page.module, list)
      })

    return [...grouped.entries()]
  }, [permissions])

  async function handleSignOut() {
    setLeaving(true)
    try {
      await signOut()
    } finally {
      setLeaving(false)
    }
  }

  return (
    <main className="workspace">
      <aside className="sidebar">
        <NavLink className="brand-lockup brand-lockup--light" to="/">
          <div className="brand-mark" aria-hidden="true"><span /><span /><span /></div>
          <div><strong>Insight Pad</strong><small>by Data Dazzle</small></div>
        </NavLink>

        <nav className="sidebar__nav" aria-label="Navegação principal">
          <NavLink className="sidebar__link" to="/" end>Visão geral</NavLink>
          {modules.map(([module, items]) => (
            <section className="sidebar__group" key={module}>
              <span>{module}</span>
              {items.map(({ page }) => (
                <NavLink className="sidebar__link" key={page.pageKey} to={page.route}>
                  {page.displayName}
                </NavLink>
              ))}
            </section>
          ))}
        </nav>

        <footer className="sidebar__footer">
          <strong>{profile?.name}</strong>
          <span>{profile?.role.name}</span>
          <button type="button" onClick={() => void handleSignOut()} disabled={leaving}>
            {leaving ? 'Saindo...' : 'Sair'}
          </button>
        </footer>
      </aside>

      <section className="workspace__content">
        <header className="workspace__header">
          <div><strong>{profile?.tenant.tradeName ?? profile?.tenant.legalName}</strong><span>Ambiente de desenvolvimento</span></div>
          <div className="workspace__identity"><strong>{profile?.name}</strong><span>{profile?.role.name}</span></div>
        </header>
        <Outlet />
      </section>
    </main>
  )
}
