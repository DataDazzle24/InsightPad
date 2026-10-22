export type StockCostItem={quantity:number;unitGrossCents:number}

export function allocateInvoiceCosts(items:StockCostItem[],extraCents:number){
 const gross=items.reduce((sum,item)=>sum+item.quantity*item.unitGrossCents,0)
 return items.map(item=>{
  if(gross<=0||item.quantity<=0)return item.unitGrossCents
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

export function aggregateFinancialDays<T extends{date:string;volume:number;revenueCents:string;profitCents:string}>(days:T[],group:'day'|'month'|'year'){
 if(group==='day')return days
 const result=new Map<string,T>()
 for(const day of days){
  const key=day.date.slice(0,group==='year'?4:7)
  const current=result.get(key)
  result.set(key,{...day,date:group==='year'?`${key}-01-01`:`${key}-01`,volume:(current?.volume??0)+Number(day.volume),revenueCents:String(Number(current?.revenueCents??0)+Number(day.revenueCents)),profitCents:String(Number(current?.profitCents??0)+Number(day.profitCents))})
 }
 return [...result.values()]
}

export function parseQuantityDraft(value:string,weighted:boolean,allowZero=false){
 const normalized=value.trim().replace(',','.')
 if(!/^\d+(?:\.\d{1,3})?$/.test(normalized))return null
 const quantity=Number(normalized)
 return Number.isFinite(quantity)&&(allowZero?quantity>=0:quantity>0)&&(weighted||Number.isInteger(quantity))?quantity:null
}
export function localDateTimeInput(value=new Date()){
 return new Date(value.getTime()-value.getTimezoneOffset()*60000).toISOString().slice(0,16)
}
export const stockStatusLabel=(status:string)=>({POSTED:'Registrado',REVERSED:'Estornado',PENDING:'Pendente',COMPLETED:'Concluído',CANCELLED:'Cancelado'}[status]??status)

export function stockConfirmed(data:{_execute?:number|null;confirmation?:{receipt?:unknown}|null},operationId:string,kind:string){
 if(typeof data._execute==='number' && Number.isInteger(data._execute) && data._execute>0)return true;
 if(data._execute!==0)return false;
 const r=data.confirmation?.receipt as {confirmed?:boolean;replay?:boolean;operationId?:string;kind?:string}|undefined;
 return r?.confirmed===true && r.replay===true && r.operationId===operationId && r.kind===kind;
}
