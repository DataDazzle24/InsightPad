import{describe,expect,it}from'vitest'
import{aggregateFinancialDays,allocateInvoiceCosts,parseMoney}from'./stock'
describe('stock and financial helpers',()=>{
 it('allocates invoice costs proportionally',()=>expect(allocateInvoiceCosts([{quantity:2,unitGrossCents:1000},{quantity:1,unitGrossCents:2000}],400)).toEqual([1100,2200]))
 it('keeps costs stable without gross value',()=>expect(allocateInvoiceCosts([{quantity:2,unitGrossCents:0}],500)).toEqual([0]))
 it('parses masked money',()=>expect(parseMoney('R$ 1.234,56')).toBe(123456))
 it('aggregates daily financial values by month',()=>expect(aggregateFinancialDays([{date:'2026-08-01',volume:1,revenueCents:'100',profitCents:'40'},{date:'2026-08-02',volume:2,revenueCents:'200',profitCents:'70'}],'month')[0]).toMatchObject({volume:3,revenueCents:'300',profitCents:'110'}))
})
