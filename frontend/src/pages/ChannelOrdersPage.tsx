import { Fragment, useCallback, useEffect, useMemo, useState } from 'react'
import { Link } from 'react-router-dom'
import { executeMutation, executeQuery, getDataConnect, mutationRef, queryRef } from 'firebase/data-connect'
import { connectorConfig } from '@insightpad/dataconnect'
import { useAuth } from '../auth/useAuth'
import { useDialogAccessibility } from '../hooks/useDialogAccessibility'
import { firebaseApp } from '../lib/firebase'

const dc = getDataConnect(firebaseApp, connectorConfig)
const PAGE_SIZE = 50

type Provider = 'IFOOD' | 'ZE_DELIVERY'
type OrderStatus = 'PENDING' | 'ACCEPTED' | 'REJECTED' | 'COMPLETED' | 'CANCELLED'
type Branch = { id: string; name: string }
type OrderItem = { id: string; name: string; quantity: number; unitPriceCents: string; totalCents: string; observation?: string | null }
type ChannelOrder = {
  id: string; providerOrderId: string; displayCode: string; provider: Provider; branchId: string; branchName: string
  customerName?: string | null; orderType: string; paymentMethod?: string | null; deliveryAddress?: string | null; notes?: string | null
  subtotalCents: string; deliveryFeeCents: string; discountCents: string; totalCents: string; status: OrderStatus
  receivedAt: string; acceptedAt?: string | null; rejectedAt?: string | null; completedAt?: string | null
  rejectionReason?: string | null; version: number; items: OrderItem[]
}
type OrderResponse = { rows: ChannelOrder[]; total: number; pending: number }
type Notice = { type: 'success' | 'error'; text: string }

const emptyResponse: OrderResponse = { rows: [], total: 0, pending: 0 }
const providerLabel = (provider: Provider) => provider === 'IFOOD' ? 'iFood' : 'Zé Delivery'
const money = (value: string | number) => new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(Number(value) / 100)
const dateTime = (value?: string | null) => value ? new Intl.DateTimeFormat('pt-BR', { dateStyle: 'short', timeStyle: 'short' }).format(new Date(value)) : '—'
const statusLabels: Record<OrderStatus, string> = { PENDING: 'Aguardando', ACCEPTED: 'Aceito', REJECTED: 'Recusado', COMPLETED: 'Concluído', CANCELLED: 'Cancelado' }

export function ChannelOrdersPage() {
  const permission = useAuth().permissions.CANAIS_VENDA
  const [data, setData] = useState<OrderResponse>(emptyResponse)
  const [branches, setBranches] = useState<Branch[]>([])
  const [term, setTerm] = useState('')
  const [status, setStatus] = useState('')
  const [provider, setProvider] = useState('')
  const [branchId, setBranchId] = useState('')
  const [page, setPage] = useState(0)
  const [expanded, setExpanded] = useState<string | null>(null)
  const [busy, setBusy] = useState(true)
  const [actingId, setActingId] = useState<string | null>(null)
  const [rejecting, setRejecting] = useState<ChannelOrder | null>(null)
  const [notice, setNotice] = useState<Notice | null>(null)

  const load = useCallback(async () => {
    setBusy(true)
    try {
      const [ordersResult, workspaceResult] = await Promise.all([
        executeQuery(queryRef(dc, 'SalesChannelOrders', { term: term.trim(), status, provider, branchId: branchId || null, limit: PAGE_SIZE, offset: page * PAGE_SIZE, requestKey: crypto.randomUUID() })),
        branches.length ? Promise.resolve(null) : executeQuery(queryRef(dc, 'SalesChannelWorkspace', { requestKey: crypto.randomUUID() })),
      ])
      const orders = ((((ordersResult.data as { _select?: unknown[] })._select ?? [])[0] as { data?: OrderResponse } | undefined)?.data)
      setData(orders ?? emptyResponse)
      if (workspaceResult) {
        const workspace = ((((workspaceResult.data as { _select?: unknown[] })._select ?? [])[0] as { data?: { branches?: Branch[] } } | undefined)?.data)
        setBranches(workspace?.branches ?? [])
      }
    } catch (error) {
      console.error(error)
      setNotice({ type: 'error', text: 'Não foi possível carregar os pedidos. Tente novamente.' })
    } finally { setBusy(false) }
  }, [branchId, branches.length, page, provider, status, term])

  useEffect(() => { const timer = window.setTimeout(() => void load(), 300); return () => window.clearTimeout(timer) }, [load])
  useEffect(() => { setPage(0) }, [term, status, provider, branchId])
  useEffect(() => { if (!notice) return; const timer = window.setTimeout(() => setNotice(null), 7000); return () => window.clearTimeout(timer) }, [notice])

  const counters = useMemo(() => ({ pending: data.rows.filter(row => row.status === 'PENDING').length, accepted: data.rows.filter(row => row.status === 'ACCEPTED').length, completed: data.rows.filter(row => row.status === 'COMPLETED').length }), [data.rows])

  async function transition(order: ChannelOrder, action: 'ACCEPT' | 'REJECT' | 'COMPLETE', reason = '') {
    setActingId(order.id)
    try {
      const result = await executeMutation(mutationRef(dc, 'TransitionSalesChannelOrder', { id: order.id, action, reason, expectedVersion: order.version }))
      if (!(result.data as { _execute?: number })._execute) throw new Error('Pedido já foi alterado ou a transição não é válida.')
      setRejecting(null)
      setNotice({ type: 'success', text: action === 'ACCEPT' ? 'Pedido aceito.' : action === 'REJECT' ? 'Pedido recusado.' : 'Pedido concluído.' })
      await load()
    } catch (error) {
      console.error(error)
      setNotice({ type: 'error', text: 'Não foi possível atualizar o pedido. Atualize a lista e tente novamente.' })
    } finally { setActingId(null) }
  }

  return <section className="catalog-page channel-orders-page">
    <header><div><span className="eyebrow">Canais de venda</span><h1>Pedidos</h1><p>Pedidos recebidos do mais recente para o mais antigo.</p></div><div className="catalog-header-actions"><Link className="catalog-back" to="/modulos/canais"><span className="material-symbols-rounded">arrow_back</span>Voltar</Link><button className="catalog-primary" onClick={() => void load()} disabled={busy}><span className="material-symbols-rounded">refresh</span>Atualizar</button></div></header>
    {notice && <div className={`master-toast master-toast--${notice.type}`} role="alert" aria-live="assertive"><span className="material-symbols-rounded">{notice.type === 'success' ? 'check_circle' : 'error'}</span><strong>{notice.text}</strong></div>}
    <div className="channels-kpis"><article><span>Aguardando decisão</span><strong>{data.pending}</strong><small>Exigem aceite ou recusa</small></article><article><span>Em preparo nesta página</span><strong>{counters.accepted}</strong><small>Pedidos aceitos</small></article><article><span>Concluídos nesta página</span><strong>{counters.completed}</strong><small>Finalizados no canal</small></article></div>
    <div className="catalog-panel channels-panel">
      <div className="catalog-toolbar channel-orders-filters"><label><span className="material-symbols-rounded">search</span><input value={term} onChange={event => setTerm(event.target.value)} placeholder="Pedido ou cliente" /></label><select value={status} onChange={event => setStatus(event.target.value)} aria-label="Filtrar por status"><option value="">Todos os status</option>{Object.entries(statusLabels).map(([value,label])=><option key={value} value={value}>{label}</option>)}</select><select value={provider} onChange={event => setProvider(event.target.value)} aria-label="Filtrar por canal"><option value="">Todos os canais</option><option value="IFOOD">iFood</option><option value="ZE_DELIVERY">Zé Delivery</option></select><select value={branchId} onChange={event => setBranchId(event.target.value)} aria-label="Filtrar por filial"><option value="">Todas as filiais</option>{branches.map(branch=><option key={branch.id} value={branch.id}>{branch.name}</option>)}</select></div>
      <div className="catalog-scroll"><div className="catalog-table channel-orders-table"><table><thead><tr><th>Pedido</th><th>Canal</th><th>Recebido</th><th>Cliente</th><th>Filial</th><th>Total</th><th>Status</th><th>Ações</th></tr></thead><tbody>{data.rows.map(order => <Fragment key={order.id}><tr className="channel-order-row" onClick={() => setExpanded(expanded === order.id ? null : order.id)} aria-expanded={expanded === order.id}><td><strong>#{order.displayCode}</strong><small>{order.orderType === 'DELIVERY' ? 'Entrega' : 'Retirada'}</small></td><td><span className={`channel-provider channel-provider--${order.provider.toLowerCase()}`}>{providerLabel(order.provider)}</span></td><td>{dateTime(order.receivedAt)}</td><td>{order.customerName || 'Não informado'}</td><td>{order.branchName}</td><td><strong>{money(order.totalCents)}</strong></td><td><span className={`channel-status channel-status--${order.status.toLowerCase()}`}><i />{statusLabels[order.status] ?? order.status}</span></td><td><div className="catalog-actions" onClick={event => event.stopPropagation()}>{order.status === 'PENDING' && permission?.canUpdate && <><button onClick={() => void transition(order,'ACCEPT')} disabled={actingId===order.id}>Aceitar</button><button className="danger" onClick={() => setRejecting(order)} disabled={actingId===order.id}>Recusar</button></>}{order.status === 'ACCEPTED' && permission?.canUpdate && <button onClick={() => void transition(order,'COMPLETE')} disabled={actingId===order.id}>Concluir</button>}<button onClick={() => setExpanded(expanded === order.id ? null : order.id)}>{expanded === order.id ? 'Fechar' : 'Detalhes'}</button></div></td></tr>{expanded === order.id && <tr className="channel-order-details"><td colSpan={8}><OrderDetails order={order} /></td></tr>}</Fragment>)}</tbody></table>{!busy && !data.rows.length && <div className="channels-empty"><span className="material-symbols-rounded">receipt_long</span><strong>Nenhum pedido encontrado</strong><p>{term || status || provider || branchId ? 'Remova alguns filtros para ampliar a pesquisa.' : 'Os pedidos aparecerão aqui quando uma conexão receber eventos do parceiro.'}</p></div>}</div></div>
      <footer className="channel-orders-pagination"><span>{data.total} pedido(s)</span><div><button disabled={page===0||busy} onClick={()=>setPage(value=>Math.max(value-1,0))}>Anterior</button><strong>Página {page+1}</strong><button disabled={(page+1)*PAGE_SIZE>=data.total||busy} onClick={()=>setPage(value=>value+1)}>Próxima</button></div></footer>
    </div>
    {rejecting && <RejectDialog order={rejecting} busy={actingId===rejecting.id} onClose={()=>setRejecting(null)} onConfirm={reason=>void transition(rejecting,'REJECT',reason)} />}
    {busy && <div className="catalog-loader"><div className="catalog-loader__mark"><span /><img src="/brand/insight-pad-logo-dark.png" alt="Insight Pad" /></div><strong>Atualizando pedidos...</strong></div>}
  </section>
}

function OrderDetails({ order }: { order: ChannelOrder }) { return <div className="channel-order-detail-grid"><section><h3>Itens do pedido</h3>{order.items.map(item=><article key={item.id}><strong>{item.quantity}× {item.name}</strong><span>{money(item.totalCents)}</span>{item.observation&&<small>{item.observation}</small>}</article>)}</section><aside><h3>Resumo</h3><p><span>Subtotal</span><strong>{money(order.subtotalCents)}</strong></p><p><span>Entrega</span><strong>{money(order.deliveryFeeCents)}</strong></p><p><span>Desconto</span><strong>- {money(order.discountCents)}</strong></p><p className="total"><span>Total</span><strong>{money(order.totalCents)}</strong></p><small>{order.paymentMethod || 'Pagamento não informado'}</small>{order.deliveryAddress&&<address>{order.deliveryAddress}</address>}{order.notes&&<small>Observação: {order.notes}</small>}</aside></div> }

function RejectDialog({ order, busy, onClose, onConfirm }: { order: ChannelOrder; busy: boolean; onClose:()=>void; onConfirm:(reason:string)=>void }) { const [reason,setReason]=useState(''); useDialogAccessibility(true,onClose); const valid=reason.trim().length>=5; return <div className="catalog-backdrop"><section className="catalog-modal master-modal channel-reject-modal" role="dialog" aria-modal="true" aria-label="Recusar pedido"><header><div><span className="eyebrow">Pedido #{order.displayCode}</span><h2>Recusar pedido</h2></div><button onClick={onClose} aria-label="Fechar">×</button></header><div className="channel-reject-body"><label><span>Motivo da recusa</span><textarea autoFocus value={reason} onChange={event=>setReason(event.target.value)} maxLength={500} placeholder="Informe o motivo que será registrado" /></label><small>Mínimo de 5 caracteres.</small></div><footer><button onClick={onClose} disabled={busy}>Cancelar</button><button className="danger" disabled={!valid||busy} onClick={()=>onConfirm(reason.trim())}>{busy?'Recusando...':'Confirmar recusa'}</button></footer></section></div> }
