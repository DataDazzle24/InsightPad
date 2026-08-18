export type StockCostItem={quantity:number;unitGrossCents:number}

export function allocateInvoiceCosts(items:StockCostItem[],extraCents:number){
 const gross=items.reduce((sum,item)=>sum+item.quantity*item.unitGrossCents,0)
 return items.map(item=>{
  if(gross<=0)return item.unitGrossCents
  const share=extraCents*(item.quantity*item.unitGrossCents/gross)
  return Math.max(0,Math.round(item.unitGrossCents+share/item.quantity))
 })
}

export function parseMoney(value:string){
 const digits=value.replace(/\D/g,'')
 return Number(digits||0)
}

export function maskMoney(cents:number){
 return new Intl.NumberFormat('pt-BR',{style:'currency',currency:'BRL'}).format(cents/100)
}

export function aggregateFinancialDays<T extends{date:string;volume:number;revenueCents:string;profitCents:string}>(days:T[],group:'day'|'month'){
 if(group==='day')return days
 const result=new Map<string,T>()
 for(const day of days){
  const key=day.date.slice(0,7)
  const current=result.get(key)
  result.set(key,{...day,date:`${key}-01`,volume:(current?.volume??0)+Number(day.volume),revenueCents:String(Number(current?.revenueCents??0)+Number(day.revenueCents)),profitCents:String(Number(current?.profitCents??0)+Number(day.profitCents))})
 }
 return [...result.values()]
}
