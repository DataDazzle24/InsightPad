import { useCallback, useEffect, useMemo, useState, type FormEvent } from 'react'
import { getDataConnect } from 'firebase/data-connect'
import { z } from 'zod'
import {
  archiveCategory,
  archiveSubcategory,
  categoryOptions,
  connectorConfig,
  createCategory,
  createSubcategory,
  listCategories,
  listSubcategories,
  updateCategory,
  updateSubcategory,
} from '@insightpad/dataconnect'
import { useAuth } from '../auth/useAuth'
import { firebaseApp } from '../lib/firebase'

const dataConnect = getDataConnect(firebaseApp, connectorConfig)
const PAGE_SIZE = 20

const categorySchema = z.object({
  id: z.string().uuid(),
  name: z.string(),
  active: z.boolean(),
  createdAt: z.string(),
  updatedAt: z.string(),
  subcategoryCount: z.coerce.number(),
})
const subcategorySchema = z.object({
  id: z.string().uuid(),
  name: z.string(),
  categoryId: z.string().uuid(),
  categoryName: z.string(),
  active: z.boolean(),
  createdAt: z.string(),
  updatedAt: z.string(),
})
const optionSchema = z.object({ id: z.string().uuid(), name: z.string() })

type Category = z.infer<typeof categorySchema>
type Subcategory = z.infer<typeof subcategorySchema>
type CategoryOption = z.infer<typeof optionSchema>

interface CatalogPagesProps { pageKey: 'CAD_CATEGORIA' | 'CAD_SUBCATEGORIA' }

export function CatalogPages({ pageKey }: CatalogPagesProps) {
  return pageKey === 'CAD_CATEGORIA' ? <CategoryPage /> : <SubcategoryPage />
}

function CategoryPage() {
  const { permissions } = useAuth()
  const permission = permissions.CAD_CATEGORIA
  const [items, setItems] = useState<Category[]>([])
  const [search, setSearch] = useState('')
  const [page, setPage] = useState(0)
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [editing, setEditing] = useState<Category | null>(null)
  const [modalOpen, setModalOpen] = useState(false)
  const [name, setName] = useState('')
  const [feedback, setFeedback] = useState<{ type: 'success' | 'error'; text: string } | null>(null)

  const load = useCallback(async () => {
    setLoading(true)
    try {
      const result = await listCategories(dataConnect, { search: search.trim(), limit: PAGE_SIZE, offset: page * PAGE_SIZE })
      setItems(z.array(categorySchema).parse(result.data._select ?? []))
    } catch (error) {
      console.error(error)
      setFeedback({ type: 'error', text: 'Não foi possível carregar as categorias.' })
    } finally { setLoading(false) }
  }, [page, search])

  useEffect(() => { void load() }, [load])

  function openCreate() { setEditing(null); setName(''); setFeedback(null); setModalOpen(true) }
  function openEdit(item: Category) { setEditing(item); setName(item.name); setFeedback(null); setModalOpen(true) }

  async function submit(event: FormEvent) {
    event.preventDefault()
    const normalized = name.trim()
    if (normalized.length < 2) { setFeedback({ type: 'error', text: 'Informe um nome com pelo menos 2 caracteres.' }); return }
    setSaving(true)
    try {
      const result = editing
        ? await updateCategory(dataConnect, { id: editing.id, name: normalized })
        : await createCategory(dataConnect, { name: normalized })
      if (!result.data._execute) throw new Error('Operação não aplicada')
      setModalOpen(false)
      setFeedback({ type: 'success', text: editing ? 'Categoria atualizada.' : 'Categoria cadastrada.' })
      await load()
    } catch (error) {
      console.error(error)
      setFeedback({ type: 'error', text: 'Não foi possível salvar. Verifique duplicidade ou permissão.' })
    } finally { setSaving(false) }
  }

  async function archive(item: Category) {
    if (!window.confirm(`Inativar a categoria "${item.name}"?`)) return
    setSaving(true)
    try {
      const result = await archiveCategory(dataConnect, { id: item.id })
      if (!result.data._execute) throw new Error('Operação não aplicada')
      setFeedback({ type: 'success', text: 'Categoria inativada.' })
      await load()
    } catch (error) {
      console.error(error)
      setFeedback({ type: 'error', text: 'A categoria possui vínculos ativos ou você não tem permissão.' })
    } finally { setSaving(false) }
  }

  return (
    <CatalogLayout title="Categorias" description="Organize os produtos em grupos para facilitar buscas, estoque e relatórios."
      search={search} setSearch={(value) => { setSearch(value); setPage(0) }} loading={loading}
      feedback={feedback} actionLabel="Nova categoria" canCreate={permission?.canCreate === true} onCreate={openCreate}
      page={page} setPage={setPage} hasNext={items.length === PAGE_SIZE}>
      <CatalogTable headers={['Categoria', 'Subcategorias', 'Atualização', 'Ações']} empty={!items.length && !loading}>
        {items.map((item) => <tr key={item.id}>
          <td><strong>{item.name}</strong></td>
          <td>{item.subcategoryCount}</td>
          <td>{formatDate(item.updatedAt)}</td>
          <td><div className="catalog-actions">
            {permission?.canUpdate && <button onClick={() => openEdit(item)}>Editar</button>}
            {permission?.canDelete && <button className="danger" disabled={saving} onClick={() => void archive(item)}>Inativar</button>}
          </div></td>
        </tr>)}
      </CatalogTable>
      {modalOpen && <CatalogModal title={editing ? 'Editar categoria' : 'Nova categoria'} saving={saving}
        onClose={() => setModalOpen(false)} onSubmit={submit}>
        <label><span>Nome da categoria *</span><input autoFocus maxLength={120} value={name} onChange={(e) => setName(e.target.value)} /></label>
      </CatalogModal>}
    </CatalogLayout>
  )
}

function SubcategoryPage() {
  const { permissions } = useAuth()
  const permission = permissions.CAD_SUBCATEGORIA
  const [items, setItems] = useState<Subcategory[]>([])
  const [options, setOptions] = useState<CategoryOption[]>([])
  const [search, setSearch] = useState('')
  const [filterCategory, setFilterCategory] = useState('')
  const [page, setPage] = useState(0)
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [editing, setEditing] = useState<Subcategory | null>(null)
  const [modalOpen, setModalOpen] = useState(false)
  const [name, setName] = useState('')
  const [categoryId, setCategoryId] = useState('')
  const [feedback, setFeedback] = useState<{ type: 'success' | 'error'; text: string } | null>(null)

  const load = useCallback(async () => {
    setLoading(true)
    try {
      const [records, categories] = await Promise.all([
        listSubcategories(dataConnect, { search: search.trim(), categoryId: filterCategory || null, limit: PAGE_SIZE, offset: page * PAGE_SIZE }),
        categoryOptions(dataConnect),
      ])
      setItems(z.array(subcategorySchema).parse(records.data._select ?? []))
      setOptions(z.array(optionSchema).parse(categories.data._select ?? []))
    } catch (error) {
      console.error(error)
      setFeedback({ type: 'error', text: 'Não foi possível carregar as subcategorias.' })
    } finally { setLoading(false) }
  }, [filterCategory, page, search])

  useEffect(() => { void load() }, [load])
  const selectedCategory = useMemo(() => options.find((item) => item.id === categoryId), [categoryId, options])

  function openCreate() { setEditing(null); setName(''); setCategoryId(options[0]?.id ?? ''); setFeedback(null); setModalOpen(true) }
  function openEdit(item: Subcategory) { setEditing(item); setName(item.name); setCategoryId(item.categoryId); setFeedback(null); setModalOpen(true) }

  async function submit(event: FormEvent) {
    event.preventDefault()
    if (!categoryId || name.trim().length < 2) { setFeedback({ type: 'error', text: 'Selecione a categoria e informe um nome válido.' }); return }
    setSaving(true)
    try {
      const vars = { categoryId, name: name.trim() }
      const result = editing
        ? await updateSubcategory(dataConnect, { id: editing.id, ...vars })
        : await createSubcategory(dataConnect, vars)
      if (!result.data._execute) throw new Error('Operação não aplicada')
      setModalOpen(false)
      setFeedback({ type: 'success', text: editing ? 'Subcategoria atualizada.' : 'Subcategoria cadastrada.' })
      await load()
    } catch (error) {
      console.error(error)
      setFeedback({ type: 'error', text: 'Não foi possível salvar. Verifique duplicidade, categoria ou permissão.' })
    } finally { setSaving(false) }
  }

  async function archive(item: Subcategory) {
    if (!window.confirm(`Inativar a subcategoria "${item.name}"?`)) return
    setSaving(true)
    try {
      const result = await archiveSubcategory(dataConnect, { id: item.id })
      if (!result.data._execute) throw new Error('Operação não aplicada')
      setFeedback({ type: 'success', text: 'Subcategoria inativada.' })
      await load()
    } catch (error) {
      console.error(error)
      setFeedback({ type: 'error', text: 'A subcategoria possui produtos ativos ou você não tem permissão.' })
    } finally { setSaving(false) }
  }

  return (
    <CatalogLayout title="Subcategorias" description="Detalhe suas categorias mantendo os relacionamentos dos produtos consistentes."
      search={search} setSearch={(value) => { setSearch(value); setPage(0) }} loading={loading}
      feedback={feedback} actionLabel="Nova subcategoria" canCreate={permission?.canCreate === true && options.length > 0}
      onCreate={openCreate} page={page} setPage={setPage} hasNext={items.length === PAGE_SIZE}
      extraFilter={<select aria-label="Filtrar por categoria" value={filterCategory} onChange={(e) => { setFilterCategory(e.target.value); setPage(0) }}>
        <option value="">Todas as categorias</option>{options.map((item) => <option value={item.id} key={item.id}>{item.name}</option>)}
      </select>}>
      <CatalogTable headers={['Subcategoria', 'Categoria', 'Atualização', 'Ações']} empty={!items.length && !loading}>
        {items.map((item) => <tr key={item.id}>
          <td><strong>{item.name}</strong></td><td>{item.categoryName}</td><td>{formatDate(item.updatedAt)}</td>
          <td><div className="catalog-actions">
            {permission?.canUpdate && <button onClick={() => openEdit(item)}>Editar</button>}
            {permission?.canDelete && <button className="danger" disabled={saving} onClick={() => void archive(item)}>Inativar</button>}
          </div></td>
        </tr>)}
      </CatalogTable>
      {modalOpen && <CatalogModal title={editing ? 'Editar subcategoria' : 'Nova subcategoria'} saving={saving}
        onClose={() => setModalOpen(false)} onSubmit={submit}>
        <label><span>Categoria *</span><select value={categoryId} onChange={(e) => setCategoryId(e.target.value)}>
          <option value="">Selecione</option>{options.map((item) => <option value={item.id} key={item.id}>{item.name}</option>)}
        </select></label>
        <label><span>Nome da subcategoria *</span><input autoFocus maxLength={120} value={name} onChange={(e) => setName(e.target.value)}
          placeholder={selectedCategory ? `Ex.: opção de ${selectedCategory.name}` : ''} /></label>
      </CatalogModal>}
    </CatalogLayout>
  )
}

function CatalogLayout(props: {
  title: string; description: string; search: string; setSearch: (value: string) => void; loading: boolean
  feedback: { type: 'success' | 'error'; text: string } | null; actionLabel: string; canCreate: boolean
  onCreate: () => void; page: number; setPage: (page: number) => void; hasNext: boolean
  extraFilter?: React.ReactNode; children: React.ReactNode
}) {
  return <section className="catalog-page">
    <header><div><span className="eyebrow">Cadastros</span><h1>{props.title}</h1><p>{props.description}</p></div>
      {props.canCreate && <button className="catalog-primary" onClick={props.onCreate}><span>+</span>{props.actionLabel}</button>}</header>
    {props.feedback && <div className={`catalog-feedback catalog-feedback--${props.feedback.type}`}>{props.feedback.text}</div>}
    <div className="catalog-panel">
      <div className="catalog-toolbar"><label><span className="material-symbols-rounded">search</span>
        <input value={props.search} onChange={(e) => props.setSearch(e.target.value)} placeholder="Pesquisar..." /></label>
        {props.extraFilter}{props.loading && <span className="catalog-loading">Atualizando...</span>}</div>
      {props.children}
      <footer className="catalog-pagination"><button disabled={props.page === 0 || props.loading} onClick={() => props.setPage(props.page - 1)}>Anterior</button>
        <span>Página {props.page + 1}</span><button disabled={!props.hasNext || props.loading} onClick={() => props.setPage(props.page + 1)}>Próxima</button></footer>
    </div>
  </section>
}

function CatalogTable({ headers, empty, children }: { headers: string[]; empty: boolean; children: React.ReactNode }) {
  if (empty) return <div className="catalog-empty"><span className="material-symbols-rounded">inventory_2</span><strong>Nenhum registro encontrado</strong><small>Cadastre o primeiro item ou altere os filtros.</small></div>
  return <div className="catalog-table"><table><thead><tr>{headers.map((header) => <th key={header}>{header}</th>)}</tr></thead><tbody>{children}</tbody></table></div>
}

function CatalogModal({ title, saving, onClose, onSubmit, children }: {
  title: string; saving: boolean; onClose: () => void; onSubmit: (event: FormEvent) => void; children: React.ReactNode
}) {
  return <div className="catalog-backdrop" onMouseDown={(event) => event.target === event.currentTarget && onClose()}>
    <section className="catalog-modal" role="dialog" aria-modal="true"><header><div><span className="eyebrow">Cadastro</span><h2>{title}</h2></div>
      <button aria-label="Fechar" onClick={onClose}>×</button></header><form onSubmit={onSubmit}><div>{children}</div><footer>
        <button type="button" onClick={onClose}>Cancelar</button><button className="catalog-primary" disabled={saving} type="submit">{saving ? 'Salvando...' : 'Salvar'}</button>
      </footer></form></section>
  </div>
}

function formatDate(value: string) {
  return new Intl.DateTimeFormat('pt-BR', { dateStyle: 'short', timeStyle: 'short' }).format(new Date(value))
}
