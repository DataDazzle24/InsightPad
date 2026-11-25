import { describe, expect, it } from 'vitest'
import { parseStatement } from './bankFile'

describe('bank statement preview',()=>{
  it('keeps signed CSV amounts, quoted separators and identifiers',()=>{
    expect(parseStatement('Data;Descrição;Valor;ID\r\n25/11/2026;"PIX; recebido";12,55;x\r\n2026-11-26;Tarifa;-1,20;y','CSV')).toEqual([
      {date:'2026-11-25',amountCents:'1255',description:'PIX; recebido',externalId:'x'},
      {date:'2026-11-26',amountCents:'-120',description:'Tarifa',externalId:'y'},
    ])
  })
  it('keeps the posted civil date on OFX 1 and refuses unsupported currencies',()=>{
    const input='<OFX><CURDEF>BRL\n<STMTTRN><DTPOSTED>20261125000100[-3:BRT]<TRNAMT>-9.17<FITID>9<NAME>Tarifa</STMTTRN></OFX>'
    expect(parseStatement(input,'OFX')[0]).toEqual({date:'2026-11-25',amountCents:'-917',description:'Tarifa',externalId:'9'})
    expect(()=>parseStatement(input.replace('BRL','USD'),'OFX')).toThrow('CURRENCY_NOT_BRL')
  })
  it('rejects incomplete rows and invalid values instead of guessing',()=>{
    expect(()=>parseStatement('data,descricao,valor\n2026-11-25,"a,1','CSV')).toThrow('CSV_QUOTING')
    expect(()=>parseStatement('data;descricao;valor\n2026-02-30;A;1','CSV')).toThrow()
  })
})
