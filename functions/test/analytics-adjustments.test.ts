import { beforeAll,beforeEach,afterAll,afterEach,it,expect } from 'vitest';
import { database,seed,operation,ids } from './sql-fixture.js';
let db:Awaited<ReturnType<typeof database>>;
beforeAll(async()=>{db=await database();await seed(db);await db.exec("UPDATE app_pages SET page_key='RELATORIOS_OPERACIONAIS'");});beforeEach(async()=>{await db.exec('BEGIN')});afterEach(async()=>{await db.exec('ROLLBACK')});afterAll(async()=>{await db.close()});
const run=(name:string)=>operation(db,name,['actor','2026-10-01','2026-10-31',{},'request-test-01']);
it('operational query executes every dataset including the region aggregation',async()=>{
 await db.query("INSERT INTO customers(tenant_id,name,city,state_code) VALUES($1,'Cliente 1','Rio','RJ'),($1,'Cliente 2','Rio','RJ')",[ids.tenant]);
 const data=(await run('OperationalAnalyticsDashboard')).rows[0] as {data:{stock:{products:unknown[]};customers:{regions:Array<{customers:number}>};categories:unknown[]}};
 expect(data.data.stock.products).toEqual([]);expect(data.data.categories).toEqual([]);expect(data.data.customers.regions[0]?.customers).toBe(2);
});
it('financial totals are branch-authorized and revoked roles cannot read dashboards',async()=>{
 for(const branch of [ids.branch,ids.otherBranch]){
 const sale=(await db.query<{id:string}>("INSERT INTO sales(tenant_id,branch_id,status,sold_at,total_cents,source) VALUES($1,$2,'COMPLETED','2026-10-20T12:00:00Z',1000,'POS') RETURNING id",[ids.tenant,branch])).rows[0]!;
 await db.query("INSERT INTO sale_items(tenant_id,sale_id,product_id,status,quantity,unit_cost_cents,total_cents) VALUES($1,$2,$3,'ACTIVE',1,100,1000)",[ids.tenant,sale.id,ids.product]);}
 await db.query("INSERT INTO user_branches(user_id,tenant_id,branch_id,active) VALUES('actor',$1,$2,true)",[ids.tenant,ids.branch]);
 const data=(await run('FinancialIndicatorsDashboard')).rows[0] as {data:{cards:{volume:number;revenueCents:string}}};expect(data.data.cards.volume).toBe(1);expect(Number(data.data.cards.revenueCents)).toBe(1000);
 await db.query('UPDATE roles SET active=false WHERE id=$1',[ids.role]);await expect(run('FinancialIndicatorsDashboard')).rejects.toThrow('SESSION_REQUIRED');await expect(run('OperationalAnalyticsDashboard')).rejects.toThrow('SESSION_REQUIRED');
});
