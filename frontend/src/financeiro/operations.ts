import type { Direction } from './domain'
import { cents, decimalBRL, parseMoney, settlementCash, splitInstallments } from './domain'
import { display, money, object, rows, value, type Row } from './model'
import type { BankFile } from './bankFile'

export type Field = { key:string; label:string; type?:'money'|'signedMoney'|'date'|'number'|'checkbox'|'textarea'|'file'; options?: readonly (readonly [string,string])[]; initial?:string; optional?:boolean }
export type Form = { title:string; action:string; fields:Field[]; payload:(form:FormData,file:BankFile|null)=>Record<string,unknown>; description?:string }
type Options = NonNullable<Field['options']>
const get = (data:FormData,key:string) => String(data.get(key) ?? '').trim()
const amount = (data:FormData,key:string,signed=false) => parseMoney(get(data,key)||'0',signed)
const select = (key:string,label:string,options:Options,initial?:string,optional=false):Field => ({key,label,options,initial,optional})
const input = (key:string,label:string,type?:Field['type'],initial?:string,optional=false):Field => ({key,label,type,initial,optional})
const pick = (lookup:Row,key:string):Options => rows(lookup[key]).flatMap(r=>value(r,'id') && r.active!==false ? [[value(r,'id'),value(r,'name')] as const] : [])
const branch = (lookup:Row):Field => select('branchId','Filial',pick(lookup,'branches'))
const account = (lookup:Row,key='accountId',label='Conta'):Field => select(key,label,pick(lookup,'accounts'))
const note = (optional=false):Field => input('reason','Motivo','textarea',undefined,optional)
const iso = (key:string,label:string,day:string) => input(key,label,'date',day)
const frequencies: Options = [['MONTHLY','Mensal'],['FORTNIGHTLY','Quinzenal (15 dias)'],['WEEKLY','Semanal'],['DAILY','Diária']]
const typeOptions: Options = [['PAY','A pagar'],['RECEIVE','A receber']]
const directionPage = {'PAY':'CONTAS_PAGAR','RECEIVE':'CONTAS_RECEBER'} as const
export { directionPage }

function baseTitle(lookup:Row,day:string,direction:Direction):Field[] {
  return [input('description','Descrição'),branch(lookup),
    select('partyId',direction==='PAY'?'Fornecedor':'Cliente',pick(lookup,direction==='PAY'?'suppliers':'customers'),undefined,true),
    input('amount','Valor (R$)','money'),iso('issueDate','Emissão',day),iso('competenceDate','Competência',day),iso('dueDate','Primeiro vencimento',day),
    input('installmentCount','Parcelas','number','1'),select('frequency','Frequência',frequencies,'MONTHLY'),
    select('categoryId','Categoria',pick(lookup,'categories'),undefined,true),select('centerId','Centro de custo',pick(lookup,'centers'),undefined,true),
    input('notes','Observações','textarea',undefined,true)]
}
function titleData(data:FormData,direction:Direction) {
  const total=amount(data,'amount'), count=Number(get(data,'installmentCount'))
  splitInstallments(total,count)
  const categoryId=get(data,'categoryId'),centerId=get(data,'centerId'),partyId=get(data,'partyId')
  if (centerId && !categoryId) throw Error('CATEGORY_REQUIRED')
  return {direction,description:get(data,'description'),branchId:get(data,'branchId'),amountCents:total,
    ...(partyId?{[direction==='PAY'?'supplierId':'customerId']:partyId}:{}),
    issueDate:get(data,'issueDate'),competenceDate:get(data,'competenceDate'),dueDate:get(data,'dueDate'),installmentCount:count,
    frequency:get(data,'frequency'),notes:get(data,'notes'),
    classifications:categoryId?[{categoryId,centerId:centerId||null,amountCents:total}]:[]}
}
function settlementFields(lookup:Row,day:string):Field[] {
  const usableMethods = {...lookup,methods:rows(lookup.methods).filter(m=>m.code!=='CASH'&&!m.requiresChange)}
  return [account(lookup),select('methodId','Meio de pagamento',pick(usableMethods,'methods')),
    iso('effectiveDate','Data da movimentação',day),input('reference','Referência',undefined,undefined,true)]
}
function settlementData(data:FormData,direction:Direction) {
  return {accountId:get(data,'accountId'),methodId:get(data,'methodId'),effectiveDate:get(data,'effectiveDate'),
    reference:get(data,'reference'),feeMode:direction==='PAY'?'ADDED':'RETAINED',reason:get(data,'reason')}
}
export function newTitle(lookup:Row,day:string,direction:Direction,settle=false):Form {
  return {title:direction==='PAY'?'Novo compromisso':'Novo recebível',action:settle?'C02':'C01',
    fields:[...baseTitle(lookup,day,direction),...(settle?settlementFields(lookup,day):[])],
    payload:data=>({...titleData(data,direction),...(settle?{settlement:settlementData(data,direction)}:{})})}
}
export function settleTitles(lookup:Row,day:string,direction:Direction,titles:Row[]):Form {
  const fields=titles.flatMap((row,i)=>{
    const title=value(row,'description')
    const part=value(row,'residual_cents')
    return [
      input('principal'+i,'Principal · '+title,'money',decimalBRL(part)),
      input('discount'+i,'Desconto · '+title,'money','0,00'),
      input('interest'+i,'Juros · '+title,'money','0,00'),
      input('penalty'+i,'Multa · '+title,'money','0,00'),
      input('fee'+i,'Tarifa · '+title,'money','0,00'),
    ]
  })
  return {title:direction==='PAY'?'Registrar pagamento':'Registrar recebimento',action:direction==='PAY'?'C07':'C08',
    fields:[...settlementFields(lookup,day),...fields,note(true)],payload:data=>{
      const lines=titles.map((title,i)=>{
        const line={titleId:value(title,'id'),expectedVersion:value(title,'version'),principalCents:amount(data,'principal'+i),
          discountCents:amount(data,'discount'+i),interestCents:amount(data,'interest'+i),penaltyCents:amount(data,'penalty'+i),feeCents:amount(data,'fee'+i)}
        settlementCash(direction,line,value(title,'residual_cents'))
        if (get(data,'reason').length<3 && [line.discountCents,line.interestCents,line.penaltyCents].some(n=>n!=='0')) throw Error('REASON_REQUIRED')
        return line
      })
      return {direction,...settlementData(data,direction),lines}
    }}
}
export function titleAdjustment(day:string,direction:Direction,title:Row,action:'C04'|'C06'|'C26'|'C28'):Form {
  const names={C04:'Reprogramar previsão',C06:'Cancelar saldo do título',C26:'Registrar promessa ou contato',C28:'Registrar perda'}
  const fields=action==='C26'?[input('note','Relato do contato','textarea'),input('forecastDate','Previsão prometida','date',undefined,true)]:
    [note(),...(action==='C04'?[iso('forecastDate','Nova previsão',day)]:[iso('effectiveDate','Data',day)]),
      ...(action==='C28'?[input('amount','Perda (R$)','money',decimalBRL(value(title,'residual_cents')))]:[])]
  return {title:names[action],action,description:value(title,'description')+' · '+money(title.residual_cents),fields,
    payload:data=>({...Object.fromEntries(data),direction,titleId:value(title,'id'),expectedVersion:value(title,'version'),...(action==='C28'?{amountCents:amount(data,'amount')}:{})})}
}
export function reverseSettlement(day:string,direction:Direction,settlement:Row):Form {
  return {title:'Estornar baixa',action:'C09',description:'O estorno registra a correção no Financeiro. Confirme separadamente qualquer devolução fora do sistema.',
    fields:[iso('effectiveDate','Data do estorno',day),note()],payload:data=>({...Object.fromEntries(data),direction,settlementId:value(settlement,'settlement_id')})}
}
export function agreement(lookup:Row,day:string,selected:Row[]):Form {
  const total=selected.reduce((sum,r)=>sum+cents(r.residual_cents),0n)
  return {title:'Renegociar saldo',action:'C27',description:money(total.toString())+' de saldo nos títulos selecionados.',
    fields:[input('description','Descrição do acordo',undefined,'Renegociação'),iso('issueDate','Emissão',day),
      iso('competenceDate','Competência',day),iso('dueDate','Primeiro vencimento',day),iso('effectiveDate','Data do acordo',day),
      input('installmentCount','Parcelas','number','1'),select('frequency','Frequência',frequencies,'MONTHLY'),
      input('discount','Desconto (R$)','money','0,00'),input('interest','Juros (R$)','money','0,00'),note(),branch(lookup)],
    payload:data=>({direction:'RECEIVE',sources:selected.map(row=>({titleId:value(row,'id'),expectedVersion:value(row,'version')})),
      destination:{...Object.fromEntries(data),installmentCount:Number(get(data,'installmentCount'))},
      discountCents:amount(data,'discount'),interestCents:amount(data,'interest'),reason:get(data,'reason'),effectiveDate:get(data,'effectiveDate')})}
}
export function accountForm(lookup:Row,day:string,uid:string):Form {
  return {title:'Abrir conta financeira',action:'C12',description:'Informe o saldo conferido no fim da data de corte. Os movimentos no módulo começam no dia seguinte.',
    fields:[input('name','Nome da conta'),select('accountType','Tipo',[['BANK','Banco'],['WALLET','Carteira'],['TRANSIT','Em trânsito'],['CASH','Caixa']]),branch(lookup),
      input('opening','Saldo no corte (R$)','signedMoney'),iso('cutoffDate','Data de corte',day),
      input('shared','Conta compartilhada','checkbox'),input('global','Autorizar meu acesso ao saldo global','checkbox'),
      input('post','Autorizar meus lançamentos nesta conta','checkbox'),input('reconcile','Autorizar minha conciliação nesta conta','checkbox')],
    payload:data=>({name:get(data,'name'),accountType:get(data,'accountType'),branchId:get(data,'branchId'),currency:'BRL',cutoffDate:get(data,'cutoffDate'),
      openingBalanceCents:amount(data,'opening',true),shared:data.has('shared'),grants:[{userId:uid,branchId:get(data,'branchId'),canPost:data.has('post'),canReconcile:data.has('reconcile'),canGlobalBalance:data.has('global')}]})}
}
export function transferForm(lookup:Row,day:string):Form {
  return {title:'Transferir entre contas',action:'C11',fields:[branch(lookup),account(lookup,'fromAccountId','Origem'),account(lookup,'toAccountId','Destino'),
    input('amount','Valor (R$)','money'),input('fee','Tarifa (R$)','money','0,00'),iso('effectiveDate','Data',day),input('reference','Referência',undefined,undefined,true)],
    payload:data=>({...Object.fromEntries(data),amountCents:amount(data,'amount'),feeCents:amount(data,'fee')})}
}
export function statementForm(lookup:Row,accountId:string):Form {
  return {title:'Importar extrato',action:'C17',description:'OFX em BRL ou CSV com as colunas data, descrição e valor. A importação não altera saldos.',
    fields:[branch(lookup),{...account(lookup),initial:accountId},input('file','Arquivo do extrato','file')],
    payload:(data,file)=>{if (!file) throw Error('STATEMENT_REQUIRED');return {branchId:get(data,'branchId'),accountId:get(data,'accountId'),...file}}}
}
export function matchForm(lookup:Row,accountId:string,bank:Row,ledger:Row[]):Form {
  return {title:'Conciliar movimento',action:'C18',description:display(bank,'description')+' · '+money(bank.amount_cents),
    fields:[branch(lookup),select('lineId','Movimento interno',ledger.map(r=>[value(r,'id'),value(r,'description')+' · '+money(r.amount_cents)])),
      input('amount','Valor com sinal (R$)','signedMoney',decimalBRL((cents(bank.amount_cents,true)-cents(bank.matched_cents,true)).toString()))],
    payload:data=>({accountId,branchId:get(data,'branchId'),edges:[{bankId:value(bank,'id'),lineId:get(data,'lineId'),amountCents:amount(data,'amount',true)}]})}
}
export function unmatchForm(day:string,row:Row):Form {
  return {title:'Desfazer conciliação',action:'C21',fields:[note(),...(row.has_created_settlement?[input('reverse','Estornar a baixa criada no vínculo','checkbox'),iso('effectiveDate','Data do estorno',day)]:[])],
    payload:data=>({matchId:value(row,'id'),branchId:value(row,'branch_id'),reason:get(data,'reason'),reverseCreatedSettlement:data.has('reverse'),effectiveDate:get(data,'effectiveDate')})}
}
export function closeForm(lookup:Row,day:string,row?:Row):Form {
  return {title:row?'Reabrir competência':'Fechar competência',action:row?'C35':'C34',
    fields:[...(row?[]:[branch(lookup),iso('period','Dia do mês contábil',day)]),note()],
    payload:data=>({branchId:row?value(row,'branch_id'):get(data,'branchId'),period:row?value(row,'period'):get(data,'period'),reason:get(data,'reason')})}
}
export function creditForm(lookup:Row,day:string,entry?:Row,issue=false):Form {
  const fields=issue?[...baseTitle(lookup,day,'RECEIVE').filter(f=>f.key!=='partyId'),input('overdueReason','Justificativa do gestor se houver atraso','textarea',undefined,true)]:
    [input('limit','Limite (R$)','money',entry?decimalBRL(value(entry,'limit_cents')):undefined),note()]
  return {title:issue?'Conceder crediário':'Definir limite de crediário',action:issue?'C31':'C30',
    fields:[...(entry?[]:[select('customerId','Cliente',pick(lookup,'customers'))]),...fields],payload:data=>{
      const customerId=entry?value(entry,'id'):get(data,'customerId')
      return issue?{direction:'RECEIVE',customerId,title:titleData(data,'RECEIVE'),overdueReason:get(data,'overdueReason')}:
        {direction:'RECEIVE',customerId,expectedVersion:entry?value(entry,'version'):'0',limitCents:amount(data,'limit'),reason:get(data,'reason')}
    }}
}
export function configForm(lookup:Row,day:string,kind:'categories'|'centers'|'recurrences'|'terms'|'ownerNatures',entry?:Row):Form {
  if (kind==='recurrences') {
    const template=object(entry?.template)
    return {title:entry?'Editar recorrência':'Criar recorrência',action:'C22',
      fields:[input('description','Descrição',undefined,value(template,'description')),{...branch(lookup),initial:value(entry??{},'branch_id')},
        select('direction','Direção',typeOptions,value(template,'direction')||'PAY'),input('amount','Valor (R$)','money',template.amountCents?decimalBRL(value(template,'amountCents')):undefined),
        iso('anchorDate','Primeiro vencimento',value(entry??{},'anchor_date')||day),select('frequency','Frequência',frequencies,value(entry??{},'frequency')||'MONTHLY'),
        input('endDate','Fim','date',value(entry??{},'end_date'),true),input('occurrenceLimit','Limite de ocorrências','number',value(entry??{},'occurrence_limit'),true),input('estimated','Valor estimado','checkbox',entry?.estimated?'true':undefined)],
      payload:data=>({recurrenceId:value(entry??{},'id')||undefined,expectedVersion:value(entry??{},'version'),branchId:get(data,'branchId'),
        anchorDate:get(data,'anchorDate'),frequency:get(data,'frequency'),endDate:get(data,'endDate'),occurrenceLimit:get(data,'occurrenceLimit'),estimated:data.has('estimated'),
        template:{description:get(data,'description'),direction:get(data,'direction'),amountCents:amount(data,'amount')}})}
  }
  const extras: Record<Exclude<typeof kind,'recurrences'>,Field[]> = {
    categories:[input('code','Código'),select('direction','Direção',[['IN','Entrada'],['OUT','Saída'],['BOTH','Ambas']]),
      select('nature','Natureza',[['REVENUE','Receita'],['EXPENSE','Despesa'],['ASSET','Ativo'],['LIABILITY','Passivo'],['EQUITY','Patrimônio'],['COST','Custo'],['DEDUCTION','Dedução'],['FINANCE','Financeiro']]),select('parentId','Categoria superior',pick(lookup,'categories'),undefined,true)],
    centers:[input('purpose','Finalidade',undefined,value(entry??{},'purpose'),true),{...branch(lookup),optional:true,initial:value(entry??{},'branch_id')}],
    terms:[input('installmentCount','Parcelas','number','1'),select('frequency','Frequência',frequencies),input('firstOffsetDays','Dias até o primeiro vencimento','number','0')],
    ownerNatures:[select('categoryId','Categoria gerencial',pick(lookup,'categories')),select('nature','Natureza',[['CAPITAL','Capital'],['ADVANCE','Adiantamento'],['REMUNERATION','Remuneração'],['DISTRIBUTION','Distribuição'],['REIMBURSEMENT','Reembolso']])],
  }
  const names={categories:'categoria',centers:'centro de custo',terms:'condição de pagamento',ownerNatures:'natureza de sócio'}
  const actions={categories:'C14',centers:'C15',terms:'C37',ownerNatures:'C38'}
  return {title:(entry?'Editar ':'Cadastrar ')+names[kind],action:actions[kind],
    fields:[input('name','Nome',undefined,value(entry??{},'name')),...(kind==='categories'&&entry?[]:extras[kind]),
      ...(entry?[input('active','Ativo','checkbox',entry.active?'true':undefined)]:[])],
    payload:data=>({...Object.fromEntries(data),id:value(entry??{},'id')||undefined,expectedVersion:value(entry??{},'version'),...(entry?{active:data.has('active')}:{})})}
}
export function ownerForm(lookup:Row,day:string):Form {
  return {title:'Movimento de sócio',action:'C32',fields:[branch(lookup),account(lookup),select('beneficiaryUid','Beneficiário',pick(lookup,'beneficiaries')),
    select('natureId','Natureza',pick(lookup,'ownerNatures')),select('direction','Direção',[['IN','Aporte'],['OUT','Retirada']]),
    input('amount','Valor (R$)','money'),iso('effectiveDate','Data',day),note()],
    payload:data=>({...Object.fromEntries(data),amountCents:amount(data,'amount')})}
}
export function cashCountForm(row:Row):Form {
  return {title:'Conferir caixa',action:'C33',description:'Valor esperado '+money(row.calculated_expected_cents),fields:[input('counted','Valor contado (R$)','money'),note()],
    payload:data=>({sessionId:value(row,'id'),expectedCents:value(row,'calculated_expected_cents'),countedCents:amount(data,'counted'),reason:get(data,'reason')})}
}

export function editTitle(day:string,direction:Direction,title:Row):Form {
  return {title:'Alterar vencimento do título',action:'C03',description:value(title,'description'),
    fields:[iso('dueDate','Vencimento',value(title,'due_date')||day),input('forecastDate','Previsão','date',value(title,'forecast_date'),true),note()],
    payload:data=>({...Object.fromEntries(data),direction,titleId:value(title,'id'),expectedVersion:value(title,'version')})}
}
export function externalRefund(lookup:Row,day:string,direction:Direction,settlement:Row):Form {
  return {title:'Registrar devolução externa',action:'C10',description:'Use somente quando a devolução já ocorreu fora do sistema. O título permanece liquidado.',
    fields:[branch(lookup),account(lookup),iso('effectiveDate','Data confirmada',day),input('reference','Identificador da devolução no extrato'),input('amount','Valor devolvido (R$)','money'),note()],
    payload:data=>({...Object.fromEntries(data),direction,settlementId:value(settlement,'settlement_id'),amountCents:amount(data,'amount')})}
}
export function dreForm(lookup:Row,day:string):Form {
  const inputs = pick(lookup,'categories')
  const mappings:Options=[['GROSS_REVENUE','Receita bruta'],['DEDUCTIONS','Deduções'],['COGS','Custos'],['OPERATING_EXPENSE','Despesas operacionais'],['FINANCIAL_RESULT','Resultado financeiro'],['NON_DRE','Fora da DRE']]
  return {title:'Publicar mapeamento gerencial',action:'C16',description:'Associe as categorias que compõem esta versão da DRE.',
    fields:[iso('effectiveFrom','Vigente desde',day),...inputs.map(([id,label])=>select(id,label,mappings,undefined,true))],
    payload:data=>({effectiveFrom:get(data,'effectiveFrom'),lines:inputs.flatMap(([categoryId])=>{
      const dreLine=get(data,categoryId)
      return dreLine?[{categoryId,dreLine}]:[]
    })})}
}
export function originForm(lookup:Row,day:string,sourceAccount=false):Form {
  const eventTypes:Options=[['SALE_REVENUE','Receita da venda'],['SALE_COST','Custo da venda'],['FEE','Tarifas'],['INTEREST','Juros'],['PENALTY','Multas'],['DISCOUNT','Descontos'],['LOSS','Perdas'],['RECOVERY','Recuperações']]
  const origins:Options=[['DRAWER','Caixa físico'],['POS','Pix do PDV'],['EC','Pix de encomendas e comandas']]
  return {title:sourceAccount?'Vincular origem a uma conta':'Classificar evento de origem',action:'C39',
    description:sourceAccount?'A vigência começa após o corte conferido. Configure a conta e a filial comprovadas.':undefined,
    fields:sourceAccount?[branch(lookup),account(lookup),select('origin','Origem',origins),select('methodId','Meio Pix',pick({...lookup,methods:rows(lookup.methods).filter(m=>m.code==='PIX')},'methods'),undefined,true),iso('startsOn','Vigente desde',day)]:
      [select('eventType','Evento',eventTypes),select('categoryId','Categoria',pick(lookup,'categories'))],
    payload:data=>({...Object.fromEntries(data),kind:sourceAccount?'SOURCE_ACCOUNT':'EVENT_CATEGORY'})}
}

export function legacyForm(direction:Direction,entry:Row):Form {
  return {title:'Conferir título legado',action:'C40',
    description:value(entry,'description')+' · '+money(entry.original_cents)+'. Confira a emissão, a competência e se há baixas em outra fonte.',
    fields:[input('issueDate','Emissão comprovada','date'),input('competenceDate','Competência comprovada','date'),note()],
    payload:data=>({...Object.fromEntries(data),direction,legacyId:value(entry,'id'),originalCents:value(entry,'original_cents'),dueDate:value(entry,'due_date')})}
}
export function classificationForm(lookup:Row,direction:Direction,document:Row,estimate=false):Form {
  return {title:estimate?'Confirmar valor da ocorrência':'Reclassificar documento',action:estimate?'C25':'C05',
    fields:[...(estimate?[input('amount','Valor confirmado (R$)','money',decimalBRL(value(document,'nominal_cents')))]:[]),
      select('categoryId','Categoria',pick(lookup,'categories'),undefined,true),select('centerId','Centro de custo',pick(lookup,'centers'),undefined,true),note()],
    payload:data=>{
      const total=estimate?amount(data,'amount'):value(document,'nominal_cents')
      const categoryId=get(data,'categoryId'), centerId=get(data,'centerId')
      if(centerId&&!categoryId)throw Error('CATEGORY_REQUIRED')
      return {direction,documentId:value(document,'id'),expectedVersion:value(document,'version'),reason:get(data,'reason'),
        ...(estimate?{amountCents:total}:{}),classifications:categoryId?[{categoryId,centerId:centerId||null,amountCents:total}]:[]}
    }}
}

export function recoverLoss(day:string,title:Row,event:Row):Form {
  return {title:'Recuperar crédito baixado como perda',action:'C29',description:'Restabelece o saldo de '+money(event.amount_cents)+' para cobrança.',
    fields:[iso('effectiveDate','Data da recuperação',day),note()],
    payload:data=>({...Object.fromEntries(data),direction:'RECEIVE',expectedVersion:value(title,'version'),lossEventId:value(event,'id')})}
}
export function deactivateAccount(lookup:Row,row:Row):Form {
  return {title:'Inativar conta financeira',action:'C13',description:value(row,'name')+'. Os registros existentes continuam disponíveis para consulta.',
    fields:[{...branch(lookup),initial:value(row,'branch_id')}],payload:data=>({accountId:value(row,'id'),branchId:get(data,'branchId')})}
}
