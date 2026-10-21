import {beforeAll,beforeEach,afterEach,afterAll,expect,it} from 'vitest';
import {database,seed,ids,operation} from './sql-fixture.js';
let db:Awaited<ReturnType<typeof database>>;
beforeAll(async()=>{db=await database();await seed(db);await db.exec("UPDATE app_pages SET page_key='ESTOQUE'");},30000);
beforeEach(async()=>{await db.exec('BEGIN')});afterEach(async()=>{await db.exec('ROLLBACK')});afterAll(async()=>{await db.close()});
const payload=(id:string,extra:object={})=>({clientOperationId:id,branchId:ids.branch,direction:'IN',occurredAt:'2026-10-21T12:00:00Z',notes:'Recebimento sintético',items:[{product_id:ids.product,quantity:10,unit_gross_cents:100,unit_cost_cents:100}],...extra});
const run=(name:string,p:object,user='actor')=>operation(db,name,[user,p]);
const receipt=(result:unknown)=>(result as {receipt?:{confirmed:boolean;replay:boolean;operationId:string;kind:string}}).receipt;
it('recognizes a lost acknowledgment by exact operation/actor/tenant/payload without duplicating stock',async()=>{
 const p=payload('receipt-entry-0001');const first=await run('SaveStockBatch',p);expect(receipt(first)).toMatchObject({confirmed:true,replay:false,operationId:p.clientOperationId,kind:'STOCK_BATCH'});
 const again=await run('SaveStockBatch',p);expect(again.affectedRows).toBe(0);expect(receipt(again)).toMatchObject({confirmed:true,replay:true});
 expect((await db.query('SELECT * FROM stock_movements')).rows).toHaveLength(1);expect(Number((await db.query('SELECT quantity FROM stock_balances')).rows[0]!.quantity)).toBe(10);
});
it('does not accept a conflicting payload or another actor with the same operation id',async()=>{
 const p=payload('receipt-entry-0002');await run('SaveStockBatch',p);
 for(const changed of [{...p,notes:'Outro conteúdo'},{...p,branchId:ids.otherBranch},{...p,items:[{product_id:ids.product,quantity:20,unit_cost_cents:100}]}])await expect(run('SaveStockBatch',changed)).rejects.toThrow('STOCK_NOT_CONFIRMED');
 await expect(run('SaveStockBatch',p,'operator')).rejects.toThrow('STOCK_NOT_CONFIRMED');
 expect((await db.query('SELECT * FROM stock_movements')).rows).toHaveLength(1);
});
it('does not convert a denied or invalid zero into a confirmation',async()=>{
 await expect(run('SaveStockBatch',payload('receipt-denied-01',{direction:'OUT'}))).rejects.toThrow('STOCK_NOT_CONFIRMED');
 const p=payload('receipt-entry-0003');await run('SaveStockBatch',p);await db.exec('UPDATE role_page_permissions SET can_create=false');
 await expect(run('SaveStockBatch',p)).rejects.toThrow('STOCK_NOT_CONFIRMED');
});
it('recognizes an exact transfer replay after ACK loss, preserving balances and rejecting changed content',async()=>{
 await run('SaveStockBatch',payload('receipt-stock-source'));
 const p={clientOperationId:'receipt-transfer-01',sourceBranchId:ids.branch,destinationBranchId:ids.otherBranch,notes:'Sintética',items:[{product_id:ids.product,quantity:3}]};
 expect(receipt(await run('PostStockTransfer',p))).toMatchObject({confirmed:true,replay:false,kind:'STOCK_TRANSFER'});
 const again=await run('PostStockTransfer',p);expect(again.affectedRows).toBe(0);expect(receipt(again)).toMatchObject({confirmed:true,replay:true});
 await expect(run('PostStockTransfer',{...p,notes:'Conflito'})).rejects.toThrow('STOCK_NOT_CONFIRMED');
 await expect(run('PostStockTransfer',p,'operator')).rejects.toThrow('STOCK_NOT_CONFIRMED');
 expect((await db.query('SELECT * FROM stock_transfers')).rows).toHaveLength(1);
 const balances=(await db.query('SELECT branch_id,quantity FROM stock_balances ORDER BY branch_id')).rows.map(r=>Number(r.quantity));expect(balances).toEqual([7,3]);
});
it('does not acknowledge legacy unverified receipts or a currently hidden branch',async()=>{
 const p=payload('receipt-entry-0004');await run('SaveStockBatch',p);
 await db.exec("UPDATE audit_logs SET after_data=after_data-'payloadHash'");await expect(run('SaveStockBatch',p)).rejects.toThrow('STOCK_NOT_CONFIRMED');
 const next=payload('receipt-entry-0005');await run('SaveStockBatch',next);
 await db.query("INSERT INTO user_branches(user_id,tenant_id,branch_id,active) VALUES('actor',$1,$2,true)",[ids.tenant,ids.otherBranch]);await expect(run('SaveStockBatch',next)).rejects.toThrow('STOCK_NOT_CONFIRMED');
});
