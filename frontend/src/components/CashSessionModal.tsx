import { useState, type FormEvent } from 'react'
import { executeMutation, mutationRef, type DataConnect } from 'firebase/data-connect'
import { maskMoney, parseMoney } from '../utils/stock'

type Session = { id: string; openedAt: string; openingAmountCents: string; expectedAmountCents: string; movementCount: number }

export function CashSessionModal({ dc, branchId, branchName, session, canManage, onClose, onChanged, onNotice }: {
  dc: DataConnect; branchId: string; branchName: string; session?: Session | null; canManage: boolean
  onClose: () => void; onChanged: () => Promise<void>; onNotice: (message: string) => void
}) {
  const [mode, setMode] = useState<'summary'|'open'|'supply'|'withdrawal'|'close'>(session ? 'summary' : 'open')
  const [amount, setAmount] = useState('R$ 0,00'), [notes, setNotes] = useState(''), [busy, setBusy] = useState(false)
  const expected = Number(session?.expectedAmountCents ?? 0)
  async function submit(event: FormEvent) {
    event.preventDefault(); if (!branchId) { onNotice('Selecione uma filial.'); return }
    const amountCents = parseMoney(amount); if (amountCents < 0) { onNotice('Informe um valor válido.'); return }
    setBusy(true)
    try {
      let result
      if (mode === 'open') result = await executeMutation(mutationRef(dc, 'OpenCashSession', { branchId, openingAmountCents: amountCents, notes }))
      else if (mode === 'close') result = await executeMutation(mutationRef(dc, 'CloseCashSession', { sessionId: session!.id, countedAmountCents: amountCents, notes }))
      else result = await executeMutation(mutationRef(dc, 'RegisterCashMovement', { sessionId: session!.id, movementType: mode === 'supply' ? 'SUPPLY' : 'WITHDRAWAL', amountCents, description: notes }))
      if (!(result.data as {_execute?:unknown})._execute) throw new Error('A operação foi recusada pelas regras do caixa.')
      onNotice(mode === 'open' ? 'Caixa aberto com sucesso.' : mode === 'close' ? 'Caixa fechado e conferido.' : mode === 'supply' ? 'Suprimento registrado.' : 'Sangria registrada.')
      await onChanged(); onClose()
    } catch (error) { console.error(error); onNotice(error instanceof Error ? error.message : 'Não foi possível atualizar o caixa.') }
    finally { setBusy(false) }
  }
  return <div className="catalog-backdrop"><section className="catalog-modal sales-modal cash-session-modal" role="dialog" aria-modal="true" aria-label="Controle de caixa"><header><div><span className="eyebrow">CONTROLE FINANCEIRO</span><h2>{session ? 'CAIXA ABERTO' : 'ABRIR CAIXA'}</h2></div><button onClick={onClose} aria-label="Fechar">×</button></header>{mode === 'summary' && session ? <div className="cash-session-summary"><article><span>Filial</span><strong>{branchName}</strong></article><article><span>Aberto em</span><strong>{new Date(session.openedAt).toLocaleString('pt-BR')}</strong></article><article><span>Fundo inicial</span><strong>{maskMoney(Number(session.openingAmountCents))}</strong></article><article><span>Saldo esperado</span><strong>{maskMoney(expected)}</strong></article><article><span>Movimentações</span><strong>{session.movementCount}</strong></article><div className="cash-session-actions">{canManage && <><button onClick={()=>{setMode('supply');setAmount('R$ 0,00');setNotes('')}}>Suprimento</button><button onClick={()=>{setMode('withdrawal');setAmount('R$ 0,00');setNotes('')}}>Sangria</button><button className="danger" onClick={()=>{setMode('close');setAmount(maskMoney(expected));setNotes('')}}>Fechar caixa</button></>}</div></div> : <form onSubmit={submit}><div className="master-form-grid"><label><span>{mode === 'open' ? 'Fundo de troco inicial' : mode === 'close' ? 'Valor contado no caixa' : 'Valor'}</span><input inputMode="numeric" value={amount} onChange={event=>setAmount(maskMoney(parseMoney(event.target.value)))} autoFocus/></label><label className="wide"><span>{mode === 'supply' ? 'Motivo do suprimento' : mode === 'withdrawal' ? 'Motivo da sangria' : 'Observações'}</span><textarea value={notes} onChange={event=>setNotes(event.target.value)} required={mode==='supply'||mode==='withdrawal'} minLength={mode==='supply'||mode==='withdrawal'?3:0}/></label>{mode==='close'&&<p className="wide">Saldo esperado: <strong>{maskMoney(expected)}</strong> · Diferença prevista: <strong>{maskMoney(parseMoney(amount)-expected)}</strong></p>}</div><footer><button type="button" onClick={()=>session?setMode('summary'):onClose()}>Voltar</button><button className="catalog-primary" disabled={busy}>{busy?'Processando...':mode==='open'?'Abrir caixa':mode==='close'?'Confirmar fechamento':'Registrar'}</button></footer></form>}</section></div>
}
