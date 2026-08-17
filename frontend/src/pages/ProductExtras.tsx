import { useCallback,useEffect,useMemo,useState,type FormEvent } from 'react'
import { getDataConnect } from 'firebase/data-connect'
import { z } from 'zod'
import { connectorConfig,productPromotions,savePromotion,setPromotionStatus } from '@insightpad/dataconnect'
import { firebaseApp } from '../lib/firebase'

const dc=getDataConnect(firebaseApp,connectorConfig)
const promotionSchema=z.object({
 id:z.string().uuid(),promotionalPriceCents:z.string(),startsAt:z.string(),endsAt:z.string(),active:z.boolean(),
 status:z.enum(['ACTIVE','SCHEDULED','ENDED','INACTIVE']),createdAt:z.string(),updatedAt:z.string(),
})
type Promotion=z.infer<typeof promotionSchema>
type Product={id:string;name:unknown;active:boolean;salePriceCents:string;costPriceCents:string}
const digits=(value:string)=>value.replace(/\D/g,'')
const money=(cents:unknown)=>new Intl.NumberFormat('pt-BR',{style:'currency',currency:'BRL'}).format(Number(cents??0)/100)
const maskMoney=(value:string)=>money(digits(value))
const toLocalInput=(value:string)=>{const date=new Date(value),offset=date.getTimezoneOffset();return new Date(date.getTime()-offset*60000).toISOString().slice(0,16)}
const statusLabel:Record<Promotion['status'],string>={ACTIVE:'Ativa',SCHEDULED:'Agendada',ENDED:'Encerrada',INACTIVE:'Inativa'}

export function ProductExtras({product,onClose}:{product:Product;onClose:()=>void}){
 const [promotions,setPromotions]=useState<Promotion[]>([]),[busy,setBusy]=useState(true),[message,setMessage]=useState('')
 const [editing,setEditing]=useState<Promotion|null>(null),[promotion,setPromotion]=useState({price:'',startsAt:'',endsAt:''})
 const priceCents=Number(digits(promotion.price)),costCents=Number(product.costPriceCents??0)
 const profit=useMemo(()=>priceCents-costCents,[priceCents,costCents])
 const load=useCallback(async()=>{setBusy(true);try{const result=await productPromotions(dc,{productId:product.id})
  setPromotions(z.array(promotionSchema).parse(result.data._select??[]))
 }catch(error){console.error(error);setMessage('Não foi possível carregar as promoções.')}finally{setBusy(false)}},[product.id])
 useEffect(()=>{const timer=setTimeout(()=>void load(),0);return()=>clearTimeout(timer)},[load])
 useEffect(()=>{if(!message)return;const timer=window.setTimeout(()=>setMessage(''),7000);return()=>window.clearTimeout(timer)},[message])
 function clear(){setEditing(null);setPromotion({price:'',startsAt:'',endsAt:''})}
 function edit(item:Promotion){setEditing(item);setPromotion({price:money(item.promotionalPriceCents),startsAt:toLocalInput(item.startsAt),endsAt:toLocalInput(item.endsAt)})}
 async function save(e:FormEvent){e.preventDefault();const starts=new Date(promotion.startsAt),ends=new Date(promotion.endsAt)
  if(priceCents<=0){setMessage('Informe um preço promocional maior que zero.');return}
  if(priceCents>=Number(product.salePriceCents)){setMessage('O preço promocional deve ser menor que o preço normal do produto.');return}
  if(!promotion.startsAt||!promotion.endsAt||ends<=starts){setMessage('A data final deve ser posterior à data inicial.');return}
  setBusy(true);try{const result=await savePromotion(dc,{id:editing?.id??null,productId:product.id,promotionalPriceCents:String(priceCents),startsAt:starts.toISOString(),endsAt:ends.toISOString()})
   if(!result.data._execute)throw new Error('Operação não aplicada');setMessage(editing?'Promoção atualizada com sucesso.':'Promoção cadastrada com sucesso.');clear();await load()
  }catch(error){console.error(error);setMessage('Não foi possível salvar. Verifique preço, período e sobreposição.')}finally{setBusy(false)}}
 async function changeStatus(item:Promotion){setBusy(true);try{const result=await setPromotionStatus(dc,{id:item.id,active:!item.active});if(!result.data._execute)throw new Error()
  setMessage(item.active?'Promoção inativada.':'Promoção reativada.');await load()
 }catch(error){console.error(error);setMessage('Não foi possível alterar o status. Verifique sobreposições e o produto.')}finally{setBusy(false)}}
 function exportHistory(){const header=['ID','Produto','Preço promocional','Início','Fim','Status','Cadastro','Atualização']
  const lines=promotions.map(item=>[item.id,String(product.name),money(item.promotionalPriceCents),new Date(item.startsAt).toLocaleString('pt-BR'),new Date(item.endsAt).toLocaleString('pt-BR'),statusLabel[item.status],new Date(item.createdAt).toLocaleString('pt-BR'),new Date(item.updatedAt).toLocaleString('pt-BR')].map(value=>`"${value.replaceAll('"','""')}"`).join(';'))
  const link=document.createElement('a');link.href=URL.createObjectURL(new Blob([`\uFEFF${header.join(';')}\n${lines.join('\n')}`],{type:'text/csv'}));link.download=`historico-promocoes-${String(product.name).toLowerCase().replace(/[^a-z0-9]+/g,'-')}.csv`;link.click();URL.revokeObjectURL(link.href)}
 return <div className="catalog-backdrop"><section className="catalog-modal product-extras"><header><div><span className="eyebrow">Promoções</span><h2>{String(product.name)}</h2></div><button onClick={onClose}>×</button></header>
  {message&&<div className={`catalog-feedback ${/sucesso|atualizada|cadastrada|inativada|reativada/i.test(message)?'catalog-feedback--success':'catalog-feedback--error'}`}>{message}</div>}
  <div className="extras-body"><div className="extras-heading"><div><strong>Histórico promocional</strong><p>Cadastre períodos sem sobreposição e acompanhe o status automaticamente.</p></div><button type="button" onClick={exportHistory} disabled={promotions.length===0}>Exportar histórico</button></div>
   <div className="promotion-summary"><span>Preço normal <strong>{money(product.salePriceCents)}</strong></span><span>Preço de custo <strong>{money(product.costPriceCents)}</strong></span></div>
   <form className="promotion-form" onSubmit={save}><label><span>Preço promocional</span><input type="text" value={promotion.price} onChange={event=>setPromotion({...promotion,price:maskMoney(event.target.value)})} required/></label>
    <label><span>Início</span><input type="datetime-local" value={promotion.startsAt} onChange={event=>setPromotion({...promotion,startsAt:event.target.value})} required/></label>
    <label><span>Fim</span><input type="datetime-local" value={promotion.endsAt} onChange={event=>setPromotion({...promotion,endsAt:event.target.value})} required/></label>
    <div className={`promotion-profit ${profit<0?'negative':''}`}><span>Lucro estimado</span><strong>{money(profit)}</strong></div>
    <button className="catalog-primary">{editing?'Salvar alterações':'Cadastrar promoção'}</button>{editing&&<button type="button" onClick={clear}>Cancelar edição</button>}</form>
   <div className="promotion-list">{promotions.length===0?<div className="catalog-empty"><strong>Nenhuma promoção cadastrada</strong></div>:promotions.map(item=><article key={item.id}><div><strong>{money(item.promotionalPriceCents)}</strong><small>{new Date(item.startsAt).toLocaleString('pt-BR')} — {new Date(item.endsAt).toLocaleString('pt-BR')}</small></div>
    <span className={`promotion-status promotion-status--${item.status.toLowerCase()}`}>{statusLabel[item.status]}</span><div className="promotion-actions"><button onClick={()=>edit(item)}>Editar</button><button onClick={()=>void changeStatus(item)}>{item.active?'Inativar':'Ativar'}</button></div></article>)}</div>
  </div>{busy&&<div className="extras-loading">Atualizando...</div>}</section></div>
}
