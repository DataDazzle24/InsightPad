import { useCallback,useEffect,useMemo,useState,type FormEvent } from 'react'
import { getDataConnect } from 'firebase/data-connect'
import { Link } from 'react-router-dom'
import {
  connectorConfig,listBranches,listSuppliers,listCustomers,listProducts,registrationOptions,
  saveBranch,saveSupplier,saveCustomer,saveProduct,setBranchStatus,setSupplierStatus,setCustomerStatus,setProductStatus,
} from '@insightpad/dataconnect'
import { useAuth } from '../auth/useAuth'
import { firebaseApp } from '../lib/firebase'
import { ProductExtras } from './ProductExtras'

const dc=getDataConnect(firebaseApp,connectorConfig),PAGE_SIZE=20
type PageKey='CAD_FILIAL'|'CAD_FORNECEDOR'|'CAD_CLIENTE'|'CAD_PRODUTO'
type Row={id:string;active:boolean;updatedAt:string;[key:string]:unknown}
type Field={key:string;label:string;type?:'text'|'email'|'date'|'number'|'textarea'|'checkbox'|'select'|'money';required?:boolean;wide?:boolean;options?:{value:string;label:string}[]}
type Config={title:string;singular:string;description:string;columns:{key:string;label:string;format?:(v:unknown,r:Row)=>string}[];fields:Field[]}
const digits=(v:string)=>v.replace(/\D/g,'')
const money=(v:unknown)=>new Intl.NumberFormat('pt-BR',{style:'currency',currency:'BRL'}).format(Number(v??0)/100)
const date=(v:unknown)=>v?new Intl.DateTimeFormat('pt-BR').format(new Date(String(v))):'—'
const configs:Record<PageKey,Config>={
 CAD_FILIAL:{title:'Filiais',singular:'filial',description:'Configure unidades e pontos de operação.',columns:[
  {key:'name',label:'Filial'},{key:'internalCode',label:'Código'},{key:'city',label:'Cidade / UF',format:(_,r)=>[r.city,r.stateCode].filter(Boolean).join(' / ')||'—'},{key:'phone',label:'Telefone'}],
  fields:[{key:'name',label:'Nome da filial',required:true},{key:'internalCode',label:'Código interno'},{key:'postalCode',label:'CEP'},{key:'stateCode',label:'UF'},
   {key:'city',label:'Cidade'},{key:'district',label:'Bairro'},{key:'street',label:'Endereço',wide:true},{key:'streetNumber',label:'Número'},
   {key:'addressComplement',label:'Complemento'},{key:'phone',label:'Telefone'}]},
 CAD_FORNECEDOR:{title:'Fornecedores',singular:'fornecedor',description:'Organize parceiros comerciais, contatos e condições.',columns:[
  {key:'legalName',label:'Fornecedor'},{key:'cnpj',label:'Documento',format:(_,r)=>String(r.cnpj||r.cpf||'—')},{key:'segment',label:'Segmento'},{key:'phonePrimary',label:'Contato'}],
  fields:[{key:'legalName',label:'Razão social / Nome',required:true},{key:'tradeName',label:'Nome fantasia'},{key:'internalCode',label:'Código interno'},
   {key:'cpf',label:'CPF'},{key:'cnpj',label:'CNPJ'},{key:'contactName',label:'Responsável'},{key:'phonePrimary',label:'Telefone principal'},
   {key:'phoneSecondary',label:'Telefone secundário'},{key:'email',label:'E-mail',type:'email'},{key:'segment',label:'Segmento'},
   {key:'paymentTerms',label:'Condição de pagamento'},{key:'paymentTermDays',label:'Prazo de pagamento',type:'number'},
   {key:'averageDeliveryDays',label:'Prazo médio de entrega',type:'number'},{key:'postalCode',label:'CEP'},{key:'stateCode',label:'UF'},
   {key:'city',label:'Cidade'},{key:'district',label:'Bairro'},{key:'street',label:'Endereço',wide:true},{key:'streetNumber',label:'Número'},
   {key:'addressComplement',label:'Complemento'},{key:'notes',label:'Observações',type:'textarea',wide:true}]},
 CAD_CLIENTE:{title:'Clientes',singular:'cliente',description:'Centralize contatos, preferências e dados cadastrais.',columns:[
  {key:'name',label:'Cliente'},{key:'cpf',label:'Documento',format:(_,r)=>String(r.cnpj||r.cpf||'—')},{key:'email',label:'E-mail'},{key:'phonePrimary',label:'Telefone'}],
  fields:[{key:'name',label:'Nome / Razão social',required:true},{key:'cpf',label:'CPF'},{key:'cnpj',label:'CNPJ'},{key:'birthDate',label:'Nascimento',type:'date'},
   {key:'gender',label:'Gênero',type:'select',options:[{value:'',label:'Não informado'},{value:'FEMININO',label:'Feminino'},{value:'MASCULINO',label:'Masculino'},{value:'OUTRO',label:'Outro'}]},
   {key:'email',label:'E-mail',type:'email'},{key:'phonePrimary',label:'Telefone principal'},{key:'phoneSecondary',label:'Telefone secundário'},
   {key:'marketingOptIn',label:'Autoriza comunicações de marketing',type:'checkbox',wide:true},{key:'postalCode',label:'CEP'},{key:'stateCode',label:'UF'},
   {key:'city',label:'Cidade'},{key:'district',label:'Bairro'},{key:'street',label:'Endereço',wide:true},{key:'streetNumber',label:'Número'},
   {key:'addressComplement',label:'Complemento'},{key:'notes',label:'Observações',type:'textarea',wide:true}]},
 CAD_PRODUTO:{title:'Produtos',singular:'produto',description:'Gerencie catálogo, preços, classificação e limites de estoque.',columns:[
  {key:'name',label:'Produto'},{key:'internalCode',label:'Código'},{key:'categoryName',label:'Categoria'},{key:'salePriceCents',label:'Preço',format:money}],
  fields:[{key:'name',label:'Nome do produto',required:true},{key:'internalCode',label:'Código interno'},{key:'ean',label:'Código de barras'},
   {key:'categoryId',label:'Categoria',type:'select',required:true},{key:'subcategoryId',label:'Subcategoria',type:'select'},{key:'supplierId',label:'Fornecedor',type:'select'},
   {key:'brand',label:'Marca'},{key:'sizeType',label:'Tipo de tamanho'},{key:'size',label:'Tamanho'},{key:'color',label:'Cor'},
   {key:'costPriceCents',label:'Preço de custo',type:'money'},{key:'salePriceCents',label:'Preço de venda',type:'money',required:true},
   {key:'minimumStock',label:'Estoque mínimo',type:'number'},{key:'maximumStock',label:'Estoque máximo',type:'number'},
   {key:'weightedProduct',label:'Produto vendido por peso',type:'checkbox'},{key:'allowNegativeStock',label:'Permitir estoque negativo',type:'checkbox'},
   {key:'bundleProduct',label:'Produto é kit/composição',type:'checkbox'},{key:'notes',label:'Observações',type:'textarea',wide:true}]}
}

export function MasterDataPage({pageKey}:{pageKey:PageKey}){
 const cfg=configs[pageKey],permission=useAuth().permissions[pageKey]
 const [rows,setRows]=useState<Row[]>([]),[search,setSearch]=useState(''),[page,setPage]=useState(0),[busy,setBusy]=useState(true),[modal,setModal]=useState(false)
 const [editing,setEditing]=useState<Row|null>(null),[form,setForm]=useState<Record<string,unknown>>({}),[notice,setNotice]=useState(''),[confirm,setConfirm]=useState<null|{text:string;run:()=>Promise<void>}>(null)
 const [selected,setSelected]=useState<string[]>([]),[extras,setExtras]=useState<Row|null>(null),[options,setOptions]=useState<{categories:any[];subcategories:any[];suppliers:any[]}>({categories:[],subcategories:[],suppliers:[]})
 const query=useMemo(()=>({search:search.trim(),limit:PAGE_SIZE,offset:page*PAGE_SIZE,requestKey:crypto.randomUUID()}),[page,search])
 const load=useCallback(async()=>{setBusy(true);try{let result
  if(pageKey==='CAD_FILIAL')result=await listBranches(dc,query);else if(pageKey==='CAD_FORNECEDOR')result=await listSuppliers(dc,query)
  else if(pageKey==='CAD_CLIENTE')result=await listCustomers(dc,query);else result=await listProducts(dc,query)
  setRows((result.data._select??[]) as Row[]);if(pageKey==='CAD_PRODUTO'){const opt=await registrationOptions(dc);const box=((opt.data._select??[])[0] as any)?.data??{};setOptions({categories:box.categories??[],subcategories:box.subcategories??[],suppliers:box.suppliers??[]})}
 }catch(e){console.error(e);setNotice('Não foi possível atualizar as informações.')}finally{setBusy(false)}},[pageKey,query])
 useEffect(()=>{const t=window.setTimeout(()=>void load(),180);return()=>clearTimeout(t)},[load])
 function open(row?:Row){setEditing(row??null);const next:Record<string,unknown>={};for(const field of cfg.fields)next[field.key]=row?.[field.key]??(field.type==='checkbox'?false:'')
  if(pageKey==='CAD_PRODUTO'){next.costPriceCents=Number(row?.costPriceCents??0)/100;next.salePriceCents=Number(row?.salePriceCents??0)/100}setForm(next);setModal(true)}
 function fieldOptions(field:Field){if(pageKey!=='CAD_PRODUTO')return field.options??[];if(field.key==='categoryId')return options.categories.map(x=>({value:x.id,label:x.name}))
  if(field.key==='subcategoryId')return options.subcategories.filter(x=>!form.categoryId||x.categoryId===form.categoryId).map(x=>({value:x.id,label:x.name}))
  if(field.key==='supplierId')return options.suppliers.map(x=>({value:x.id,label:x.name}));return field.options??[]}
 async function lookupCep(value:unknown){const cep=digits(String(value??''));if(cep.length!==8)return
  try{setBusy(true);const response=await fetch(`https://viacep.com.br/ws/${cep}/json/`);const data=await response.json()
    if(!data.erro)setForm(current=>({...current,postalCode:cep,stateCode:data.uf??'',city:data.localidade??'',district:data.bairro??'',street:data.logradouro??''}))
    else setNotice('CEP não encontrado.')
  }catch(error){console.error(error);setNotice('Não foi possível consultar o CEP. Preencha o endereço manualmente.')}finally{setBusy(false)}
 }
 function validate(){if(cfg.fields.some(f=>f.required&&!String(form[f.key]??'').trim()))return 'Preencha todos os campos obrigatórios.'
  if((form.cpf&&digits(String(form.cpf)).length!==11)||(form.cnpj&&digits(String(form.cnpj)).length!==14))return 'CPF ou CNPJ inválido.'
  if(form.email&&!/^\S+@\S+\.\S+$/.test(String(form.email)))return 'E-mail inválido.'
  if(pageKey==='CAD_PRODUTO'&&Number(form.maximumStock||0)<Number(form.minimumStock||0))return 'Estoque máximo deve ser maior ou igual ao mínimo.';return ''}
 async function save(){const error=validate();if(error){setNotice(error);return}setBusy(true);try{const payload={...form}
  if(pageKey==='CAD_PRODUTO'){payload.costPriceCents=Math.round(Number(form.costPriceCents||0)*100);payload.salePriceCents=Math.round(Number(form.salePriceCents||0)*100)}
  const vars={id:editing?.id??null,payload};let result
  if(pageKey==='CAD_FILIAL')result=await saveBranch(dc,vars);else if(pageKey==='CAD_FORNECEDOR')result=await saveSupplier(dc,vars)
  else if(pageKey==='CAD_CLIENTE')result=await saveCustomer(dc,vars);else result=await saveProduct(dc,vars)
  if(!result.data._execute)throw new Error();setModal(false);setNotice(`${cfg.singular} salvo com sucesso.`);await load()
 }catch(e){console.error(e);setNotice('Operação não aplicada. Verifique duplicidades, vínculos e dados informados.')}finally{setBusy(false)}}
 async function status(ids:string[],active:boolean){setBusy(true);try{for(const id of ids){if(pageKey==='CAD_FILIAL')await setBranchStatus(dc,{id,active});else if(pageKey==='CAD_FORNECEDOR')await setSupplierStatus(dc,{id,active})
  else if(pageKey==='CAD_CLIENTE')await setCustomerStatus(dc,{id,active});else await setProductStatus(dc,{id,active})}setSelected([]);setNotice('Status atualizado.');await load()
 }catch(e){console.error(e);setNotice('Não foi possível alterar o status. Verifique vínculos ativos.')}finally{setBusy(false)}}
 function exportCsv(){const headers=cfg.columns.map(c=>c.label);const lines=rows.map(r=>cfg.columns.map(c=>`"${String(c.format?c.format(r[c.key],r):r[c.key]??'').replaceAll('"','""')}"`).join(';'))
  const a=document.createElement('a');a.href=URL.createObjectURL(new Blob([`\uFEFF${headers.join(';')}\n${lines.join('\n')}`],{type:'text/csv'}));a.download=`${pageKey.toLowerCase()}.csv`;a.click();URL.revokeObjectURL(a.href)}
 return <section className="catalog-page"><header><div><span className="eyebrow">Cadastros</span><h1>{cfg.title}</h1><p>{cfg.description}</p></div><div className="catalog-header-actions">
  <Link className="catalog-back" to="/modulos/cadastros"><span className="material-symbols-rounded">arrow_back</span>Voltar</Link>{permission?.canCreate&&<button className="catalog-primary" onClick={()=>open()}>+ Novo cadastro</button>}</div></header>
  {notice&&<div className="catalog-feedback catalog-feedback--success">{notice}</div>}<div className="catalog-panel"><div className="catalog-toolbar"><label><span className="material-symbols-rounded">search</span>
   <input value={search} onChange={e=>{setSearch(e.target.value);setPage(0)}} placeholder="Pesquisar..."/></label>{selected.length>0&&<><button onClick={()=>setConfirm({text:`Inativar ${selected.length} registros?`,run:()=>status(selected,false)})}>Inativar selecionados</button>
   <button onClick={()=>setConfirm({text:`Ativar ${selected.length} registros?`,run:()=>status(selected,true)})}>Ativar selecionados</button></>}{permission?.canExport&&<button onClick={exportCsv}>Exportar CSV</button>}</div>
   <div className="catalog-scroll"><div className="catalog-table"><table><thead><tr><th><input type="checkbox" checked={rows.length>0&&selected.length===rows.length} onChange={e=>setSelected(e.target.checked?rows.map(r=>r.id):[])}/></th>
    {cfg.columns.map(c=><th key={c.key}>{c.label}</th>)}<th>Status</th><th>Ações</th></tr></thead><tbody>{rows.map(row=><tr key={row.id} className={!row.active?'is-inactive':''}><td><input type="checkbox" checked={selected.includes(row.id)} onChange={e=>setSelected(v=>e.target.checked?[...v,row.id]:v.filter(id=>id!==row.id))}/></td>
    {cfg.columns.map(c=><td key={c.key}>{c.format?c.format(row[c.key],row):String(row[c.key]??'—')}</td>)}<td><span className={`catalog-status catalog-status--${row.active?'active':'inactive'}`}><i/>{row.active?'Ativo':'Inativo'}</span></td><td><div className="catalog-actions">
     {row.active&&permission?.canUpdate&&<button onClick={()=>open(row)}>Editar</button>}{pageKey==='CAD_PRODUTO'&&row.active&&permission?.canUpdate&&<button onClick={()=>setExtras(row)}>Kit e promoções</button>}<button className={row.active?'danger':'success'} onClick={()=>setConfirm({text:`${row.active?'Inativar':'Ativar'} “${String(row.name||row.legalName)}”?`,run:()=>status([row.id],!row.active)})}>{row.active?'Inativar':'Ativar'}</button></div></td></tr>)}</tbody></table></div></div>
   <footer className="catalog-pagination"><button disabled={page===0} onClick={()=>setPage(page-1)}>Anterior</button><span>Página {page+1}</span><button disabled={rows.length<PAGE_SIZE} onClick={()=>setPage(page+1)}>Próxima</button></footer></div>
  {modal&&<div className="catalog-backdrop"><section className="catalog-modal master-modal"><header><div><span className="eyebrow">Cadastro</span><h2>{editing?'Editar':'Novo'} {cfg.singular}</h2></div><button onClick={()=>setModal(false)}>×</button></header>
   <form onSubmit={(e:FormEvent)=>{e.preventDefault();setConfirm({text:'Confirma o salvamento das informações?',run:save})}}><div className="master-form-grid">{cfg.fields.map(field=><label className={field.wide?'wide':''} key={field.key}>
    <span>{field.label}{field.required?' *':''}</span>{field.type==='textarea'?<textarea value={String(form[field.key]??'')} onChange={e=>setForm({...form,[field.key]:e.target.value})}/>:
    field.type==='checkbox'?<input type="checkbox" checked={Boolean(form[field.key])} onChange={e=>setForm({...form,[field.key]:e.target.checked})}/>:
    field.type==='select'?<select value={String(form[field.key]??'')} onChange={e=>setForm({...form,[field.key]:e.target.value})}><option value="">Selecione</option>{fieldOptions(field).map(o=><option key={o.value} value={o.value}>{o.label}</option>)}</select>:
    <input type={field.type==='money'||field.type==='number'?'number':field.type??'text'} step={field.type==='money'?'0.01':undefined} value={String(form[field.key]??'')} onChange={e=>setForm({...form,[field.key]:e.target.value})} onBlur={field.key==='postalCode'?e=>void lookupCep(e.target.value):undefined}/>}</label>)}</div>
    {pageKey==='CAD_PRODUTO'&&<div className="product-margin">Margem estimada: <strong>{Number(form.salePriceCents)>0?(((Number(form.salePriceCents)-Number(form.costPriceCents||0))/Number(form.salePriceCents))*100).toFixed(1):'0.0'}%</strong></div>}
    <footer><button type="button" onClick={()=>setModal(false)}>Cancelar</button><button className="catalog-primary">Continuar</button></footer></form></section></div>}
  {confirm&&<div className="catalog-backdrop"><section className="catalog-confirm"><span className="material-symbols-rounded">help</span><h2>Confirmar operação</h2><p>{confirm.text}</p><footer><button onClick={()=>setConfirm(null)}>Cancelar</button><button className="catalog-primary" onClick={()=>{const action=confirm.run;setConfirm(null);void action()}}>Confirmar</button></footer></section></div>}
  {extras&&<ProductExtras product={{id:extras.id,name:extras.name,active:extras.active}} products={rows.map(r=>({id:r.id,name:r.name,active:r.active}))} onClose={()=>setExtras(null)}/>}
  {busy&&<div className="catalog-loader"><div className="catalog-loader__mark"><span/><img src="/brand/insight-pad-logo-dark.png" alt="Insight Pad"/></div><strong>Atualizando informações...</strong></div>}
 </section>
}
