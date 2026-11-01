import { createElement } from 'react'
import { expect,it } from 'vitest'
import { aggregateFinancialDays,parseQuantityDraft,localDateTimeInput,allocateInvoiceCosts } from './stock'
import { dashboardCsv,financialCsv,heatmapStyle } from './dashboardExport'
it('annual sums reconcile across a year boundary',()=>{const rows=[{date:'2025-12-31',volume:2,revenueCents:'100',profitCents:'20'},{date:'2026-01-01',volume:1,revenueCents:'50',profitCents:'-10'},{date:'2026-12-30',volume:3,revenueCents:'200',profitCents:'40'}];expect(aggregateFinancialDays(rows,'year')).toEqual([{date:'2025-01-01',volume:2,revenueCents:'100',profitCents:'20'},{date:'2026-01-01',volume:4,revenueCents:'250',profitCents:'30'}])})
it('heatmap remains bounded for zero negatives equal values and outliers',()=>{expect(heatmapStyle(0,[0])).toEqual({});expect(heatmapStyle(-1,[-1,1,100000]).backgroundColor).toContain('230, 136, 30');expect(heatmapStyle(1,[1,1]).backgroundColor).toContain('0.08');expect(heatmapStyle(100000,[1,100000]).backgroundColor).toContain('0.24')})
it('CSV exports every row with readable React labels and formula protection',()=>{const csv=dashboardCsv(['Produto'],[[createElement('strong',null,'=SUM(A1)')],...Array.from({length:501},(_,i)=>[i])]);expect(csv.split('\n')).toHaveLength(503);expect(csv).toContain('"\'=SUM(A1)"');expect(csv).toContain('"500"')})
it('draft quantities preserve commas and reject unit fractions without truncation',()=>{expect(parseQuantityDraft('',true)).toBeNull();expect(parseQuantityDraft('1,5',true)).toBe(1.5);expect(parseQuantityDraft('1,5',false)).toBeNull();expect(parseQuantityDraft('0',false)).toBeNull();expect(parseQuantityDraft('1.0001',true)).toBeNull();expect(parseQuantityDraft('2',false)).toBe(2);expect(allocateInvoiceCosts([{quantity:0,unitGrossCents:100}],50)).toEqual([100]);expect(localDateTimeInput(new Date(2026,9,20,23,30))).toBe('2026-10-20T23:30')})

it('financial CSV declares BRL, converts cents exactly once and preserves the ledger and formula guard',()=>{
 const cents=[0,1,800,1234,100001,-1234];const rows=cents.map(c=>({name:'=FORMULA',category:'+CATEGORY',subcategory:'@SUB',quantity:2,revenueCents:c,providerFeeCents:c,netRevenueCents:c,costCents:c,profitCents:c,marginPercent:0})),before=structuredClone(rows)
 const csv=financialCsv(rows);expect(csv).toContain('Faturamento bruto (R$)');expect(csv).toContain('Margem (%)')
 for(const expected of ['0,00','0,01','8,00','12,34','1000,01',"'-12,34"])expect(csv).toContain('"'+expected+'"')
 for(const expected of ["'=FORMULA","'+CATEGORY","'@SUB"])expect(csv).toContain(expected)
 expect(rows).toEqual(before);expect(csv).not.toContain('"100001"')
})

it('preserves exact contractual bigint cents, including a safe integer whose division loses a cent',()=>{
 const inputs:Array<[string|number,string]>=[['9007199254740991','90071992547409,91'],[9007199254740991,'90071992547409,91'],['9999999999999999','99999999999999,99'],['-9999999999999999',"'-99999999999999,99"],['9223372036854775807','92233720368547758,07'],[0,'0,00'],[1,'0,01'],['99','0,99'],[100,'1,00'],[-1,"'-0,01"]]
 for(const [value,expected]of inputs){const rows=[{name:'=EXACT',category:'+CAT',subcategory:'@SUB',quantity:1,revenueCents:value,providerFeeCents:value,netRevenueCents:value,costCents:value,profitCents:value,marginPercent:0}],before=structuredClone(rows);const line=financialCsv(rows).split('\n')[1]!.split(';');for(const cell of line.slice(4,9))expect(cell).toBe('"'+expected+'"');expect(rows).toEqual(before)}
})
