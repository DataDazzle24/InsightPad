import { MenuCard } from '../components/MenuCard'
import { useAuth } from '../auth/useAuth'
import { navigationModules } from '../config/navigation'

export function DashboardPage() {
  const { profile, canAccess } = useAuth()
  const modules = navigationModules.filter((module) => module.pageKeys.some(canAccess))

  return (
    <section className="home-menu">
      <div className="home-menu__brand">
        <div className="home-menu__welcome"><span>Bem-vindo,</span><strong>{profile?.name?.split(' ')[0]}</strong></div>
        <img className="home-menu__insight-logo" src="/brand/insight-pad-interface.png" alt="Insight Pad" />
        <p className="ip-slogan"><span>DADOS PARA O PRESENTE.</span><strong>INSIGHTS PARA O FUTURO.</strong></p>
      </div>
      <div className="home-menu__modules">
        {modules.map((module) => (
          <MenuCard key={module.label} to={module.to} label={module.label} description={module.description} icon={module.icon} />
        ))}
      </div>
    </section>
  )
}
