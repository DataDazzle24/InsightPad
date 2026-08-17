import { useCallback, useEffect, useState, type FormEvent, type ReactNode } from 'react'
import { getDataConnect } from 'firebase/data-connect'
import { Link } from 'react-router-dom'
import { z } from 'zod'
import {
  archiveCategory, archiveSubcategory, categoryOptions, connectorConfig,
  createCategory, createSubcategory, listCategories, listSubcategories,
  restoreCategory, restoreSubcategory, updateCategory, updateSubcategory,
} from '@insightpad/dataconnect'
import { useAuth } from '../auth/useAuth'
import { firebaseApp } from '../lib/firebase'

const dataConnect = getDataConnect(firebaseApp, connectorConfig)
const PAGE_SIZE = 20
const categorySchema = z.object({ id:z.string().uuid(), name:z.string(), active:z.boolean(), createdAt:z.string(), updatedAt:z.string(), subcategoryCount:z.coerce.number() })
const subcategorySchema = z.object({ id:z.string().uuid(), name:z.string(), categoryId:z.string().uuid(), categoryName:z.string(), active:z.boolean(), createdAt:z.string(), updatedAt:z.string() })
const optionSchema = z.object({ id:z.string().uuid(), name:z.string() })
type Category=z.infer<typeof categorySchema>; type Subcategory=z.infer<typeof subcategorySchema>; type Option=z.infer<typeof optionSchema>
type Notice={type:'success'|'error';text:string}; type Confirmation={title:string;message:string;confirmLabel:string;danger?:boolean;run:()=>Promise<void>}

export function CatalogPages({pageKey}:{pageKey:'CAD_CATEGORIA'|'CAD_SUBCATEGORIA'}) {
  return pageKey==='CAD_CATEGORIA'?<CategoryPage/>:<SubcategoryPage/>
}

function CategoryPage(){
  const permission=useAuth().permissions.CAD_CATEGORIA
  const [items,setItems]=useState<Category[]>([]),[search,setSearch]=useState(''),[page,setPage]=useState(0)
  const [loading,setLoading]=useState(true),[saving,setSaving]=useState(false),[modal,setModal]=useState(false)
  const [editing,setEditing]=useState<Category|null>(null),[name,setName]=useState(''),[notice,setNotice]=useState<Notice|null>(null)
  const [confirmation,setConfirmation]=useState<Confirmation|null>(null)

  const load=useCallback(async()=>{setLoading(true);try{
    const result=await listCategories(dataConnect,{search:search.trim(),limit:PAGE_SIZE,offset:page*PAGE_SIZE,requestKey:crypto.randomUUID()})
    setItems(z.array(categorySchema).parse(result.data._select??[]))
  }catch(error){console.error(error);setNotice({type:'error',text:'Não foi possível atualizar as categorias.'})}finally{setLoading(false)}},[page,search])
  useEffect(()=>{const request=window.setTimeout(()=>void load(),180);return()=>window.clearTimeout(request)},[load])

  function openCreate(){setEditing(null);setName('');setNotice(null);setModal(true)}
  function openEdit(item:Category){setEditing(item);setName(item.name);setNotice(null);setModal(true)}
  function submit(event:FormEvent){event.preventDefault();const value=name.trim()
    if(value.length<2){setNotice({type:'error',text:'Informe um nome com pelo menos 2 caracteres.'});return}
    setConfirmation({title:editing?'Confirmar edição':'Confirmar cadastro',message:editing?`Salvar as alterações da categoria “${editing.name}”?`:`Cadastrar a categoria “${value}”?`,confirmLabel:editing?'Salvar alterações':'Cadastrar',run:async()=>{
      const result=editing?await updateCategory(dataConnect,{id:editing.id,name:value}):await createCategory(dataConnect,{name:value})
      if(!result.data._execute)throw new Error('Operação não aplicada');setModal(false);setNotice({type:'success',text:editing?'Categoria atualizada.':'Categoria cadastrada.'});await load()
    }})
  }
  function changeStatus(item:Category){const activate=!item.active;setConfirmation({title:activate?'Ativar categoria':'Inativar categoria',
    message:activate?`Deseja ativar “${item.name}”?`:`Deseja inativar “${item.name}”? Registros vinculados podem impedir esta operação.`,
    confirmLabel:activate?'Ativar':'Inativar',danger:!activate,run:async()=>{const result=activate?await restoreCategory(dataConnect,{id:item.id}):await archiveCategory(dataConnect,{id:item.id})
      if(!result.data._execute)throw new Error('Operação não aplicada');setNotice({type:'success',text:activate?'Categoria ativada.':'Categoria inativada.'});await load()}})
  }
  async function confirm(){if(!confirmation)return;setSaving(true);try{await confirmation.run();setConfirmation(null)}catch(error){console.error(error);setNotice({type:'error',text:'A operação não foi aplicada. Verifique duplicidades, vínculos ou permissões.'});setConfirmation(null)}finally{setSaving(false)}}

  return <CatalogLayout title="Categorias" description="Organize os produtos em grupos para facilitar buscas, estoque e relatórios." search={search}
    setSearch={v=>{setSearch(v);setPage(0)}} busy={loading||saving} notice={notice} actionLabel="Nova categoria" canCreate={!!permission?.canCreate}
    onCreate={openCreate} page={page} setPage={setPage} hasNext={items.length===PAGE_SIZE}>
    <CatalogTable headers={['Categoria','Status','Subcategorias','Atualização','Ações']} empty={!items.length&&!loading}>
      {items.map(item=><tr key={item.id} className={!item.active?'is-inactive':''}><td><strong>{item.name}</strong></td><td><Status active={item.active}/></td>
        <td>{item.subcategoryCount}</td><td>{formatDate(item.updatedAt)}</td><td><div className="catalog-actions">
          {item.active&&permission?.canUpdate&&<button onClick={()=>openEdit(item)}>Editar</button>}
          {(permission?.canDelete||permission?.canUpdate)&&<button className={item.active?'danger':'success'} onClick={()=>changeStatus(item)}>{item.active?'Inativar':'Ativar'}</button>}
        </div></td></tr>)}
    </CatalogTable>
    {modal&&<FormModal title={editing?'Editar categoria':'Nova categoria'} saving={saving} onClose={()=>setModal(false)} onSubmit={submit}>
      <label><span>Nome da categoria *</span><input autoFocus maxLength={120} value={name} onChange={e=>setName(e.target.value)}/></label>
    </FormModal>}
    {confirmation&&<ConfirmModal value={confirmation} saving={saving} onCancel={()=>setConfirmation(null)} onConfirm={()=>void confirm()}/>}
  </CatalogLayout>
}

function SubcategoryPage(){
  const permission=useAuth().permissions.CAD_SUBCATEGORIA
  const [items,setItems]=useState<Subcategory[]>([]),[options,setOptions]=useState<Option[]>([]),[search,setSearch]=useState(''),[filter,setFilter]=useState(''),[page,setPage]=useState(0)
  const [loading,setLoading]=useState(true),[saving,setSaving]=useState(false),[modal,setModal]=useState(false),[editing,setEditing]=useState<Subcategory|null>(null)
  const [name,setName]=useState(''),[categoryId,setCategoryId]=useState(''),[notice,setNotice]=useState<Notice|null>(null),[confirmation,setConfirmation]=useState<Confirmation|null>(null)

  const load=useCallback(async()=>{setLoading(true);try{const [records,categories]=await Promise.all([
    listSubcategories(dataConnect,{search:search.trim(),categoryId:filter||null,limit:PAGE_SIZE,offset:page*PAGE_SIZE,requestKey:crypto.randomUUID()}),categoryOptions(dataConnect)])
    setItems(z.array(subcategorySchema).parse(records.data._select??[]));setOptions(z.array(optionSchema).parse(categories.data._select??[]))
  }catch(error){console.error(error);setNotice({type:'error',text:'Não foi possível atualizar as subcategorias.'})}finally{setLoading(false)}},[filter,page,search])
  useEffect(()=>{const request=window.setTimeout(()=>void load(),180);return()=>window.clearTimeout(request)},[load])
  function openCreate(){setEditing(null);setName('');setCategoryId(options[0]?.id??'');setNotice(null);setModal(true)}
  function openEdit(item:Subcategory){setEditing(item);setName(item.name);setCategoryId(item.categoryId);setNotice(null);setModal(true)}
  function submit(event:FormEvent){event.preventDefault();const value=name.trim();if(!categoryId||value.length<2){setNotice({type:'error',text:'Selecione a categoria e informe um nome válido.'});return}
    setConfirmation({title:editing?'Confirmar edição':'Confirmar cadastro',message:editing?`Salvar as alterações de “${editing.name}”?`:`Cadastrar a subcategoria “${value}”?`,
      confirmLabel:editing?'Salvar alterações':'Cadastrar',run:async()=>{const vars={categoryId,name:value};const result=editing?await updateSubcategory(dataConnect,{id:editing.id,...vars}):await createSubcategory(dataConnect,vars)
        if(!result.data._execute)throw new Error('Operação não aplicada');setModal(false);setNotice({type:'success',text:editing?'Subcategoria atualizada.':'Subcategoria cadastrada.'});await load()}})
  }
  function changeStatus(item:Subcategory){const activate=!item.active;setConfirmation({title:activate?'Ativar subcategoria':'Inativar subcategoria',message:activate?`Deseja ativar “${item.name}”?`:`Deseja inativar “${item.name}”?`,
    confirmLabel:activate?'Ativar':'Inativar',danger:!activate,run:async()=>{const result=activate?await restoreSubcategory(dataConnect,{id:item.id}):await archiveSubcategory(dataConnect,{id:item.id})
      if(!result.data._execute)throw new Error('Operação não aplicada');setNotice({type:'success',text:activate?'Subcategoria ativada.':'Subcategoria inativada.'});await load()}})
  }
  async function confirm(){if(!confirmation)return;setSaving(true);try{await confirmation.run();setConfirmation(null)}catch(error){console.error(error);setNotice({type:'error',text:'A operação não foi aplicada. Verifique duplicidades, vínculos ou permissões.'});setConfirmation(null)}finally{setSaving(false)}}

  return <CatalogLayout title="Subcategorias" description="Detalhe suas categorias mantendo os relacionamentos dos produtos consistentes." search={search}
    setSearch={v=>{setSearch(v);setPage(0)}} busy={loading||saving} notice={notice} actionLabel="Nova subcategoria" canCreate={!!permission?.canCreate&&options.length>0}
    onCreate={openCreate} page={page} setPage={setPage} hasNext={items.length===PAGE_SIZE} extraFilter={<select value={filter} onChange={e=>{setFilter(e.target.value);setPage(0)}}><option value="">Todas as categorias</option>{options.map(o=><option value={o.id} key={o.id}>{o.name}</option>)}</select>}>
    <CatalogTable headers={['Subcategoria','Categoria','Status','Atualização','Ações']} empty={!items.length&&!loading}>
      {items.map(item=><tr key={item.id} className={!item.active?'is-inactive':''}><td><strong>{item.name}</strong></td><td>{item.categoryName}</td><td><Status active={item.active}/></td>
        <td>{formatDate(item.updatedAt)}</td><td><div className="catalog-actions">{item.active&&permission?.canUpdate&&<button onClick={()=>openEdit(item)}>Editar</button>}
          {(permission?.canDelete||permission?.canUpdate)&&<button className={item.active?'danger':'success'} onClick={()=>changeStatus(item)}>{item.active?'Inativar':'Ativar'}</button>}</div></td></tr>)}
    </CatalogTable>
    {modal&&<FormModal title={editing?'Editar subcategoria':'Nova subcategoria'} saving={saving} onClose={()=>setModal(false)} onSubmit={submit}>
      <label><span>Categoria *</span><select value={categoryId} onChange={e=>setCategoryId(e.target.value)}><option value="">Selecione</option>{options.map(o=><option value={o.id} key={o.id}>{o.name}</option>)}</select></label>
      <label><span>Nome da subcategoria *</span><input autoFocus maxLength={120} value={name} onChange={e=>setName(e.target.value)}/></label>
    </FormModal>}
    {confirmation&&<ConfirmModal value={confirmation} saving={saving} onCancel={()=>setConfirmation(null)} onConfirm={()=>void confirm()}/>}
  </CatalogLayout>
}

function CatalogLayout(p:{title:string;description:string;search:string;setSearch:(v:string)=>void;busy:boolean;notice:Notice|null;actionLabel:string;canCreate:boolean;onCreate:()=>void;page:number;setPage:(n:number)=>void;hasNext:boolean;extraFilter?:ReactNode;children:ReactNode}){
  return <section className="catalog-page"><header><div><span className="eyebrow">Cadastros</span><h1>{p.title}</h1><p>{p.description}</p></div><div className="catalog-header-actions">
    <Link className="catalog-back" to="/modulos/cadastros"><span className="material-symbols-rounded">arrow_back</span>Voltar</Link>
    {p.canCreate&&<button className="catalog-primary" onClick={p.onCreate}><span>+</span>{p.actionLabel}</button>}</div></header>
    {p.notice&&<div className={`catalog-feedback catalog-feedback--${p.notice.type}`}>{p.notice.text}</div>}
    <div className="catalog-panel"><div className="catalog-toolbar"><label><span className="material-symbols-rounded">search</span><input value={p.search} onChange={e=>p.setSearch(e.target.value)} placeholder="Pesquisar..."/></label>{p.extraFilter}</div>
      <div className="catalog-scroll">{p.children}</div><footer className="catalog-pagination"><button disabled={p.page===0||p.busy} onClick={()=>p.setPage(p.page-1)}>Anterior</button><span>Página {p.page+1}</span><button disabled={!p.hasNext||p.busy} onClick={()=>p.setPage(p.page+1)}>Próxima</button></footer></div>
    {p.busy&&<LoadingOverlay/>}
  </section>
}
function CatalogTable({headers,empty,children}:{headers:string[];empty:boolean;children:ReactNode}){return empty?<div className="catalog-empty"><span className="material-symbols-rounded">inventory_2</span><strong>Nenhum registro encontrado</strong><small>Cadastre o primeiro item ou altere os filtros.</small></div>:<div className="catalog-table"><table><thead><tr>{headers.map(h=><th key={h}>{h}</th>)}</tr></thead><tbody>{children}</tbody></table></div>}
function Status({active}:{active:boolean}){return <span className={`catalog-status catalog-status--${active?'active':'inactive'}`}><i/>{active?'Ativo':'Inativo'}</span>}
function FormModal(p:{title:string;saving:boolean;onClose:()=>void;onSubmit:(e:FormEvent)=>void;children:ReactNode}){return <div className="catalog-backdrop" onMouseDown={e=>e.target===e.currentTarget&&p.onClose()}><section className="catalog-modal"><header><div><span className="eyebrow">Cadastro</span><h2>{p.title}</h2></div><button onClick={p.onClose}>×</button></header><form onSubmit={p.onSubmit}><div>{p.children}</div><footer><button type="button" onClick={p.onClose}>Cancelar</button><button className="catalog-primary" disabled={p.saving}>Continuar</button></footer></form></section></div>}
function ConfirmModal({value,saving,onCancel,onConfirm}:{value:Confirmation;saving:boolean;onCancel:()=>void;onConfirm:()=>void}){return <div className="catalog-backdrop"><section className="catalog-confirm"><span className="material-symbols-rounded">help</span><h2>{value.title}</h2><p>{value.message}</p><footer><button onClick={onCancel} disabled={saving}>Cancelar</button><button className={value.danger?'confirm-danger':'catalog-primary'} onClick={onConfirm} disabled={saving}>{value.confirmLabel}</button></footer></section></div>}
function LoadingOverlay(){return <div className="catalog-loader" role="status" aria-live="polite"><div className="catalog-loader__mark"><span/><img src="/brand/insight-pad-logo-dark.png" alt="Insight Pad"/></div><strong>Atualizando informações...</strong></div>}
function formatDate(value:string){return new Intl.DateTimeFormat('pt-BR',{dateStyle:'short',timeStyle:'short'}).format(new Date(value))}
