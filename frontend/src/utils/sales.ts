export type CartItem={productId:string;name:string;quantity:number;unitPriceCents:number;listPriceCents:number;costPriceCents:number;weightedProduct:boolean;bundleProduct:boolean;stock:number;allowNegativeStock:boolean}
export type PaymentInput={paymentMethodId:string;amountCents:number;sequence:number;externalReference?:string}

export const cents=(value:string)=>Number(value.replace(/\D/g,''))||0
export const money=(value:number|string)=>new Intl.NumberFormat('pt-BR',{style:'currency',currency:'BRL'}).format(Number(value||0)/100)
export const quantity=(value:number,weighted:boolean)=>weighted?Math.round(value*1000)/1000:Math.trunc(value)
export const lineTotal=(item:Pick<CartItem,'quantity'|'unitPriceCents'>)=>Math.round(item.quantity*item.unitPriceCents)
export const saleTotals=(items:CartItem[],discountCents=0,surchargeCents=0)=>{const subtotalCents=items.reduce((sum,item)=>sum+lineTotal(item),0);return{subtotalCents,discountCents:Math.min(Math.max(0,discountCents),subtotalCents),surchargeCents:Math.max(0,surchargeCents),totalCents:Math.max(0,subtotalCents-Math.min(Math.max(0,discountCents),subtotalCents)+Math.max(0,surchargeCents))}}
export function validateCheckout(items:CartItem[],payments:PaymentInput[],discountCents:number,surchargeCents:number,changeMethodIds:Set<string>){
 if(!items.length)return'Adicione ao menos um produto.'
 if(items.some(item=>item.quantity<=0||(!item.weightedProduct&&!Number.isInteger(item.quantity))))return'Confira as quantidades. Produtos não pesáveis exigem números inteiros.'
 if(items.some(item=>!item.allowNegativeStock&&item.stock<item.quantity&&!item.bundleProduct))return'Há produto sem saldo suficiente nesta filial.'
 const {totalCents}=saleTotals(items,discountCents,surchargeCents),paid=payments.reduce((sum,p)=>sum+p.amountCents,0)
 if(!payments.length||payments.some(p=>!p.paymentMethodId||p.amountCents<=0))return'Informe uma forma e um valor de pagamento válidos.'
 if(paid<totalCents)return`Ainda faltam ${money(totalCents-paid)} para concluir.`
 if(paid>totalCents&&!payments.some(p=>changeMethodIds.has(p.paymentMethodId)))return'Pagamento acima do total só é permitido em uma forma que gere troco.'
 return''
}

export function upsertCart(items:CartItem[],incoming:CartItem){const index=items.findIndex(item=>item.productId===incoming.productId);if(index<0)return[...items,incoming];return items.map((item,i)=>i===index?{...item,quantity:quantity(item.quantity+incoming.quantity,item.weightedProduct)}:item)}

