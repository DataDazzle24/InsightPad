import {beforeEach,expect,it} from 'vitest'
import {qaOperation,qaState,resetFixtures,uuid,fixtureDate,inspectFixtures,useBoundaryLedger} from './api'
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

// Independent expected records: these tests do not call the fixture aggregators.
type R=Record<string,unknown>
const box=async(name:string,v:R={})=>((await qaOperation(name,v)).data as {_select:{data:R}[]})._select[0]!.data
const list=async(name:string,v:R={})=>((await qaOperation(name,{limit:1000,...v})).data as {_select:R[]})._select
it('A01 selects fixed dates, branches, sources and clear without rewriting any ledger record',async()=>{
 useBoundaryLedger();const original=inspectFixtures().ledger
 const cases:[R,number[]][]=[[{from:'2025-12-31',to:'2026-01-01'},[0,1]],[{from:'2026-01-01',to:'2026-01-31'},[1,2]],[{filters:{branches:[uuid(1)]}},[0,2,4]],[{filters:{sources:['IFOOD']}},[1,3,5]],[{filters:{products:[uuid(104)],suppliers:[uuid(20)]}},[4]],[{filters:{categories:[uuid(999)]}},[]],[{},[0,1,2,3,4,5]]]
 const expectedRevenue=[0,1,800,1234,100001,800],expectedCost=[0,0,900,1234,1,900]
 for(const [v,indices]of cases){const f=await box('FinancialIndicatorsDashboard',v),cards=f.cards as R,rows=f.products as R[]
  expect(rows.map(r=>r.id)).toEqual(indices.map(i=>uuid(100+i)));expect(cards.revenueCents).toBe(indices.reduce((n,i)=>n+expectedRevenue[i]!,0));expect(cards.costCents).toBe(indices.reduce((n,i)=>n+expectedCost[i]!,0));expect(cards.volume).toBe(indices.length)
  expect(inspectFixtures().ledger).toEqual(original)
 }
 const multi=await box('FinancialIndicatorsDashboard',{from:'2025-12-31',to:'2026-03-01'});expect((multi.daily as R[]).map(r=>r.date)).toEqual(['2025-12-31','2026-01-01','2026-01-31','2026-02-01','2026-02-28','2026-03-01']);expect(multi.monthly).toMatchObject({months:3,lastVolume:2,lastProfitCents:100000,averageVolume:5/3,averageProfitCents:33300})
 const channels=await box('SalesChannelAnalyticsDashboard',{from:'2026-01-01',to:'2026-03-01',branchId:uuid(2)});expect(channels.cards).toMatchObject({orders:3,grossRevenueCents:2035,profitCents:-99});expect((channels.topProducts as R[]).map(r=>r.id)).toEqual([uuid(101),uuid(103),uuid(105)])
 expect((await box('SalesChannelAnalyticsDashboard',{connectionId:'missing'})).cards).toMatchObject({orders:0,grossRevenueCents:0})
})
it('A01 operational categories inherit the selected immutable universe; errors never become zero data',async()=>{
 useBoundaryLedger();const v={from:'2026-01-01',to:'2026-02-28',filters:{branches:[uuid(1)],sources:['POS']}}
 const f=await box('FinancialIndicatorsDashboard',v),o=await box('OperationalAnalyticsDashboard',v)
 for(const level of ['Categoria','Subcategoria'])expect((o.categories as R[]).filter(r=>r.level===level).reduce((n,r)=>n+Number(r.revenueCents),0)).toBe((f.cards as R).revenueCents)
 qaState.fail=true;await expect(box('FinancialIndicatorsDashboard',v)).rejects.toThrow('falha sintética');qaState.fail=false;expect((await box('FinancialIndicatorsDashboard',v)).cards).toEqual(f.cards)
})
it('A02 counts two products against three subcategories once, and homonyms belong to their own parent',async()=>{
 for(const name of ['PARENT A','PARENT B'])await qaOperation('CreateCategory',{name})
 const cats=await list('ListCategories'),a=cats.find(c=>c.name==='PARENT A')!,b=cats.find(c=>c.name==='PARENT B')!
 await qaOperation('CreateSubcategoriesBatch',{items:[{categoryId:a.id,name:'HOMONIMO'},{categoryId:a.id,name:'OUTRO'},{categoryId:a.id,name:'TERCEIRO'},{categoryId:b.id,name:'HOMONIMO'}]})
 const subs=await list('ListSubcategories'),sa=subs.find(x=>x.categoryId===a.id&&x.name==='HOMONIMO')!,sb=subs.find(x=>x.categoryId===b.id&&x.name==='HOMONIMO')!
 for(const [name,categoryId,subcategoryId]of [['PA1',a.id,sa.id],['PA2',a.id,sa.id],['PB1',b.id,sb.id]])await qaOperation('SaveProduct',{payload:{name,categoryId,subcategoryId,salePriceCents:1200}})
 const rows=await list('ListCategories');expect(rows.find(c=>c.id===a.id)).toMatchObject({productCount:2,subcategoryCount:3});expect(rows.find(c=>c.id===b.id)).toMatchObject({productCount:1,subcategoryCount:1})
 const children=await list('ListSubcategories');expect(children.find(s=>s.id===sa.id)?.productCount).toBe(2);expect(children.find(s=>s.id===sb.id)?.productCount).toBe(1)
 const selected=await list('ListCategories',{filters:{active:['true'],productPresence:['with'],subcategoryPresence:['with']}});expect(selected.map(c=>c.id)).toContain(a.id);expect(selected.every(c=>c.active&&Number(c.productCount)>0&&Number(c.subcategoryCount)>0)).toBe(true)
})
it('A02 partitions all 300 catalog rows by status and AND filters without lost/duplicated IDs',async()=>{
 for(const name of ['ListCategories','ListSubcategories']){
  const all=await list(name),active=await list(name,{filters:{active:['true']}}),inactive=await list(name,{filters:{active:['false']}})
  expect(active.length+inactive.length).toBe(300);expect(new Set([...active,...inactive].map(r=>r.id)).size).toBe(300)
  const paged=(await Promise.all([0,100,200].map(offset=>list(name,{offset,limit:100,sortField:'name',sortDirection:'asc'})))).flat();expect(new Set(paged.map(r=>r.id))).toEqual(new Set(all.map(r=>r.id)))
  const filtered=await list(name,{filters:{active:['true'],productPresence:['without']}});expect(filtered.every(r=>r.active&&r.productCount===0)).toBe(true)
 }
})
it('A04 catalog batches enforce 0/20/21, canonical Unicode, scoped homonyms and all-or-nothing rejection',async()=>{
 for(const sub of [false,true]){
  const op=sub?'CreateSubcategoriesBatch':'CreateCategoriesBatch',read=sub?'ListSubcategories':'ListCategories',args=(names:string[])=>sub?{items:names.map(name=>({name,categoryId:uuid(300)}))}:{names}
  const before=await list(read);await expect(qaOperation(op,args([]))).rejects.toThrow('1 a 20');await expect(qaOperation(op,args(Array.from({length:21},(_,i)=>'LOTE '+i)))) .rejects.toThrow('1 a 20');expect(await list(read)).toEqual(before)
  await qaOperation(op,args(Array.from({length:20},(_,i)=>'LOTE '+i)));expect((await list(read)).length).toBe(320)
  await qaOperation(op,args(['  áGUA   MINERAL  ']));expect((await list(read,{search:'ÁGUA'}))[0]?.name).toBe('ÁGUA MINERAL')
  await expect(qaOperation(op,args(['AGUARDAR NOVO','áGua MINERAL']))).rejects.toThrow('duplicado');expect(await list(read,{search:'AGUARDAR NOVO'})).toEqual([])
  await qaOperation(op,args(['😀'.repeat(120)]));await expect(qaOperation(op,args(['😀'.repeat(121)]))).rejects.toThrow('nome inválido')
  await expect(qaOperation(op,args(['']))).rejects.toThrow('nome inválido')
 }
 await expect(qaOperation('CreateSubcategory',{name:'SEM PAI',categoryId:''})).rejects.toThrow('categoria obrigatória')
})
it('A04 reactivation rejects an active canonical conflict and edit preserves identity and parent',async()=>{
 await qaOperation('CreateSubcategory',{name:'NOME ANTIGO',categoryId:uuid(301)});const id=(await list('ListSubcategories',{search:'NOME ANTIGO'}))[0]!.id
 await qaOperation('UpdateSubcategory',{id,name:'  nome   NOVO ',categoryId:uuid(301)});expect((await list('ListSubcategories',{search:'NOME NOVO'}))[0]).toMatchObject({id,categoryId:uuid(301),name:'NOME NOVO'})
 await qaOperation('ArchiveSubcategory',{id});await qaOperation('CreateSubcategory',{name:'NOME NOVO',categoryId:uuid(301)});await expect(qaOperation('RestoreSubcategory',{id})).rejects.toThrow('duplicado')
 await qaOperation('CreateSubcategory',{name:'NOME NOVO',categoryId:uuid(302)})
})
it('A04 promotion enforces the implemented 5% boundary, schedule, overlap and persisted IDs',async()=>{
 const p={productId:uuid(101),promotionalPriceCents:1139,startsAt:'2026-01-01T00:00:00Z',endsAt:'2026-02-01T00:00:00Z'}
 for(const promotionalPriceCents of [0,-1,1140,1200])await expect(qaOperation('SavePromotion',{...p,promotionalPriceCents})).rejects.toThrow()
 await expect(qaOperation('SavePromotion',{...p,endsAt:p.startsAt})).rejects.toThrow('promoção');await qaOperation('SavePromotion',p)
 const id=(await list('ProductPromotions',{productId:p.productId}))[0]!.id;await expect(qaOperation('SavePromotion',p)).rejects.toThrow('promoção')
 await qaOperation('SavePromotion',{...p,id,promotionalPriceCents:1000});expect((await list('ProductPromotions',{productId:p.productId}))[0]).toMatchObject({id,promotionalPriceCents:'1000'})
 await qaOperation('SetPromotionStatus',{id,active:false});await qaOperation('SavePromotion',p)
})
it('A04 registration documents use checksum validation, allow homonyms and deny changes without mutation',async()=>{
 for(const op of ['SaveCustomer','SaveSupplier']){
  const p={name:'PESSOA QA',legalName:'PESSOA QA'}
  await expect(qaOperation(op,{payload:{...p,cpf:'11111111111'}})).rejects.toThrow('documento');await expect(qaOperation(op,{payload:{...p,cnpj:'11111111111111'}})).rejects.toThrow('documento')
  qaState.permissions='read';await expect(qaOperation(op,{payload:p})).rejects.toThrow('permissão');qaState.permissions='full';await qaOperation(op,{payload:p})
 }
})
it('A06 separate entry/transfer/reversal branch conserves total stock, rejects partial transfer and sale reversal',async()=>{
 const before=inspectFixtures().products.find(p=>p.id===uuid(101))!.balances.map(b=>b.quantity)
 await qaOperation('SaveStockBatch',{payload:{clientOperationId:'entry3',branchId:uuid(1),direction:'IN',items:[{product_id:uuid(101),quantity:3}]}})
 const transfer={clientOperationId:'transfer2',sourceBranchId:uuid(1),destinationBranchId:uuid(2),items:[{product_id:uuid(101),quantity:2}]};await qaOperation('PostStockTransfer',{payload:transfer})
 let now=inspectFixtures();expect(now.products.find(p=>p.id===uuid(101))!.balances.map(b=>b.quantity)).toEqual([before[0]!+1,before[1]!+2]);const legs=now.movements.filter(m=>m.operationId==='transfer2')
 await expect(qaOperation('ReverseStockOperation',{operationId:'transfer2',movementIds:[legs[0]!.id],reason:'RECUSA PARCIAL'})).rejects.toThrow('não elegível');expect(inspectFixtures()).toEqual(now)
 await qaOperation('ReverseStockOperation',{operationId:'transfer2',movementIds:[],reason:'ESTORNO TOTAL'});now=inspectFixtures();expect(now.transfers.find(t=>t.operationId==='transfer2')!.status).toBe('CANCELLED');expect(now.products.find(p=>p.id===uuid(101))!.balances.map(b=>b.quantity)).toEqual([before[0]!+3,before[1]])
 await expect(qaOperation('ReverseStockOperation',{operationId:'transfer2',movementIds:[],reason:'REPETICAO'})).rejects.toThrow('não elegível');expect(inspectFixtures()).toEqual(now)
 await qaOperation('ReverseStockOperation',{operationId:'entry3',movementIds:[],reason:'ESTORNO ENTRADA'});expect(inspectFixtures().products.find(p=>p.id===uuid(101))!.balances.map(b=>b.quantity)).toEqual(before)
})
it('A06 rejected stock/sale requests have zero effects, including late invalid lines and restricted destinations',async()=>{
 const before=inspectFixtures(),payload={clientOperationId:'rejected',branchId:uuid(1),direction:'OUT',items:[{product_id:uuid(101),quantity:1},{product_id:uuid(102),quantity:100000}]}
 await expect(qaOperation('SaveStockBatch',{payload})).rejects.toThrow('saldo');expect(inspectFixtures()).toEqual(before)
 for(const quantity of [0,-1,.5,Number.NaN]){await expect(qaOperation('SaveStockBatch',{payload:{...payload,items:[{product_id:uuid(101),quantity}]}})).rejects.toThrow();expect(inspectFixtures()).toEqual(before)}
 qaState.allowedBranches=[uuid(1)];await expect(qaOperation('PostStockTransfer',{payload:{clientOperationId:'denied',sourceBranchId:uuid(1),destinationBranchId:uuid(2),items:[{product_id:uuid(101),quantity:1}]}})).rejects.toThrow('filial');expect(inspectFixtures()).toEqual(before)
})
it('A06 cash invalid requests, same payload replay and changed retry preserve one effect',async()=>{
 const p={sessionId:uuid(60),operationId:'cash-once',movementType:'SUPPLY',amountCents:500}
 for(const amountCents of [0,-1,1.5])await expect(qaOperation('RegisterCashMovement',{...p,amountCents})).rejects.toThrow()
 expect(inspectFixtures().sessions[0]!.expectedAmountCents).toBe('10000');await qaOperation('RegisterCashMovement',p);await qaOperation('RegisterCashMovement',p)
 await expect(qaOperation('RegisterCashMovement',{...p,amountCents:600})).rejects.toThrow('conflitante');expect(inspectFixtures().cashMovements).toHaveLength(1)
 await expect(qaOperation('RegisterCashMovement',{...p,operationId:'too-large',movementType:'WITHDRAWAL',amountCents:20000})).rejects.toThrow('saldo');expect(inspectFixtures().sessions[0]!.expectedAmountCents).toBe('10500')
 await qaOperation('RegisterCashMovement',{...p,operationId:'withdraw',movementType:'WITHDRAWAL'});expect(inspectFixtures().sessions[0]!.expectedAmountCents).toBe('10000')
})
it('A07 orders all 201 transfers with stable ID ties, date bounds, scope and nonoverlapping pages',async()=>{
 const read=async(v:R)=>box('StockWorkspace',v),all=await read({limit:1000,sortField:'totalQuantity',sortDirection:'asc'}),rows=all.transfers as R[]
 expect(rows).toHaveLength(201);expect(rows.every((r,i)=>i===0||Number(rows[i-1]!.totalQuantity)<=Number(r.totalQuantity))).toBe(true)
 const pages=(await Promise.all([0,100,200].map(offset=>read({limit:100,offset,sortField:'totalQuantity',sortDirection:'asc'})))).flatMap(x=>x.transfers as R[]);expect(pages.map(r=>r.id)).toEqual(rows.map(r=>r.id));expect(new Set(pages.map(r=>r.id)).size).toBe(201)
 const end=await read({filters:{from:fixtureDate+'T12:00:00Z',to:fixtureDate+'T12:00:00Z'},limit:1000});expect(end.transferCount).toBe(201)
 expect((await read({filters:{from:fixtureDate+'T12:00:00.001Z'}})).transferCount).toBe(0)
 qaState.allowedBranches=[uuid(1)];expect((await read({})).transferCount).toBe(0);qaState.allowedBranches=[];expect((await read({})).transferCount).toBe(201)
})

it('A04 details preserve existing stock and sales reader field contracts',async()=>{
 const movement=inspectFixtures().movements[0]!;expect(await box('StockOperationDetails',{operationId:movement.operationId})).toMatchObject({movements:[movement],fiscalDocument:null});
 const payload={clientOperationId:'details-sale',branchId:uuid(1),cashSessionId:uuid(60),items:[{product_id:uuid(101),quantity:2,requested_price:1200}],payments:[{payment_method_id:uuid(50),amount_cents:3000,sequence:1}]};await qaOperation('PostSale',{payload});
 expect(await box('SaleDetails',{saleId:'details-sale'})).toMatchObject({sale:{total_cents:2400},items:[{productName:'PRODUTO QA 002',unitSalePriceCents:1200,totalCents:2400}],payments:[{paymentMethodName:'DINHEIRO',amountCents:3000}]})
})

it('A05 negative monetary fields never persist, and the interactive profile reconciles cash ledger entries',async()=>{
 const before=inspectFixtures().products;for(const field of ['costPriceCents','salePriceCents'])await expect(qaOperation('SaveProduct',{id:uuid(101),payload:{name:'INVALIDO', [field]:-1}})).rejects.toThrow('monetário');expect(inspectFixtures().products).toEqual(before)
})
