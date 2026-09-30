import { z } from 'zod'
import type { SaleReceipt } from './receipt'
const text=z.string().nullish().transform(value=>value??undefined)
const cents=z.coerce.number().int().nonnegative().max(Number.MAX_SAFE_INTEGER)
const fields={id:z.string().min(1),date:z.string().min(1),status:z.literal('COMPLETED'),offline:z.literal(false),operator:z.string(),customer:z.string(),subtotalCents:cents,discountCents:cents,surchargeCents:cents,totalCents:cents,changeCents:cents,
 tenant:z.object({legalName:z.string().min(1),tradeName:text,document:text,email:text,phone:text}),
 branch:z.object({name:z.string().min(1),internalCode:text,postalCode:text,stateCode:text,city:text,district:text,street:text,streetNumber:text,addressComplement:text,phone:text}),
 items:z.array(z.object({productId:z.string(),name:z.string(),quantity:z.coerce.number().positive().finite(),unitPriceCents:cents,listPriceCents:cents,costPriceCents:cents,weightedProduct:z.boolean(),bundleProduct:z.boolean(),stock:z.coerce.number(),allowNegativeStock:z.boolean()})).min(1),
 payments:z.array(z.object({paymentMethodId:z.string(),name:z.string(),amountCents:cents,sequence:z.coerce.number().int().positive(),externalReference:text})).min(1)}
const snapshot=z.object({data:z.object(fields)})
export function serverReceipt(value:unknown):SaleReceipt|null {
 const result=snapshot.safeParse(value)
 if(!result.success)return null
 const receipt=result.data.data
 if(receipt.totalCents!==receipt.subtotalCents-receipt.discountCents+receipt.surchargeCents)return null
 return receipt
}
