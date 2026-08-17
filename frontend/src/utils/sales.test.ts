import{describe,expect,it}from'vitest'
import{saleTotals,upsertCart,validateCheckout,type CartItem}from'./sales'
const item:CartItem={productId:'1',name:'Produto',quantity:2,unitPriceCents:1250,listPriceCents:1250,costPriceCents:500,weightedProduct:false,bundleProduct:false,stock:10,allowNegativeStock:false}
describe('sales rules',()=>{it('calculates discount and surcharge in cents',()=>expect(saleTotals([item],500,100)).toEqual({subtotalCents:2500,discountCents:500,surchargeCents:100,totalCents:2100}));it('groups repeated scans',()=>expect(upsertCart([item],{...item,quantity:1})[0].quantity).toBe(3));it('rejects non-cash overpayment',()=>expect(validateCheckout([item],[{paymentMethodId:'pix',amountCents:2600,sequence:1}],0,0,new Set(['cash']))).toContain('troco'));it('accepts cash overpayment',()=>expect(validateCheckout([item],[{paymentMethodId:'cash',amountCents:2600,sequence:1}],0,0,new Set(['cash']))).toBe(''))})

