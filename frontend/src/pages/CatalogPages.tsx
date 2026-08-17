import { useCallback,useEffect,useMemo,useState,type FormEvent,type ReactNode } from 'react'
import { getDataConnect } from 'firebase/data-connect'
import { Link } from 'react-router-dom'
import { z } from 'zod'
import {
 archiveCategory,archiveSubcategory,categoryOptions,connectorConfig,createCategoriesBatch,createCategory,createSubcategoriesBatch,
 createSubcategory,listCategories,listSubcategories,restoreCategory,restoreSubcategory,updateCategory,updateSubcategory,
} from '@insightpad/dataconnect'
import { useAuth } from '../auth/useAuth'
import { firebaseApp } from '../lib/firebase'

const dc=getDataConnect(firebaseApp,connectorConfig),RESULT_LIMIT=5000
const categorySchema=z.object({id:z.string().uuid(),name:z.string(),active:z.boolean(),createdAt:z.string(),updatedAt:z.string(),subcategoryCount:z.coerce.number()})
const subcategorySchema=z.object({id:z.string().uuid(),name:z.string(),categoryId:z.string().uuid(),categoryName:z.string(),active:z.boolean(),createdAt:z.string(),updatedAt:z.string()})
const optionSchema=z.object({id:z.string().uuid(),name:z.string()})
type Category=z.infer<typeof categorySchema>;type Subcategory=z.infer<typeof subcategorySchema>;type Option=z.infer<typeof optionSchema>
type Notice={type:'success'|'error';text:string};type Confirmation={message:string;run:()=>Promise<void>}
type BatchSubcategory={categoryId:string;name:string}
const formatDate=(value:string)=>new Intl.DateTimeFormat('pt-BR',{dateStyle:'short',timeStyle:'short'}).format(new Date(value))
const csv=(filename:string,headers:string[],lines:string[][])=>{const content=[headers,...lines].map(line=>line.map(value=>`"${String(value??'').replaceAll('"','""')}"`).join(';')).join('\n')
 const link=document.createElement('a');link.href=URL.createObjectURL(new Blob([`\uFEFF${content}`],{type:'text/csv'}));link.download=filename;link.click();URL.revokeObjectURL(link.href)}

export function CatalogPages({pageKey}:{pageKey:'CAD_CATEGORIA'|'CAD_SUBCATEGORIA'}){return pageKey==='CAD_CATEGORIA'?<CategoryPage/>:<SubcategoryPage/>}

function CategoryPage(){
 const permission=useAuth().permissions.CAD_CATEGORIA
 const [items,setItems]=useState<Category[]>([]),[search,setSearch]=useState(''),[busy,setBusy]=useState(true),[notice,setNotice]=useState<Notice|null>(null)
 const [modal,setModal]=useState(false),[editing,setEditing]=useState<Category|null>(null),[names,setNames]=useState([''])
 const [selected,setSelected]=useState<string[]>([]),[filters,setFilters]=useState<Record<string,string[]>>({}),[filterSearch,setFilterSearch]=useState<Record<string,string>>({}),[filterModal,setFilterModal]=useState(false)
 const [confirmation,setConfirmation]=useState<Confirmation|null>(null)
 const load=useCallback(async()=>{setBusy(true);try{const result=await listCategories(dc,{search:search.trim(),limit:RESULT_LIMIT,offset:0,requestKey:crypto.randomUUID()});setItems(z.array(categorySchema).parse(result.data._select??[]))}
  catch(error){console.error(error);setNotice({type:'error',text:'Não foi possível atualizar as categorias.'})}finally{setBusy(false)}},[search])
 useEffect(()=>{const timer=window.setTimeout(()=>void load(),180);return()=>window.clearTimeout(timer)},[load])
 useEffect(()=>{if(!notice)return;const timer=window.setTimeout(()=>setNotice(null),7000);return()=>window.clearTimeout(timer)},[notice])
 const filtered=useMemo(()=>items.filter(item=>Object.entries(filters).every(([key,values])=>values.length===0||values.includes(String(item[key as keyof Category]??'')))),[items,filters])
 function open(item?:Category){setEditing(item??null);setNames([item?.name??'']);setModal(true)}
 function save(event:FormEvent){event.preventDefault();const clean=names.map(name=>name.trim().toUpperCase()).filter(Boolean)
  if(clean.length===0||clean.some(name=>name.length<2)||new Set(clean).size!==clean.length){setNotice({type:'error',text:'Informe categorias válidas, sem repetições.'});return}
  setConfirmation({message:editing?'Confirmar a edição da categoria?':`Cadastrar ${clean.length} categoria(s)?`,run:async()=>{const result=editing?await updateCategory(dc,{id:editing.id,name:clean[0]}):clean.length===1?await createCategory(dc,{name:clean[0]}):await createCategoriesBatch(dc,{names:clean})
   if(!result.data._execute)throw new Error();setModal(false);setNotice({type:'success',text:editing?'Categoria atualizada.':'Categorias cadastradas.'});await load()}})
 }
 async function status(ids:string[],active:boolean){setBusy(true);try{for(const id of ids){const result=active?await restoreCategory(dc,{id}):await archiveCategory(dc,{id});if(!result.data._execute)throw new Error()}setSelected([]);setNotice({type:'success',text:'Status atualizado.'});await load()}
  catch(error){console.error(error);setNotice({type:'error',text:'Não foi possível alterar o status. Verifique vínculos e permissões.'})}finally{setBusy(false)}}
 async function confirm(){if(!confirmation)return;setBusy(true);try{await confirmation.run();setConfirmation(null)}catch(error){console.error(error);setConfirmation(null);setNotice({type:'error',text:'Operação não aplicada. Verifique duplicidades e permissões.'})}finally{setBusy(false)}}
 const options={name:[...new Set(items.map(item=>item.name))].sort().map(value=>({value,label:value})),active:[{value:'true',label:'Ativo'},{value:'false',label:'Inativo'}]}
 return <CatalogShell title="Categorias" search={search} setSearch={setSearch} busy={busy} notice={notice} selected={selected} canCreate={!!permission?.canCreate} onCreate={()=>open()} onExport={permission?.canExport?()=>csv('categorias-completo.csv',['ID','Categoria','Status','Subcategorias','Cadastro','Atualização'],filtered.map(item=>[item.id,item.name,item.active?'Ativo':'Inativo',String(item.subcategoryCount),formatDate(item.createdAt),formatDate(item.updatedAt)])):undefined}
  onFilters={()=>setFilterModal(true)} filterCount={Object.values(filters).reduce((total,value)=>total+value.length,0)}
  onInactive={permission?.canDelete?()=>setConfirmation({message:`Inativar ${selected.length} categoria(s)?`,run:()=>status(selected,false)}):undefined}
  onActive={permission?.canUpdate?()=>setConfirmation({message:`Ativar ${selected.length} categoria(s)?`,run:()=>status(selected,true)}):undefined}>
  <div className="catalog-table"><table><thead><tr><th><input type="checkbox" checked={filtered.length>0&&filtered.every(item=>selected.includes(item.id))} onChange={event=>setSelected(event.target.checked?filtered.map(item=>item.id):[])}/></th><th>Categoria</th><th>Status</th><th>Subcategorias</th><th>Cadastro</th><th>Atualização</th><th>Ações</th></tr></thead>
   <tbody>{filtered.map(item=><tr key={item.id} className={!item.active?'is-inactive':''}><td><input type="checkbox" checked={selected.includes(item.id)} onChange={event=>setSelected(value=>event.target.checked?[...value,item.id]:value.filter(id=>id!==item.id))}/></td><td><strong>{item.name}</strong></td><td><Status active={item.active}/></td><td>{item.subcategoryCount}</td><td>{formatDate(item.createdAt)}</td><td>{formatDate(item.updatedAt)}</td><td><div className="catalog-actions">{item.active&&permission?.canUpdate&&<button onClick={()=>open(item)}>Editar</button>}{((item.active&&permission?.canDelete)||(!item.active&&permission?.canUpdate))&&<button className={item.active?'danger':'success'} onClick={()=>setConfirmation({message:`${item.active?'Inativar':'Ativar'} “${item.name}”?`,run:()=>status([item.id],!item.active)})}>{item.active?'Inativar':'Ativar'}</button>}</div></td></tr>)}</tbody></table></div>
  {modal&&<BatchCategoryModal editing={!!editing} names={names} setNames={setNames} onClose={()=>setModal(false)} onSubmit={save}/>}
  {filterModal&&<FilterModal fields={[{key:'name',label:'Categoria',options:options.name},{key:'active',label:'Status',options:options.active}]} filters={filters} setFilters={setFilters} searches={filterSearch} setSearches={setFilterSearch} onClose={()=>setFilterModal(false)}/>}
  {confirmation&&<Confirm message={confirmation.message} onCancel={()=>setConfirmation(null)} onConfirm={()=>void confirm()}/>}
 </CatalogShell>
}

function SubcategoryPage(){
 const permission=useAuth().permissions.CAD_SUBCATEGORIA
 const [items,setItems]=useState<Subcategory[]>([]),[categories,setCategories]=useState<Option[]>([]),[search,setSearch]=useState(''),[busy,setBusy]=useState(true),[notice,setNotice]=useState<Notice|null>(null)
 const [modal,setModal]=useState(false),[editing,setEditing]=useState<Subcategory|null>(null),[batch,setBatch]=useState<BatchSubcategory[]>([{categoryId:'',name:''}])
 const [selected,setSelected]=useState<string[]>([]),[filters,setFilters]=useState<Record<string,string[]>>({}),[filterSearch,setFilterSearch]=useState<Record<string,string>>({}),[filterModal,setFilterModal]=useState(false),[confirmation,setConfirmation]=useState<Confirmation|null>(null)
 const load=useCallback(async()=>{setBusy(true);try{const key=crypto.randomUUID(),[records,options]=await Promise.all([listSubcategories(dc,{search:search.trim(),categoryId:null,limit:RESULT_LIMIT,offset:0,requestKey:key}),categoryOptions(dc,{requestKey:key})]);setItems(z.array(subcategorySchema).parse(records.data._select??[]));setCategories(z.array(optionSchema).parse(options.data._select??[]))}
  catch(error){console.error(error);setNotice({type:'error',text:'Não foi possível atualizar as subcategorias.'})}finally{setBusy(false)}},[search])
 useEffect(()=>{const timer=window.setTimeout(()=>void load(),180);return()=>window.clearTimeout(timer)},[load])
 useEffect(()=>{if(!notice)return;const timer=window.setTimeout(()=>setNotice(null),7000);return()=>window.clearTimeout(timer)},[notice])
 const filtered=useMemo(()=>items.filter(item=>Object.entries(filters).every(([key,values])=>values.length===0||values.includes(String(item[key as keyof Subcategory]??'')))),[items,filters])
 function open(item?:Subcategory){setEditing(item??null);setBatch([{categoryId:item?.categoryId??categories[0]?.id??'',name:item?.name??''}]);setModal(true)}
 function save(event:FormEvent){event.preventDefault();const clean=batch.map(item=>({categoryId:item.categoryId,name:item.name.trim().toUpperCase()})).filter(item=>item.categoryId&&item.name)
  const keys=clean.map(item=>item.categoryId+'|'+item.name);if(clean.length===0||clean.some(item=>item.name.length<2)||new Set(keys).size!==keys.length){setNotice({type:'error',text:'Informe combinações válidas, sem repetições.'});return}
  setConfirmation({message:editing?'Confirmar a edição da subcategoria?':`Cadastrar ${clean.length} subcategoria(s)?`,run:async()=>{const first=clean[0],result=editing?await updateSubcategory(dc,{id:editing.id,...first}):clean.length===1?await createSubcategory(dc,first):await createSubcategoriesBatch(dc,{items:clean})
   if(!result.data._execute)throw new Error();setModal(false);setNotice({type:'success',text:editing?'Subcategoria atualizada.':'Subcategorias cadastradas.'});await load()}})
 }
 async function status(ids:string[],active:boolean){setBusy(true);try{for(const id of ids){const result=active?await restoreSubcategory(dc,{id}):await archiveSubcategory(dc,{id});if(!result.data._execute)throw new Error()}setSelected([]);setNotice({type:'success',text:'Status atualizado.'});await load()}
  catch(error){console.error(error);setNotice({type:'error',text:'Não foi possível alterar o status. Verifique produtos vinculados.'})}finally{setBusy(false)}}
 async function confirm(){if(!confirmation)return;setBusy(true);try{await confirmation.run();setConfirmation(null)}catch(error){console.error(error);setConfirmation(null);setNotice({type:'error',text:'Operação não aplicada. Verifique duplicidades e permissões.'})}finally{setBusy(false)}}
 const names=[...new Set(items.map(item=>item.name))].sort().map(value=>({value,label:value})),categoryValues=categories.filter(category=>items.some(item=>item.categoryId===category.id)).map(category=>({value:category.id,label:category.name}))
 return <CatalogShell title="Subcategorias" search={search} setSearch={setSearch} busy={busy} notice={notice} selected={selected} canCreate={!!permission?.canCreate&&categories.length>0} onCreate={()=>open()}
  onExport={permission?.canExport?()=>csv('subcategorias-completo.csv',['ID','Subcategoria','Categoria','Status','Cadastro','Atualização'],filtered.map(item=>[item.id,item.name,item.categoryName,item.active?'Ativo':'Inativo',formatDate(item.createdAt),formatDate(item.updatedAt)])):undefined}
  onFilters={()=>setFilterModal(true)} filterCount={Object.values(filters).reduce((total,value)=>total+value.length,0)}
  onInactive={permission?.canDelete?()=>setConfirmation({message:`Inativar ${selected.length} subcategoria(s)?`,run:()=>status(selected,false)}):undefined}
  onActive={permission?.canUpdate?()=>setConfirmation({message:`Ativar ${selected.length} subcategoria(s)?`,run:()=>status(selected,true)}):undefined}>
  <div className="catalog-table"><table><thead><tr><th><input type="checkbox" checked={filtered.length>0&&filtered.every(item=>selected.includes(item.id))} onChange={event=>setSelected(event.target.checked?filtered.map(item=>item.id):[])}/></th><th>Subcategoria</th><th>Categoria</th><th>Status</th><th>Cadastro</th><th>Atualização</th><th>Ações</th></tr></thead><tbody>
   {filtered.map(item=><tr key={item.id} className={!item.active?'is-inactive':''}><td><input type="checkbox" checked={selected.includes(item.id)} onChange={event=>setSelected(value=>event.target.checked?[...value,item.id]:value.filter(id=>id!==item.id))}/></td><td><strong>{item.name}</strong></td><td>{item.categoryName}</td><td><Status active={item.active}/></td><td>{formatDate(item.createdAt)}</td><td>{formatDate(item.updatedAt)}</td><td><div className="catalog-actions">{item.active&&permission?.canUpdate&&<button onClick={()=>open(item)}>Editar</button>}{((item.active&&permission?.canDelete)||(!item.active&&permission?.canUpdate))&&<button className={item.active?'danger':'success'} onClick={()=>setConfirmation({message:`${item.active?'Inativar':'Ativar'} “${item.name}”?`,run:()=>status([item.id],!item.active)})}>{item.active?'Inativar':'Ativar'}</button>}</div></td></tr>)}</tbody></table></div>
  {modal&&<BatchSubcategoryModal editing={!!editing} items={batch} setItems={setBatch} categories={categories} onClose={()=>setModal(false)} onSubmit={save}/>}
  {filterModal&&<FilterModal fields={[{key:'name',label:'Subcategoria',options:names},{key:'categoryId',label:'Categoria',options:categoryValues},{key:'active',label:'Status',options:[{value:'true',label:'Ativo'},{value:'false',label:'Inativo'}]}]} filters={filters} setFilters={setFilters} searches={filterSearch} setSearches={setFilterSearch} onClose={()=>setFilterModal(false)}/>}
  {confirmation&&<Confirm message={confirmation.message} onCancel={()=>setConfirmation(null)} onConfirm={()=>void confirm()}/>}
 </CatalogShell>
}

function CatalogShell(p:{title:string;search:string;setSearch:(value:string)=>void;busy:boolean;notice:Notice|null;selected:string[];canCreate:boolean;onCreate:()=>void;onExport?:()=>void;onFilters:()=>void;filterCount:number;onInactive?:()=>void;onActive?:()=>void;children:ReactNode}){
 return <section className="catalog-page"><header><div><span className="eyebrow">Cadastros</span><h1>{p.title}</h1></div><div className="catalog-header-actions"><Link className="catalog-back" to="/modulos/cadastros"><span className="material-symbols-rounded">arrow_back</span>Voltar</Link>{p.canCreate&&<button className="catalog-primary" onClick={p.onCreate}>+ Novo cadastro</button>}</div></header>
  {p.notice&&<div className={`master-toast master-toast--${p.notice.type}`} role="alert"><span className="material-symbols-rounded">{p.notice.type==='success'?'check_circle':'error'}</span><strong>{p.notice.text}</strong></div>}
  <div className="catalog-panel"><div className="catalog-toolbar"><label><span className="material-symbols-rounded">search</span><input value={p.search} onChange={event=>p.setSearch(event.target.value)} placeholder="Pesquisar..."/></label>
   {p.selected.length>0&&<>{p.onInactive&&<button onClick={p.onInactive}>Inativar selecionados</button>}{p.onActive&&<button onClick={p.onActive}>Ativar selecionados</button>}</>}<button onClick={p.onFilters}><span className="material-symbols-rounded">tune</span>Pesquisa avançada{p.filterCount>0&&<b>{p.filterCount}</b>}</button>{p.onExport&&<button onClick={p.onExport}>Exportar CSV</button>}</div>
   <div className="catalog-scroll">{p.children}</div></div>{p.busy&&<Loading/>}</section>
}
function BatchCategoryModal({editing,names,setNames,onClose,onSubmit}:{editing:boolean;names:string[];setNames:(value:string[])=>void;onClose:()=>void;onSubmit:(event:FormEvent)=>void}){
 return <div className="catalog-backdrop"><section className="catalog-modal master-modal"><header><div><span className="eyebrow">Cadastro</span><h2>{editing?'Editar categoria':'Categorias em lote'}</h2></div><button onClick={onClose}>×</button></header><form onSubmit={onSubmit}><div className="batch-fields">{names.map((name,index)=><div className="batch-row" key={index}><label><span>Categoria {index+1}</span><input autoFocus={index===0} value={name} onChange={event=>setNames(names.map((item,i)=>i===index?event.target.value:item))}/></label>{!editing&&names.length>1&&<button type="button" onClick={()=>setNames(names.filter((_,i)=>i!==index))}>Remover</button>}</div>)}</div>{!editing&&names.length<20&&<button type="button" className="batch-add" onClick={()=>setNames([...names,''])}>+ Adicionar categoria</button>}<footer><button type="button" onClick={onClose}>Cancelar</button><button className="catalog-primary">Continuar</button></footer></form></section></div>
}
function BatchSubcategoryModal({editing,items,setItems,categories,onClose,onSubmit}:{editing:boolean;items:BatchSubcategory[];setItems:(value:BatchSubcategory[])=>void;categories:Option[];onClose:()=>void;onSubmit:(event:FormEvent)=>void}){
 return <div className="catalog-backdrop"><section className="catalog-modal master-modal"><header><div><span className="eyebrow">Cadastro</span><h2>{editing?'Editar subcategoria':'Subcategorias em lote'}</h2></div><button onClick={onClose}>×</button></header><form onSubmit={onSubmit}><div className="batch-fields">{items.map((item,index)=><div className="batch-row batch-row--subcategory" key={index}><label><span>Categoria</span><select value={item.categoryId} onChange={event=>setItems(items.map((value,i)=>i===index?{...value,categoryId:event.target.value}:value))}><option value="">Selecione</option>{categories.map(category=><option value={category.id} key={category.id}>{category.name}</option>)}</select></label><label><span>Subcategoria</span><input value={item.name} onChange={event=>setItems(items.map((value,i)=>i===index?{...value,name:event.target.value}:value))}/></label>{!editing&&items.length>1&&<button type="button" onClick={()=>setItems(items.filter((_,i)=>i!==index))}>Remover</button>}</div>)}</div>{!editing&&items.length<20&&<button type="button" className="batch-add" onClick={()=>setItems([...items,{categoryId:categories[0]?.id??'',name:''}])}>+ Adicionar subcategoria</button>}<footer><button type="button" onClick={onClose}>Cancelar</button><button className="catalog-primary">Continuar</button></footer></form></section></div>
}
type FilterField={key:string;label:string;options:{value:string;label:string}[]}
function FilterModal({fields,filters,setFilters,searches,setSearches,onClose}:{fields:FilterField[];filters:Record<string,string[]>;setFilters:(value:Record<string,string[]>)=>void;searches:Record<string,string>;setSearches:(value:Record<string,string>)=>void;onClose:()=>void}){
 return <div className="catalog-backdrop"><section className="catalog-modal master-modal advanced-search-modal"><header><div><span className="eyebrow">Pesquisa</span><h2>Filtros avançados</h2></div><button onClick={onClose}>×</button></header><form onSubmit={event=>{event.preventDefault();onClose()}}><div className="master-form-grid filter-grid">{fields.map(field=>{const selected=filters[field.key]??[],term=searches[field.key]??'',visible=field.options.filter(option=>option.label.toLowerCase().includes(term.toLowerCase()));return <div className="filter-field" key={field.key}><span>{field.label}</span><details className="filter-multiselect"><summary>{selected.length===0?'Todos os valores':`${selected.length} selecionado(s)`}</summary><div className="filter-dropdown"><label className="filter-dropdown__search"><span className="material-symbols-rounded">search</span><input value={term} onChange={event=>setSearches({...searches,[field.key]:event.target.value})} placeholder="Digite para filtrar..."/></label><div className="filter-dropdown__options">{visible.map(option=><label key={option.value}><input type="checkbox" checked={selected.includes(option.value)} onChange={event=>setFilters({...filters,[field.key]:event.target.checked?[...selected,option.value]:selected.filter(value=>value!==option.value)})}/><span>{option.label}</span></label>)}</div></div></details></div>})}</div><footer><button type="button" onClick={()=>{setFilters({});setSearches({})}}>Limpar filtros</button><button className="catalog-primary">Aplicar</button></footer></form></section></div>
}
function Confirm({message,onCancel,onConfirm}:{message:string;onCancel:()=>void;onConfirm:()=>void}){return <div className="catalog-backdrop"><section className="catalog-confirm"><span className="material-symbols-rounded">help</span><h2>Confirmar operação</h2><p>{message}</p><footer><button onClick={onCancel}>Cancelar</button><button className="catalog-primary" onClick={onConfirm}>Confirmar</button></footer></section></div>}
function Status({active}:{active:boolean}){return <span className={`catalog-status catalog-status--${active?'active':'inactive'}`}><i/>{active?'Ativo':'Inativo'}</span>}
function Loading(){return <div className="catalog-loader"><div className="catalog-loader__mark"><span/><img src="/brand/insight-pad-logo-dark.png" alt="Insight Pad"/></div><strong>Atualizando informações...</strong></div>}
