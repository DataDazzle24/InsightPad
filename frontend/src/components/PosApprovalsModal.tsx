import { useCallback, useEffect, useState } from 'react'
import type { DataConnect } from 'firebase/data-connect'
import { approvePosSale, pendingPosApprovals } from '@insightpad/dataconnect'
import { useDialogAccessibility } from '../hooks/useDialogAccessibility'
import { money } from '../utils/sales'
type Approval = { id:string; kind:string; cashAmountCents?:string; cashExpectedCents?:string; cashDescription?:string; subtotalCents:string; discountCents:string; surchargeCents:string; operatorName:string; branchName:string; createdAt:string }
export function PosApprovalsModal({dc,onClose,onNotice}:{dc:DataConnect;onClose:()=>void;onNotice:(message:string)=>void}) {
  const [rows,setRows]=useState<Approval[]>([]),[busy,setBusy]=useState(false)
  useDialogAccessibility(true,()=>{if(!busy)onClose()})
  const load=useCallback(async()=>{
    setBusy(true)
    try{const result=await pendingPosApprovals(dc,{requestKey:crypto.randomUUID()});setRows((result.data._select??[]) as Approval[])}
    catch{onNotice('Não foi possível consultar as aprovações.')}
    finally{setBusy(false)}
  },[dc,onNotice])
  useEffect(()=>{const timer=setTimeout(()=>void load(),0);return()=>clearTimeout(timer)},[load])
  async function decide(id:string,approved:boolean){
    if(busy)return;setBusy(true)
    try{await approvePosSale(dc,{approvalId:id,approved});onNotice(approved?'Solicitação aprovada. O operador pode concluir a operação.':'Solicitação recusada.');await load()}
    catch{onNotice('Não foi possível decidir. Confira a permissão e a validade da solicitação.')}
    finally{setBusy(false)}
  }
  return <div className="catalog-backdrop"><section className="catalog-modal sales-modal pos-queue" role="dialog" aria-modal="true" aria-label="Aprovações gerenciais">
    <header><h2>Aprovações gerenciais</h2><button aria-label="Fechar aprovações" disabled={busy} onClick={onClose}>×</button></header>
    <div className="pos-queue-body">{!rows.length?<p role="status">{busy?'Consultando solicitações...':'Nenhuma solicitação pendente.'}</p>:rows.map(row=><article key={row.id}>
      <strong>{row.operatorName} · {row.branchName}</strong><span>{new Date(row.createdAt).toLocaleString('pt-BR')}</span>
      {row.kind === 'SALE' ? <span>Subtotal {money(row.subtotalCents)} · Desconto {money(row.discountCents)} · Acréscimo {money(row.surchargeCents)}</span> : <><span>{row.kind === 'CLOSE' ? 'Fechamento — valor contado' : 'Sangria'}: {money(row.cashAmountCents ?? 0)} · Saldo esperado: {money(row.cashExpectedCents ?? 0)}</span><span>{row.cashDescription}</span></>}
      <div className="cash-session-actions"><button disabled={busy} className="catalog-modal-cancel" onClick={()=>void decide(row.id,false)}>Recusar</button><button disabled={busy} className="catalog-primary" onClick={()=>void decide(row.id,true)}>Aprovar esta operação</button></div>
    </article>)}</div>
    <footer><button className="catalog-modal-cancel" disabled={busy} onClick={onClose}>Fechar</button><button disabled={busy} onClick={()=>void load()}>Atualizar</button></footer>
  </section></div>
}
