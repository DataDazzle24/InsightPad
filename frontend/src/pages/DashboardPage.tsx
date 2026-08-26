import { Link } from 'react-router-dom'
import { useAuth } from '../auth/useAuth'
import { navigationModules } from '../config/navigation'
import { useTheme } from '../theme/theme-context'

export function DashboardPage() {
  const { profile, canAccess } = useAuth()
  const { theme } = useTheme()
  const modules = navigationModules.filter((module) => module.pageKeys.some(canAccess))

  return (
    <section className="home-menu">
      <div className="home-menu__brand">
        <div className="home-menu__welcome"><span>Bem-vindo,</span><strong>{profile?.name?.split(' ')[0]}</strong></div>
        <img className="home-menu__insight-logo" src="/brand/insight-pad-logo-compact.png" alt="Insight Pad" />
        <footer>
          <span>Um produto</span>
          <img
            src={theme === 'light'
              ? '/brand/data-dazzle-logo-light-compact.png'
              : '/brand/data-dazzle-logo-dark-compact.png'}
            alt="Data Dazzle"
          />
        </footer>
      </div>
      <div className="home-menu__modules">
        {modules.map((module) => (
          <Link className={'legacy-tile legacy-tile--' + module.accent} key={module.label} to={module.to}>
            <span className="legacy-tile__bar" />
            <span className="material-symbols-rounded legacy-tile__icon" aria-hidden="true">{module.icon}</span>
            <span><strong>{module.label}</strong><small>{module.description}</small></span>
            <span className="material-symbols-rounded legacy-tile__arrow" aria-hidden="true">arrow_forward</span>
          </Link>
        ))}
      </div>
    </section>
  )
}
