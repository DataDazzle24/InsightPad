import {describe,expect,it} from 'vitest'
import {serverReceipt} from './serverReceipt'
const data={id:'sale-server',date:'2026-09-30T12:00:00Z',status:'COMPLETED',offline:false,operator:'Operador',customer:'Consumidor final',tenant:{legalName:'Empresa teste'},branch:{name:'Filial teste'},subtotalCents:'1500',discountCents:'0',surchargeCents:'0',totalCents:'1500',changeCents:'500',items:[{productId:'product',name:'Produto',quantity:'1',unitPriceCents:'1500',listPriceCents:'1500',costPriceCents:'500',weightedProduct:false,bundleProduct:false,stock:0,allowNegativeStock:false}],payments:[{paymentMethodId:'cash',name:'Dinheiro',amountCents:'2000',sequence:1,externalReference:null}]}
describe('comprovante confirmado pelo servidor',()=>{
 it('usa preços, troco e identificador oficiais em números',()=>{expect(serverReceipt({data})).toMatchObject({id:'sale-server',totalCents:1500,changeCents:500,items:[{unitPriceCents:1500,quantity:1}]})})
 it('não imprime valores incompletos ou inconsistentes como venda confirmada',()=>{expect(serverReceipt({data:{...data,totalCents:'1400'}})).toBe(null);expect(serverReceipt({data:{...data,status:'CANCELLED'}})).toBe(null);expect(serverReceipt(null)).toBe(null)})
})
