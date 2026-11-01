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

it('A01 actual financial SQL selects immutable lines across Sao Paulo midnight, months, years and filters',async()=>{
 await db.query("UPDATE tenants SET timezone='America/Sao_Paulo' WHERE id=$1",[ids.tenant]);
 const specs=[['2026-01-01T02:59:59Z',1,800],['2026-01-01T03:00:00Z',800,900],['2026-02-01T02:59:59Z',1234,1234],['2026-02-01T03:00:00Z',100001,1]] as const;
 for(const [soldAt,revenue,cost]of specs){const sale=(await db.query<{id:string}>("INSERT INTO sales(tenant_id,branch_id,status,sold_at,total_cents,source) VALUES($1,$2,'COMPLETED',$3,$4,'POS') RETURNING id",[ids.tenant,ids.branch,soldAt,revenue])).rows[0]!;await db.query("INSERT INTO sale_items(tenant_id,sale_id,product_id,status,quantity,unit_cost_cents,total_cents) VALUES($1,$2,$3,'ACTIVE',1,$4,$5)",[ids.tenant,sale.id,ids.product,cost,revenue]);}
 const before=await db.query('SELECT * FROM sale_items ORDER BY id');
 const read=async(from:string,to:string,filters:Record<string,unknown>={})=>(await operation(db,'FinancialIndicatorsDashboard',['actor',from,to,filters,'boundary-test-01'])).rows[0] as {data:{cards:{volume:number;revenueCents:string;costCents:string;profitCents:string};daily:{date:string;volume:number}[];products:{id:string;quantity:number}[]}};
 const dec=await read('2025-12-31','2025-12-31'),jan=await read('2026-01-01','2026-01-31'),feb=await read('2026-02-01','2026-02-28');
 expect(dec.data.cards).toMatchObject({volume:1,revenueCents:'1',costCents:'800',profitCents:'-799'});expect(jan.data.cards).toMatchObject({volume:2,revenueCents:'2034',costCents:'2134',profitCents:'-100'});expect(feb.data.cards).toMatchObject({volume:1,revenueCents:'100001',costCents:'1',profitCents:'100000'});
 expect(jan.data.daily).toHaveLength(31);expect(jan.data.daily.filter(r=>r.volume>0).map(r=>r.date)).toEqual(['2026-01-01','2026-01-31']);
 expect((await read('2026-01-01','2026-01-31',{products:[ids.product],branches:[ids.branch],categories:[ids.category],sources:['POS']})).data).toEqual(jan.data);
 expect((await read('2026-01-01','2026-01-31',{sources:['IFOOD']})).data.cards.volume).toBe(0);expect((await read('2026-01-01','2026-01-31',{branches:[ids.otherBranch]})).data.cards.volume).toBe(0);expect((await read('2026-01-01','2026-01-31')).data).toEqual(jan.data);expect(await db.query('SELECT * FROM sale_items ORDER BY id')).toEqual(before);
});
it('A01 actual channel SQL reconciles received/completed dates, fees and closed-period branch filters',async()=>{
 await db.query("UPDATE tenants SET timezone='America/Sao_Paulo' WHERE id=$1",[ids.tenant]);
 const sale=(await db.query<{id:string}>("INSERT INTO sales(tenant_id,branch_id,status,sold_at,total_cents,source) VALUES($1,$2,'COMPLETED','2026-02-01T03:00:00Z',1234,'IFOOD') RETURNING id",[ids.tenant,ids.branch])).rows[0]!;
 await db.query("INSERT INTO sale_items(tenant_id,sale_id,product_id,status,quantity,unit_cost_cents,total_cents) VALUES($1,$2,$3,'ACTIVE',2,400,1234)",[ids.tenant,sale.id,ids.product]);
 await db.query("UPDATE sales_channel_orders SET status='COMPLETED',sale_id=$1,received_at='2026-02-01T02:59:59Z',completed_at='2026-02-01T03:00:00Z',provider_fee_cents=34,net_amount_cents=1200,total_cents=1234 WHERE id=$2",[sale.id,ids.order]);
 const read=async(from:string,to:string,filters:Record<string,unknown>={})=>(await operation(db,'SalesChannelAnalyticsDashboard',['actor',from,to,filters,'channels-test-01'])).rows[0] as {data:{cards:Record<string,unknown>;byChannel:Record<string,unknown>[];topProducts:Record<string,unknown>[]}};
 expect((await read('2026-01-31','2026-01-31')).data.cards).toMatchObject({orders:1,sales:0,grossRevenueCents:'0'});
 const feb=await read('2026-02-01','2026-02-01');expect(feb.data.cards).toMatchObject({orders:0,sales:1,grossRevenueCents:'1234',providerFeeCents:'34',netRevenueCents:'1200',profitCents:'400'});expect(feb.data.topProducts[0]).toMatchObject({id:ids.product,quantity:2,revenueCents:'1234',netRevenueCents:'1200'});
 expect((await read('2026-02-01','2026-02-01',{branchId:ids.otherBranch})).data.cards.sales).toBe(0);expect((await read('2026-02-01','2026-02-01',{connectionId:ids.connection})).data).toEqual(feb.data);
});
