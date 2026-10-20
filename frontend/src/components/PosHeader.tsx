import { Link } from 'react-router-dom'

type Props={clock:Date;online:boolean;pending:number;blocked:number;syncing:boolean;cashReady:boolean;cashOpen:boolean;cashDisabled:boolean;canManage:boolean;hasCart:boolean;onCash:()=>void;onSync:()=>void;onQueue:()=>void;onApprovals:()=>void}
export function PosHeader(p:Props){
 return <header className="pos-topbar pos-topbar--aligned">
  <div className="pos-clock-group">
   <Link className="catalog-back" to="/modulos/vendas" onClick={event=>{if(p.hasCart&&!window.confirm('Sair do PDV e descartar os itens do carrinho?'))event.preventDefault()}}><span className="material-symbols-rounded" aria-hidden="true">arrow_back</span>Voltar</Link>
   <div className="pos-clock"><span>{p.clock.toLocaleDateString('pt-BR',{weekday:'long',day:'2-digit',month:'long'})}</span><strong>{p.clock.toLocaleTimeString('pt-BR')}</strong></div>
  </div>
  <span role="status" aria-live="polite" className={`connection ${p.online?'online':'offline'}`}><i aria-hidden="true"/>{p.online?'Online':'Offline'}{p.pending>0&&` · ${p.pending} pendente(s)`}</span>
  <div className="sales-header-actions">
   <button className={`pos-cash-toggle pos-cash-toggle--${p.cashReady?(p.cashOpen?'close':'open'):'loading'}`} onClick={p.onCash} disabled={p.cashDisabled}><span className="material-symbols-rounded" aria-hidden="true">point_of_sale</span>{!p.cashReady?'Carregando caixa...':p.cashOpen?'Fechar caixa':'Abrir caixa'}</button>
   {p.pending>0&&p.online&&<button disabled={p.syncing} onClick={p.onSync}>{p.syncing?'Sincronizando...':'Sincronizar'}</button>}
   {p.pending>0&&<button onClick={p.onQueue}>Revisar fila ({p.blocked} bloqueada(s))</button>}
   {p.canManage&&<button onClick={p.onApprovals}>Aprovações</button>}
  </div>
 </header>
}
