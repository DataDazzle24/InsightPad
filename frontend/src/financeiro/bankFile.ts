import { civilDate, parseMoney } from './domain'

type BankRow = { date:string; amountCents:string; description:string; externalId?:string }
export type BankFile = { format:'OFX'|'CSV'; rows:BankRow[]; fileHash:string }
const limit = 1000

function csvCells(source: string): string[][] {
  const delimiter = source.slice(0, source.indexOf('\n')).includes(';') ? ';' : ','
  const rows: string[][] = []
  let row: string[] = [], cell = '', quoted = false, endedQuote = false
  const push = () => { row.push(cell.trim()); cell=''; endedQuote=false }
  const line = () => { push(); if (row.some(Boolean)) rows.push(row); row=[] }
  for (let i=0; i<source.length; i++) {
    const c = source[i]
    if (quoted) {
      if (c === '"' && source[i+1] === '"') { cell += '"'; i++; continue }
      if (c === '"') { quoted=false; endedQuote=true; continue }
      cell+=c
    } else if (c === delimiter) push()
    else if (c === '\n' || c === '\r') {
      if (c === '\r' && source[i+1] === '\n') i++
      line()
    } else if (c === '"' && !cell && !endedQuote) quoted=true
    else if (endedQuote || c === '"') throw Error('CSV_QUOTING')
    else cell+=c
    if (rows.length > limit + 1) throw Error('IMPORT_LIMIT')
  }
  if (quoted) throw Error('CSV_QUOTING')
  line()
  return rows
}
export function parseStatement(source: string, format: BankFile['format']): BankRow[] {
  let output: BankRow[]
  if (format === 'CSV') {
    const [header,...body] = csvCells(source.replace(/^\ufeff/,''))
    const normalized = header?.map(s => s.toLowerCase().normalize('NFD').replace(/\p{M}/gu,''))
    const date = normalized?.findIndex(s => ['data','date'].includes(s))
    const amount = normalized?.findIndex(s => ['valor','amount'].includes(s))
    const description = normalized?.findIndex(s => ['descricao','description','historico'].includes(s))
    const id = normalized?.findIndex(s => ['id','fitid','identificador'].includes(s))
    if (date == null || date<0 || amount<0 || description<0) throw Error('CSV_HEADER')
    output = body.map(line => {
      if (line.length !== header.length) throw Error('CSV_COLUMNS')
      let dateText = line[date]
      if (/^\d{2}\/\d{2}\/\d{4}$/.test(dateText)) dateText=dateText.split('/').reverse().join('-')
      return {date:civilDate(dateText),amountCents:parseMoney(line[amount],true),description:line[description],externalId:id>=0 ? line[id] || undefined : undefined}
    })
  } else {
    const get = (input: string, name: string) => new RegExp('<'+name+'>\\s*([^<\\r\\n]+)','i').exec(input)?.[1].trim()
    const currencies = Array.from(source.matchAll(/<CURDEF>\s*([^<\r\n]+)/gi), m=>m[1].trim().toUpperCase())
    if (!currencies.length || currencies.some(c=>c!=='BRL')) throw Error('CURRENCY_NOT_BRL')
    const accounts = Array.from(source.matchAll(/<ACCTID>\s*([^<\r\n]+)/gi), m=>m[1].trim())
    if (new Set(accounts).size > 1) throw Error('MULTIPLE_BANK_ACCOUNTS')
    const transactions = Array.from(source.matchAll(/<STMTTRN\s*>([\s\S]*?)<\/STMTTRN\s*>/gi),m=>m[1])
    if (transactions.length !== Array.from(source.matchAll(/<STMTTRN\s*>/gi)).length) throw Error('OFX_FORMAT')
    output = transactions.map(transaction => {
      const stamp=get(transaction,'DTPOSTED')
      if (!stamp || !/^\d{8}/.test(stamp)) throw Error('INVALID_DATE')
      return {
        date:civilDate(stamp.slice(0,4)+'-'+stamp.slice(4,6)+'-'+stamp.slice(6,8)),
        amountCents:parseMoney(get(transaction,'TRNAMT') ?? '',true),
        description:[get(transaction,'NAME'),get(transaction,'MEMO')].filter(Boolean).join(' · '),
        externalId:get(transaction,'FITID'),
      }
    })
  }
  if (!output.length || output.length>limit) throw Error('IMPORT_LIMIT')
  if (output.some(row => row.amountCents==='0' || row.description.length>1000 || (row.externalId?.length ?? 0)>240)) throw Error('INVALID_BANK_ROW')
  return output
}
export async function readStatement(file: File): Promise<BankFile> {
  const extension=file.name.split('.').at(-1)?.toUpperCase()
  if (extension!=='OFX' && extension!=='CSV') throw Error('STATEMENT_FORMAT')
  if (file.size>512*1024 || !file.size) throw Error('IMPORT_LIMIT')
  const bytes=await file.arrayBuffer()
  let source: string
  try { source=new TextDecoder('utf-8',{fatal:true}).decode(bytes) }
  catch { source=new TextDecoder('windows-1252').decode(bytes) }
  const rows=parseStatement(source,extension)
  const hash=await crypto.subtle.digest('SHA-256',bytes)
  return {format:extension,rows,fileHash:Array.from(new Uint8Array(hash),byte=>byte.toString(16).padStart(2,'0')).join('')}
}
