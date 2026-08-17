import { useCallback,useEffect,useState,type FormEvent } from 'react'
import { getDataConnect } from 'firebase/data-connect'
import { z } from 'zod'
import { connectorConfig,productComponents,productPromotions,saveProductComponents,savePromotion,setPromotionStatus } from '@insightpad/dataconnect'
import { firebaseApp } from '../lib/firebase'
const dc=getDataConnect(firebaseApp,connectorConfig)
const componentSchema=z.object({productId:z.string().uuid(),name:z.string(),quantity:z.coerce.number(),allocatedUnitPriceCents:z.string().nullable().optional()})
const promotionSchema=z.object({id:z.string().uuid(),promotionalPriceCents:z.string(),startsAt:z.string(),endsAt:z.string(),active:z.boolean()})
type Component=z.infer<typeof componentSchema>;type Promotion=z.infer<typeof promotionSchema>
type Product={id:string;name:unknown;active:boolean}
export function ProductExtras({product,products,onClose}:{product:Product;products:Product[];onClose:()=>void}){
 const [tab,setTab]=useState<'kit'|'promotion'>('kit'),[components,setComponents]=useState<Component[]>([]),[promotions,setPromotions]=useState<Promotion[]>([])
 const [busy,setBusy]=useState(true),[message,setMessage]=useState(''),[promotion,setPromotion]=useState({price:'',startsAt:'',endsAt:''})
 const load=useCallback(async()=>{setBusy(true);try{const [a,b]=await Promise.all([productComponents(dc,{productId:product.id}),productPromotions(dc,{productId:product.id})])
  setComponents(z.array(componentSchema).parse(a.data._select??[]));setPromotions(z.array(promotionSchema).parse(b.data._select??[]))
 }catch(e){console.error(e);setMessage('Não foi possível carregar kits e promoções.')}finally{setBusy(false)}},[product.id])
 useEffect(()=>{const t=setTimeout(()=>void load(),0);return()=>clearTimeout(t)},[load])
 function addComponent(){const available=products.find(p=>p.id!==product.id&&p.active&&!components.some(c=>c.productId===p.id));if(!available)return
  setComponents(v=>[...v,{productId:available.id,name:String(available.name),quantity:1,allocatedUnitPriceCents:null}])}
 async function saveKit(){setBusy(true);try{const result=await saveProductComponents(dc,{productId:product.id,components:components.map(c=>({productId:c.productId,quantity:c.quantity,allocatedUnitPriceCents:c.allocatedUnitPriceCents??''}))})
  if(!result.data._execute)throw new Error();setMessage('Composição salva com sucesso.')}catch(e){console.error(e);setMessage('Não foi possível salvar a composição.')}finally{setBusy(false)}}
 async function savePromo(e:FormEvent){e.preventDefault();setBusy(true);try{const starts=new Date(promotion.startsAt),ends=new Date(promotion.endsAt)
  const result=await savePromotion(dc,{id:null,productId:product.id,promotionalPriceCents:String(Math.round(Number(promotion.price)*100)),startsAt:starts.toISOString(),endsAt:ends.toISOString()})
  if(!result.data._execute)throw new Error();setPromotion({price:'',startsAt:'',endsAt:''});setMessage('Promoção cadastrada.');await load()
 }catch(e){console.error(e);setMessage('Verifique preço, período e sobreposição com outras promoções.')}finally{setBusy(false)}}
 async function status(item:Promotion){setBusy(true);try{await setPromotionStatus(dc,{id:item.id,active:!item.active});await load()}finally{setBusy(false)}}
 return <div className="catalog-backdrop"><section className="catalog-modal product-extras"><header><div><span className="eyebrow">Produto</span><h2>{String(product.name)}</h2></div><button onClick={onClose}>×</button></header>
  <div className="extras-tabs"><button className={tab==='kit'?'active':''} onClick={()=>setTab('kit')}>Kit / Composição</button><button className={tab==='promotion'?'active':''} onClick={()=>setTab('promotion')}>Promoções</button></div>
  {message&&<div className="catalog-feedback catalog-feedback--success">{message}</div>}
  {tab==='kit'?<div className="extras-body"><div className="extras-heading"><p>Defina os produtos e quantidades que compõem este kit.</p><button className="catalog-primary" onClick={addComponent}>+ Componente</button></div>
   {components.map((c,index)=><div className="component-row" key={c.productId}><select value={c.productId} onChange={e=>setComponents(v=>v.map((x,i)=>i===index?{...x,productId:e.target.value,name:String(products.find(p=>p.id===e.target.value)?.name??'')}:x))}>
    {products.filter(p=>p.active&&p.id!==product.id).map(p=><option value={p.id} key={p.id}>{String(p.name)}</option>)}</select><input type="number" min=".001" step=".001" value={c.quantity} onChange={e=>setComponents(v=>v.map((x,i)=>i===index?{...x,quantity:Number(e.target.value)}:x))}/>
    <button className="danger" onClick={()=>setComponents(v=>v.filter((_,i)=>i!==index))}>Remover</button></div>)}<footer><button className="catalog-primary" onClick={()=>void saveKit()}>Salvar composição</button></footer></div>:
   <div className="extras-body"><form className="promotion-form" onSubmit={savePromo}><label><span>Preço promocional</span><input type="number" min="0" step=".01" value={promotion.price} onChange={e=>setPromotion({...promotion,price:e.target.value})} required/></label>
    <label><span>Início</span><input type="datetime-local" value={promotion.startsAt} onChange={e=>setPromotion({...promotion,startsAt:e.target.value})} required/></label><label><span>Fim</span><input type="datetime-local" value={promotion.endsAt} onChange={e=>setPromotion({...promotion,endsAt:e.target.value})} required/></label>
    <button className="catalog-primary">Cadastrar promoção</button></form><div className="promotion-list">{promotions.map(p=><article key={p.id}><div><strong>{new Intl.NumberFormat('pt-BR',{style:'currency',currency:'BRL'}).format(Number(p.promotionalPriceCents)/100)}</strong>
     <small>{new Date(p.startsAt).toLocaleString('pt-BR')} — {new Date(p.endsAt).toLocaleString('pt-BR')}</small></div><span className={`catalog-status catalog-status--${p.active?'active':'inactive'}`}><i/>{p.active?'Ativa':'Inativa'}</span>
     <button onClick={()=>void status(p)}>{p.active?'Inativar':'Ativar'}</button></article>)}</div></div>}
  {busy&&<div className="extras-loading">Atualizando...</div>}</section></div>
}
