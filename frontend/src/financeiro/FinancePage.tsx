import { useEffect, useMemo, useState, type FormEvent, type ReactNode } from 'react'
import { Link, useLocation, useNavigate } from 'react-router-dom'
import { useAuth } from '../auth/useAuth'
import { financeDestinations, type FinancePageKey } from '../config/financeRoutes'
import { useTheme } from '../theme/theme-context'
import { cents, csv, type Direction, type ExportCell } from './domain'
import { columns, display, money, object, operationalDate, responseSchema, rows, titleColumns, value, views, type Column, type Response, type Row, type View } from './model'
import { accountForm, agreement, cashCountForm, classificationForm, closeForm, configForm, creditForm, deactivateAccount, directionPage, dreForm, editTitle, externalRefund, legacyForm, matchForm, newTitle, originForm, ownerForm, recoverLoss, reverseSettlement, settleTitles, statementForm, titleAdjustment, transferForm, unmatchForm, type Form } from './operations'
import { OperationDialog } from './OperationDialog'
import { explain } from './messages'
import { financialService } from './service'
import { FinanceActions, FinanceDialog, FinanceHeader, FinanceMetrics, FinancePanel, FinanceScope, FinanceTable } from './ui'

const pageSize=50
const titleKeys=['CONTAS_PAGAR','CONTAS_RECEBER']
type Query = Record<string,unknown>
type State = {data?: Response; lookup?: Row; error?:string; busy?:boolean}
type Detail = {title:string; columns:Column[]; rows:Row[]; notes?:ReactNode}

function Grid({label, schema, data, actions}:{label:string; schema:Column[]; data:Row[]; actions?:(row:Row)=>ReactNode}) {
  return <FinanceTable label={label} rows={data} rowKey={row=>value(row,'id')||value(row,'date')||value(row,'dre_line')||JSON.stringify(row)} empty="Nenhum registro neste recorte."
    columns={[...schema.map(([id,title,format])=>({id,title,numeric:format==='money',cell:(row:Row)=>display(row,id,format)})),
      ...(actions?[{id:'actions',title:'Ações',cell:actions}]:[])]}/>
}
function Button({children,onClick,disabled,primary}:{children:ReactNode;onClick:()=>void;disabled?:boolean;primary?:boolean}) {
  return <button type="button" className={primary?'btn primary':'btn'} onClick={onClick} disabled={disabled}>{children}</button>
}
function printRows(page:Window,title:string,schema:Column[],data:Row[]) {
  page.opener=null
  const doc=page.document
  doc.title=title
  const style=doc.createElement('style')
  style.textContent='body{font:14px system-ui;padding:20px;color:#101827}table{border-collapse:collapse;width:100%}th,td{border:1px solid #bbb;padding:7px;text-align:left}tr{break-inside:avoid}thead{display:table-header-group}'
  doc.head.append(style)
  const heading=doc.createElement('h1')
  heading.textContent=title
  doc.body.append(heading)
  const table=doc.createElement('table')
  const header=table.createTHead().insertRow()
  for(const [,label] of schema) {
    const th=doc.createElement('th');th.scope='col';th.textContent=label;header.append(th)
  }
  const body=table.createTBody()
  data.forEach(row=>{
    const tr=body.insertRow()
    schema.forEach(([id,,format])=>{tr.insertCell().textContent=display(row,id,format)})
  })
  doc.body.append(table)
  return page
}
function saveCsv(title:string,schema:Column[],data:Row[]) {
  const lines:ExportCell[][]=[schema.map(([,label])=>({text:label})),...data.map(row=>schema.map(([id,,format])=>
    format==='money'&&typeof row[id]==='string'?{cents:row[id]}:{text:display(row,id,format)}))]
  const file=new Blob([csv(lines)],{type:'text/csv;charset=utf-8;'})
  const url=URL.createObjectURL(file)
  const download=document.createElement('a')
  download.href=url
  download.download=title.toLowerCase().replace(/\s+/g,'-')+'.csv'
  download.click()
  setTimeout(()=>URL.revokeObjectURL(url),2000)
}
export function FinancePage() {
  const { profile,permissions,canAccess }=useAuth()
  const { theme }=useTheme()
  const location=useLocation()
  const navigate=useNavigate()
  const destination=financeDestinations.find(r=>r.route===location.pathname.replace(/\/$/,''))??financeDestinations[0]
  const {pageKey,label}=destination
  const today=operationalDate(profile?.tenant.timezone??'America/Sao_Paulo')
  const tabs=views[pageKey]
  const [tab,setTab]=useState(tabs[0].id)
  const [legacy,setLegacy]=useState(false)
  const tabView=tabs.find(v=>v.id===tab)??tabs[0]
  const view=useMemo<View>(()=>legacy ? {id:tabView.id,label:'Títulos legados para conferir',mode:'LEGACY'} : tabView,[legacy,tabView])
  const direction:Direction=pageKey==='CONTAS_PAGAR'?'PAY':'RECEIVE'
  const [filters,setFilters]=useState<Query>({})
  const [filterOpen,setFilterOpen]=useState(false)
  const [accountId,setAccountId]=useState('')
  const [offset,setOffset]=useState(0)
  const [revision,setRevision]=useState('')
  const [reload,setReload]=useState(0)
  const [state,setState]=useState<State>({busy:true})
  const [form,setForm]=useState<Form|null>(null)
  const [recovery,setRecovery]=useState(false)
  const [detail,setDetail]=useState<Detail|null>(null)
  const [selected,setSelected]=useState<string[]>([])
  const [notice,setNotice]=useState('')
  const [exporting,setExporting]=useState(false)
  const [fileError,setFileError]=useState('')
  const [scenario,setScenario]=useState('0')
  const ownerId=profile?.tenant.id, uid=profile?.id
  const client=useMemo(()=>ownerId&&uid?financialService({tenantId:ownerId,uid}):null,[ownerId,uid])
  const lookup=state.lookup??{}
  const data=state.data
  const requiresAccount=['LEDGER','RECONCILIATION','MATCHES'].includes(view.mode)
  const effectiveAccount=accountId || (requiresAccount ? value(rows(lookup.accounts).find(r=>view.mode==='LEDGER'||r.balance_scope==='GLOBAL')??{},'id') : '')
  const query=useMemo(()=>({
    mode:view.mode,direction,...(view.status?{status:view.status}:{}),
    ...(requiresAccount?{accountId:effectiveAccount}:{}),
    ...(['DRE','REPORTS'].includes(view.mode)?{from:today.slice(0,7)+'-01',to:today}:{}),
    ...filters,offset,pageSize,...(revision?{revision}:{}),
  }),[view,direction,requiresAccount,effectiveAccount,today,filters,offset,revision])
  useEffect(()=>{
    if(!client) return
    let active=true
    // State changes follow the request's microtask, with cancellation at every route/tab change.
    void (async()=>{
      await Promise.resolve()
      if(!active) return
      setState(current=>({...current,busy:true,error:undefined}))
      try {
        const info=object(await client.read({mode:'LOOKUPS',pageKey}))
        if(!active) return
        const account=viewRequiresAccount(query.mode)?query.accountId:''
        const effective=String(account||value(rows(info.accounts).find(r=>query.mode==='LEDGER'||r.balance_scope==='GLOBAL')??{},'id'))
        const result=viewRequiresAccount(query.mode)&&!effective?undefined:
          responseSchema.parse(await client.read({...query,...(viewRequiresAccount(query.mode)?{accountId:effective}:{})}))
        if(active) setState({lookup:info,data:result})
      } catch(error) { if(active)setState(current=>({lookup:current.lookup,error:explain(error)})) }
    })()
    return ()=>{active=false}
  },[client,pageKey,query,reload])

  if(!client || !profile) return null
  const manager=permissions[pageKey]?.canManage===true
  const pending=client.pending()
  const schema=columns[view.collection??view.mode]??[]
  const listed=rows(view.collection?data?.[view.collection]:data?.rows).map(row=>view.collection==='recurrences'?{...row,description:object(row.template).description}:row)
  const selection=listed.filter(row=>selected.includes(value(row,'id')))
  const refresh=()=>{setOffset(0);setRevision('');setSelected([]);setReload(n=>n+1)}
  const start=(newForm:Form)=>{
    setDetail(null)
    if (pending) setRecovery(true)
    else setForm(newForm)
  }
  const changeTab=(id:string)=>{setTab(id);setLegacy(false);setFilters({});setAccountId('');refresh()}
  const settlements:Column[]=[['effective_date','Data','date'],['principal_cents','Principal','money'],['cash_cents','Caixa','money'],['reversed','Estornado'],['reference','Referência']]
  function showTitle(row:Row) {
    void client!.read({mode:'DETAIL',direction,titleId:value(row,'id')}).then(result=>{
      const info=object(result)
      const title=object(info.title)
      const document=object(info.document)
      const events=rows(info.principalEvents)
      const losses=events.filter(event=>event.event_type==='LOSS'&&!events.some(r=>r.reverses_id===event.id))
      setDetail({title:value(title,'description'),columns:settlements,rows:rows(info.settlements),
        notes:<><FinanceMetrics items={[
          {id:'original',label:'Original',formattedValue:money(title.original_cents)},
          {id:'principal',label:'Principal liquidado',formattedValue:money(title.principal_cents)},
          {id:'residual',label:'Saldo',formattedValue:money(title.residual_cents)},
        ]}/><p>Vencimento {display(title,'due_date','date')} · Origem {display(title,'source_type')}</p>
          {title.blocked_reason && <p>Registro protegido. Confira a origem e o saldo migrado.</p>}
          {manager&&document.source_type==='RECURRENCE_ESTIMATE'&&permissions.FIN_CONFIGURACOES?.canManage&&
            <Button onClick={()=>start(classificationForm(lookup,direction,document,true))}>Confirmar valor estimado</Button>}
          {manager&&['MANUAL','RECURRENCE','RECURRENCE_CONFIRMED','VERIFIED_LEGACY'].includes(value(document,'source_type'))&&!rows(info.principalEvents).length&&
            <Button onClick={()=>start(classificationForm(lookup,direction,document))}>Reclassificar</Button>}
          {manager&&title.source_type==='MANUAL'&&!rows(info.principalEvents).length&&<Button onClick={()=>start(editTitle(today,direction,title))}>Alterar vencimento</Button>}
          {manager && rows(info.settlements).some(r=>!r.reversed) && <div className="fin-buttons">
            {rows(info.settlements).filter(r=>!r.reversed).map(r=><div key={value(r,'id')} className="fin-buttons">
              <Button onClick={()=>start(reverseSettlement(today,direction,r))}>Estornar {money(r.cash_cents)} em {display(r,'effective_date','date')}</Button>
              <Button onClick={()=>start(externalRefund(lookup,today,direction,r))}>Devolução externa</Button>
            </div>)}
          </div>}
          {!!rows(info.contacts).length && <Grid label="Contatos" schema={[[ 'created_at','Data','date'],['forecast_date','Previsão','date'],['note','Relato']]} data={rows(info.contacts)}/>}
          {manager&&direction==='RECEIVE'&&losses.map(event=><Button key={value(event,'id')} onClick={()=>start(recoverLoss(today,title,event))}>Recuperar perda de {money(event.amount_cents)}</Button>)}
          <h3>Histórico do saldo</h3>
          <Grid label="Histórico" schema={[[ 'effective_date','Data','date'],['event_type','Evento'],['amount_cents','Principal','money']]} data={rows(info.principalEvents)}/></>})
    }).catch(error=>setNotice(explain(error)))
  }
  function showParty(row:Row) {
    const partyId=value(row,direction==='PAY'?'supplier_id':'customer_id')
    if(!partyId) return
    void client!.read({mode:'PARTY',direction,partyId,pageSize:200}).then(result=>{
      setDetail({title:value(row,'party_name'),columns:titleColumns,rows:rows(object(result).rows)})
    }).catch(error=>setNotice(explain(error)))
  }
  function reconcile(row:Row) {
    void client!.read({mode:'RECONCILIATION',accountId:effectiveAccount,candidates:true,pageSize:100}).then(result=>{
      const candidates=rows(object(result).candidates)
      if (!candidates.length) {setNotice('Nenhum movimento interno disponível nesta conta.');return}
      start(matchForm(lookup,effectiveAccount,row,candidates))
    }).catch(error=>setNotice(explain(error)))
  }
  function control(row:Row):ReactNode {
    if(view.mode==='TITLES') {
      const available=!row.blocked_reason && row.source_type!=='RECURRENCE_ESTIMATE' && cents(row.residual_cents)>0n
      const id=value(row,'id')
      return <div className="fin-buttons">
        {manager&&available&&<label className="fin-check"><input type="checkbox" aria-label={'Selecionar '+value(row,'description')} checked={selected.includes(id)} onChange={event=>setSelected(current=>event.target.checked?[...current,id]:current.filter(x=>x!==id))}/>Incluir</label>}
        <Button onClick={()=>showTitle(row)}>Detalhes</Button>
        {value(row,direction==='PAY'?'supplier_id':'customer_id') && <Button onClick={()=>showParty(row)}>Ficha</Button>}
        {manager && available && <>
          <Button onClick={()=>start(settleTitles(lookup,today,direction,[row]))}>{direction==='PAY'?'Pagar':'Receber'}</Button>
          <Button onClick={()=>start(titleAdjustment(today,direction,row,'C04'))}>Previsão</Button>
          <Button onClick={()=>start(titleAdjustment(today,direction,row,'C06'))}>Cancelar saldo</Button>
          {direction==='RECEIVE'&&<><Button onClick={()=>start(titleAdjustment(today,direction,row,'C26'))}>Contato</Button><Button onClick={()=>start(titleAdjustment(today,direction,row,'C28'))}>Perda</Button></>}
        </>}
      </div>
    }
    if(view.mode==='ACCOUNTS')return <div className="fin-buttons">
      <Button onClick={()=>{changeTab('extrato');setAccountId(value(row,'id'))}}>Ver extrato</Button>
      {manager&&row.active===true&&<Button onClick={()=>start(deactivateAccount(lookup,row))}>Inativar</Button>}
    </div>
    if(!manager)return null
    if(view.mode==='LEGACY'&&row.active===true&&!row.has_settlement_evidence&&row.legacy_status==='OPEN'&&['MANUAL','LEGACY'].includes(value(row,'source_type')))
      return <Button onClick={()=>start(legacyForm(direction,row))}>Conferir título</Button>
    if(view.mode==='CREDIT')return <div className="fin-buttons"><Button onClick={()=>start(creditForm(lookup,today,row))}>Editar limite</Button><Button onClick={()=>start(creditForm(lookup,today,row,true))}>Conceder</Button></div>
    if(view.mode==='RECONCILIATION' && row.amount_cents!==row.matched_cents)return <Button onClick={()=>reconcile(row)}>Conciliar</Button>
    if(view.mode==='MATCHES' && !row.unmatched)return <Button onClick={()=>start(unmatchForm(today,row))}>Desfazer vínculo</Button>
    if(view.mode==='CASH')return <Button onClick={()=>start(cashCountForm(row))}>Conferir</Button>
    if(view.mode==='CLOSURES' && row.action==='CLOSE')return <Button onClick={()=>start(closeForm(lookup,today,row))}>Reabrir</Button>
    if(view.collection==='categories'||view.collection==='centers')return <Button onClick={()=>start(configForm(lookup,today,view.collection as 'categories'|'centers',row))}>Editar</Button>
    if(view.collection==='recurrences')return <div className="fin-buttons">
      <Button onClick={()=>start(configForm(lookup,today,'recurrences',row))}>Editar próximas</Button>
      {row.active === true && <Button onClick={()=>start({title:'Gerar ocorrência',action:'C23',fields:[],description:value(row,'description'),payload:()=>({recurrenceId:row.id,occurrence:row.next_occurrence})})}>Gerar</Button>}
      <Button onClick={()=>start({title:row.active?'Pausar recorrência':'Retomar recorrência',action:'C24',fields:[],payload:()=>({recurrenceId:row.id,expectedVersion:row.version,active:!row.active})})}>{row.active?'Pausar':'Retomar'}</Button>
    </div>
    return null
  }
  function newAction() {
    if(!manager)return null
    if(view.mode==='TITLES')return <><Button primary onClick={()=>start(newTitle(lookup,today,direction))}>{direction==='PAY'?'Novo compromisso':'Novo recebível'}</Button>
      <Button onClick={()=>start(newTitle(lookup,today,direction,true))}>Criar e baixar</Button></>
    if(view.mode==='CREDIT')return <Button primary onClick={()=>start(creditForm(lookup,today))}>Definir limite</Button>
    if(view.mode==='ACCOUNTS')return <Button primary onClick={()=>start(accountForm(lookup,today,uid!))}>Nova conta</Button>
    if(view.mode==='TRANSFERS')return <Button primary onClick={()=>start(transferForm(lookup,today))}>Nova transferência</Button>
    if(view.mode==='OWNER')return <Button primary onClick={()=>start(ownerForm(lookup,today))}>Movimento de sócio</Button>
    if(view.mode==='RECONCILIATION')return <Button primary disabled={!effectiveAccount} onClick={()=>start(statementForm(lookup,effectiveAccount))}>Importar extrato</Button>
    if(view.mode==='CLOSURES')return <Button primary onClick={()=>start(closeForm(lookup,today))}>Fechar competência</Button>
    const kind=view.collection
    if(kind==='ownerNatures')return <><Button primary onClick={()=>start(dreForm(lookup,today))}>Publicar mapa DRE</Button>
      <Button onClick={()=>start(originForm(lookup,today))}>Classificar evento</Button>
      <Button onClick={()=>start(originForm(lookup,today,true))}>Vincular origem</Button>
      <Button onClick={()=>start(configForm(lookup,today,kind))}>Cadastrar natureza</Button></>
    if(kind==='categories'||kind==='centers'||kind==='recurrences')return <Button primary onClick={()=>start(configForm(lookup,today,kind))}>Cadastrar</Button>
    if(kind==='methods')return <Button primary onClick={()=>start(configForm(lookup,today,'terms'))}>Nova condição</Button>
    return null
  }
  async function exportView(print:boolean) {
    if(!schema.length || !data)return
    const printPage=print?window.open('','_blank'):null
    if(print&&!printPage){setFileError('Autorize a janela de impressão e tente novamente.');return}
    if(printPage) printPage.opener=null
    setExporting(true);setFileError('')
    try {
      const exportQuery={...query}
      delete exportQuery.revision
      let at=0
      let snapshot:string|undefined
      const complete:Row[]=[]
      while(true) {
        const next=responseSchema.parse(await client!.read({...exportQuery,export:true,offset:at,pageSize:200,...(snapshot?{revision:snapshot}:{})}))
        snapshot=next.revision
        const batch=rows(view.collection?next[view.collection]:next.rows)
        complete.push(...batch)
        at+=batch.length
        if (view.collection||batch.length<200||at>=(next.totalCount??Infinity))break
        if (at>=20000) throw Error('EXPORT_ROW_LIMIT')
      }
      if(printPage)printRows(printPage,label+' · '+view.label,schema,complete).print()
      else saveCsv(label+' · '+view.label,schema,complete)
    } catch(error){printPage?.close();setFileError(explain(error))}
    finally{setExporting(false)}
  }
  function applyFilters(event:FormEvent<HTMLFormElement>) {
    event.preventDefault()
    setFilters(Object.fromEntries([...new FormData(event.currentTarget)].filter(([,v])=>v!=='')))
    setFilterOpen(false)
    refresh()
  }
  const balance=rows(data?.accounts)
  const totals=object(data?.totals)
  const overview=object(data?.titles)
  const canExport=permissions[pageKey]?.canExport===true && !!schema.length && !exporting
  const canCreateOverview=pageKey==='FIN_VISAO'
  const titlePage=titleKeys.includes(pageKey)
  return <FinanceScope theme={theme}><main className="workspace finance-workspace">
    <FinanceHeader title={label} tabs={tabs} activeTab={view.id} onTab={changeTab} onBack={()=>navigate('/modulos/financeiro')} actions={
      <FinanceActions onClear={()=>{setFilters({});refresh()}} onFilters={()=>setFilterOpen(true)} onExport={()=>void exportView(false)} onPrint={()=>void exportView(true)} canExport={canExport}>
        {titlePage && <Button onClick={()=>{setLegacy(flag=>!flag);setFilters({});refresh()}}>{legacy?'Voltar aos títulos':'Conferir legados'}</Button>}
        {newAction()}
      </FinanceActions>}/>
    {pending && <div className="callout" role="status">Operação financeira em conferência. <Button onClick={()=>setRecovery(true)}>Consultar referência</Button></div>}
    {notice && <div className="callout" role="status">{notice} <Button onClick={()=>setNotice('')}>Entendi</Button></div>}
    {fileError && <p className="dialog-error" role="alert">{fileError}</p>}
    {state.error && <div className="callout" role="alert">{state.error} <Button onClick={refresh}>Tentar novamente</Button></div>}
    {state.busy && <p role="status">Carregando informações financeiras…</p>}
    {requiresAccount && <label className="fin-selector">Conta <select value={effectiveAccount} onChange={event=>{setAccountId(event.target.value);refresh()}}>
      <option value="">Selecione uma conta</option>
      {rows(lookup.accounts).filter(r=>view.mode==='LEDGER'||r.balance_scope==='GLOBAL').map(r=><option key={value(r,'id')} value={value(r,'id')}>{value(r,'name')}</option>)}
    </select></label>}
    {!state.busy && !state.error && requiresAccount && !effectiveAccount && <p className="callout">Selecione uma conta à qual você tem acesso. Para conciliar, solicite autorização para a conta inteira.</p>}
    {data && !state.busy && !state.error && <>
      {canCreateOverview && <>
        <FinanceMetrics items={[
          {id:'pay',label:'Pagamentos em aberto',formattedValue:money(overview.payableCents),tone:'amber'},
          {id:'receive',label:'Recebimentos em aberto',formattedValue:money(overview.receivableCents),tone:'green'},
          {id:'overdue',label:'Valores em atraso',formattedValue:money(overview.overdueCents),tone:'red'},
          {id:'quality',label:'Registros a conferir',formattedValue:String((overview.blockedCount as number??0)+(object(data.quality).unmappedLegacyPayables as number??0)+(object(data.quality).unmappedLegacyReceivables as number??0))},
        ]}/>
        <FinancePanel title="Onde está o dinheiro" subtitle={'Posição em '+display(data,'position','date')}
          actions={<div className="fin-buttons">{permittedLinks(pageKey,canAccess)}{(['PAY','RECEIVE'] as const).filter(d=>permissions[directionPage[d]]?.canManage).map(d=><Button key={d} onClick={()=>start(newTitle(lookup,today,d))}>{d==='PAY'?'Nova despesa':'Nova receita'}</Button>)}</div>}>
          <Grid label="Saldos" schema={columns.ACCOUNTS} data={balance}/>
        </FinancePanel>
      </>}
      {titlePage && view.mode==='TITLES' && <FinanceMetrics items={[
        {id:'count',label:'Títulos encontrados',formattedValue:String(data.totalCount??listed.length)},
        {id:'original',label:'Valor original',formattedValue:money(totals.originalCents)},
        {id:'balance',label:'Saldo em aberto',formattedValue:money(totals.residualCents),tone:direction==='PAY'?'amber':'green'},
      ]}/>}
      {view.mode==='DRE' && data.quality==='INCOMPLETE' && <p className="callout" role="status">Resultado incompleto. Confira os eventos sem custo ou classificação gerencial.</p>}
      {view.mode==='FLOW' && <FinanceMetrics items={[{id:'late',label:'Saldo vencido fora da previsão',formattedValue:money(data.overdueCents),tone:'amber'}]}/>}
      {view.id==='cenarios' && <FinancePanel title="Cenário local" subtitle="Simule um ajuste no total da previsão.">
        <label className="fin-selector">Ajuste em centavos <input value={scenario} onChange={event=>setScenario(event.target.value)} pattern="-?[0-9]+"/></label>
        <p className="fin-scenario">Total estimado {money((listed.reduce((sum,r)=>sum+cents(r.amount_cents,true),0n)+(/^-?\d+$/.test(scenario)?BigInt(scenario):0n)).toString())}</p>
      </FinancePanel>}
      {!!schema.length && <FinancePanel title={view.label} subtitle={data.totalCount===undefined?undefined:data.totalCount+' registros'}
        actions={selection.length>0&&<div className="fin-buttons"><Button onClick={()=>start(settleTitles(lookup,today,direction,selection))}>Baixar {selection.length} títulos</Button>
          {direction==='RECEIVE' && selection.every(r=>r.customer_id && r.customer_id===selection[0].customer_id && r.branch_id===selection[0].branch_id) && <Button onClick={()=>start(agreement(lookup,today,selection))}>Renegociar</Button>}</div>}>
        <Grid label={view.label} schema={schema} data={listed} actions={['TITLES','LEGACY','ACCOUNTS','CREDIT','OWNER','RECONCILIATION','MATCHES','CASH','CLOSURES','SETTINGS'].includes(view.mode)?control:undefined}/>
        {(offset>0 || (data.totalCount??0)>pageSize || (data.totalCount===undefined && !view.collection && listed.length===pageSize)) && <nav className="fin-pagination" aria-label="Paginação">
          <Button disabled={!offset} onClick={()=>{setRevision(data.revision);setOffset(n=>Math.max(0,n-pageSize));setSelected([])}}>Anterior</Button>
          <span>Página {Math.floor(offset/pageSize)+1}</span>
          <Button disabled={data.totalCount!==undefined?offset+pageSize>=data.totalCount:listed.length<pageSize} onClick={()=>{setRevision(data.revision);setOffset(n=>n+pageSize);setSelected([])}}>Próxima</Button>
        </nav>}
      </FinancePanel>}
      {view.mode==='DRE' && !!rows(data.gaps).length && <FinancePanel title="Eventos a conferir"><Grid label="Eventos a conferir" schema={[[ 'competence_date','Competência','date'],['event_type','Evento'],['quality','Qualidade'],['amount_cents','Valor','money']]} data={rows(data.gaps)}/></FinancePanel>}
      {view.collection==='methods' && <FinancePanel title="Condições de pagamento"><Grid label="Condições" schema={columns.terms} data={rows(data.terms)}/></FinancePanel>}
      {view.collection==='ownerNatures' && <FinancePanel title="Configurações que habilitam operações"><p className="fin-scenario">Confirme o saldo na data de corte de cada conta. A retirada de sócio exige natureza vinculada ao plano gerencial. Comprovantes aguardam configuração de armazenamento privado.</p></FinancePanel>}
    </>}
    {filterOpen && <FinanceDialog open title="Filtros financeiros" onClose={()=>setFilterOpen(false)} footer={<Button onClick={()=>setFilterOpen(false)}>Voltar</Button>}>
      <form className="form-grid" onSubmit={applyFilters}>
        {titlePage && view.mode==='TITLES' && <><label>Buscar título <input name="search" defaultValue={String(filters.search??'')}/></label>
          <label>Tipo de data <select name="dateType" defaultValue={String(filters.dateType??'DUE')}><option value="DUE">Vencimento</option><option value="COMPETENCE">Competência</option><option value="FORECAST">Previsão</option><option value="SETTLEMENT">Liquidação</option></select></label></>}
        <label>Filial <select name="branchId" defaultValue={String(filters.branchId??'')}><option value="">Todas autorizadas</option>{rows(lookup.branches).map(r=><option key={value(r,'id')} value={value(r,'id')}>{value(r,'name')}</option>)}</select></label>
        <label>De <input type="date" name="from" defaultValue={String(filters.from??'')}/></label>
        <label>Até <input type="date" name="to" defaultValue={String(filters.to??'')}/></label>
        <button type="submit" className="btn primary">Aplicar filtros</button>
      </form>
    </FinanceDialog>}
    {detail && <FinanceDialog open title={detail.title} onClose={()=>setDetail(null)} wide footer={<Button onClick={()=>setDetail(null)}>Fechar</Button>}>
      {detail.notes}
      <Grid label={detail.title} schema={detail.columns} data={detail.rows}/>
    </FinanceDialog>}
    {(form||recovery)&&<OperationDialog form={form} client={client} onClose={()=>{setForm(null);setRecovery(false)}} onFinish={result=>{
      if(result.status==='COMMITTED'){setNotice('Operação registrada · '+result.operationId);refresh()}
    }}/>}
  </main></FinanceScope>
}
function viewRequiresAccount(mode:unknown){return ['LEDGER','RECONCILIATION','MATCHES'].includes(String(mode))}
function permittedLinks(pageKey:FinancePageKey,canAccess:(key:string)=>boolean) {
  return financeDestinations.filter(r=>r.pageKey!==pageKey&&canAccess(r.pageKey)).map(r=><Link className="btn" key={r.pageKey} to={r.route}>{r.label}</Link>)
}
