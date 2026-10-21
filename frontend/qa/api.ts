// Deterministic, memory-only fixtures. This module never imports Firebase or fetch.
type Row=Record<string,unknown>
export const connectorConfig={connector:'qa-only',service:'fixture',location:'local'}
export const firebaseApp={},auth={currentUser:null},appCheck=null
export const getDataConnect=()=>({qa:true}),getFunctions=()=>({qa:true})
export const currentSessionToken=()=> '0'.repeat(64)
export const sessionKey=(uid:string)=>'qa.session:'+uid
export const qaState={fail:false,delay:0,ackLoss:false,logs:[] as string[],unsupported:[] as string[],permissions:'full',empty:false,allowedBranches:[] as string[]}
export const uuid=(n:number)=>`00000000-0000-4000-8000-${String(n).padStart(12,'0')}`
const when='2026-10-21T12:00:00Z'
export const branches=[{id:uuid(1),name:'MATRIZ QA'},{id:uuid(2),name:'FILIAL QA'}]
const initialProducts=()=>Array.from({length:65},(_,i)=>({id:uuid(100+i),name:`PRODUTO QA ${String(i+1).padStart(3,'0')}`,internalCode:`QA${i+1}`,ean:`789000000${String(i).padStart(4,'0')}`,categoryId:uuid(300),subcategoryId:uuid(800),categoryName:'CATEGORIA QA 001',subcategoryName:'SUBCATEGORIA QA 001',minimumStock:5,maximumStock:30,allowNegativeStock:false,weightedProduct:i%3===0,costPriceCents:'800',salePriceCents:'1200',salePrice:1200,priceCents:'1200',unit:'UN',active:true,createdAt:when,updatedAt:when,balances:branches.map(b=>({branchId:b.id,branchName:b.name,quantity:i%7===0?2:20,reservedQuantity:0,availableQuantity:i%7===0?2:20,averageCostCents:'800'}))}))
export let products=initialProducts()
let categories:Row[],subcategories:Row[],movements:Row[],transfers:Row[],sessions:Row[],cashMovements:Row[],sales:Row[]
let nextId=13000,policy:Row
const mutations=new Map<string,{hash:string;data:unknown}>()
const receipts=new Map<string,{hash:string;kind:string}>()
export function resetFixtures(){
 products=initialProducts();nextId=13000;mutations.clear();cashMovements=[];sales=[]
 sessions=[{id:uuid(60),branchId:uuid(1),status:'OPEN',openedAt:when,openingAmountCents:'10000',expectedAmountCents:'10000',movementCount:0}]
 policy={requireOpenSession:true,operatorDiscountPercent:5,operatorSurchargePercent:5,allowOperatorClose:true,operatorWithdrawalLimitCents:100000,operatorCloseDifferenceLimitCents:100000}
 categories=Array.from({length:151},(_,i)=>({id:uuid(300+i),name:`CATEGORIA QA ${String(i+1).padStart(3,'0')}`,active:i%11!==10,createdAt:when,updatedAt:when,productCount:i%4,subcategoryCount:i%3}))
 subcategories=Array.from({length:151},(_,i)=>({id:uuid(800+i),name:`SUBCATEGORIA QA ${String(i+1).padStart(3,'0')}`,categoryId:uuid(300+i%10),categoryName:`CATEGORIA QA ${String(i%10+1).padStart(3,'0')}`,active:i%11!==10,createdAt:when,updatedAt:when,productCount:i%4}))
 movements=Array.from({length:501},(_,i)=>({id:uuid(2000+i),operationId:'qa-movement-'+i,occurredAt:when,quantity:i%5+1,unitCostCents:'800',status:i%13===0?'REVERSED':'POSTED',typeCode:i%2?'LOSS':'MANUAL_IN',typeName:i%2?'Perda':'Entrada',direction:i%2?'OUT':'IN',productId:products[i%products.length]!.id,productName:products[i%products.length]!.name,branchId:branches[i%2]!.id,branchName:branches[i%2]!.name}))
 transfers=Array.from({length:201},(_,i)=>({id:uuid(3000+i),operationId:'qa-transfer-'+i,status:'COMPLETED',requestedAt:when,sourceBranchId:branches[0]!.id,destinationBranchId:branches[1]!.id,sourceBranch:branches[0]!.name,destinationBranch:branches[1]!.name,totalQuantity:i%5+1,itemCount:1}))
 receipts.clear();qaState.logs=[];qaState.unsupported=[]
}
resetFixtures()
const result=(data:unknown)=>({data:{_select:[{data:structuredClone(data)}]}})
const page=(rows:Row[],v:Row)=>{
 let selected=rows.filter(r=>!v.search||String(r.name).toLowerCase().includes(String(v.search).toLowerCase()))
 const filters=(v.filters??{}) as Record<string,unknown[]>
 for(const [k,values] of Object.entries(filters))if(Array.isArray(values)&&values.length)selected=selected.filter(r=>values.map(String).includes(String(r[k])))
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
 const date=(value:unknown)=>(!f.from||String(value)>=String(f.from))&&(!f.to||String(value)<=String(f.to));
 const ms=(qaState.empty?[]:movements).filter(m=>branchAllowed(m.branchId)&&has('branches',m.branchId)&&has('types',m.typeCode)&&has('products',m.productId)&&date(m.occurredAt)&&[m.productName,m.branchName,m.typeName,m.operationId].join(' ').toLocaleLowerCase('pt-BR').includes(text));
 const ts=(qaState.empty?[]:transfers).filter(t=>branchAllowed(t.sourceBranchId)&&branchAllowed(t.destinationBranchId)&&(has('branches',t.sourceBranchId)||has('branches',t.destinationBranchId))&&date(t.requestedAt)&&[t.sourceBranch,t.destinationBranch,t.operationId].join(' ').toLocaleLowerCase('pt-BR').includes(text));
 const offset=Math.max(0,Number(v.offset??0)),limit=Math.min(1000,Math.max(1,Number(v.limit??100)));
 return {branches:branches.filter(b=>branchAllowed(b.id)),suppliers:[{id:uuid(20),name:'FORNECEDOR QA'}],products:qaState.empty?[]:products.map(p=>({...p,balances:p.balances.filter(b=>branchAllowed(b.branchId))})),movements:sorted(ms,v,'occurredAt').slice(offset,offset+limit),transfers:sorted(ts,v,'requestedAt').slice(offset,offset+limit),movementCount:ms.length,transferCount:ts.length}
}
const posProducts=(branchId:unknown)=>products.filter(p=>p.active).map(p=>({...p,listPriceCents:String(p.salePriceCents),effectivePriceCents:String(p.salePriceCents),stock:p.balances.find(b=>b.branchId===branchId)?.availableQuantity??0,stockByBranches:p.balances.filter(b=>branchAllowed(b.branchId)).map(b=>({branchId:b.branchId,branchName:b.branchName,quantity:b.availableQuantity}))}))
const cashSession=(branchId:unknown)=>sessions.find(x=>x.status==='OPEN'&&x.branchId===branchId)??null
const mutateOnce=(name:string,key:unknown,payload:unknown,apply:()=>unknown)=>{
 if(!key)throw Error('QA: identificador de operação obrigatório');const id=name+':'+key,hash=JSON.stringify(payload),old=mutations.get(id);
 if(old){if(old.hash!==hash)throw Error('QA: conteúdo conflitante');return structuredClone(old.data)}
 const data=apply();mutations.set(id,{hash,data:structuredClone(data)});return data
}
export async function qaOperation(name:string,variables:unknown={}){
 const v=(variables??{}) as Row,p=(v.payload??{}) as Row
 qaState.logs.push(name);qaState.logs=qaState.logs.slice(-40)
 if(qaState.delay)await new Promise(r=>setTimeout(r,qaState.delay))
 if(qaState.fail)throw new Error('QA: falha sintética de API')
 const writing=/^(Save|Create|Update|Set|Archive|Restore|Open|Close|Register|Post|Reverse|Ensure)/.test(name)
 if(qaState.permissions==='denied'||writing&&qaState.permissions==='read')throw Error('QA: permissão negada')
 const box=(value:unknown)=>result(value)
 switch(name){
 case 'ListCategories':return page(qaState.empty?[]:categories,v)
 case 'ListSubcategories':return page(qaState.empty?[]:subcategories,v)
 case 'CategoryOptions':return {data:{_select:categories.filter(c=>c.active)}}
 case 'RegistrationOptions':return box({branches,categories,subcategories,suppliers:[{id:uuid(20),name:'FORNECEDOR QA'}],products,paymentMethods:[],options:{}})
 case 'ListProducts':return page(qaState.empty?[]:products,v)
 case 'ListBranches':return page(branches.map(b=>({...b,active:true,createdAt:when,updatedAt:when})),v)
 case 'ListSuppliers':case 'ListCustomers':return page(Array.from({length:101},(_,i)=>({id:uuid(4000+i),name:`PESSOA FICTÍCIA QA ${i}`,active:true,createdAt:when,updatedAt:when})),v)
 case 'ProductComponents':case 'ProductPromotions':case 'PendingPosApprovals':return {data:{_select:[]}}
 case 'StockWorkspace':return box(stockWorkspace(v))
 case 'SaveStockBatch':case 'PostStockTransfer':{
  const key=String(p.clientOperationId),hash=JSON.stringify(p),kind=name==='SaveStockBatch'?'STOCK_BATCH':'STOCK_TRANSFER',old=receipts.get(key)
  if(old&&old.hash!==hash)throw new Error('STOCK_NOT_CONFIRMED')
  if(!old){
   const lines=p.items as Row[];if(!Array.isArray(lines)||!lines.length)throw Error('QA: itens obrigatórios');
   const source=name==='SaveStockBatch'?p.branchId:p.sourceBranchId,destination=p.destinationBranchId;
   if(!branchAllowed(source)||name==='PostStockTransfer'&&(!branchAllowed(destination)||source===destination))throw Error('QA: filial inválida');
   if(name==='SaveStockBatch'&&!['IN','OUT'].includes(String(p.direction)))throw Error('QA: direção inválida');
   const prepared=lines.map(line=>{const product=products.find(x=>x.id===line.product_id&&x.active),quantity=Number(line.quantity);if(!product||!Number.isFinite(quantity)||quantity<=0||!product.weightedProduct&&!Number.isInteger(quantity))throw Error('QA: item inválido');const balance=product.balances.find(b=>b.branchId===source)!;if((name==='PostStockTransfer'||p.direction==='OUT')&&!product.allowNegativeStock&&balance.availableQuantity<quantity)throw Error('QA: saldo insuficiente');return {product,balance,quantity}});
   if(new Set(prepared.map(x=>x.product.id)).size!==prepared.length)throw Error('QA: item duplicado');
   for(const {product,balance,quantity}of prepared){const direction=name==='PostStockTransfer'?'OUT':String(p.direction),sign=direction==='IN'?1:-1;balance.quantity+=sign*quantity;balance.availableQuantity+=sign*quantity;if(name==='PostStockTransfer'){const target=product.balances.find(b=>b.branchId===destination)!;target.quantity+=quantity;target.availableQuantity+=quantity}
    movements.unshift({id:uuid(nextId++),operationId:key,occurredAt:p.occurredAt??when,quantity,unitCostCents:product.costPriceCents,status:'POSTED',typeCode:name==='PostStockTransfer'?'TRANSFER_OUT':direction==='IN'?'MANUAL_IN':'LOSS',typeName:name==='PostStockTransfer'?'Transferência':direction==='IN'?'Entrada':'Perda',direction,productId:product.id,productName:product.name,branchId:source,branchName:branches.find(b=>b.id===source)!.name})
   }
   if(name==='PostStockTransfer')transfers.unshift({id:uuid(nextId++),operationId:key,status:'COMPLETED',requestedAt:when,sourceBranchId:source,destinationBranchId:destination,sourceBranch:branches.find(b=>b.id===source)!.name,destinationBranch:branches.find(b=>b.id===destination)!.name,totalQuantity:prepared.reduce((n,x)=>n+x.quantity,0),itemCount:prepared.length});receipts.set(key,{hash,kind})
  }
  if(qaState.ackLoss&&!old)throw new Error('QA: confirmação perdida após persistência sintética')
  return {data:{_execute:old?0:1,confirmation:{receipt:{confirmed:true,replay:!!old,operationId:key,kind}}}}
 }
 case 'StockOperationDetails':return box({items:movements.filter(m=>m.operationId===v.operationId),fiscal:null})
 case 'FinancialIndicatorsDashboard':return box({options:{branches,products,categories,subcategories,suppliers:[],sources:[]},cards:{volume:25,revenueCents:'30000',providerFeeCents:'1500',netRevenueCents:'28500',costCents:'16000',grossProfitCents:'14000',profitCents:'12500',marginPercent:41.67,ticketCents:'1200',financialPendingSales:0},monthly:{lastVolume:25,averageVolume:20,volumeGrowth:25,lastProfitCents:'12500',averageProfitCents:'10000',profitGrowth:25,months:2},daily:[{date:'2025-10-21',volume:10,revenueCents:'12000',profitCents:'5000'},{date:'2026-10-21',volume:15,revenueCents:'18000',profitCents:'7500'}],products:products.map((x,i)=>({...x,quantity:i+1,revenueCents:'1200',providerFeeCents:'60',netRevenueCents:'1140',costCents:'800',grossProfitCents:'400',profitCents:i%7?-340:340,marginPercent:28.33,lineCount:1}))})
 case 'OperationalAnalyticsDashboard':return box({stock:{cards:{quantity:500,costCents:400000},monthly:[],products:products.map(x=>({...x,quantity:20,averageCostCents:800,costCents:16000,minimumStock:5,maximumStock:30,status:'NORMAL'}))},customers:{cards:{customers:1201,activeCustomers:1100},abc:[],regions:[],birthdays:Array.from({length:51},(_,i)=>({id:uuid(5000+i),name:`ANIVERSARIANTE QA ${i+1}`,birthDate:'2000-10-21'})),dormant:Array.from({length:1201},(_,i)=>({id:uuid(6000+i),name:`SEM COMPRAR QA ${i+1}`,lastPurchase:null,revenueCents:1200}))},categories:categories.slice(0,8).map(x=>({...x,level:'Categoria',quantity:25,revenueCents:'30000',costCents:'16000',profitCents:'14000',marginPercent:46.67,growthPercent:10}))})
 case 'SalesChannelAnalyticsDashboard':return box({options:{branches,connections:[]},cards:{orders:25,sales:25,grossRevenueCents:30000},daily:[],byChannel:[],fees:[],payments:[],topProducts:[]})
 case 'SalesWorkspace':return box({tenant:{legalName:'EMPRESA FICTÍCIA QA',tradeName:'QA'},branches:branches.filter(b=>branchAllowed(b.id)),customers:[],products:posProducts(v.branchId??branches[0]!.id),paymentMethods:[{id:uuid(50),name:'DINHEIRO',code:'CASH',requiresChange:true}],policy,openSession:cashSession(v.branchId??branches[0]!.id)})
 case 'SearchPosProducts':return {data:{_select:qaState.empty?[]:posProducts(v.branchId).filter(x=>!v.search||[x.name,x.ean,x.internalCode].join(' ').toUpperCase().includes(String(v.search).toUpperCase())).slice(Number(v.offset??0),Number(v.offset??0)+Number(v.limit??30))}}
 case 'SearchPosCustomers':return {data:{_select:[]}}
 case 'PosProductBranches':return {data:{_select:products.find(p=>p.id===v.productId)?.balances.filter(b=>branchAllowed(b.branchId)).map(b=>({...b,availableStock:b.availableQuantity}))??[]}}
 case 'SaveProduct':{
  if(!String(p.name??'').trim())throw Error('QA: nome obrigatório');const current=v.id?products.find(x=>x.id===v.id):null;if(v.id&&!current)throw Error('QA: produto inexistente');
  for(const key of ['ean','internalCode'])if(p[key]&&products.some(x=>x.id!==v.id&&String(x[key as 'ean'|'internalCode'])===String(p[key])))throw Error('QA: código duplicado');
  const row={...structuredClone(current??initialProducts()[0]!),...p,id:current?.id??uuid(nextId++),name:String(p.name).trim().toUpperCase(),salePriceCents:String(integer(p.salePriceCents??current?.salePriceCents??0)),costPriceCents:String(integer(p.costPriceCents??current?.costPriceCents??0)),updatedAt:when};
  if(current)Object.assign(current,row);else products.push({...row,balances:branches.map(b=>({branchId:b.id,branchName:b.name,quantity:0,reservedQuantity:0,availableQuantity:0,averageCostCents:row.costPriceCents}))});return {data:{_execute:1}}
 }
 case 'SetProductsStatusBatch':{
  const ids=(v.ids??[]) as string[];if(!ids.length||ids.some(id=>!products.some(p=>p.id===id)))throw Error('QA: produtos inválidos');for(const p of products)if(ids.includes(p.id))p.active=v.active===true;return {data:{_execute:ids.length}}
 }
 case 'OpenCashSession':{
  if(!branchAllowed(v.branchId)||cashSession(v.branchId))throw Error('QA: filial inválida ou caixa já aberto');const amount=integer(v.openingAmountCents);sessions.push({id:uuid(nextId++),branchId:v.branchId,status:'OPEN',openedAt:when,openingAmountCents:String(amount),expectedAmountCents:String(amount),movementCount:0});return {data:{_execute:1}}
 }
 case 'RegisterCashMovement':case 'CloseCashSession':return {data:mutateOnce(name,v.operationId,v,()=>{
  const session=sessions.find(s=>s.id===v.sessionId&&s.status==='OPEN');if(!session||!branchAllowed(session.branchId))throw Error('QA: caixa não está aberto');
  if(name==='CloseCashSession'){Object.assign(session,{status:'CLOSED',countedAmountCents:String(integer(v.countedAmountCents)),closedAt:when,notes:v.notes});return {_execute:1}}
  if(!['SUPPLY','WITHDRAWAL'].includes(String(v.movementType)))throw Error('QA: tipo inválido');const amount=integer(v.amountCents);if(!amount)throw Error('QA: valor deve ser positivo');const expected=Number(session.expectedAmountCents)+(v.movementType==='SUPPLY'?amount:-amount);if(expected<0)throw Error('QA: saldo insuficiente');Object.assign(session,{expectedAmountCents:String(expected),movementCount:Number(session.movementCount)+1});cashMovements.push({...v,id:uuid(nextId++)});return {_execute:1}
 }) as {_execute:number}}
 case 'UpdatePosPolicy':policy={...policy,...v};return {data:{_execute:1}}
 case 'PostSale':return {data:mutateOnce(name,p.clientOperationId,p,()=>{
  const session=cashSession(p.branchId);if(!branchAllowed(p.branchId)||!session||session.id!==p.cashSessionId)throw Error('POS_SESSION_REQUIRED');
  const lines=p.items as Row[],payments=p.payments as Row[];if(!Array.isArray(lines)||!lines.length||!Array.isArray(payments)||!payments.length)throw Error('POS_INVALID');
  const items=lines.map(line=>{const product=products.find(x=>x.id===line.product_id&&x.active),quantity=Number(line.quantity);if(!product||!Number.isFinite(quantity)||quantity<=0||!product.weightedProduct&&!Number.isInteger(quantity))throw Error('POS_INVALID');
   const balance=product.balances.find(b=>b.branchId===p.branchId);if(!balance||!product.allowNegativeStock&&balance.availableQuantity<quantity)throw Error('POS_STOCK_INSUFFICIENT');const price=integer(line.requested_price);if(price!==Number(product.salePriceCents))throw Error('POS_PRICE_UNSUPPORTED');return {productId:product.id,name:product.name,quantity,unitPriceCents:price,listPriceCents:price,costPriceCents:Number(product.costPriceCents),weightedProduct:product.weightedProduct,bundleProduct:false,stock:balance.availableQuantity,allowNegativeStock:product.allowNegativeStock}
  });if(new Set(items.map(x=>x.productId)).size!==items.length)throw Error('POS_INVALID');
  const subtotal=items.reduce((n,x)=>n+Math.round(x.quantity*x.unitPriceCents),0),discount=integer(p.discountCents??0),surcharge=integer(p.surchargeCents??0),total=subtotal-discount+surcharge;if(total<0)throw Error('POS_INVALID');
  const tender=payments.map(x=>{if(x.payment_method_id!==uuid(50)||!integer(x.amount_cents))throw Error('POS_PAYMENT_UNSUPPORTED');return {paymentMethodId:String(x.payment_method_id),name:'DINHEIRO',amountCents:integer(x.amount_cents),sequence:integer(x.sequence),externalReference:null}}),paid=tender.reduce((n,x)=>n+x.amountCents,0);if(paid<total)throw Error('POS_PAYMENT_INSUFFICIENT');
  for(const item of items){const product=products.find(x=>x.id===item.productId)!,balance=product.balances.find(b=>b.branchId===p.branchId)!;balance.quantity-=item.quantity;balance.availableQuantity-=item.quantity;movements.unshift({id:uuid(nextId++),operationId:p.clientOperationId,occurredAt:when,quantity:item.quantity,unitCostCents:String(item.costPriceCents),status:'POSTED',typeCode:'SALE',typeName:'Venda',direction:'OUT',productId:item.productId,productName:item.name,branchId:p.branchId,branchName:branches.find(b=>b.id===p.branchId)!.name})}
  Object.assign(session,{expectedAmountCents:String(Number(session.expectedAmountCents)+total),movementCount:Number(session.movementCount)+1});
  const receipt={id:String(p.clientOperationId),date:when,status:'COMPLETED',offline:false,operator:'OPERADOR FICTÍCIO QA',customer:'Consumidor final',tenant:{legalName:'EMPRESA FICTÍCIA QA',tradeName:'QA'},branch:{name:branches.find(b=>b.id===p.branchId)!.name},items,payments:tender,subtotalCents:subtotal,discountCents:discount,surchargeCents:surcharge,totalCents:total,changeCents:paid-total};sales.push(receipt);return {_execute:1,result:{receipt:{data:receipt}}}
 }) as {_execute:number;result:{receipt:unknown}}}
 case 'SalesChannelOptions':return box({branches,connections:[]})
 case 'LatestPendingSalesChannelOrder':return box({orders:[]})
 case 'ListSales':return box({rows:structuredClone(sales),totalCount:sales.length,summary:{}})
 case 'SalesChannelConnectionsV2':case 'SalesChannelProductMappingsV2':case 'SalesChannelOrdersV2':return box({rows:[],totalCount:0,summary:{}})
 case 'SalesChannelOperations':return box({events:[],commands:[],syncs:[],summary:{}})
 case 'EnsureSalesDefaults':return {data:{_execute:1}}
 }
 // In-memory catalog writes are useful for forms and status flows. Unknown
 // operations fail explicitly; they never pretend to validate a real backend.
 const sub=name.includes('Subcategor'),cat=/^(Create|Update|Archive|Restore|Set)(Categories|Category|Subcategories|Subcategory)(Batch)?$/.test(name)
 if(cat){
  const list=sub?subcategories:categories,rows=(v.names??v.items??[v.name??'NOVA CATEGORIA QA']) as unknown[]
  if(/^(Create|Update)/.test(name)){
   if(v.id){const row=list.find(x=>x.id===v.id);if(row)Object.assign(row,{name:v.name,categoryId:v.categoryId??row.categoryId})}
   else for(const value of rows){const x=typeof value==='object'&&value?value as Row:{name:value};list.push({id:uuid(12000+list.length),name:String(x.name??value).trim().toUpperCase(),categoryId:x.categoryId??uuid(300),categoryName:'CATEGORIA QA 001',active:true,createdAt:when,updatedAt:when,productCount:0,subcategoryCount:0})}
  }else{const ids=(v.ids??[v.id]) as string[];for(const row of list)if(ids.includes(String(row.id)))row.active=v.active??/^Restore/.test(name)}
  return {data:{_execute:(v.ids as unknown[]|undefined)?.length??rows.length}}
 }
 qaState.unsupported.push(name)
 throw new Error('QA: operação ainda sem fixture: '+name)
}
export const queryRef=(_dc:unknown,name:string,variables:unknown={})=>({name,variables})
export const mutationRef=queryRef
export const executeQuery=(ref:ReturnType<typeof queryRef>)=>qaOperation(ref.name,ref.variables)
export const executeMutation=executeQuery
export const httpsCallable=(_functions:unknown,name:string)=>async()=>{throw new Error('QA: chamada externa mockada e desativada: '+name)}
