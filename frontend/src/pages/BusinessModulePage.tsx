import { useMemo, useState, type FormEvent } from 'react'
import { useAuth } from '../auth/useAuth'
import { moduleDefinitions, type ModuleField } from '../config/module-definitions'

type RecordValue = string | number | boolean
type LocalRecord = Record<string, RecordValue> & { id: string; createdAt: string; active: boolean }

function storageKey(tenantId: string, pageKey: string) {
  return `insightpad:offline:${tenantId}:${pageKey}`
}

function readRecords(tenantId: string, pageKey: string): LocalRecord[] {
  try { return JSON.parse(localStorage.getItem(storageKey(tenantId, pageKey)) ?? '[]') as LocalRecord[] }
  catch { return [] }
}

function Field({ field, value, onChange }: { field: ModuleField; value: string; onChange: (value: string) => void }) {
  if (field.type === 'textarea') return <textarea value={value} onChange={(e) => onChange(e.target.value)} required={field.required} rows={3} />
  if (field.options) return (
    <select value={value} onChange={(e) => onChange(e.target.value)} required={field.required}>
      <option value="">Selecione</option>{field.options.map((option) => <option key={option}>{option}</option>)}
    </select>
  )
  return <input type={field.type ?? 'text'} value={value} onChange={(e) => onChange(e.target.value)} required={field.required} step={field.type === 'number' ? '0.01' : undefined} />
}

export function BusinessModulePage({ pageKey }: { pageKey: string }) {
  const { profile, permissions } = useAuth()
  const definition = moduleDefinitions[pageKey]
  const tenantId = profile?.tenant.id ?? 'anonymous'
  const permission = permissions[pageKey]
  const [records, setRecords] = useState(() => readRecords(tenantId, pageKey))
  const [query, setQuery] = useState('')
  const [filter, setFilter] = useState(definition?.quickFilters?.[0] ?? 'Todos')
  const [editing, setEditing] = useState<LocalRecord | null>(null)
  const [modalOpen, setModalOpen] = useState(false)
  const [form, setForm] = useState<Record<string, string>>({})

  const visibleRecords = useMemo(() => {
    const normalized = query.trim().toLocaleLowerCase('pt-BR')
    if (!normalized) return records
    return records.filter((record) => Object.values(record).some((value) => String(value).toLocaleLowerCase('pt-BR').includes(normalized)))
  }, [records, query])

  if (!definition) return null

  function persist(next: LocalRecord[]) {
    localStorage.setItem(storageKey(tenantId, pageKey), JSON.stringify(next))
    setRecords(next)
  }

  function openCreate() {
    setEditing(null); setForm({}); setModalOpen(true)
  }

  function openEdit(record: LocalRecord) {
    setEditing(record)
    setForm(Object.fromEntries(definition.fields.map((field) => [field.key, String(record[field.key] ?? '')])))
    setModalOpen(true)
  }

  function submit(event: FormEvent) {
    event.preventDefault()
    const payload: LocalRecord = {
      id: editing?.id ?? crypto.randomUUID(), createdAt: editing?.createdAt ?? new Date().toISOString(), active: true, ...form,
    }
    persist(editing ? records.map((item) => item.id === editing.id ? payload : item) : [payload, ...records])
    setModalOpen(false)
  }

  function remove(record: LocalRecord) {
    if (!window.confirm(`Deseja realmente excluir esta ${definition.singular}?`)) return
    persist(records.filter((item) => item.id !== record.id))
  }

  function exportCsv() {
    const headers = definition.fields.map((field) => field.label)
    const rows = visibleRecords.map((record) => definition.fields.map((field) => `"${String(record[field.key] ?? '').replaceAll('"', '""')}"`).join(';'))
    const blob = new Blob([`\uFEFF${headers.join(';')}\n${rows.join('\n')}`], { type: 'text/csv;charset=utf-8' })
    const link = document.createElement('a'); link.href = URL.createObjectURL(blob); link.download = `${pageKey.toLowerCase()}.csv`; link.click(); URL.revokeObjectURL(link.href)
  }

  const primaryFields = definition.fields.filter((field) => field.mobilePriority).slice(0, 4)
  const tableFields = primaryFields.length ? primaryFields : definition.fields.slice(0, 4)

  return (
    <section className="business-page">
      <div className="legacy-actionbar">
        <div className="legacy-actionbar__left">
          <button type="button" onClick={() => history.back()} title="Voltar">←</button>
          {definition.fields.length > 0 && permission?.canCreate && <button type="button" onClick={openCreate} title={definition.primaryAction ?? `Nova ${definition.singular}`}>＋</button>}
          {permission?.canUpdate && <button type="button" disabled={!editing} title="Editar">✎</button>}
          {permission?.canDelete && <button type="button" disabled={!editing} title="Excluir">♲</button>}
        </div>
        <div className="legacy-actionbar__right"><button type="button" onClick={exportCsv} title="Extrair CSV">CSV</button><button type="button" title="Pesquisar">▽</button><button type="button" onClick={() => setQuery('')} title="Limpar">⌫</button></div>
      </div>

      {pageKey === 'RELATORIOS_OPERACIONAIS' && <DashboardSummary records={records} />}

      <section className="content-card">
        <div className="list-toolbar">
          <label className="search-box"><span>⌕</span><input value={query} onChange={(e) => setQuery(e.target.value)} placeholder={`Buscar em ${definition.title.toLowerCase()}...`} /></label>
          {definition.quickFilters && <div className="filter-pills">{definition.quickFilters.map((item) => <button className={filter === item ? 'active' : ''} onClick={() => setFilter(item)} key={item}>{item}</button>)}</div>}
          {permission?.canExport && visibleRecords.length > 0 && <button className="secondary-button" onClick={exportCsv}>Exportar</button>}
        </div>

        {visibleRecords.length === 0 ? (
          <div className="friendly-empty"><div>✓</div><h2>Tudo pronto para começar</h2><p>Ainda não há registros nesta página. Use o botão acima para adicionar o primeiro.</p></div>
        ) : (
          <>
            <div className="desktop-table"><table><thead><tr>{tableFields.map((field) => <th key={field.key}>{field.label}</th>)}<th>Ações</th></tr></thead><tbody>
              {visibleRecords.map((record) => <tr key={record.id}>{tableFields.map((field) => <td key={field.key}>{String(record[field.key] ?? '—')}</td>)}<td className="row-actions">{permission?.canUpdate && <button onClick={() => openEdit(record)}>Editar</button>}{permission?.canDelete && <button className="danger-link" onClick={() => remove(record)}>Excluir</button>}</td></tr>)}
            </tbody></table></div>
            <div className="mobile-records">{visibleRecords.map((record) => <article key={record.id}><div>{tableFields.map((field) => <p key={field.key}><small>{field.label}</small><strong>{String(record[field.key] ?? '—')}</strong></p>)}</div><footer>{permission?.canUpdate && <button onClick={() => openEdit(record)}>Editar</button>}{permission?.canDelete && <button onClick={() => remove(record)}>Excluir</button>}</footer></article>)}</div>
          </>
        )}
      </section>

      {modalOpen && <div className="modal-backdrop" onMouseDown={(e) => e.target === e.currentTarget && setModalOpen(false)}><section className="form-modal" role="dialog" aria-modal="true"><header><div><span className="eyebrow">{editing ? 'EDITAR' : 'NOVO REGISTRO'}</span><h2>{editing ? `Editar ${definition.singular}` : definition.primaryAction ?? `Nova ${definition.singular}`}</h2></div><button className="modal-close" onClick={() => setModalOpen(false)} aria-label="Fechar">×</button></header><form onSubmit={submit}><div className="form-grid">{definition.fields.map((field) => <label className={field.type === 'textarea' ? 'wide' : ''} key={field.key}><span>{field.label}{field.required && ' *'}</span><Field field={field} value={form[field.key] ?? ''} onChange={(value) => setForm((current) => ({ ...current, [field.key]: value }))} /></label>)}</div><footer><button type="button" className="secondary-button" onClick={() => setModalOpen(false)}>Cancelar</button><button className="primary-button" type="submit">Salvar</button></footer></form></section></div>}
    </section>
  )
}

function DashboardSummary({ records }: { records: LocalRecord[] }) {
  return <div className="summary-grid"><article><span>Faturamento</span><strong>R$ 0,00</strong><small>Período selecionado</small></article><article><span>Vendas</span><strong>{records.length}</strong><small>Registros encontrados</small></article><article><span>Ticket médio</span><strong>R$ 0,00</strong><small>Por venda concluída</small></article><article><span>Estoque baixo</span><strong>0</strong><small>Produtos para revisar</small></article></div>
}
