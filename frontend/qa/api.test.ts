import {beforeEach,expect,it} from 'vitest'
import {qaOperation,qaState,resetFixtures,uuid} from './api'
beforeEach(()=>{resetFixtures();qaState.fail=false;qaState.ackLoss=false;qaState.delay=0})
it('uses deterministic full datasets, pagination and explicit unknown-operation failures',async()=>{
 const a=await qaOperation('ListCategories',{limit:100,offset:0}),b=await qaOperation('ListCategories',{limit:100,offset:100});expect(a.data).toMatchObject({_selectFirst:{totalCount:151}});expect((b.data as {_select:unknown[]})._select).toHaveLength(51);
 const r=await qaOperation('OperationalAnalyticsDashboard');const data=(r.data as {_select:Array<{data:{customers:{birthdays:unknown[];dormant:unknown[]}}}>})._select[0]!.data;expect(data.customers.birthdays).toHaveLength(51);expect(data.customers.dormant).toHaveLength(1201);
 await expect(qaOperation('RealBackendNotMocked')).rejects.toThrow('operação ainda sem fixture');
})
it('simulates first ACK loss and only confirms the same in-memory operation payload',async()=>{
 qaState.ackLoss=true;const payload={clientOperationId:'qa-ack-001',branchId:uuid(1),direction:'IN',items:[]};await expect(qaOperation('SaveStockBatch',{payload})).rejects.toThrow('confirmação perdida');
 const result=await qaOperation('SaveStockBatch',{payload});expect(result.data).toMatchObject({_execute:0,confirmation:{receipt:{confirmed:true,replay:true,operationId:payload.clientOperationId}}});
 await expect(qaOperation('SaveStockBatch',{payload:{...payload,direction:'OUT'}})).rejects.toThrow('STOCK_NOT_CONFIRMED');
})
