import { useCallback, useEffect, useMemo, useState, type FormEvent } from 'react'
import { Link } from 'react-router-dom'
import { executeMutation, executeQuery, getDataConnect, mutationRef, queryRef } from 'firebase/data-connect'
import { connectorConfig } from '@insightpad/dataconnect'
import { useAuth } from '../auth/useAuth'
import { useDialogAccessibility } from '../hooks/useDialogAccessibility'
import { firebaseApp } from '../lib/firebase'

const dc = getDataConnect(firebaseApp, connectorConfig)

type Branch = { id: string; name: string }
type Provider = 'IFOOD' | 'ZE_DELIVERY'
type ChannelConnection = {
  id: string
  provider: Provider
  displayName: string
  externalStoreId?: string | null
  branchId: string
  branchName: string
  status: string
  enabled: boolean
  lastSyncedAt?: string | null
  lastError?: string | null
}
type Workspace = { branches: Branch[]; connections: ChannelConnection[] }
type Notice = { type: 'success' | 'error'; text: string }
type Form = { provider: Provider; branchId: string; displayName: string; externalStoreId: string; enabled: boolean }

const empty: Workspace = { branches: [], connections: [] }
const blank = (branchId = ''): Form => ({ provider: 'IFOOD', branchId, displayName: '', externalStoreId: '', enabled: true })
const providerName = (provider: Provider) => provider === 'IFOOD' ? 'iFood' : 'Zé Delivery'
const formatDate = (value?: string | null) => value ? new Intl.DateTimeFormat('pt-BR', { dateStyle: 'short', timeStyle: 'short' }).format(new Date(value)) : 'Ainda não sincronizado'

export function SalesChannelsPage() {
  const permission = useAuth().permissions.CANAIS_VENDA
  const [workspace, setWorkspace] = useState<Workspace>(empty)
  const [busy, setBusy] = useState(true)
  const [notice, setNotice] = useState<Notice | null>(null)
  const [term, setTerm] = useState('')
  const [modal, setModal] = useState(false)
  const [editing, setEditing] = useState<ChannelConnection | null>(null)
  const [form, setForm] = useState<Form>(blank())
  const [removing, setRemoving] = useState<ChannelConnection | null>(null)

  const load = useCallback(async () => {
    setBusy(true)
    try {
      const result = await executeQuery(queryRef(dc, 'SalesChannelWorkspace', { requestKey: crypto.randomUUID() }))
      const data = ((((result.data as { _select?: unknown[] })._select ?? [])[0] as { data?: Workspace } | undefined)?.data)
      setWorkspace(data ?? empty)
    } catch (error) {
      console.error(error)
      setNotice({ type: 'error', text: 'Não foi possível carregar os canais de venda.' })
    } finally {
      setBusy(false)
    }
  }, [])

  useEffect(() => { void load() }, [load])
  useEffect(() => {
    if (!notice) return
    const timer = window.setTimeout(() => setNotice(null), 7000)
    return () => window.clearTimeout(timer)
  }, [notice])

  const filtered = useMemo(() => {
    const query = term.trim().toLocaleLowerCase('pt-BR')
    if (!query) return workspace.connections
    return workspace.connections.filter((connection) => [providerName(connection.provider), connection.displayName, connection.branchName, connection.externalStoreId ?? '', connection.status].join(' ').toLocaleLowerCase('pt-BR').includes(query))
  }, [term, workspace.connections])
  const activeCount = workspace.connections.filter((connection) => connection.enabled && connection.status === 'ACTIVE').length
  const pendingCount = workspace.connections.filter((connection) => connection.status === 'DRAFT' || connection.status === 'PENDING_APPROVAL').length

  function open(connection?: ChannelConnection) {
    setEditing(connection ?? null)
    setForm(connection ? {
      provider: connection.provider,
      branchId: connection.branchId,
      displayName: connection.displayName,
      externalStoreId: connection.externalStoreId ?? '',
      enabled: connection.enabled,
    } : blank(workspace.branches[0]?.id ?? ''))
    setModal(true)
  }

  async function save(event: FormEvent) {
    event.preventDefault()
    const displayName = form.displayName.trim()
    if (displayName.length < 2 || (!editing && !form.branchId)) {
      setNotice({ type: 'error', text: 'Informe a filial e um nome para identificar a loja.' })
      return
    }
    setBusy(true)
    try {
      const result = editing
        ? await executeMutation(mutationRef(dc, 'UpdateSalesChannelConnection', { id: editing.id, displayName, externalStoreId: form.externalStoreId.trim(), enabled: form.enabled }))
        : await executeMutation(mutationRef(dc, 'CreateSalesChannelConnection', { provider: form.provider, branchId: form.branchId, displayName, externalStoreId: form.externalStoreId.trim() }))
      if (!(result.data as { _execute?: unknown })._execute) throw new Error('A operação não foi aplicada.')
      setModal(false)
      setNotice({ type: 'success', text: editing ? 'Configuração atualizada.' : 'Canal preparado. A autorização do parceiro será a próxima etapa.' })
      await load()
    } catch (error) {
      console.error(error)
      setNotice({ type: 'error', text: editing ? 'Não foi possível atualizar este canal.' : 'Não foi possível preparar o canal. Verifique se já existe uma conexão deste parceiro para a filial.' })
    } finally {
      setBusy(false)
    }
  }

  async function remove() {
    if (!removing) return
    setBusy(true)
    try {
      const result = await executeMutation(mutationRef(dc, 'ArchiveSalesChannelConnection', { id: removing.id }))
      if (!(result.data as { _execute?: unknown })._execute) throw new Error('A operação não foi aplicada.')
      setNotice({ type: 'success', text: 'Canal removido da configuração.' })
      setRemoving(null)
      await load()
    } catch (error) {
      console.error(error)
      setNotice({ type: 'error', text: 'Não foi possível remover este canal.' })
    } finally {
      setBusy(false)
    }
  }

  return <section className="catalog-page channels-page">
    <header>
      <div><span className="eyebrow">Canais de venda</span><h1>Gestão de conexões</h1></div>
      <div className="catalog-header-actions">
        <Link className="catalog-back" to="/modulos/canais"><span className="material-symbols-rounded">arrow_back</span>Voltar</Link>
        {permission?.canCreate && <button className="catalog-primary" onClick={() => open()}><span className="material-symbols-rounded">add_link</span>Novo canal</button>}
      </div>
    </header>
    {notice && <div aria-live="assertive" className={`master-toast master-toast--${notice.type}`} role="alert"><span className="material-symbols-rounded">{notice.type === 'success' ? 'check_circle' : 'error'}</span><strong>{notice.text}</strong></div>}
    <div className="channels-guidance"><span className="material-symbols-rounded">security</span><div><strong>Integrações seguras por ambiente</strong><p>Senhas, tokens e chaves do iFood ou Zé Delivery nunca são digitados nem armazenados nesta tela. A autorização será feita pelo fluxo oficial de cada parceiro.</p></div></div>
    <div className="channels-kpis"><article><span>Conexões ativas</span><strong>{activeCount}</strong><small>Recebendo pedidos automaticamente</small></article><article><span>Em preparação</span><strong>{pendingCount}</strong><small>Aguardando autorização ou homologação</small></article><article><span>Canais disponíveis</span><strong>2</strong><small>iFood e Zé Delivery</small></article></div>
    <div className="catalog-panel channels-panel"><div className="catalog-toolbar"><label><span className="material-symbols-rounded">search</span><input value={term} onChange={(event) => setTerm(event.target.value)} placeholder="Pesquisar canal, loja ou filial" /></label><span className="channels-toolbar-note">Cada filial pode ter uma conexão por parceiro.</span></div>
      <div className="catalog-scroll"><div className="catalog-table channels-table"><table><thead><tr><th>Canal</th><th>Loja no Insight Pad</th><th>Filial</th><th>ID externo</th><th>Status</th><th>Última sincronização</th><th>Ações</th></tr></thead><tbody>{filtered.map((connection) => <tr key={connection.id}><td><span className={`channel-provider channel-provider--${connection.provider.toLowerCase()}`}>{providerName(connection.provider)}</span></td><td><strong>{connection.displayName}</strong></td><td>{connection.branchName}</td><td>{connection.externalStoreId || '—'}</td><td><ConnectionStatus connection={connection} /></td><td>{formatDate(connection.lastSyncedAt)}</td><td><div className="catalog-actions">{permission?.canUpdate && <button onClick={() => open(connection)}>Configurar</button>}{permission?.canDelete && <button className="danger" onClick={() => setRemoving(connection)}>Remover</button>}</div></td></tr>)}</tbody></table>{!busy && filtered.length === 0 && <div className="channels-empty"><span className="material-symbols-rounded">hub</span><strong>{workspace.connections.length ? 'Nenhum canal encontrado' : 'Nenhum canal configurado'}</strong><p>{workspace.connections.length ? 'Altere a pesquisa para visualizar suas conexões.' : 'Prepare uma loja para iniciar a autorização com iFood ou Zé Delivery.'}</p>{!workspace.connections.length && permission?.canCreate && <button className="catalog-primary" onClick={() => open()}>Preparar primeiro canal</button>}</div>}</div></div>
    </div>
    {modal && <ChannelModal editing={editing} branches={workspace.branches} form={form} setForm={setForm} onClose={() => setModal(false)} onSubmit={save} />}
    {removing && <RemoveDialog connection={removing} onClose={() => setRemoving(null)} onConfirm={() => void remove()} />}
    {busy && <div className="catalog-loader"><div className="catalog-loader__mark"><span /><img src="/brand/insight-pad-logo-dark.png" alt="Insight Pad" /></div><strong>Atualizando canais de venda...</strong></div>}
  </section>
}

function ConnectionStatus({ connection }: { connection: ChannelConnection }) {
  if (!connection.enabled) return <span className="channel-status channel-status--paused"><i />Pausada</span>
  const labels: Record<string, string> = { ACTIVE: 'Ativa', DRAFT: 'Em preparação', PENDING_APPROVAL: 'Aguardando aprovação', ERROR: 'Atenção necessária', SUSPENDED: 'Suspensa' }
  const variant = connection.status === 'ACTIVE' ? 'active' : connection.status === 'ERROR' || connection.status === 'SUSPENDED' ? 'error' : 'pending'
  return <span className={`channel-status channel-status--${variant}`} title={connection.lastError ?? undefined}><i />{labels[connection.status] ?? connection.status}</span>
}

function ChannelModal({ editing, branches, form, setForm, onClose, onSubmit }: { editing: ChannelConnection | null; branches: Branch[]; form: Form; setForm: (form: Form) => void; onClose: () => void; onSubmit: (event: FormEvent) => void }) {
  useDialogAccessibility(true, onClose)
  return <div className="catalog-backdrop"><section className="catalog-modal master-modal channel-modal" role="dialog" aria-modal="true" aria-label={editing ? 'Configurar canal de venda' : 'Preparar canal de venda'}><header><div><span className="eyebrow">Integrações</span><h2>{editing ? 'Configurar canal' : 'Preparar canal'}</h2></div><button onClick={onClose} aria-label="Fechar">×</button></header><form onSubmit={onSubmit}><div className="channel-modal__notice"><span className="material-symbols-rounded">info</span><p>Este cadastro organiza a loja para a futura autorização oficial. Não informe senha, token ou chave de API.</p></div><div className="master-form-grid"><label><span>Parceiro</span><select value={form.provider} disabled={Boolean(editing)} onChange={(event) => setForm({ ...form, provider: event.target.value as Provider })}><option value="IFOOD">iFood</option><option value="ZE_DELIVERY">Zé Delivery</option></select></label><label><span>Filial</span><select value={form.branchId} disabled={Boolean(editing)} onChange={(event) => setForm({ ...form, branchId: event.target.value })}><option value="">Selecione a filial</option>{branches.map((branch) => <option key={branch.id} value={branch.id}>{branch.name}</option>)}</select></label><label><span>Nome da loja</span><input autoFocus value={form.displayName} maxLength={160} onChange={(event) => setForm({ ...form, displayName: event.target.value })} placeholder="Como a loja será identificada" required /></label><label><span>ID da loja no parceiro <small>(opcional)</small></span><input value={form.externalStoreId} maxLength={160} onChange={(event) => setForm({ ...form, externalStoreId: event.target.value })} placeholder="Preencha após receber do parceiro" /></label>{editing && <label className="channel-toggle"><input type="checkbox" checked={form.enabled} onChange={(event) => setForm({ ...form, enabled: event.target.checked })} /><span>Permitir sincronização quando a integração estiver ativa</span></label>}</div><footer><button type="button" onClick={onClose}>Cancelar</button><button className="catalog-primary">{editing ? 'Salvar configuração' : 'Preparar canal'}</button></footer></form></section></div>
}

function RemoveDialog({ connection, onClose, onConfirm }: { connection: ChannelConnection; onClose: () => void; onConfirm: () => void }) {
  useDialogAccessibility(true, onClose)
  return <div className="catalog-backdrop"><section className="catalog-confirm" role="alertdialog" aria-modal="true" aria-label="Remover canal"><span className="material-symbols-rounded">link_off</span><h2>Remover canal?</h2><p>A configuração de {providerName(connection.provider)} para “{connection.displayName}” será desativada. Nenhum pedido ou venda já registrado será apagado.</p><footer><button onClick={onClose}>Cancelar</button><button className="danger" onClick={onConfirm}>Remover</button></footer></section></div>
}
