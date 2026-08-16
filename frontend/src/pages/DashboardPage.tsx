import { Link } from 'react-router-dom'
import { useAuth } from '../auth/useAuth'

export function DashboardPage() {
  const { profile, permissions } = useAuth()
  const can = (key: string) => permissions[key]?.canAccess === true
  return <section className="legacy-home">
    <div className="legacy-home__brand"><div className="legacy-home__user"><span>◉</span><strong>{profile?.name}</strong><small>{profile?.role.name}</small></div><img className="legacy-home__insight" src="https://drive.google.com/thumbnail?id=1T6pWIpQeH-jPowvh63mPQDJVIjA3VJBJ&sz=w2000" alt="Insight Pad" /><div className="legacy-home__footer"><img src="https://drive.google.com/thumbnail?id=1RMePnzCwzaKXK0Gz-bw0TKG2zIOnwzHC&sz=w2000" alt="Data Dazzle" /><span>Um produto Data Dazzle</span></div></div>
    <div className="legacy-home__actions"><Link className="legacy-main-button" to="/menu/vendas"><i>▣</i><span>VENDAS</span></Link>{can('ESTOQUE') && <Link className="legacy-main-button" to="/estoque"><i>◇</i><span>ESTOQUE</span></Link>}<div className="legacy-home__row">{can('CONTAS_PAGAR') && <Link className="legacy-main-button legacy-main-button--half" to="/financeiro/contas-a-pagar"><i>$</i><span>CONTAS A PAGAR</span></Link>}{can('CONTAS_RECEBER') && <Link className="legacy-main-button legacy-main-button--half" to="/financeiro/contas-a-receber"><i>＄</i><span>CONTAS A RECEBER</span></Link>}</div><div className="legacy-home__row"><Link className="legacy-main-button legacy-main-button--half" to="/menu/cadastros"><i>≡</i><span>CADASTRO</span></Link><Link className="legacy-main-button legacy-main-button--half" to="/menu/dashboards"><i>↗</i><span>DASHBOARD</span></Link></div></div>
  </section>
}
