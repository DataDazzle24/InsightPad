import {beforeEach,expect,it} from 'vitest'
import {qaOperation,qaState,resetFixtures,uuid,fixtureDate} from './api'
beforeEach(()=>{resetFixtures();qaState.fail=false;qaState.ackLoss=false;qaState.delay=0;qaState.permissions='full';qaState.empty=false;qaState.allowedBranches=[]})
it('uses deterministic full datasets, pagination and explicit unknown-operation failures',async()=>{
 const a=await qaOperation('ListCategories',{limit:100,offset:0}),b=await qaOperation('ListCategories',{limit:100,offset:100});expect(a.data).toMatchObject({_selectFirst:{totalCount:300}});expect((b.data as {_select:unknown[]})._select).toHaveLength(100);
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

it('reconciles monetary cards, daily rows, product rows and customer counts from the same QA ledger',async()=>{
 const read=async(name:string,v:Record<string,unknown>={})=>((await qaOperation(name,v)).data as {_select:Array<{data:{cards:Record<string,number>;products:Array<Record<string,number>>;daily:Array<Record<string,number>>;customers:{cards:Record<string,number>;dormant:unknown[];abc:unknown[]};stock:{cards:Record<string,number>;products:Array<{inQuantity:number;valueCents:number}>}}}>})._select[0]!.data
 const f=await read('FinancialIndicatorsDashboard',{from:fixtureDate,to:fixtureDate});
 for(const key of ['revenueCents','costCents','providerFeeCents','netRevenueCents','grossProfitCents','profitCents']){expect(Number(f.cards[key])).toBe(f.products.reduce((n:number,r:Record<string,unknown>)=>n+Number(r[key]),0));expect(Number(f.cards[key])).toBe(f.daily.reduce((n:number,r:Record<string,unknown>)=>n+Number(r[key]),0))}
 expect(new Set(f.products.map((r:Record<string,unknown>)=>r.costCents)).size).toBeGreaterThan(3);expect(f.cards.volume).toBe(f.products.length)
 const o=await read('OperationalAnalyticsDashboard',{from:fixtureDate,to:fixtureDate});expect(o.customers.cards.withoutPurchase).toBe(o.customers.dormant.length);expect(o.customers.cards.active).toBe(o.customers.abc.length+o.customers.dormant.length);expect(o.stock.cards.inboundQuantity).toBe(o.stock.products.reduce((n:number,r:{inQuantity:number})=>n+r.inQuantity,0));expect(o.stock.cards.inboundValueCents-o.stock.cards.lossValueCents-o.stock.cards.saleCostCents).toBe(o.stock.products.reduce((n:number,r:{valueCents:number})=>n+r.valueCents,0));
 const outside=await read('FinancialIndicatorsDashboard',{from:'2001-01-01',to:'2001-01-31'});expect(outside.cards.revenueCents).toBe(0);expect(outside.products).toEqual([])
 const stock=(await qaOperation('StockWorkspace')).data as {_select:Array<{data:{products:Array<{balances:Array<{quantity:number}>}>}}>} ;expect(new Set(stock._select[0]!.data.products.map(p=>p.balances[0]!.quantity)).size).toBeGreaterThan(5)
})
it('selects immutable analytical records without recomputing quantities or money',async()=>{
 const read=async(v={})=>((await qaOperation('FinancialIndicatorsDashboard',v)).data as {_select:{data:{products:Record<string,unknown>[]}}[]})._select[0]!.data.products;
 const all=await read(),target=all[17]!;expect(target.category).toBe('CATEGORIA QA 001');expect(target.subcategory).toBe('SUBCATEGORIA QA 001');const selected=await read({filters:{products:[target.id]}});expect(selected).toEqual([target]);
 await qaOperation('SaveProduct',{id:target.id,payload:{name:'EDITADO SEM REESCREVER HISTÓRICO',salePriceCents:'9999'}});expect(await read({filters:{products:[target.id]}})).toEqual([target]);expect(await read()).toEqual(all);
})
it('derives category/subcategory counts from actual product relationships',async()=>{
 const read=async(name:string)=>(await qaOperation(name,{limit:1000})).data as {_select:Record<string,unknown>[]};
 const products=(await read('ListProducts'))._select,categories=(await read('ListCategories'))._select,subs=(await read('ListSubcategories'))._select;
 for(const c of categories){expect(c.productCount).toBe(products.filter(p=>p.categoryId===c.id).length);expect(c.subcategoryCount).toBe(subs.filter(s=>s.categoryId===c.id).length)}
 for(const s of subs)expect(s.productCount).toBe(products.filter(p=>p.subcategoryId===s.id).length);
})
it('supports existing customer supplier branch and promotion contracts without fake writes',async()=>{
 for(const [save,list]of [['SaveCustomer','ListCustomers'],['SaveSupplier','ListSuppliers'],['SaveBranch','ListBranches']]){
  await qaOperation(save!,{payload:{name:'NOME NOVO QA',legalName:'NOME NOVO QA',cpf:'529.982.247-25'}});const data=(await qaOperation(list!,{search:'NOME NOVO QA'})).data as {_select:{id:string}[]};const id=data._select[0]!.id;
  await expect(qaOperation(save!,{payload:{name:'NOME NOVO QA',legalName:'NOME NOVO QA',cpf:'52998224725'}})).rejects.toThrow('duplicado');await qaOperation(save!,{id,payload:{name:'NOME EDITADO QA',legalName:'NOME EDITADO QA',cpf:'52998224725'}});expect((await qaOperation(list!,{search:'NOME NOVO QA'})).data).toMatchObject({_select:[]});
  qaState.permissions='read';await expect(qaOperation(save!,{id,payload:{name:'NEGADO'}})).rejects.toThrow('permissão');qaState.permissions='full';
 }
 await qaOperation('SavePromotion',{productId:uuid(101),promotionalPriceCents:'999',startsAt:'2000-01-01',endsAt:'2099-01-01'});expect((await qaOperation('ProductPromotions',{productId:uuid(101)})).data).toMatchObject({_select:[{promotionalPriceCents:'999',status:'ACTIVE'}]});
})
it('reconciles sale and cancellation once across cash stock and the same sale ID',async()=>{
 await qaOperation('SaveStockBatch',{payload:{clientOperationId:'initial-stock',branchId:uuid(1),direction:'OUT',items:[{product_id:uuid(101),quantity:10}]}});
 const sale={clientOperationId:'coherent-sale',branchId:uuid(1),cashSessionId:uuid(60),items:[{product_id:uuid(101),quantity:2,requested_price:1200}],payments:[{payment_method_id:uuid(50),amount_cents:3000,sequence:1}]};
 await qaOperation('PostSale',{payload:sale});const read=async()=>((await qaOperation('SalesWorkspace',{branchId:uuid(1)})).data as {_select:{data:{openSession:{expectedAmountCents:string};products:{id:string;stock:number}[]}}[]})._select[0]!.data;
 const sold=await read();expect(sold.openSession.expectedAmountCents).toBe('12400');expect(sold.products.find(p=>p.id===uuid(101))!.stock).toBe(8);
 await qaOperation('CancelSale',{saleId:sale.clientOperationId,reason:'teste isolado'});await qaOperation('CancelSale',{saleId:sale.clientOperationId,reason:'mesmo cancelamento'});const cancelled=await read();expect(cancelled.openSession.expectedAmountCents).toBe('10000');expect(cancelled.products.find(p=>p.id===uuid(101))!.stock).toBe(10);
})
it('rejects unit component fractions, preserves weighed quantities and resets added branches',async()=>{
 const payload={name:'KIT TESTE',bundleProduct:true,salePriceCents:1200};
 await expect(qaOperation('SaveProduct',{payload,components:[{productId:uuid(101),quantity:.5}]})).rejects.toThrow('componente');
 await qaOperation('SaveProduct',{payload,components:[{productId:uuid(100),quantity:.5}]});const data=(await qaOperation('ListProducts',{search:'KIT TESTE'})).data as {_select:{id:string}[]};expect((await qaOperation('ProductComponents',{productId:data._select[0]!.id})).data).toMatchObject({_select:[{productId:uuid(100),quantity:.5}]});
 await qaOperation('SaveBranch',{payload:{name:'FILIAL ADICIONAL'}});resetFixtures();expect((await qaOperation('ListBranches',{limit:1000})).data).toMatchObject({_selectFirst:{totalCount:2}});
})
it('keeps uncertain sale ACK retry payload and applies cash and stock once',async()=>{
 const payload={clientOperationId:'sale-ack',branchId:uuid(1),cashSessionId:uuid(60),items:[{product_id:uuid(101),quantity:2,requested_price:1200}],payments:[{payment_method_id:uuid(50),amount_cents:3000,sequence:1}]};qaState.ackLoss=true;
 await expect(qaOperation('PostSale',{payload})).rejects.toThrow('confirmação perdida');await qaOperation('PostSale',{payload});await expect(qaOperation('PostSale',{payload:{...payload,discountCents:1}})).rejects.toThrow('conflitante');
 expect((await qaOperation('SalesWorkspace',{branchId:uuid(1)})).data).toMatchObject({_select:[{data:{openSession:{expectedAmountCents:'12400',movementCount:1}}}]});
})
it('reconciles category and subcategory analytical groups with the immutable financial ledger',async()=>{
 const f=(await qaOperation('FinancialIndicatorsDashboard')).data as {_select:{data:{cards:{revenueCents:number}}}[]};const o=(await qaOperation('OperationalAnalyticsDashboard')).data as {_select:{data:{categories:{level:string;revenueCents:number}[]}}[]};
 for(const level of ['Categoria','Subcategoria'])expect(o._select[0]!.data.categories.filter(x=>x.level===level).reduce((n,x)=>n+x.revenueCents,0)).toBe(f._select[0]!.data.cards.revenueCents);
})

it('allows customer and supplier homonyms while rejecting duplicate active normalized documents',async()=>{
 for(const name of ['SaveCustomer','SaveSupplier']){await qaOperation(name,{payload:{name:'HOMONIMO QA',legalName:'HOMONIMO QA'}});await qaOperation(name,{payload:{name:'HOMONIMO QA',legalName:'HOMONIMO QA'}});await qaOperation(name,{payload:{name:'OUTRO QA',legalName:'OUTRO QA',cpf:'529.982.247-25'}});await expect(qaOperation(name,{payload:{name:'OUTRO NOME QA',legalName:'OUTRO NOME QA',cpf:'52998224725'}})).rejects.toThrow('duplicado')}
})
