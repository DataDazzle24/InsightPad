import { MenuCard } from '../components/MenuCard'
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
    <section className="legacy-module menus-submenu">
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
            <MenuCard key={item.label} to={route} label={item.label} description={item.description} icon={item.icon} />
          )
        })}
      </div>
    </section>
  )
}
