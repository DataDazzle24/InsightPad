import { beforeAll,beforeEach,afterAll,afterEach,it,expect } from 'vitest';
import { database,seed,operation,ids } from './sql-fixture.js';
let db:Awaited<ReturnType<typeof database>>;
beforeAll(async()=>{db=await database();await seed(db);await db.exec("UPDATE app_pages SET page_key='ESTOQUE'");});
beforeEach(async()=>{await db.exec('BEGIN')});afterEach(async()=>{await db.exec('ROLLBACK')});afterAll(async()=>{await db.close()});
const run=(name:string,...args:unknown[])=>operation(db,name,['actor',...args]);
const payload=(id:string,quantity:number,extra:object={})=>({branchId:ids.branch,direction:'IN',clientOperationId:id,occurredAt:'2026-10-19T23:30:00-03:00',items:[{product_id:ids.product,quantity,unit_gross_cents:100,unit_cost_cents:100}],...extra});
const balances=async()=> (await db.query<{branch_id:string;quantity:number}>('SELECT branch_id,quantity FROM stock_balances ORDER BY branch_id')).rows.map(x=>({...x,quantity:Number(x.quantity)}));
it('first manual entry updates the ledger and materialized balance',async()=>{
 expect((await run('SaveStockBatch',payload('first-entry-0001',10))).affectedRows).toBe(1);
 expect(await balances()).toEqual([{branch_id:ids.branch,quantity:10}]);
});
it('editing an entry applies one net change to the materialized balance',async()=>{
 await db.query("INSERT INTO stock_movement_types(tenant_id,code,name,direction) VALUES($1,'MANUAL_IN','Entrada','IN')",[ids.tenant]);
 await run('SaveStockBatch',payload('entry-edit-0001',10));await run('SaveStockBatch',payload('entry-edit-0002',12,{replacesOperationId:'entry-edit-0001'}));
 expect(await balances()).toEqual([{branch_id:ids.branch,quantity:12}]);
});
it('first transfer preserves source cost and updates both balances',async()=>{
 await db.query("INSERT INTO stock_movement_types(tenant_id,code,name,direction) VALUES($1,'MANUAL_IN','Entrada','IN')",[ids.tenant]);
 await run('SaveStockBatch',payload('transfer-entry-01',10));
 expect((await run('PostStockTransfer',{sourceBranchId:ids.branch,destinationBranchId:ids.otherBranch,clientOperationId:'transfer-first-01',items:[{product_id:ids.product,quantity:5}]})).affectedRows).toBe(1);
 expect(await balances()).toEqual([{branch_id:ids.branch,quantity:5},{branch_id:ids.otherBranch,quantity:5}]);
 const cost=await db.query<{average_cost_cents:string}>('SELECT average_cost_cents FROM stock_balances WHERE branch_id=$1',[ids.otherBranch]);expect(Number(cost.rows[0]!.average_cost_cents)).toBe(100);
});
it('workspace pages 501 movements and 201 transfers while physical stock uses the full ledger',async()=>{
 await db.query("INSERT INTO stock_movement_types(id,tenant_id,code,name,direction) VALUES($1,$2,'MANUAL_IN','Entrada','IN')",[ids.event,ids.tenant]);
 await db.query("INSERT INTO stock_movements(tenant_id,branch_id,product_id,movement_type_id,client_operation_id,quantity,unit_cost_cents,status,occurred_at) SELECT $1,$2,$3,$4,'history-'||i,1,100,'POSTED',now()-i*interval '1 minute' FROM generate_series(1,501)i",[ids.tenant,ids.branch,ids.product,ids.event]);
 await db.query("INSERT INTO stock_transfers(tenant_id,source_branch_id,destination_branch_id,client_operation_id,status,requested_at) SELECT $1,$2,$3,'transfer-'||i,'COMPLETED',now()-i*interval '1 minute' FROM generate_series(1,201)i",[ids.tenant,ids.branch,ids.otherBranch]);
 const r=await run('StockWorkspace','test',{},100,500,'occurredAt','desc');const data=(r.rows[0] as {data:{movementCount:number;transferCount:number;movements:unknown[];products:Array<{balances:Array<{quantity:number}>}>}}).data;
 expect(data.movementCount).toBe(501);expect(data.transferCount).toBe(201);expect(data.movements).toHaveLength(1);expect(Number(data.products[0]!.balances[0]!.quantity)).toBe(501);
});
it('branch restriction blocks writes, transfers and hidden workspace branches',async()=>{
 await db.query('INSERT INTO user_branches(user_id,tenant_id,branch_id,active) VALUES(\'actor\',$1,$2,true)',[ids.tenant,ids.branch]);
 expect((await run('SaveStockBatch',payload('denied-branch-001',10,{branchId:ids.otherBranch}))).affectedRows).toBe(0);
 await db.query("INSERT INTO stock_movement_types(id,tenant_id,code,name,direction) VALUES($1,$2,'MANUAL_IN','Entrada','IN')",[ids.event,ids.tenant]);await db.query("INSERT INTO stock_movements(tenant_id,branch_id,product_id,movement_type_id,client_operation_id,quantity,status) VALUES($1,$2,$3,$4,'hidden-operation',1,'POSTED')",[ids.tenant,ids.otherBranch,ids.product,ids.event]);const details=await run('StockOperationDetails','hidden-operation','test');expect((details.rows[0] as {data:{movements:unknown[]}}).data.movements).toHaveLength(0);
 expect((await run('PostStockTransfer',{sourceBranchId:ids.branch,destinationBranchId:ids.otherBranch,clientOperationId:'denied-transfer-01',items:[{product_id:ids.product,quantity:1}]})).affectedRows).toBe(0);
 const r=await run('StockWorkspace','test',{},100,0,'','');expect((r.rows[0] as {data:{branches:unknown[]}}).data.branches).toHaveLength(1);
});
it('reservation limits outgoing stock; reversing selected manual IDs is idempotent',async()=>{
 await run('SaveStockBatch',payload('reserve-entry-01',10));
 await db.query("INSERT INTO sales_channel_stock_reservations(tenant_id,branch_id,product_id,order_id,quantity,status) VALUES($1,$2,$3,$4,3,'RESERVED')",[ids.tenant,ids.branch,ids.product,ids.order]);
 expect((await run('SaveStockBatch',payload('reserve-loss-001',8,{direction:'OUT'}))).affectedRows).toBe(0);
 expect((await run('PostStockTransfer',{sourceBranchId:ids.branch,destinationBranchId:ids.otherBranch,clientOperationId:'reserve-transfer-1',items:[{product_id:ids.product,quantity:8}]})).affectedRows).toBe(0);
 await run('SaveStockBatch',payload('reserve-loss-002',2,{direction:'OUT'}));
 const row=(await db.query<{id:string}>('SELECT id FROM stock_movements WHERE client_operation_id=\'reserve-loss-002\'')).rows[0]!;
 expect((await run('ReverseStockOperation','',[row.id],'Correção autorizada')).affectedRows).toBe(1);
 expect((await run('ReverseStockOperation','',[row.id],'Correção autorizada')).affectedRows).toBe(0);
 expect((await balances())[0]?.quantity).toBe(10);
 expect((await db.query<{occurred_at:Date}>('SELECT occurred_at FROM stock_movements WHERE client_operation_id=\'reserve-entry-01\'')).rows[0]?.occurred_at.toISOString()).toBe('2026-10-20T02:30:00.000Z');
});
it('unit fractions and mixed invalid input are rejected without partial writes',async()=>{
 expect((await run('SaveStockBatch',payload('unit-fraction-01',1.5))).affectedRows).toBe(0);
 expect((await run('SaveStockBatch',payload('mixed-invalid-01',1,{items:[{product_id:ids.product,quantity:1},{product_id:ids.category,quantity:0}]}))).affectedRows).toBe(0);
 await db.query('UPDATE products SET weighted_product=true WHERE id=$1',[ids.product]);
 expect((await run('SaveStockBatch',payload('weight-valid-01',1.5))).affectedRows).toBe(1);
});
