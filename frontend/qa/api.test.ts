import {beforeEach,expect,it} from 'vitest'
import {qaOperation,qaState,resetFixtures,uuid} from './api'
beforeEach(()=>{resetFixtures();qaState.fail=false;qaState.ackLoss=false;qaState.delay=0;qaState.permissions='full';qaState.empty=false;qaState.allowedBranches=[]})
it('uses deterministic full datasets, pagination and explicit unknown-operation failures',async()=>{
 const a=await qaOperation('ListCategories',{limit:100,offset:0}),b=await qaOperation('ListCategories',{limit:100,offset:100});expect(a.data).toMatchObject({_selectFirst:{totalCount:151}});expect((b.data as {_select:unknown[]})._select).toHaveLength(51);
 const r=await qaOperation('OperationalAnalyticsDashboard');const data=(r.data as {_select:Array<{data:{customers:{birthdays:unknown[];dormant:unknown[]}}}>})._select[0]!.data;expect(data.customers.birthdays).toHaveLength(51);expect(data.customers.dormant).toHaveLength(1201);
 await expect(qaOperation('RealBackendNotMocked')).rejects.toThrow('operação ainda sem fixture');
})
it('simulates first ACK loss and only confirms the same in-memory operation payload',async()=>{
 qaState.ackLoss=true;const payload={clientOperationId:'qa-ack-001',branchId:uuid(1),direction:'IN',items:[{product_id:uuid(101),quantity:1}]};await expect(qaOperation('SaveStockBatch',{payload})).rejects.toThrow('confirmação perdida');
 const result=await qaOperation('SaveStockBatch',{payload});expect(result.data).toMatchObject({_execute:0,confirmation:{receipt:{confirmed:true,replay:true,operationId:payload.clientOperationId}}});
 await expect(qaOperation('SaveStockBatch',{payload:{...payload,direction:'OUT'}})).rejects.toThrow('STOCK_NOT_CONFIRMED');
})
it('persists product changes and cash state and supports a real synthetic sale with idempotent retry',async()=>{
 const payload={name:'PRODUTO EDITADO QA',salePriceCents:1500};await qaOperation('SaveProduct',{id:uuid(101),payload});
 expect((await qaOperation('ListProducts',{search:'EDITADO'})).data).toMatchObject({_select:[{id:uuid(101),name:payload.name}]});
 await qaOperation('CloseCashSession',{sessionId:uuid(60),countedAmountCents:10000,operationId:'close-qa'});
 expect((await qaOperation('SalesWorkspace',{branchId:uuid(1)})).data).toMatchObject({_select:[{data:{openSession:null}}]});
 await qaOperation('OpenCashSession',{branchId:uuid(1),openingAmountCents:5000,notes:'QA'});
 const w=(await qaOperation('SalesWorkspace',{branchId:uuid(1)})).data as {_select:Array<{data:{openSession:{id:string}}}>};
 const sale={clientOperationId:'sale-qa-1',branchId:uuid(1),cashSessionId:w._select[0]!.data.openSession.id,items:[{product_id:uuid(101),quantity:2,requested_price:1500}],payments:[{payment_method_id:uuid(50),amount_cents:3500,sequence:1}],discountCents:0,surchargeCents:0};
 expect((await qaOperation('PostSale',{payload:sale})).data).toMatchObject({_execute:1,result:{receipt:{data:{totalCents:3000,changeCents:500,status:'COMPLETED'}}}});
 expect((await qaOperation('PostSale',{payload:sale})).data).toMatchObject({_execute:1});expect((await qaOperation('ListSales',{})).data).toMatchObject({_select:[{id:'sale-qa-1',soldAt:expect.any(String),branchName:'MATRIZ QA',createdByUid:'qa-user'}],_selectFirst:{totalCount:1}});
 const after=(await qaOperation('SalesWorkspace',{branchId:uuid(1)})).data;expect(after).toMatchObject({_select:[{data:{openSession:{expectedAmountCents:'8000',movementCount:1}}}]});
 await expect(qaOperation('PostSale',{payload:{...sale,discountCents:1}})).rejects.toThrow();
 resetFixtures();expect((await qaOperation('ListProducts',{search:'EDITADO'})).data).toMatchObject({_select:[]});
})
it('filters stock before counting, numerically sorting and paginating, and rejects fake successes',async()=>{
 const read=async(offset:number)=>((await qaOperation('StockWorkspace',{filters:{branches:[uuid(1)]},sortField:'quantity',sortDirection:'desc',limit:2,offset})).data as {_select:Array<{data:{movements:Array<{id:string;branchId:string;quantity:number}>;movementCount:number}}>} )._select[0]!.data;
 const a=await read(0),b=await read(2);expect(a.movementCount).toBe(251);expect(a.movements.every(x=>x.branchId===uuid(1))).toBe(true);expect(a.movements.map(x=>x.quantity)).toEqual([5,5]);expect(new Set([...a.movements,...b.movements].map(x=>x.id)).size).toBe(4);
 await expect(qaOperation('SaveProductPromotion',{})).rejects.toThrow('sem fixture');
})

it('enforces fixture read permissions and branch scopes, updates stock once and resets deterministically',async()=>{
 qaState.permissions='read';await expect(qaOperation('SaveProduct',{payload:{name:'NEGADO'}})).rejects.toThrow('permissão');qaState.permissions='full';
 qaState.allowedBranches=[uuid(1)];const p={clientOperationId:'stock-memory-1',branchId:uuid(1),direction:'IN',items:[{product_id:uuid(101),quantity:3}]};await qaOperation('SaveStockBatch',{payload:p});await qaOperation('SaveStockBatch',{payload:p});
 const w=(await qaOperation('StockWorkspace',{limit:1000})).data as {_select:Array<{data:{products:Array<{id:string;balances:Array<{quantity:number}>}>;movements:Array<{operationId:string}>}}>} ;expect(w._select[0]!.data.products.find(x=>x.id===uuid(101))!.balances).toEqual([expect.objectContaining({quantity:23})]);expect(w._select[0]!.data.movements.filter(m=>m.operationId===p.clientOperationId)).toHaveLength(1);
 await expect(qaOperation('SaveStockBatch',{payload:{...p,clientOperationId:'stock-denied',branchId:uuid(2)}})).rejects.toThrow('filial');qaState.allowedBranches=[];resetFixtures();
})

it('matches channel contracts exactly with finite empty counters, totals and operations',async()=>{
 const contracts={SalesChannelConnectionsV2:['total','authorized','preparing','attention'],SalesChannelProductMappingsV2:['total','automatic','pending','errors'],SalesChannelOrdersV2:['pending','accepted','completed','attention']};
 for(const [operation,keys]of Object.entries(contracts)){
  const r=(await qaOperation(operation)).data as {_select:Array<{data:{rows:unknown[];total:number;summary:Record<string,number>}}>};const data=r._select[0]!.data;
  expect(data.rows).toEqual([]);expect(Number.isFinite(data.total)).toBe(true);expect(data.total).toBe(0);expect(Object.keys(data.summary).sort()).toEqual(keys.sort());expect(Object.values(data.summary).every(Number.isFinite)).toBe(true);
 }
 expect((await qaOperation('SalesChannelOperations')).data).toMatchObject({_select:[{data:{events:[],commands:[],jobs:[],summary:{eventFailures:0,queuedCommands:0,syncFailures:0}}}]});
});
it('uses identical current product prices in list and POS after editing, and supplier legal identities',async()=>{
 const price='1799',name='PRODUTO QA CONTRATO';await qaOperation('SaveProduct',{id:uuid(101),payload:{name,salePriceCents:price}});
 expect((await qaOperation('ListProducts',{search:name})).data).toMatchObject({_select:[{id:uuid(101),name,salePriceCents:price,effectivePriceCents:price,listPriceCents:price}]});
 expect((await qaOperation('SearchPosProducts',{branchId:uuid(1),search:name})).data).toMatchObject({_select:[{id:uuid(101),name,salePriceCents:price,effectivePriceCents:price,listPriceCents:price}]});
 expect((await qaOperation('ListSuppliers',{limit:1})).data).toMatchObject({_select:[{id:uuid(4000),legalName:'FORNECEDOR FICTÍCIO QA 1'}],_selectFirst:{totalCount:101}});
 await expect(qaOperation('SaveProduct',{id:uuid(101),payload:{name,salePriceCents:'NaN'}})).rejects.toThrow('monetário');
});
