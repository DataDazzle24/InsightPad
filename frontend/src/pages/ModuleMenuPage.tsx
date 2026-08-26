import { Link } from 'react-router-dom'
import { appRoutes } from '../config/pages'
import { moduleMenus } from '../config/navigation'
import { useAuth } from '../auth/useAuth'

interface ModuleMenuPageProps {
  moduleKey: keyof typeof moduleMenus
}

export function ModuleMenuPage({ moduleKey }: ModuleMenuPageProps) {
  const { canAccess } = useAuth()
  const menu = moduleMenus[moduleKey]
  const items = menu.items.filter((item) => canAccess(item.pageKey))

  return (
    <section className="legacy-module">
      <header className="legacy-module__intro">
        <span className="eyebrow">INSIGHT PAD</span>
        <h1>{menu.title}</h1>
        <p>{menu.subtitle}</p>
      </header>
      <div className="legacy-module__grid">
        {items.map((item) => {
          const route = 'route' in item
            ? item.route
            : appRoutes.find((entry) => entry.pageKey === item.pageKey)?.route ?? '/'
          return (
            <Link className="legacy-tile legacy-tile--submenu" key={item.label} to={route}>
              <span className="legacy-tile__bar" />
              <span className="material-symbols-rounded legacy-tile__icon" aria-hidden="true">{item.icon}</span>
              <span><strong>{item.label}</strong><small>{item.description}</small></span>
              <span className="material-symbols-rounded legacy-tile__arrow" aria-hidden="true">arrow_forward</span>
            </Link>
          )
        })}
      </div>
    </section>
  )
}
