import { useState, type FormEvent } from 'react'
import { addDays, addMonths, splitInstallments } from './domain'
import { readStatement, type BankFile } from './bankFile'
import { money, object, rows, value } from './model'
import type { Form } from './operations'
import { FinancialUncertainError, type Command, type Receipt } from './protocol'
import type { financialService } from './service'
import { FinanceDialog, FinanceTable } from './ui'

export type FinanceClient = ReturnType<typeof financialService>
import { explain } from './messages'
const final = (status:string) => ['COMMITTED','REJECTED','CANCELLED'].includes(status)

function Impact({command}:{command:Command}) {
  const p=command.payload
  const summary=rows(p.lines)
  const count=p.installmentCount
  const effective=value(p,'effectiveDate')
  const imported=rows(p.rows)
  const installments=typeof p.amountCents==='string'&&typeof count==='number'&&count>1&&typeof p.dueDate==='string'
    ? splitInstallments(p.amountCents,count).map((amount,index)=>({
      amount, date:p.frequency==='MONTHLY'?addMonths(String(p.dueDate),index):
        addDays(String(p.dueDate),index*(p.frequency==='FORTNIGHTLY'?15:p.frequency==='WEEKLY'?7:1)),
    })):[]
  return <dl className="fin-impact">
    {typeof p.description==='string' && <><dt>Descrição</dt><dd>{p.description}</dd></>}
    {typeof p.amountCents==='string' && <><dt>Valor</dt><dd>{money(p.amountCents)}</dd></>}
    {typeof p.openingBalanceCents==='string' && <><dt>Saldo de abertura</dt><dd>{money(p.openingBalanceCents)}</dd></>}
    {typeof p.limitCents==='string' && <><dt>Limite</dt><dd>{money(p.limitCents)}</dd></>}
    {typeof count==='number' && <><dt>Parcelas</dt><dd>{count}</dd></>}
    {installments.length>0&&<div><FinanceTable label="Prévia das parcelas" rows={installments} rowKey={row=>row.date} empty=""
      columns={[{id:'date',title:'Vencimento',cell:r=>r.date},{id:'amount',title:'Parcela',cell:r=>money(r.amount)}]}/></div>}
    {effective && <><dt>Data de efeito</dt><dd>{effective}</dd></>}
    {summary.map((line,i)=><div key={value(line,'titleId')}><dt>Baixa {i+1}</dt><dd>Principal {money(line.principalCents)} · Desconto {money(line.discountCents)} · Juros {money(line.interestCents)} · Multa {money(line.penaltyCents)} · Tarifa {money(line.feeCents)}</dd></div>)}
    {imported.length>0 && <><dt>Movimentos no arquivo</dt><dd>{imported.length}</dd></>}
    {typeof p.reason==='string' && p.reason && <><dt>Motivo</dt><dd>{p.reason}</dd></>}
  </dl>
}

export function OperationDialog({form,client,onClose,onFinish}:{form:Form|null;client:FinanceClient;onClose:()=>void;onFinish:(result:Receipt)=>void}) {
  const [command,setCommand]=useState<Command|null>(null)
  const [review,setReview]=useState<Receipt|null>(null)
  const [busy,setBusy]=useState(false)
  const [error,setError]=useState('')
  const [file,setFile]=useState<BankFile|null>(null)
  const pending=client.pending()
  const report=(error:unknown)=>setError(explain(error))
  const accept=(receipt:Receipt)=>{
    setReview(receipt)
    if (receipt.intent) setCommand(receipt.intent)
    if (final(receipt.status)) {
      client.acknowledge(receipt)
      onFinish(receipt)
    }
  }
  async function run(work:()=>Promise<Receipt|null>) {
    setBusy(true)
    setError('')
    try {
      const received=await work()
      if (received) accept(received)
    } catch (error) {
      if(error instanceof FinancialUncertainError) setReview(null)
      report(error)
    }
    finally {setBusy(false)}
  }
  async function submit(event:FormEvent<HTMLFormElement>) {
    event.preventDefault()
    if (!form || busy) return
    try {
      const payload=form.payload(new FormData(event.currentTarget),file)
      const request={operationId:crypto.randomUUID(),action:form.action,payload}
      setCommand(request)
      await run(()=>client.prepare(request))
    } catch(error) { report(error) }
  }
  async function preview(file:File|undefined) {
    setFile(null)
    if (!file) return
    setBusy(true)
    setError('')
    try {setFile(await readStatement(file))}
    catch(error) {report(error)}
    finally {setBusy(false)}
  }
  const uncertain=!!pending && (!review || review.status==='UNKNOWN')
  const reviewing=review?.status==='PREPARED'
  const finished=review && final(review.status)
  const actions=finished?<button type="button" className="btn primary" onClick={onClose}>Fechar</button>:
    reviewing?<><button type="button" className="btn" disabled={busy} onClick={()=>void run(()=>client.confirm(true))}>Cancelar operação</button>
      <button type="button" className="btn primary" disabled={busy||!command} onClick={()=>void run(()=>client.confirm())}>Confirmar lançamento</button></>:
    uncertain || !form?<><button type="button" className="btn" disabled={busy} onClick={onClose}>Voltar</button>
      {command && !pending?.payloadHash && <button type="button" className="btn" disabled={busy} onClick={()=>void run(()=>client.prepare(command))}>Repetir preparo da mesma operação</button>}
      {pending && <button type="button" className="btn" disabled={busy} onClick={()=>void run(()=>client.confirm(true))}>Cancelar se ainda estiver pendente</button>}
      <button type="button" className="btn primary" disabled={busy} onClick={()=>void run(client.resolve)}>Consultar resultado</button></>:
    <><button type="button" className="btn" disabled={busy} onClick={onClose}>Voltar</button>
      <button type="submit" className="btn primary" form="fin-operation" disabled={busy}>Revisar</button></>
  return <FinanceDialog open title={form?.title??'Recuperar operação'} busy={busy} wide error={error} onClose={onClose} footer={actions}>
    {form?.description && <p>{form.description}</p>}
    {finished && <p role="status">{review.status==='COMMITTED'?'Operação confirmada.':review.status==='CANCELLED'?'Operação cancelada.':explain(review.error?.code)}</p>}
    {pending && <p className="fin-ref">Referência <strong>{pending.operationId}</strong></p>}
    {uncertain && <p>Confira o resultado no servidor antes de iniciar outro lançamento.</p>}
    {reviewing && (command?<Impact command={command}/>:<p>Consulte os detalhes da operação antes de confirmar.</p>)}
    {reviewing && !command && <button className="btn" onClick={()=>void run(client.resolve)}>Consultar detalhes</button>}
    {!reviewing && !uncertain && !finished && form && <form id="fin-operation" className="form-grid" onSubmit={submit}>
      {form.fields.map(field=>{
        const key='fin-operation-'+field.key
        if (field.type==='checkbox') return <label key={key} className="fin-check"><input name={field.key} type="checkbox" defaultChecked={field.initial==='true'}/>{field.label}</label>
        return <div className="fin-form-field" key={key}><label htmlFor={key}>{field.label}</label>
          {field.options?<select id={key} name={field.key} defaultValue={field.initial??''} required={!field.optional}>
            <option value="">{field.optional?'Nenhum':'Selecione'}</option>{field.options.map(([id,label])=><option value={id} key={id}>{label}</option>)}
          </select>:field.type==='textarea'?<textarea id={key} name={field.key} rows={3} maxLength={1000} defaultValue={field.initial} required={!field.optional}/>:
            field.type==='file'?<input id={key} type="file" accept=".ofx,.csv" onChange={event=>void preview(event.currentTarget.files?.[0])} required/>:
            <input id={key} type={field.type==='date'||field.type==='number'?field.type:'text'} name={field.key}
              inputMode={field.type==='money'||field.type==='signedMoney'?'decimal':undefined}
              step={field.type==='number'?1:undefined} defaultValue={field.initial} maxLength={180} required={!field.optional}/>}
        </div>
      })}
    </form>}
    {file && !finished && <FinanceTable label="Prévia do arquivo" rows={file.rows.slice(0,10)} rowKey={row=>JSON.stringify(row)+String(file.rows.indexOf(row))}
      empty="Nenhum movimento" columns={[
        {id:'date',title:'Data',cell:r=>r.date},
        {id:'name',title:'Descrição',cell:r=>r.description},
        {id:'amount',title:'Valor',cell:r=>money(r.amountCents)},
      ]}/>}
    {finished && review.status==='COMMITTED' && typeof object(review).importedCount==='number' && <p>{String(object(review).importedCount)} movimentos importados.</p>}
  </FinanceDialog>
}
