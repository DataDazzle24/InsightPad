import { describe, expect, it } from 'vitest'
import { escapeReceiptHtml, receiptHtml, type SaleReceipt } from './receipt'

const receipt: SaleReceipt = {id:'operation',tenant:{legalName:'Empresa <Teste>',document:'12345678000199'},branch:{name:'Matriz'},customer:'Cliente',operator:'Operador',items:[{productId:'product-123',name:'Produto <script>alert(1)</script>',quantity:1,unitPriceCents:1000,listPriceCents:1000,costPriceCents:500,weightedProduct:false,bundleProduct:false,stock:1,allowNegativeStock:false}],payments:[{paymentMethodId:'pix',name:'Pix',amountCents:1000,sequence:1}],subtotalCents:1000,discountCents:0,surchargeCents:0,totalCents:1000,changeCents:0,date:'2026-08-23T12:00:00.000Z',offline:false}

describe('sale receipt',()=>{
  it('escapes untrusted registration values',()=>expect(escapeReceiptHtml('<script>')).toBe('&lt;script&gt;'))
  it('identifies itself as a non-fiscal commercial receipt',()=>expect(receiptHtml(receipt)).toContain('Documento auxiliar não fiscal'))
  it('does not inject product markup into the document',()=>expect(receiptHtml(receipt)).not.toContain('<script>alert(1)</script>'))
})
