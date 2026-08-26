import { useCallback, useEffect, useState } from 'react'
import { executeMutation, executeQuery, getDataConnect, mutationRef, queryRef } from 'firebase/data-connect'
import { connectorConfig } from '@insightpad/dataconnect'
import { Link } from 'react-router-dom'
import { useAuth } from '../auth/useAuth'
import { useDialogAccessibility } from '../hooks/useDialogAccessibility'
import { firebaseApp } from '../lib/firebase'

const dc = getDataConnect(firebaseApp, connectorConfig)
type PendingOrder = { id:string; displayCode:string; provider:'IFOOD'|'ZE_DELIVERY'; branchName:string; customerName?:string|null; totalCents:string; receivedAt:string; version:number; items:{name:string;quantity:number;observation?:string|null}[] }
const money=(value:string)=>new Intl.NumberFormat('pt-BR',{style:'currency',currency:'BRL'}).format(Number(value)/100)

export function ChannelOrderNotifier(){
 const permission=useAuth().permissions.CANAIS_VENDA
 const [order,setOrder]=useState<PendingOrder|null>(null)
 const [busy,setBusy]=useState(false)
 const [rejecting,setRejecting]=useState(false)
 const [reason,setReason]=useState('')
 const close=useCallback(()=>{if(order)sessionStorage.setItem(`channel-order-seen:${order.id}`,String(order.version));setOrder(null);setRejecting(false);setReason('')},[order])
 useDialogAccessibility(Boolean(order),close)
 const check=useCallback(async()=>{if(!permission?.canAccess)return;try{const result=await executeQuery(queryRef(dc,'LatestPendingSalesChannelOrder',{requestKey:crypto.randomUUID()}));const next=((((result.data as {_select?:unknown[]})._select??[])[0] as {data?:PendingOrder}|undefined)?.data)??null;if(next&&sessionStorage.getItem(`channel-order-seen:${next.id}`)!==String(next.version))setOrder(next)}catch(error){console.error('Falha ao verificar novos pedidos',error)}},[permission?.canAccess])
 useEffect(()=>{void check();const timer=window.setInterval(()=>void check(),30000);return()=>window.clearInterval(timer)},[check])
 async function act(action:'ACCEPT'|'REJECT'){if(!order)return;setBusy(true);try{const result=await executeMutation(mutationRef(dc,'TransitionSalesChannelOrder',{id:order.id,action,reason:action==='REJECT'?reason.trim():'',expectedVersion:order.version}));if(!(result.data as {_execute?:number})._execute)throw new Error('Pedido já processado');close()}catch(error){console.error(error);void check()}finally{setBusy(false)}}
 if(!order)return null
 return <div className="catalog-backdrop channel-order-notification-backdrop"><section className="channel-order-notification" role="alertdialog" aria-modal="true" aria-label="Novo pedido recebido"><header><span className="material-symbols-rounded">notifications_active</span><div><small>Novo pedido • {order.provider==='IFOOD'?'iFood':'Zé Delivery'}</small><h2>Pedido #{order.displayCode}</h2><p>{order.branchName}{order.customerName?` • ${order.customerName}`:''}</p></div><strong>{money(order.totalCents)}</strong></header><div className="channel-order-notification__items"><h3>Itens</h3>{order.items.map((item,index)=><article key={`${item.name}-${index}`}><strong>{item.quantity}×</strong><span>{item.name}{item.observation&&<small>{item.observation}</small>}</span></article>)}</div>{rejecting&&<label className="channel-order-notification__reason"><span>Motivo da recusa</span><textarea autoFocus maxLength={500} value={reason} onChange={event=>setReason(event.target.value)} placeholder="Informe o motivo" /></label>}<footer><Link to="/integracoes/canais/pedidos" onClick={close}>Ver pedido</Link><button onClick={()=>{if(rejecting){void act('REJECT')}else setRejecting(true)}} disabled={busy||(rejecting&&reason.trim().length<5)} className="danger">{rejecting?'Confirmar recusa':'Recusar'}</button>{!rejecting&&<button className="catalog-primary" onClick={()=>void act('ACCEPT')} disabled={busy}>{busy?'Processando...':'Aceitar pedido'}</button>}<button className="channel-notification-later" onClick={close} disabled={busy}>Agora não</button></footer></section></div>
}
