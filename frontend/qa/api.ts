import {isValidCpf,isValidCnpj,normalizeCatalogName} from '../src/utils/registration'
// Deterministic, memory-only fixtures. This module never imports Firebase or fetch.
type Row=Record<string,unknown>
export const connectorConfig={connector:'qa-only',service:'fixture',location:'local'}
export const firebaseApp={},auth={currentUser:null},appCheck=null
export const getDataConnect=()=>({qa:true}),getFunctions=()=>({qa:true})
export const currentSessionToken=()=> '0'.repeat(64)
export const sessionKey=(uid:string)=>'qa.session:'+uid
export const qaState={fail:false,delay:0,ackLoss:false,logs:[] as string[],unsupported:[] as string[],permissions:'full',empty:false,allowedBranches:[] as string[],cashAckLoss:false,requests:[] as {name:string;variables:unknown}[]}
export const uuid=(n:number)=>`00000000-0000-4000-8000-${String(n).padStart(12,'0')}`
const immutable=<T>(value:T):T=>{if(value&&typeof value==='object'){Object.values(value).forEach(immutable);Object.freeze(value)}return value}
export const fixtureDate=new Date().toISOString().slice(0,10)
const when=fixtureDate+'T12:00:00Z'
const fixtureQuantity=(i:number)=>i%7===0?i/7:20+(i+4)%5
const fixtureCost=(i:number)=>String([0,800,1075,1499,1,1234,100001][i%7])
const initialBranches=()=>[{id:uuid(1),name:'MATRIZ QA'},{id:uuid(2),name:'FILIAL QA'}]
export const branches=initialBranches()
const components=new Map<string,Row[]>()
const initialProducts=()=>Array.from({length:65},(_,i)=>({id:uuid(100+i),name:`PRODUTO QA ${String(i+1).padStart(3,'0')}`,internalCode:`QA${i+1}`,ean:`789000000${String(i).padStart(4,'0')}`,categoryId:uuid(300),subcategoryId:uuid(800),categoryName:'CATEGORIA QA 001',subcategoryName:'SUBCATEGORIA QA 001',minimumStock:5,maximumStock:30,allowNegativeStock:false,bundleProduct:false,weightedProduct:i%3===0,costPriceCents:fixtureCost(i),salePriceCents:'1200',unit:'UN',active:true,createdAt:when,updatedAt:when,balances:branches.map(b=>({branchId:b.id,branchName:b.name,quantity:fixtureQuantity(i),reservedQuantity:0,availableQuantity:fixtureQuantity(i),averageCostCents:fixtureCost(i)}))}))
export let products=initialProducts()
let categories:Row[],subcategories:Row[],movements:Row[],transfers:Row[],sessions:Row[],cashMovements:Row[],sales:Row[]
let ledger:Readonly<Row>[]=[]
let customers:Row[],suppliers:Row[],promotions:Row[]
let nextId=13000,policy:Row
const mutations=new Map<string,{hash:string;data:unknown}>()
const receipts=new Map<string,{hash:string;kind:string}>()
export function resetFixtures(){
 branches.splice(0,branches.length,...initialBranches());components.clear();products=initialProducts();
 ledger=products.map((p,i)=>{const quantity=i%9+1,revenueCents=quantity*Number(p.salePriceCents),providerFeeCents=Math.round(revenueCents*.05),costCents=quantity*Number(p.costPriceCents),netRevenueCents=revenueCents-providerFeeCents,grossProfitCents=revenueCents-costCents,profitCents=netRevenueCents-costCents;return immutable({...structuredClone(p),category:p.categoryName,subcategory:p.subcategoryName,branchId:branches[i%2]!.id,saleId:'qa-ledger-'+i,source:i%2?'IFOOD':'POS',supplierId:uuid(20),date:fixtureDate,quantity,revenueCents,providerFeeCents,netRevenueCents,costCents,grossProfitCents,profitCents,marginPercent:revenueCents?profitCents/revenueCents*100:0,lineCount:1})});
 customers=Array.from({length:101},(_,i)=>({id:uuid(4000+i),name:`PESSOA FICTÍCIA QA ${i}`,active:true,createdAt:when,updatedAt:when}));
 suppliers=Array.from({length:101},(_,i)=>({id:uuid(4000+i),name:`FORNECEDOR FICTÍCIO QA ${i+1}`,legalName:`FORNECEDOR FICTÍCIO QA ${i+1}`,tradeName:`FORNECEDOR QA ${i+1}`,active:true,createdAt:when,updatedAt:when}));promotions=[];
 nextId=13000;mutations.clear();cashMovements=[];sales=[]
 sessions=[{id:uuid(60),branchId:uuid(1),status:'OPEN',openedAt:when,openingAmountCents:'10000',expectedAmountCents:'10000',movementCount:0}]
 policy={requireOpenSession:true,operatorDiscountPercent:5,operatorSurchargePercent:5,allowOperatorClose:true,operatorWithdrawalLimitCents:100000,operatorCloseDifferenceLimitCents:100000}
 categories=Array.from({length:300},(_,i)=>({id:uuid(300+i),name:`CATEGORIA QA ${String(i+1).padStart(3,'0')}`,active:i%11!==10,createdAt:when,updatedAt:when}))
 subcategories=Array.from({length:300},(_,i)=>({id:uuid(800+i),name:`SUBCATEGORIA QA ${String(i+1).padStart(3,'0')}`,categoryId:uuid(300+i%10),categoryName:`CATEGORIA QA ${String(i%10+1).padStart(3,'0')}`,active:i%11!==10,createdAt:when,updatedAt:when}))
 movements=Array.from({length:501},(_,i)=>({id:uuid(2000+i),operationId:'qa-movement-'+i,occurredAt:when,quantity:i%5+1,unitCostCents:products[i%products.length]!.costPriceCents,status:i%13===0?'REVERSED':'POSTED',typeCode:i%2?'LOSS':'MANUAL_IN',typeName:i%2?'Perda':'Entrada',direction:i%2?'OUT':'IN',productId:products[i%products.length]!.id,productName:products[i%products.length]!.name,branchId:branches[i%2]!.id,branchName:branches[i%2]!.name}))
 transfers=Array.from({length:201},(_,i)=>({id:uuid(3000+i),operationId:'qa-transfer-'+i,status:'COMPLETED',requestedAt:when,sourceBranchId:branches[0]!.id,destinationBranchId:branches[1]!.id,sourceBranch:branches[0]!.name,destinationBranch:branches[1]!.name,totalQuantity:i%5+1,itemCount:1}))
 receipts.clear();qaState.logs=[];qaState.unsupported=[];qaState.requests=[]
}
resetFixtures()
const result=(data:unknown)=>({data:{_select:[{data:structuredClone(data)}]}})
const page=(rows:Row[],v:Row)=>{
 let selected=rows.filter(r=>!v.search||String(r.name).toLowerCase().includes(String(v.search).toLowerCase()))
 const filters=(v.filters??{}) as Record<string,unknown[]>
 for(const [k,values] of Object.entries(filters)){
  if(Array.isArray(values)&&values.length)selected=selected.filter(r=>values.map(String).includes(k==='productPresence'?(Number(r.productCount)>0?'with':'without'):k==='subcategoryPresence'?(Number(r.subcategoryCount)>0?'with':'without'):String(r[k])))
  if(k.endsWith('From'))selected=selected.filter(r=>String(r[k.slice(0,-4)])>=String(values));
  if(k.endsWith('To'))selected=selected.filter(r=>String(r[k.slice(0,-2)])<=String(values));
 }
 if(v.categoryId)selected=selected.filter(r=>r.categoryId===v.categoryId)
 if(v.sortField){const sign=v.sortDirection==='desc'?-1:1;selected=[...selected].sort((a,b)=>sign*String(a[String(v.sortField)]??'').localeCompare(String(b[String(v.sortField)]??''),'pt-BR',{numeric:true}))}
 return {data:{_select:structuredClone(selected.slice(Number(v.offset??0),Number(v.offset??0)+Number(v.limit??100))),_selectFirst:{totalCount:selected.length}}}
}
const branchAllowed=(id:unknown)=>branches.some(b=>b.id===id)&&(!qaState.allowedBranches.length||qaState.allowedBranches.includes(String(id)))
const integer=(value:unknown)=>{const n=Number(value);if(!Number.isSafeInteger(n)||n<0)throw Error('QA: valor monetário inválido');return n}
const sorted=(rows:Row[],v:Row,date:string)=>[...rows].sort((a,b)=>{
 const field=String(v.sortField??date),numeric=['quantity','totalQuantity','unitCostCents','itemCount'].includes(field),sign=v.sortDirection==='asc'?1:-1;
 const order=numeric?Number(a[field]??0)-Number(b[field]??0):String(a[field]??'').localeCompare(String(b[field]??''),'pt-BR',{numeric:true});return sign*order||String(a.id).localeCompare(String(b.id))
})
const stockWorkspace=(v:Row)=>{
 const f=(v.filters??{}) as Row,has=(key:string,value:unknown)=>!Array.isArray(f[key])||!(f[key] as unknown[]).length||(f[key] as unknown[]).includes(value);
 const text=String(f.search??'').toLocaleLowerCase('pt-BR');
 const date=(value:unknown)=>(!f.from||Date.parse(String(value))>=Date.parse(String(f.from)))&&(!f.to||Date.parse(String(value))<=Date.parse(String(f.to)));
 const ms=(qaState.empty?[]:movements).filter(m=>branchAllowed(m.branchId)&&has('branches',m.branchId)&&has('types',m.typeCode)&&has('products',m.productId)&&date(m.occurredAt)&&[m.productName,m.branchName,m.typeName,m.operationId].join(' ').toLocaleLowerCase('pt-BR').includes(text));
 const ts=(qaState.empty?[]:transfers).filter(t=>branchAllowed(t.sourceBranchId)&&branchAllowed(t.destinationBranchId)&&(has('branches',t.sourceBranchId)||has('branches',t.destinationBranchId))&&date(t.requestedAt)&&[t.sourceBranch,t.destinationBranch,t.operationId].join(' ').toLocaleLowerCase('pt-BR').includes(text));
 const offset=Math.max(0,Number(v.offset??0)),limit=Math.min(1000,Math.max(1,Number(v.limit??100)));
 return {branches:branches.filter(b=>branchAllowed(b.id)),suppliers:[{id:uuid(20),name:'FORNECEDOR QA'}],products:qaState.empty?[]:products.map(p=>({...p,balances:p.balances.filter(b=>branchAllowed(b.branchId))})),movements:sorted(ms,v,'occurredAt').slice(offset,offset+limit),transfers:sorted(ts,v,'requestedAt').slice(offset,offset+limit),movementCount:ms.length,transferCount:ts.length}
}
// QA-only analytical ledgers. Cards, tables and exports derive from the same rows.
const inPeriod=(date:unknown,v:Row)=>(!v.from||String(date).slice(0,10)>=String(v.from))&&(!v.to||String(date).slice(0,10)<=String(v.to))
const sum=(rows:Row[],key:string)=>rows.reduce((n,r)=>n+Number(r[key]??0),0)
// Fixed boundary fixture: does not change the normal mass or product contracts.
export function useBoundaryLedger(){
 const specs=[['2025-12-31',0,0,0],['2026-01-01',1,1,0],['2026-01-31',2,800,900],['2026-02-01',3,1234,1234],['2026-02-28',4,100001,1],['2026-03-01',5,800,900]] as const
 ledger=specs.map(([date,i,revenueCents,costCents])=>immutable({...structuredClone(products[i]!),category:'CATEGORIA QA 001',subcategory:'SUBCATEGORIA QA 001',saleId:'boundary-'+i,source:i%2?'IFOOD':'POS',supplierId:uuid(20),branchId:branches[i%2]!.id,date,quantity:1,revenueCents,providerFeeCents:0,netRevenueCents:revenueCents,costCents,grossProfitCents:revenueCents-costCents,profitCents:revenueCents-costCents,marginPercent:revenueCents?(revenueCents-costCents)/revenueCents*100:0,lineCount:1}))
}
// Separate interactive flow profile: opening ledger and balances reconcile by ID.
export function useFlowFixtures(){
 resetFixtures();const product=products.find(p=>p.id===uuid(101))!;products=[product]
 product.balances.forEach((b,i)=>{b.quantity=i===0?10:0;b.availableQuantity=b.quantity;b.reservedQuantity=0})
 movements=[{id:uuid(1999),operationId:'qa-flow-opening',occurredAt:when,quantity:10,unitCostCents:product.costPriceCents,status:'POSTED',typeCode:'MANUAL_IN',typeName:'Entrada inicial QA',direction:'IN',productId:product.id,productName:product.name,branchId:uuid(1),branchName:branches[0]!.name}];transfers=[];ledger=[]
}
const analyticalRows=(v:Row,period=true)=>{
 const f=(v.filters??{}) as Row,keys:Record<string,string>={products:'id',categories:'categoryId',subcategories:'subcategoryId',branches:'branchId',suppliers:'supplierId',sources:'source'}
 return (qaState.empty?[]:ledger).filter(r=>(!period||inPeriod(r.date,v))&&branchAllowed(r.branchId)&&Object.entries(keys).every(([key,field])=>!Array.isArray(f[key])||!(f[key] as unknown[]).length||(f[key] as unknown[]).includes(r[field])))
}
const financialCards=(rows:Readonly<Row>[])=>{
 const revenueCents=sum(rows,'revenueCents'),profitCents=sum(rows,'profitCents'),volume=new Set(rows.map(r=>r.saleId)).size
 return {volume,revenueCents,providerFeeCents:sum(rows,'providerFeeCents'),netRevenueCents:sum(rows,'netRevenueCents'),costCents:sum(rows,'costCents'),grossProfitCents:sum(rows,'grossProfitCents'),profitCents,marginPercent:revenueCents?profitCents/revenueCents*100:0,ticketCents:volume?Math.round(revenueCents/volume):0,financialPendingSales:0}
}
function financialFixture(v:Row){
 const rows=analyticalRows(v),cards=financialCards(rows)
 const days=[...new Set(rows.map(r=>String(r.date)))].sort(),daily=days.map(date=>({date,...financialCards(rows.filter(r=>r.date===date))}))
 const historical=analyticalRows(v,false).filter(r=>String(r.date).slice(0,7)<String(v.to??fixtureDate).slice(0,7)),months=[...new Set(historical.map(r=>String(r.date).slice(0,7)))].sort().slice(-12),closed=months.map(month=>financialCards(historical.filter(r=>String(r.date).startsWith(month))))
 const last=closed.at(-1),averageVolume=closed.length?sum(closed,'volume')/closed.length:0,averageProfitCents=closed.length?Math.round(sum(closed,'profitCents')/closed.length):0,lastVolume=last?.volume??0,lastProfitCents=last?.profitCents??0
 const productRows:Row[]=[...new Set(rows.map(r=>r.id))].map(id=>{const own=rows.filter(r=>r.id===id),totals=financialCards(own);return {...own[0],...totals,quantity:sum(own,'quantity'),lineCount:own.length}})
 return {options:{branches:branches.filter(b=>branchAllowed(b.id)),products,categories,subcategories,suppliers:[{id:uuid(20),name:'FORNECEDOR QA'}],sources:[{id:'POS',name:'Balcão / PDV'},{id:'IFOOD',name:'iFood'}]},cards,monthly:{lastVolume,averageVolume,volumeGrowth:averageVolume?(lastVolume-averageVolume)/averageVolume*100:0,lastProfitCents,averageProfitCents,profitGrowth:averageProfitCents?(lastProfitCents-averageProfitCents)/averageProfitCents*100:0,months:closed.length},daily,products:productRows}
}
function operationalFixture(v:Row){
 const filters=(v.filters??{}) as Row
 const ms=(qaState.empty?[]:movements).filter(m=>m.status==='POSTED'&&branchAllowed(m.branchId)&&inPeriod(m.occurredAt,v)&&(!Array.isArray(filters.branches)||!filters.branches.length||filters.branches.includes(m.branchId)))
 const rows=(qaState.empty?[]:products).map(p=>{const own=ms.filter(m=>m.productId===p.id),ins=own.filter(m=>m.direction==='IN'),outs=own.filter(m=>m.direction==='OUT');return {...p,inQuantity:sum(ins,'quantity'),outQuantity:sum(outs,'quantity'),netQuantity:sum(ins,'quantity')-sum(outs,'quantity'),valueCents:own.reduce((n,m)=>n+(m.direction==='IN'?1:-1)*Number(m.quantity)*Number(m.unitCostCents),0)}})
 const ins=ms.filter(m=>m.direction==='IN'),sale=ms.filter(m=>m.typeCode==='SALE'),loss=ms.filter(m=>m.typeCode==='LOSS'),value=(xs:Row[])=>xs.reduce((n,m)=>n+Number(m.quantity)*Number(m.unitCostCents),0)
 const stockCards={inboundQuantity:sum(ins,'quantity'),inboundValueCents:value(ins),freightCents:0,extraCostsCents:0,saleQuantity:sum(sale,'quantity'),saleCostCents:value(sale),saleProfitCents:0,lossQuantity:sum(loss,'quantity'),lossValueCents:value(loss)}
 const activePeriod=inPeriod(fixtureDate,v),financial=financialFixture(v),fp=financial.products
 const dormant=activePeriod&&!qaState.empty?Array.from({length:1201},(_,i)=>({id:uuid(6000+i),name:`SEM COMPRAR QA ${i+1}`,lastPurchase:null,revenueCents:0})):[]
 const abc=activePeriod?fp.map((p,i)=>({id:uuid(9000+i),name:`CLIENTE ATIVO QA ${i+1}`,class:i<10?'A':'B',purchases:1,revenueCents:p.revenueCents,lastPurchase:fixtureDate})):[]
 const birthdays=activePeriod?abc.slice(0,51).map((p,i)=>({id:p.id,name:`ANIVERSARIANTE QA ${i+1}`,birthDate:'2000-'+fixtureDate.slice(5)})):[]
 const group=(list:Row[],level:string,key:string)=>(qaState.empty?[]:list).map(c=>{const selected=fp.filter(p=>p[key]===c.id),revenueCents=sum(selected,'revenueCents'),costCents=sum(selected,'costCents');return {...c,level,quantity:sum(selected,'quantity'),revenueCents,costCents,profitCents:revenueCents-costCents,marginPercent:revenueCents?(revenueCents-costCents)/revenueCents*100:0,growthPercent:0}})
 const categoryRows=[...group(categories,'Categoria','categoryId'),...group(subcategories,'Subcategoria','subcategoryId')]

 return {stock:{cards:stockCards,monthly:ms.length?[{date:fixtureDate,...stockCards}]:[],products:rows},customers:{cards:{active:abc.length+dormant.length,new:abc.length,withoutPurchase:dormant.length,ticketCents:abc.length?Math.round(sum(abc,'revenueCents')/abc.length):0,frequency:abc.length?1:0},abc,regions:abc.length?[{region:'REGIÃO SINTÉTICA QA',customers:abc.length+dormant.length,revenueCents:sum(abc,'revenueCents')}]:[],birthdays,dormant},categories:categoryRows}
}
const posProducts=(branchId:unknown)=>products.filter(p=>p.active).map(p=>({...p,listPriceCents:String(p.salePriceCents),effectivePriceCents:String(p.salePriceCents),stock:p.balances.find(b=>b.branchId===branchId)?.availableQuantity??0,stockByBranches:p.balances.filter(b=>branchAllowed(b.branchId)).map(b=>({branchId:b.branchId,branchName:b.branchName,quantity:b.availableQuantity}))}))
const cashSession=(branchId:unknown)=>sessions.find(x=>x.status==='OPEN'&&x.branchId===branchId)??null
const mutateOnce=(name:string,key:unknown,payload:unknown,apply:()=>unknown)=>{
 if(!key)throw Error('QA: identificador de operação obrigatório');const id=name+':'+key,hash=JSON.stringify(payload),old=mutations.get(id);
 if(old){if(old.hash!==hash)throw Error('QA: conteúdo conflitante');return structuredClone(old.data)}
 const data=apply();mutations.set(id,{hash,data:structuredClone(data)});return data
}
export async function qaOperation(name:string,variables:unknown={}){
 const v=(variables??{}) as Row,p=(name==='SavePromotion'?v:v.payload??{}) as Row
 qaState.requests.push({name,variables:structuredClone(v)});qaState.requests=qaState.requests.slice(-200);
 qaState.logs.push(name);qaState.logs=qaState.logs.slice(-40)
 if(qaState.delay)await new Promise(r=>setTimeout(r,qaState.delay))
 if(qaState.fail)throw new Error('QA: falha sintética de API')
 const writing=/^(Cancel|Save|Create|Update|Set|Archive|Restore|Open|Close|Register|Post|Reverse|Ensure)/.test(name)
 if(qaState.permissions==='denied'||writing&&qaState.permissions==='read')throw Error('QA: permissão negada')
 const box=(value:unknown)=>result(value)
 switch(name){
 case 'ListCategories':return page(qaState.empty?[]:categories.map(c=>({...c,productCount:products.filter(p=>p.categoryId===c.id).length,subcategoryCount:subcategories.filter(p=>p.categoryId===c.id).length})),v)
 case 'ListSubcategories':return page(qaState.empty?[]:subcategories.map(c=>({...c,productCount:products.filter(p=>p.subcategoryId===c.id).length})),v)
 case 'CategoryOptions':return {data:{_select:categories.filter(c=>c.active)}}
 case 'RegistrationOptions':return box({branches,categories,subcategories,suppliers:[{id:uuid(20),name:'FORNECEDOR QA'}],products,paymentMethods:[],options:{}})
 case 'ListProducts':return page(qaState.empty?[]:products.map(p=>({...p,effectivePriceCents:p.salePriceCents,listPriceCents:p.salePriceCents})),v)
 case 'ListBranches':return page(qaState.empty?[]:branches.map(b=>({active:true,createdAt:when,updatedAt:when,...b})),v)
 case 'ListSuppliers':return page(qaState.empty?[]:suppliers,v)
 case 'ListCustomers':return page(qaState.empty?[]:customers,v)
 case 'ProductPromotions':return {data:{_select:structuredClone(promotions.filter(p=>p.productId===v.productId).map(p=>({...p,promotionalPriceCents:String(p.promotionalPriceCents),status:!p.active?'INACTIVE':String(p.startsAt)>new Date().toISOString()?'SCHEDULED':String(p.endsAt)<new Date().toISOString()?'ENDED':'ACTIVE'})))}}
 case 'SaveCustomer':case 'SaveSupplier':case 'SaveBranch':case 'SavePromotion':{
  const list=name==='SaveCustomer'?customers:name==='SaveSupplier'?suppliers:name==='SaveBranch'?branches:promotions;
  const old=v.id?list.find(x=>x.id===v.id):undefined;if(v.id&&!old)throw Error('QA: registro inexistente');
  const label=String(name==='SaveSupplier'?p.legalName??'':p.name??'').trim(),cpf=String(p.cpf??'').replace(/\D/g,''),cnpj=String(p.cnpj??'').replace(/\D/g,'');
  if(name!=='SavePromotion'&&label.length<2)throw Error('QA: nome obrigatório');
  if((cpf&&cnpj)||(cpf&&!isValidCpf(cpf))||(cnpj&&!isValidCnpj(cnpj)))throw Error('QA: documento inválido');
  if(list.some(x=>x.id!==v.id&&(x as Row).active!==false&&(name==='SaveBranch'?(String(x.name).trim().toUpperCase()===label.toUpperCase()||p.internalCode&&(x as Row).internalCode===p.internalCode):((cpf&&(x as Row).cpf===cpf)||(cnpj&&(x as Row).cnpj===cnpj)))))throw Error('QA: registro duplicado');
  if(name==='SavePromotion'){const amount=integer(p.promotionalPriceCents),product=products.find(x=>x.id===p.productId&&x.active);if(!product||amount<=0||amount*100>=Number(product.salePriceCents)*95||!Number.isFinite(Date.parse(String(p.startsAt)))||!Number.isFinite(Date.parse(String(p.endsAt)))||Date.parse(String(p.endsAt))<=Date.parse(String(p.startsAt))||promotions.some(x=>x.id!==v.id&&x.active&&x.productId===p.productId&&Date.parse(String(x.startsAt))<Date.parse(String(p.endsAt))&&Date.parse(String(x.endsAt))>Date.parse(String(p.startsAt))))throw Error('QA: promoção inválida')}
  const row={...p,cpf,cnpj,id:String(old?.id??uuid(nextId++)),name:label,active:p.active??true,createdAt:(old as Row|undefined)?.createdAt??when,updatedAt:when};
  if(old)Object.assign(old,row);else list.push(row);return {data:{_execute:1}}
 }
 case 'SetCustomersStatusBatch':case 'SetSuppliersStatusBatch':case 'SetBranchesStatusBatch':case 'SetPromotionStatus':{
  const list=name==='SetCustomersStatusBatch'?customers:name==='SetSuppliersStatusBatch'?suppliers:name==='SetBranchesStatusBatch'?branches:promotions,ids=(v.ids??[v.id]) as string[];
  if(typeof v.active!=='boolean'||!ids.length||ids.some(id=>!list.some(x=>x.id===id)))throw Error('QA: estado ou registros inválidos');
  for(const row of list)if(ids.includes(row.id as string))Object.assign(row,{active:v.active});return {data:{_execute:ids.length}}
 }
 case 'ProductComponents':return {data:{_select:structuredClone(components.get(String(v.productId))??[])}}
 case 'PendingPosApprovals':return {data:{_select:[]}}
 case 'StockWorkspace':return box(stockWorkspace(v))
 case 'SaveStockBatch':case 'PostStockTransfer':{
  if(p.replacesOperationId||p.fiscalEnabled)throw Error('QA: correção/fiscal ainda sem fixture')
  const key=String(p.clientOperationId),hash=JSON.stringify(p),kind=name==='SaveStockBatch'?'STOCK_BATCH':'STOCK_TRANSFER',old=receipts.get(key)
  if(old&&(old.hash!==hash||old.kind!==kind))throw new Error('STOCK_NOT_CONFIRMED')
  if(!old){
   const lines=p.items as Row[];if(!Array.isArray(lines)||!lines.length)throw Error('QA: itens obrigatórios');
   const source=name==='SaveStockBatch'?p.branchId:p.sourceBranchId,destination=p.destinationBranchId;
   if(!branchAllowed(source)||name==='PostStockTransfer'&&(!branchAllowed(destination)||source===destination))throw Error('QA: filial inválida');
   if(name==='SaveStockBatch'&&!['IN','OUT'].includes(String(p.direction)))throw Error('QA: direção inválida');
   const prepared=lines.map(line=>{const product=products.find(x=>x.id===line.product_id&&x.active),quantity=Number(line.quantity);if(!product||!Number.isFinite(quantity)||quantity<=0||!product.weightedProduct&&!Number.isInteger(quantity))throw Error('QA: item inválido');const balance=product.balances.find(b=>b.branchId===source)!;if((name==='PostStockTransfer'||p.direction==='OUT')&&!product.allowNegativeStock&&balance.availableQuantity<quantity)throw Error('QA: saldo insuficiente');return {product,balance,quantity}});
   if(new Set(prepared.map(x=>x.product.id)).size!==prepared.length)throw Error('QA: item duplicado');
   for(const {product,balance,quantity}of prepared){const direction=name==='PostStockTransfer'?'OUT':String(p.direction),sign=direction==='IN'?1:-1;balance.quantity+=sign*quantity;balance.availableQuantity+=sign*quantity;if(name==='PostStockTransfer'){const target=product.balances.find(b=>b.branchId===destination)!;target.quantity+=quantity;target.availableQuantity+=quantity;movements.unshift({id:uuid(nextId++),operationId:key,occurredAt:p.occurredAt??when,quantity,unitCostCents:product.costPriceCents,status:'POSTED',typeCode:'TRANSFER_IN',direction:'IN',productId:product.id,productName:product.name,branchId:destination,branchName:branches.find(b=>b.id===destination)!.name})}
    movements.unshift({id:uuid(nextId++),operationId:key,occurredAt:p.occurredAt??when,quantity,unitCostCents:product.costPriceCents,status:'POSTED',typeCode:name==='PostStockTransfer'?'TRANSFER_OUT':direction==='IN'?'MANUAL_IN':'LOSS',typeName:name==='PostStockTransfer'?'Transferência':direction==='IN'?'Entrada':'Perda',direction,productId:product.id,productName:product.name,branchId:source,branchName:branches.find(b=>b.id===source)!.name})
   }
   if(name==='PostStockTransfer')transfers.unshift({id:uuid(nextId++),operationId:key,status:'COMPLETED',requestedAt:when,sourceBranchId:source,destinationBranchId:destination,sourceBranch:branches.find(b=>b.id===source)!.name,destinationBranch:branches.find(b=>b.id===destination)!.name,totalQuantity:prepared.reduce((n,x)=>n+x.quantity,0),itemCount:prepared.length});receipts.set(key,{hash,kind})
  }
  if(qaState.ackLoss&&!old)throw new Error('QA: confirmação perdida após persistência sintética')
  return {data:{_execute:old?0:1,confirmation:{receipt:{confirmed:true,replay:!!old,operationId:key,kind}}}}
 }
 // Mirrors ReverseStockOperation eligibility. No invented reservation/fiscal endpoint.
 case 'ReverseStockOperation':{
  const ids=(v.movementIds??[]) as string[];if(!Array.isArray(ids)||new Set(ids).size!==ids.length||String(v.reason??'').trim().length<5)throw Error('QA: estorno inválido')
  const rows=movements.filter(m=>ids.length?ids.includes(String(m.id)):v.operationId&&m.operationId===v.operationId)
  if(!rows.length||ids.length&&rows.length!==ids.length||rows.some(m=>m.status!=='POSTED'||m.typeCode==='SALE'||m.typeCode==='SALE_REVERSAL'||!branchAllowed(m.branchId)||ids.length&&String(m.typeCode).startsWith('TRANSFER'))||ids.length&&new Set(rows.map(m=>m.branchId)).size!==1)throw Error('QA: estorno não elegível')
  for(const m of rows){const balance=products.find(p=>p.id===m.productId)!.balances.find(b=>b.branchId===m.branchId)!;const delta=(m.direction==='OUT'?1:-1)*Number(m.quantity);balance.quantity+=delta;balance.availableQuantity+=delta;m.status='REVERSED'}
  for(const t of transfers)if(t.operationId===v.operationId&&!movements.some(m=>m.operationId===t.operationId&&m.status==='POSTED'))t.status='CANCELLED'
  return {data:{_execute:1}}
 }
 case 'StockOperationDetails':return box({movements:movements.filter(m=>m.operationId===v.operationId&&branchAllowed(m.branchId)),fiscalDocument:null})
 case 'FinancialIndicatorsDashboard':return box(financialFixture(v))
 case 'OperationalAnalyticsDashboard':return box(operationalFixture(v))
 case 'SalesChannelAnalyticsDashboard':{
  const filter=(v.filters??v) as Row,rows=analyticalRows(v).filter(r=>r.source==='IFOOD'&&(!filter.branchId||r.branchId===filter.branchId)&&(!filter.connectionId||filter.connectionId===uuid(70)))
  const metrics=(rows:Readonly<Row>[])=>{const c=financialCards(rows);return {...c,orders:c.volume,sales:c.volume,cancelledOrders:0,grossRevenueCents:c.revenueCents,customerPaidCents:c.revenueCents,partnerSubsidyCents:0,merchantDiscountCents:0,financialAdjustmentsCents:0,averageTicketCents:c.ticketCents}}
  return box({options:{branches:branches.filter(b=>branchAllowed(b.id)),connections:[{id:uuid(70),name:'CANAL FICTÍCIO QA'}]},cards:metrics(rows),daily:[...new Set(rows.map(r=>r.date))].sort().map(date=>({date,...metrics(rows.filter(r=>r.date===date))})),byChannel:rows.length?[{id:uuid(70),name:'CANAL FICTÍCIO QA',...metrics(rows)}]:[],fees:rows.length?[{name:'TAXA SINTÉTICA',entries:rows.length,amountCents:sum(rows,'providerFeeCents')}]:[],payments:rows.length?[{method:'PAGAMENTO SINTÉTICO',orders:rows.length,amountCents:sum(rows,'revenueCents')}]:[],topProducts:rows})
 }
 case 'SalesWorkspace':return box({tenant:{legalName:'EMPRESA FICTÍCIA QA',tradeName:'QA'},branches:branches.filter(b=>branchAllowed(b.id)),customers:[],products:posProducts(v.branchId??branches[0]!.id),paymentMethods:[{id:uuid(50),name:'DINHEIRO',code:'CASH',requiresChange:true}],policy,openSession:cashSession(v.branchId??branches[0]!.id)})
 case 'SearchPosProducts':return {data:{_select:qaState.empty?[]:posProducts(v.branchId).filter(x=>!v.search||[x.name,x.ean,x.internalCode].join(' ').toUpperCase().includes(String(v.search).toUpperCase())).slice(Number(v.offset??0),Number(v.offset??0)+Number(v.limit??30))}}
 case 'SearchPosCustomers':return {data:{_select:[]}}
 case 'PosProductBranches':return {data:{_select:products.find(p=>p.id===v.productId)?.balances.filter(b=>branchAllowed(b.branchId)).map(b=>({...b,availableStock:b.availableQuantity}))??[]}}
 case 'SaveProduct':{
  if(!String(p.name??'').trim())throw Error('QA: nome obrigatório');const current=v.id?products.find(x=>x.id===v.id):null;if(v.id&&!current)throw Error('QA: produto inexistente');
  for(const key of ['ean','internalCode'])if(p[key]&&products.some(x=>x.id!==v.id&&String(x[key as 'ean'|'internalCode'])===String(p[key])))throw Error('QA: código duplicado');
  const kit=(v.components??[]) as Row[];
  if(!Array.isArray(kit)||p.bundleProduct&&(!kit.length||new Set(kit.map(x=>x.productId)).size!==kit.length))throw Error('QA: composição inválida');
  for(const item of kit){const child=products.find(p=>p.id===item.productId);if(!child||child.id===v.id||!Number.isFinite(Number(item.quantity))||Number(item.quantity)<=0||!child.weightedProduct&&!Number.isInteger(Number(item.quantity)))throw Error('QA: quantidade de componente inválida')}
  const row={...structuredClone(current??initialProducts()[0]!),...p,id:current?.id??uuid(nextId++),name:String(p.name).trim().toUpperCase(),salePriceCents:String(integer(p.salePriceCents??current?.salePriceCents??0)),costPriceCents:String(integer(p.costPriceCents??current?.costPriceCents??0)),updatedAt:when};
  components.set(row.id,structuredClone(kit));if(current)Object.assign(current,row);else products.push({...row,balances:branches.map(b=>({branchId:b.id,branchName:b.name,quantity:0,reservedQuantity:0,availableQuantity:0,averageCostCents:row.costPriceCents}))});return {data:{_execute:1}}
 }
 case 'SetProductsStatusBatch':{
  const ids=(v.ids??[]) as string[];if(typeof v.active!=='boolean')throw Error('QA: estado inválido');if(!ids.length||ids.some(id=>!products.some(p=>p.id===id)))throw Error('QA: produtos inválidos');for(const p of products)if(ids.includes(p.id))p.active=v.active===true;return {data:{_execute:ids.length}}
 }
 case 'OpenCashSession':{
  if(!branchAllowed(v.branchId)||cashSession(v.branchId))throw Error('QA: filial inválida ou caixa já aberto');const amount=integer(v.openingAmountCents);sessions.push({id:uuid(nextId++),branchId:v.branchId,status:'OPEN',openedAt:when,openingAmountCents:String(amount),expectedAmountCents:String(amount),movementCount:0});return {data:{_execute:1}}
 }
 case 'RegisterCashMovement':case 'CloseCashSession':{const replay=mutations.has(name+':'+v.operationId);const data=mutateOnce(name,v.operationId,v,()=>{
  const session=sessions.find(s=>s.id===v.sessionId&&s.status==='OPEN');if(!session||!branchAllowed(session.branchId))throw Error('QA: caixa não está aberto');
  if(name==='CloseCashSession'){Object.assign(session,{status:'CLOSED',countedAmountCents:String(integer(v.countedAmountCents)),closedAt:when,notes:v.notes});return {_execute:1}}
  if(!['SUPPLY','WITHDRAWAL'].includes(String(v.movementType)))throw Error('QA: tipo inválido');const amount=integer(v.amountCents);if(!amount)throw Error('QA: valor deve ser positivo');const expected=Number(session.expectedAmountCents)+(v.movementType==='SUPPLY'?amount:-amount);if(expected<0)throw Error('QA: saldo insuficiente');Object.assign(session,{expectedAmountCents:String(expected),movementCount:Number(session.movementCount)+1});cashMovements.push({...v,id:uuid(nextId++)});return {_execute:1}
 });if(qaState.cashAckLoss&&!replay)throw Object.assign(new TypeError('Failed to fetch'),{code:'unavailable'});return {data:data as {_execute:number}}}
 case 'UpdatePosPolicy':policy={...policy,...v};return {data:{_execute:1}}
 case 'PostSale':{const replay=mutations.has(name+':'+p.clientOperationId);const data=mutateOnce(name,p.clientOperationId,p,()=>{
  if(p.replacesSaleId)throw Error('POS_CORRECTION_UNSUPPORTED');
  const session=cashSession(p.branchId);if(!branchAllowed(p.branchId)||!session||session.id!==p.cashSessionId)throw Error('POS_SESSION_REQUIRED');
  const lines=p.items as Row[],payments=p.payments as Row[];if(!Array.isArray(lines)||!lines.length||!Array.isArray(payments)||!payments.length)throw Error('POS_INVALID');
  const items=lines.map(line=>{const product=products.find(x=>x.id===line.product_id&&x.active),quantity=Number(line.quantity);if(!product||product.bundleProduct||!Number.isFinite(quantity)||quantity<=0||!product.weightedProduct&&!Number.isInteger(quantity))throw Error('POS_INVALID');
   const balance=product.balances.find(b=>b.branchId===p.branchId);if(!balance||!product.allowNegativeStock&&balance.availableQuantity<quantity)throw Error('POS_STOCK_INSUFFICIENT');const price=integer(line.requested_price);if(price!==Number(product.salePriceCents))throw Error('POS_PRICE_UNSUPPORTED');return {productId:product.id,name:product.name,quantity,unitPriceCents:price,listPriceCents:price,costPriceCents:Number(product.costPriceCents),weightedProduct:product.weightedProduct,bundleProduct:false,stock:balance.availableQuantity,allowNegativeStock:product.allowNegativeStock}
  });if(new Set(items.map(x=>x.productId)).size!==items.length)throw Error('POS_INVALID');
  const subtotal=items.reduce((n,x)=>n+Math.round(x.quantity*x.unitPriceCents),0),discount=integer(p.discountCents??0),surcharge=integer(p.surchargeCents??0),total=subtotal-discount+surcharge;if(total<0)throw Error('POS_INVALID');
  const tender=payments.map(x=>{if(x.payment_method_id!==uuid(50)||!integer(x.amount_cents))throw Error('POS_PAYMENT_UNSUPPORTED');return {paymentMethodId:String(x.payment_method_id),name:'DINHEIRO',amountCents:integer(x.amount_cents),sequence:integer(x.sequence),externalReference:null}}),paid=tender.reduce((n,x)=>n+x.amountCents,0);if(paid<total)throw Error('POS_PAYMENT_INSUFFICIENT');
  for(const item of items){const product=products.find(x=>x.id===item.productId)!,balance=product.balances.find(b=>b.branchId===p.branchId)!;balance.quantity-=item.quantity;balance.availableQuantity-=item.quantity;movements.unshift({id:uuid(nextId++),operationId:p.clientOperationId,occurredAt:when,quantity:item.quantity,unitCostCents:String(item.costPriceCents),status:'POSTED',typeCode:'SALE',typeName:'Venda',direction:'OUT',productId:item.productId,productName:item.name,branchId:p.branchId,branchName:branches.find(b=>b.id===p.branchId)!.name})}
  Object.assign(session,{expectedAmountCents:String(Number(session.expectedAmountCents)+total),movementCount:Number(session.movementCount)+1});cashMovements.push({id:uuid(nextId++),sessionId:session.id,saleId:p.clientOperationId,movementType:'SALE',amountCents:total});
  const receipt={id:String(p.clientOperationId),date:when,status:'COMPLETED',offline:false,operator:'OPERADOR FICTÍCIO QA',customer:'Consumidor final',tenant:{legalName:'EMPRESA FICTÍCIA QA',tradeName:'QA'},branch:{name:branches.find(b=>b.id===p.branchId)!.name},items,payments:tender,subtotalCents:subtotal,discountCents:discount,surchargeCents:surcharge,totalCents:total,changeCents:paid-total};sales.push({...receipt,branchId:p.branchId,cashSessionId:session.id});return {_execute:1,result:{receipt:{data:receipt}}}
 });if(qaState.ackLoss&&!replay)throw Error('QA: confirmação perdida após persistência sintética');return {data:data as {_execute:number;result:{receipt:unknown}}}}
 case 'SaleDetails':{const sale=sales.find(s=>s.id===v.saleId&&branchAllowed(s.branchId));if(!sale)throw Error('QA: venda inválida');return box({sale:{...sale,total_cents:sale.totalCents,source:'POS'},branch:sale.branch,customer:null,items:(sale.items as Row[]).map(i=>({...i,productName:i.name,unitSalePriceCents:i.unitPriceCents,discountCents:0,totalCents:Math.round(Number(i.quantity)*Number(i.unitPriceCents))})),payments:(sale.payments as Row[]).map(p=>({...p,paymentMethodName:p.name}))})}
 case 'CancelSale':{
  if(!String(v.reason??'').trim())throw Error('QA: motivo obrigatório');
  const sale=sales.find(s=>s.id===v.saleId);if(!sale||!branchAllowed(sale.branchId))throw Error('QA: venda inválida');
  if(sale.status==='CANCELLED')return {data:{_execute:0}};
  const session=cashSession(sale.branchId);if(!session||session.id!==sale.cashSessionId)throw Error('QA: caixa fechado');
  for(const item of sale.items as Row[]){const product=products.find(p=>p.id===item.productId)!,balance=product.balances.find(b=>b.branchId===sale.branchId)!;balance.quantity+=Number(item.quantity);balance.availableQuantity+=Number(item.quantity);movements.unshift({id:uuid(nextId++),operationId:'cancel:'+sale.id,occurredAt:when,quantity:item.quantity,unitCostCents:String(item.costPriceCents),status:'POSTED',typeCode:'SALE_REVERSAL',typeName:'Estorno de venda',direction:'IN',productId:product.id,productName:product.name,branchId:sale.branchId,branchName:branches.find(b=>b.id===sale.branchId)!.name})}
  session.expectedAmountCents=String(Number(session.expectedAmountCents)-Number(sale.totalCents));session.movementCount=Number(session.movementCount)+1;cashMovements.push({id:uuid(nextId++),sessionId:session.id,saleId:sale.id,movementType:'SALE_REVERSAL',amountCents:-Number(sale.totalCents)});sale.status='CANCELLED';return {data:{_execute:1}}
 }
 case 'SalesChannelOptions':return box({branches,connections:[]})
 case 'LatestPendingSalesChannelOrder':return box({orders:[]})
 case 'ListSales':return page(sales.map(s=>({...s,clientOperationId:s.id,source:'POS',soldAt:s.date,createdByUid:'qa-user',branchId:s.branchId,branchName:(s.branch as Row).name,customerName:s.customer,name:s.customer,itemCount:(s.items as unknown[]).length,paymentMethods:'DINHEIRO'})),{...v,search:(v.filters as Row|undefined)?.search??''})
 case 'SalesChannelConnectionsV2':return box({rows:[],total:0,summary:{total:0,authorized:0,preparing:0,attention:0}})
 case 'SalesChannelProductMappingsV2':return box({rows:[],total:0,summary:{total:0,automatic:0,pending:0,errors:0}})
 case 'SalesChannelOrdersV2':return box({rows:[],total:0,summary:{pending:0,accepted:0,completed:0,attention:0}})
 case 'SalesChannelOperations':return box({events:[],commands:[],jobs:[],summary:{eventFailures:0,queuedCommands:0,syncFailures:0}})
 case 'EnsureSalesDefaults':return {data:{_execute:1}}
 }
 // In-memory catalog writes are useful for forms and status flows. Unknown
 // operations fail explicitly; they never pretend to validate a real backend.
 const sub=name.includes('Subcategor'),cat=['CreateCategory','UpdateCategory','ArchiveCategory','RestoreCategory','CreateCategoriesBatch','SetCategoriesStatusBatch','CreateSubcategory','UpdateSubcategory','ArchiveSubcategory','RestoreSubcategory','CreateSubcategoriesBatch','SetSubcategoriesStatusBatch'].includes(name)
 if(cat){
  const list=sub?subcategories:categories
  if(/^(Create|Update)/.test(name)){
   const rows=(v.names??v.items??[{name:v.name,categoryId:v.categoryId}]) as Row[]|string[]
   if(!Array.isArray(rows)||rows.length<1||rows.length>20)throw Error('QA: lote deve conter 1 a 20 registros')
   const prepared=rows.map(value=>{const x=typeof value==='object'&&value?value:{name:value,categoryId:v.categoryId};return {name:normalizeCatalogName(String(x.name??'')),categoryId:sub?x.categoryId:undefined}})
   const key=(x:Row)=>String(sub?x.categoryId:'')+'|'+normalizeCatalogName(String(x.name))
   if(prepared.some(x=>[...x.name].length<2||[...x.name].length>120)||new Set(prepared.map(key)).size!==prepared.length)throw Error('QA: nome inválido ou duplicado')
   if(sub&&prepared.some(x=>!categories.some(c=>c.id===x.categoryId&&c.active)))throw Error('QA: categoria obrigatória')
   if(v.id&&!list.some(x=>x.id===v.id))throw Error('QA: registro inexistente')
   if(prepared.some(x=>list.some(r=>r.id!==v.id&&r.active&&key(r)===key(x))))throw Error('QA: nome duplicado')
   for(const x of prepared){const values={...x,categoryName:sub?categories.find(c=>c.id===x.categoryId)!.name:undefined,updatedAt:when};if(v.id)Object.assign(list.find(x=>x.id===v.id)!,values);else list.push({...values,id:uuid(nextId++),active:true,createdAt:when})}
   return {data:{_execute:prepared.length}}
  }
  const ids=[...new Set((v.ids??[v.id]) as string[])],active=v.active??/^Restore/.test(name)
  if(!Array.isArray(ids)||!ids.length||typeof active!=='boolean'||ids.some(id=>!list.some(row=>row.id===id)))throw Error('QA: registros inexistentes')
  const rows=list.filter(r=>ids.includes(String(r.id))),key=(r:Row)=>String(sub?r.categoryId:'')+'|'+normalizeCatalogName(String(r.name))
  if(active&&rows.some(r=>list.some(x=>x.id!==r.id&&(x.active||ids.includes(String(x.id)))&&key(x)===key(r))))throw Error('QA: nome duplicado')
  if(active&&sub&&rows.some(r=>!categories.some(c=>c.id===r.categoryId&&c.active)))throw Error('QA: categoria obrigatória')
  // SQL status mutations are atomic: one ineligible ID rejects the whole batch.
  if(!active&&rows.some(r=>products.some(p=>p.active&&p[sub?'subcategoryId':'categoryId']===r.id)||!sub&&subcategories.some(c=>c.active&&c.categoryId===r.id)))return {data:{_execute:0}}
  for(const row of rows)Object.assign(row,{active,deletedAt:active?null:when})
  return {data:{_execute:rows.length}}
 }
 qaState.unsupported.push(name)
 throw new Error('QA: operação ainda sem fixture: '+name)
}
export const queryRef=(_dc:unknown,name:string,variables:unknown={})=>({name,variables})
export const mutationRef=queryRef
export const executeQuery=(ref:ReturnType<typeof queryRef>)=>qaOperation(ref.name,ref.variables)
export const executeMutation=executeQuery
export const httpsCallable=(_functions:unknown,name:string)=>async()=>{throw new Error('QA: chamada externa mockada e desativada: '+name)}
// Read-only diagnostic snapshot for browser assertions; synthetic QA build only.
export const inspectFixtures=()=>structuredClone({products,movements,transfers,sessions,sales,cashMovements,ledger,categories,subcategories,branches,policy,customers,suppliers,promotions})
