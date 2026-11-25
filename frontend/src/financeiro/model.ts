import { z } from 'zod'
import type { FinancePageKey } from '../config/financeRoutes'
import { formatBRL } from './domain'

export type Row = Record<string, unknown>
const row = z.record(z.string(), z.unknown())
export const responseSchema = z.object({
  revision: z.string(),
  position: z.string(),
  rows: z.array(row).optional(),
  accounts: z.array(row).optional(),
  totalCount: z.number().optional(),
}).passthrough()
export type Response = z.infer<typeof responseSchema>
export type View = { id: string; label: string; mode: string; status?: string; collection?: string }
export const views: Record<FinancePageKey, View[]> = {
  FIN_VISAO: [{id:'resumo',label:'Resumo',mode:'OVERVIEW'}],
  CONTAS_PAGAR: [
    {id:'abertas',label:'Abertas',mode:'TITLES',status:'OPEN'},
    {id:'pagas',label:'Pagas',mode:'TITLES',status:'SETTLED'},
    {id:'todas',label:'Todas',mode:'TITLES'},
  ],
  CONTAS_RECEBER: [
    {id:'abertas',label:'Abertas',mode:'TITLES',status:'OPEN'},
    {id:'recebidas',label:'Recebidas',mode:'TITLES',status:'SETTLED'},
    {id:'inadimplencia',label:'Inadimplência',mode:'TITLES',status:'OVERDUE'},
    {id:'crediario',label:'Crediário',mode:'CREDIT'},
  ],
  FIN_CONTAS: [
    {id:'contas',label:'Contas',mode:'ACCOUNTS',collection:'accounts'},
    {id:'extrato',label:'Extrato',mode:'LEDGER'},
    {id:'transferencias',label:'Transferências',mode:'TRANSFERS'},
    {id:'movimentos',label:'Movimentos de caixa e sócios',mode:'OWNER'},
  ],
  FIN_CONCILIACAO: [
    {id:'bancaria',label:'Bancária',mode:'RECONCILIATION'},
    {id:'caixas',label:'Caixas operacionais',mode:'CASH'},
    {id:'pendencias',label:'Pendências',mode:'MATCHES'},
  ],
  FIN_FLUXO: [
    {id:'realizado',label:'Realizado',mode:'ACTUAL'},
    {id:'previsto',label:'Previsto',mode:'FLOW'},
    {id:'cenarios',label:'Cenários',mode:'FLOW'},
  ],
  FIN_RELATORIOS: [
    {id:'dre',label:'DRE gerencial',mode:'DRE'},
    {id:'relatorios',label:'Relatórios',mode:'REPORTS'},
    {id:'fechamentos',label:'Fechamentos',mode:'CLOSURES'},
  ],
  FIN_CONFIGURACOES: [
    {id:'categorias',label:'Categorias',mode:'SETTINGS',collection:'categories'},
    {id:'centros',label:'Centros de custo',mode:'SETTINGS',collection:'centers'},
    {id:'meios',label:'Meios e condições',mode:'SETTINGS',collection:'methods'},
    {id:'recorrencias',label:'Recorrências',mode:'SETTINGS',collection:'recurrences'},
    {id:'politicas',label:'Políticas',mode:'SETTINGS',collection:'ownerNatures'},
  ],
}

export type Column = readonly [key: string, label: string, format?: 'money' | 'date']
export const titleColumns: Column[] = [
  ['description','Título'],['party_name','Contraparte'],['due_date','Vencimento','date'],
  ['original_cents','Valor original','money'],['residual_cents','Saldo','money'],['source_type','Origem'],
]
export const columns: Record<string, Column[]> = {
  TITLES:titleColumns,
  LEGACY:[['description','Título'],['source_type','Origem'],['original_cents','Valor registrado','money'],['due_date','Vencimento','date'],['legacy_status','Situação na origem'],['has_settlement_evidence','Tem indício de baixa']],
  ACCOUNTS:[['name','Conta'],['account_type','Tipo'],['cutoff_date','Corte','date'],['balance_cents','Posição','money'],['balance_scope','Escopo']],
  LEDGER:[['effective_date','Data','date'],['description','Descrição'],['debit_cents','Entrada','money'],['credit_cents','Saída','money'],['amount_cents','Movimento líquido','money']],
  TRANSFERS:[['effective_date','Data','date'],['from_name','Origem'],['to_name','Destino'],['amount_cents','Valor','money'],['fee_cents','Tarifa','money'],['reference','Referência']],
  OWNER:[['effective_date','Data','date'],['beneficiary','Beneficiário'],['nature_name','Natureza'],['direction','Direção'],['amount_cents','Valor','money'],['reason','Motivo']],
  RECONCILIATION:[['booked_date','Data','date'],['description','Descrição'],['amount_cents','Valor','money'],['matched_cents','Conciliado','money'],['possible_duplicate','Possível duplicata']],
  MATCHES:[['created_at','Criado em','date'],['edge_count','Vínculos'],['unmatched','Desconciliado']],
  CASH:[['opened_at','Abertura','date'],['status','Situação'],['calculated_expected_cents','Esperado','money'],['counted_amount_cents','Contado','money'],['difference_cents','Diferença','money']],
  ACTUAL:[['date','Data','date'],['debit_cents','Entradas','money'],['credit_cents','Saídas','money'],['amount_cents','Total líquido','money']],
  FLOW:[['date','Data','date'],['amount_cents','Previsão líquida','money'],['contains_estimate','Inclui estimativa']],
  DRE:[['dre_line','Linha gerencial'],['amount_cents','Valor','money']],
  REPORTS:[['competence_date','Competência','date'],['direction','Direção'],['documents','Documentos'],['nominal_cents','Original','money'],['residual_cents','Saldo','money']],
  CLOSURES:[['period','Competência','date'],['action','Evento'],['revision','Revisão'],['reason','Motivo']],
  CREDIT:[['name','Cliente'],['limit_cents','Limite','money'],['version','Revisão']],
  categories:[['name','Categoria'],['direction','Direção'],['code','Código'],['nature','Natureza'],['active','Ativa']],
  centers:[['name','Centro'],['purpose','Finalidade'],['active','Ativo']],
  methods:[['name','Meio'],['code','Código'],['requiresChange','Exige troco']],
  recurrences:[['description','Título'],['frequency','Frequência'],['anchor_date','Primeiro vencimento','date'],['next_occurrence','Ocorrências'],['active','Ativa'],['estimated','Estimativa']],
  ownerNatures:[['name','Natureza de sócio']],
  terms:[['name','Condição'],['installment_count','Parcelas'],['frequency','Frequência'],['first_offset_days','Dias até o primeiro vencimento']],
}
const labels: Record<string,string> = {
  GLOBAL:'Saldo global', PARTIAL_CONTRIBUTION:'Contribuição parcial', PAY:'A pagar', RECEIVE:'A receber', MANUAL:'Manual',
  CREDIT:'Crediário', OPEN:'Aberto', CLOSED:'Fechado', CLOSE:'Fechamento', REOPEN:'Reabertura',
  SETTLED:'Liquidado', MONTHLY:'Mensal', FORTNIGHTLY:'Quinzenal', WEEKLY:'Semanal', DAILY:'Diária',
  REVENUE:'Receita', EXPENSE:'Despesa', COST:'Custo', NEUTRAL:'Neutra', IN:'Entrada', OUT:'Saída',
  GROSS_REVENUE:'Receita bruta', DEDUCTIONS:'Deduções', COGS:'Custos', OPERATING_EXPENSE:'Despesas operacionais',
  FINANCIAL_RESULT:'Resultado financeiro', BANK:'Banco', TRANSIT:'Em trânsito', WALLET:'Carteira', CASH:'Caixa',
}
export function rows(data: unknown): Row[] {
  const parsed = z.array(row).safeParse(data)
  return parsed.success ? parsed.data : []
}
export function object(data: unknown): Row {
  return row.safeParse(data).data ?? {}
}
export function value(data: Row, key: string): string {
  const field = data[key]
  return typeof field === 'string' || typeof field === 'number' ? String(field) : ''
}
export function money(data: unknown): string {
  try { return typeof data === 'string' ? formatBRL(data) : '—' }
  catch { return '—' }
}
export function display(data: Row,key: string,format?: Column[2]): string {
  const raw = data[key]
  if (format === 'money') return money(raw)
  if (typeof raw === 'boolean') return raw ? 'Sim' : 'Não'
  const text = value(data,key)
  if (!text) return '—'
  if (format === 'date') {
    const date = text.slice(0,10).split('-')
    return date.length === 3 ? date.reverse().join('/') : text
  }
  return labels[text] ?? text
}
export function operationalDate(timezone: string) {
  return new Intl.DateTimeFormat('sv-SE', {timeZone:timezone, year:'numeric', month:'2-digit', day:'2-digit'}).format(new Date())
}
