// Deterministic, memory-only fixtures. This module never imports Firebase or fetch.
type Row=Record<string,unknown>
export const connectorConfig={connector:'qa-only',service:'fixture',location:'local'}
export const firebaseApp={},auth={currentUser:null},appCheck=null
export const getDataConnect=()=>({qa:true}),getFunctions=()=>({qa:true})
export const currentSessionToken=()=> '0'.repeat(64)
export const sessionKey=(uid:string)=>'qa.session:'+uid
export const qaState={fail:false,delay:0,ackLoss:false,logs:[] as string[]}
export const uuid=(n:number)=>`00000000-0000-4000-8000-${String(n).padStart(12,'0')}`
const when='2026-10-21T12:00:00Z'
export const branches=[{id:uuid(1),name:'MATRIZ QA'},{id:uuid(2),name:'FILIAL QA'}]
export const products=Array.from({length:65},(_,i)=>({id:uuid(100+i),name:`PRODUTO QA ${String(i+1).padStart(3,'0')}`,internalCode:`QA${i+1}`,ean:`789000000${String(i).padStart(4,'0')}`,categoryId:uuid(300),subcategoryId:uuid(800),categoryName:'CATEGORIA QA 001',subcategoryName:'SUBCATEGORIA QA 001',minimumStock:5,maximumStock:30,allowNegativeStock:false,weightedProduct:i%3===0,costPriceCents:'800',salePriceCents:'1200',salePrice:1200,priceCents:'1200',unit:'UN',active:true,createdAt:when,updatedAt:when,balances:branches.map(b=>({branchId:b.id,branchName:b.name,quantity:i%7===0?2:20,reservedQuantity:0,availableQuantity:i%7===0?2:20,averageCostCents:'800'}))}))
let categories:Row[],subcategories:Row[],movements:Row[],transfers:Row[]
const receipts=new Map<string,{hash:string;kind:string}>()
export function resetFixtures(){
 categories=Array.from({length:151},(_,i)=>({id:uuid(300+i),name:`CATEGORIA QA ${String(i+1).padStart(3,'0')}`,active:i%11!==10,createdAt:when,updatedAt:when,productCount:i%4,subcategoryCount:i%3}))
 subcategories=Array.from({length:151},(_,i)=>({id:uuid(800+i),name:`SUBCATEGORIA QA ${String(i+1).padStart(3,'0')}`,categoryId:uuid(300+i%10),categoryName:`CATEGORIA QA ${String(i%10+1).padStart(3,'0')}`,active:i%11!==10,createdAt:when,updatedAt:when,productCount:i%4}))
 movements=Array.from({length:501},(_,i)=>({id:uuid(2000+i),operationId:'qa-movement-'+i,occurredAt:when,quantity:i%5+1,unitCostCents:'800',status:i%13===0?'REVERSED':'POSTED',typeCode:i%2?'LOSS':'MANUAL_IN',typeName:i%2?'Perda':'Entrada',direction:i%2?'OUT':'IN',productId:products[i%products.length]!.id,productName:products[i%products.length]!.name,branchId:branches[i%2]!.id,branchName:branches[i%2]!.name}))
 transfers=Array.from({length:201},(_,i)=>({id:uuid(3000+i),operationId:'qa-transfer-'+i,status:'COMPLETED',requestedAt:when,sourceBranch:branches[0]!.name,destinationBranch:branches[1]!.name,totalQuantity:3,itemCount:1}))
 receipts.clear();qaState.logs=[]
}
resetFixtures()
const result=(data:unknown)=>({data:{_select:[{data}]}})
const page=(rows:Row[],v:Row)=>{
 let selected=rows.filter(r=>!v.search||String(r.name).toLowerCase().includes(String(v.search).toLowerCase()))
 const filters=(v.filters??{}) as Record<string,unknown[]>
 for(const [k,values] of Object.entries(filters))if(Array.isArray(values)&&values.length)selected=selected.filter(r=>values.map(String).includes(String(r[k])))
 if(v.categoryId)selected=selected.filter(r=>r.categoryId===v.categoryId)
 if(v.sortField){const sign=v.sortDirection==='desc'?-1:1;selected=[...selected].sort((a,b)=>sign*String(a[String(v.sortField)]??'').localeCompare(String(b[String(v.sortField)]??''),'pt-BR',{numeric:true}))}
 return {data:{_select:selected.slice(Number(v.offset??0),Number(v.offset??0)+Number(v.limit??100)),_selectFirst:{totalCount:selected.length}}}
}
export async function qaOperation(name:string,variables:unknown={}){
 const v=(variables??{}) as Row,p=(v.payload??{}) as Row
 qaState.logs.push(name);qaState.logs=qaState.logs.slice(-40)
 if(qaState.delay)await new Promise(r=>setTimeout(r,qaState.delay))
 if(qaState.fail)throw new Error('QA: falha sintética de API')
 const box=(value:unknown)=>result(value)
 switch(name){
 case 'ListCategories':return page(categories,v)
 case 'ListSubcategories':return page(subcategories,v)
 case 'CategoryOptions':return {data:{_select:categories.filter(c=>c.active)}}
 case 'RegistrationOptions':return box({branches,categories,subcategories,suppliers:[{id:uuid(20),name:'FORNECEDOR QA'}],products,paymentMethods:[],options:{}})
 case 'ListProducts':return page(products,v)
 case 'ListBranches':return page(branches.map(b=>({...b,active:true,createdAt:when,updatedAt:when})),v)
 case 'ListSuppliers':case 'ListCustomers':return page(Array.from({length:101},(_,i)=>({id:uuid(4000+i),name:`PESSOA FICTÍCIA QA ${i}`,active:true,createdAt:when,updatedAt:when})),v)
 case 'ProductComponents':case 'ProductPromotions':case 'PendingPosApprovals':return {data:{_select:[]}}
 case 'StockWorkspace':return box({branches,suppliers:[{id:uuid(20),name:'FORNECEDOR QA'}],products,movements:movements.slice(Number(v.offset??0),Number(v.offset??0)+Number(v.limit??100)),transfers:transfers.slice(Number(v.offset??0),Number(v.offset??0)+Number(v.limit??100)),movementCount:movements.length,transferCount:transfers.length})
 case 'SaveStockBatch':case 'PostStockTransfer':{
  const key=String(p.clientOperationId),hash=JSON.stringify(p),kind=name==='SaveStockBatch'?'STOCK_BATCH':'STOCK_TRANSFER',old=receipts.get(key)
  if(old&&old.hash!==hash)throw new Error('STOCK_NOT_CONFIRMED')
  if(!old){receipts.set(key,{hash,kind});if(name==='SaveStockBatch')movements.unshift({id:uuid(9000+receipts.size),operationId:key,occurredAt:p.occurredAt??when,quantity:1,unitCostCents:100,status:'POSTED',typeCode:'MANUAL_IN',typeName:'Entrada',direction:p.direction,productId:products[0]!.id,productName:products[0]!.name,branchId:p.branchId,branchName:'MATRIZ QA'});else transfers.unshift({id:uuid(9500+receipts.size),operationId:key,status:'COMPLETED',requestedAt:when,sourceBranch:'MATRIZ QA',destinationBranch:'FILIAL QA',totalQuantity:1,itemCount:1})}
  if(qaState.ackLoss&&!old)throw new Error('QA: confirmação perdida após persistência sintética')
  return {data:{_execute:old?0:1,confirmation:{receipt:{confirmed:true,replay:!!old,operationId:key,kind}}}}
 }
 case 'StockOperationDetails':return box({items:movements.filter(m=>m.operationId===v.operationId),fiscal:null})
 case 'ReverseStockOperation':movements=movements.map(m=>(v.movementIds as string[]??[]).includes(String(m.id))?{...m,status:'REVERSED'}:m);return {data:{_execute:1}}
 case 'FinancialIndicatorsDashboard':return box({options:{branches,products,categories,subcategories,suppliers:[],sources:[]},cards:{volume:25,revenueCents:'30000',providerFeeCents:'1500',netRevenueCents:'28500',costCents:'16000',grossProfitCents:'14000',profitCents:'12500',marginPercent:41.67,ticketCents:'1200',financialPendingSales:0},monthly:{lastVolume:25,averageVolume:20,volumeGrowth:25,lastProfitCents:'12500',averageProfitCents:'10000',profitGrowth:25,months:2},daily:[{date:'2025-10-21',volume:10,revenueCents:'12000',profitCents:'5000'},{date:'2026-10-21',volume:15,revenueCents:'18000',profitCents:'7500'}],products:products.map((x,i)=>({...x,quantity:i+1,revenueCents:'1200',providerFeeCents:'60',netRevenueCents:'1140',costCents:'800',grossProfitCents:'400',profitCents:i%7?-340:340,marginPercent:28.33,lineCount:1}))})
 case 'OperationalAnalyticsDashboard':return box({stock:{cards:{quantity:500,costCents:400000},monthly:[],products:products.map(x=>({...x,quantity:20,averageCostCents:800,costCents:16000,minimumStock:5,maximumStock:30,status:'NORMAL'}))},customers:{cards:{customers:1201,activeCustomers:1100},abc:[],regions:[],birthdays:Array.from({length:51},(_,i)=>({id:uuid(5000+i),name:`ANIVERSARIANTE QA ${i+1}`,birthDate:'2000-10-21'})),dormant:Array.from({length:1201},(_,i)=>({id:uuid(6000+i),name:`SEM COMPRAR QA ${i+1}`,lastPurchase:null,revenueCents:1200}))},categories:categories.slice(0,8).map(x=>({...x,level:'Categoria',quantity:25,revenueCents:'30000',costCents:'16000',profitCents:'14000',marginPercent:46.67,growthPercent:10}))})
 case 'SalesChannelAnalyticsDashboard':return box({options:{branches,connections:[]},cards:{orders:25,sales:25,grossRevenueCents:30000},daily:[],byChannel:[],fees:[],payments:[],topProducts:[]})
 case 'SalesWorkspace':return box({tenant:{legalName:'EMPRESA FICTÍCIA QA',tradeName:'QA'},branches,customers:[],products,paymentMethods:[{id:uuid(50),name:'DINHEIRO',code:'CASH',requiresChange:true}],policy:{requireOpenSession:true,operatorDiscountPercent:5,operatorSurchargePercent:5,allowOperatorClose:true},openSession:{id:uuid(60),openedAt:when,openingAmountCents:'10000',expectedAmountCents:'10000',movementCount:0}})
 case 'SearchPosProducts':return {data:{_select:products.filter(x=>!v.search||x.name.includes(String(v.search).toUpperCase())).slice(0,30)}}
 case 'SearchPosCustomers':return {data:{_select:[]}}
 case 'PosProductBranches':return {data:{_select:branches.map(x=>({...x,quantity:20,availableStock:20}))}}
 case 'SalesChannelOptions':return box({branches,connections:[]})
 case 'LatestPendingSalesChannelOrder':return box({orders:[]})
 case 'SalesChannelConnectionsV2':case 'SalesChannelProductMappingsV2':case 'SalesChannelOrdersV2':case 'ListSales':return box({rows:[],totalCount:0,summary:{}})
 case 'SalesChannelOperations':return box({events:[],commands:[],syncs:[],summary:{}})
 case 'EnsureSalesDefaults':return {data:{_execute:1}}
 }
 // In-memory catalog writes are useful for forms and status flows. Unknown
 // operations fail explicitly; they never pretend to validate a real backend.
 const sub=name.includes('Subcategor'),cat=name.includes('Categor')
 if(cat){
  const list=sub?subcategories:categories,rows=(v.names??v.items??[v.name??'NOVA CATEGORIA QA']) as unknown[]
  if(/^(Create|Update)/.test(name)){
   if(v.id){const row=list.find(x=>x.id===v.id);if(row)Object.assign(row,{name:v.name,categoryId:v.categoryId??row.categoryId})}
   else for(const value of rows){const x=typeof value==='object'&&value?value as Row:{name:value};list.push({id:uuid(12000+list.length),name:String(x.name??value).trim().toUpperCase(),categoryId:x.categoryId??uuid(300),categoryName:'CATEGORIA QA 001',active:true,createdAt:when,updatedAt:when,productCount:0,subcategoryCount:0})}
  }else{const ids=(v.ids??[v.id]) as string[];for(const row of list)if(ids.includes(String(row.id)))row.active=v.active??/^Restore/.test(name)}
  return {data:{_execute:(v.ids as unknown[]|undefined)?.length??rows.length}}
 }
 if(/^(SaveProduct|SaveCustomer|SaveSupplier|SaveBranch|SetProductsStatusBatch|SetCustomersStatusBatch|SetSuppliersStatusBatch|SetBranchesStatusBatch|SaveProductPromotion|ArchiveProductPromotion|OpenCashSession|RegisterCashMovement|CloseCashSession|UpdatePosPolicy)$/.test(name))return {data:{_execute:1}}
 throw new Error('QA: operação ainda sem fixture: '+name)
}
export const queryRef=(_dc:unknown,name:string,variables:unknown={})=>({name,variables})
export const mutationRef=queryRef
export const executeQuery=(ref:ReturnType<typeof queryRef>)=>qaOperation(ref.name,ref.variables)
export const executeMutation=executeQuery
export const httpsCallable=(_functions:unknown,name:string)=>async()=>{throw new Error('QA: chamada externa mockada e desativada: '+name)}
