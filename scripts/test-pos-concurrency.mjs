// Isolated synthetic PostgreSQL 18 concurrency test; run as a non-root user.
// npm install --prefix /tmp/insightpad-pg embedded-postgres@18.4.0-beta.17
// node scripts/test-pos-concurrency.mjs /tmp/insightpad-pg/node_modules/embedded-postgres/dist/index.js
import ts from '../functions/node_modules/typescript/lib/typescript.js';
import {readFile,writeFile,mkdtemp,rm} from 'node:fs/promises';
import {tmpdir} from 'node:os';
import {join} from 'node:path';
import {pathToFileURL} from 'node:url';
import assert from 'node:assert/strict';
import {randomBytes} from 'node:crypto';
if(!process.argv[2]) throw new Error('Informe o módulo embedded-postgres instalado em um diretório temporário.');
const {default:EmbeddedPostgres}=await import(pathToFileURL(process.argv[2]).href);
const directory=await mkdtemp(join(tmpdir(),'insightpad-pos-test-'));
const source=await readFile(new URL('../functions/test/sql-fixture.ts',import.meta.url),'utf8');
let fixture=ts.transpileModule(source,{compilerOptions:{target:ts.ScriptTarget.ES2022,module:ts.ModuleKind.ES2022}}).outputText;
fixture=fixture.replace(/import \{ PGlite \} from "@electric-sql\/pglite";\n/,'').replace('new URL("../../dataconnect/", import.meta.url)',`new URL(${JSON.stringify(new URL('../dataconnect/',import.meta.url).href)})`);
const fixturePath=join(directory,'fixture.mjs');await writeFile(fixturePath,fixture);
const {schemaStatements,seed,operation,ids}=await import(pathToFileURL(fixturePath).href);
const pg=new EmbeddedPostgres({databaseDir:join(directory,'pg'),user:'postgres',password:randomBytes(24).toString('hex'),port:55438,persistent:false,createPostgresUser:false,onLog:()=>{},onError:()=>{}});
const clients=[];let count=0;
const connect=async()=>{const c=pg.getPgClient('postgres','127.0.0.1');await c.connect();clients.push(c);return {query:async(...args)=>{const r=await c.query(...args);return {...r,affectedRows:r.rowCount}},exec:sql=>c.query(sql),client:c};};
let admin,a,b;
const cash='00000000-0000-4000-8000-000000000060';
let session;
const payload=(uid='actor',sessionId=session,operationId=crypto.randomUUID())=>({branchId:ids.branch,cashSessionId:sessionId,clientOperationId:operationId,customerId:null,replacesSaleId:null,discountCents:0,surchargeCents:0,items:[{product_id:ids.product,quantity:1,requested_price:1500}],payments:[{payment_method_id:cash,amount_cents:1500,sequence:1}]});
const transact=async(db,name,args)=>{await db.exec('BEGIN');try{const r=await operation(db,name,args);await db.exec('COMMIT');return r}catch(e){await db.exec('ROLLBACK');throw e}};
const reset=async()=>{
 await admin.exec('TRUNCATE cash_movements,sale_items,sale_payments,stock_movements,cash_sessions,sales,audit_logs,stock_balances,stock_movement_types');
 await admin.query('INSERT INTO stock_balances(tenant_id,branch_id,product_id,quantity) VALUES ($1,$2,$3,20)',[ids.tenant,ids.branch,ids.product]);
 await transact(admin,'OpenCashSession',['actor',ids.branch,1000,'']);
 session=(await admin.query("SELECT id FROM cash_sessions WHERE opened_by_uid='actor'")).rows[0].id;
};
async function heldRace(firstDb,firstName,firstArgs,secondDb,secondName,secondArgs){
 await firstDb.exec('BEGIN');await operation(firstDb,firstName,firstArgs);
 const waiting=transact(secondDb,secondName,secondArgs);
 let blocked=false;
 for(let i=0;i<40;i++){
  const r=await admin.query("SELECT count(*)::int n FROM pg_stat_activity WHERE datname=current_database() AND wait_event_type='Lock'");
  if(r.rows[0].n){blocked=true;break}await new Promise(resolve=>setTimeout(resolve,25));
 }
 assert.ok(blocked,'second transaction should wait for the first branch lock');
 await firstDb.exec('COMMIT');return waiting;
}
try{
 await pg.initialise();await pg.start();admin=await connect();a=await connect();b=await connect();
 for(const sql of schemaStatements())await admin.exec(sql);await seed(admin);
 await admin.exec("INSERT INTO app_pages(id,page_key,active) VALUES (gen_random_uuid(),'CAIXA',true),(gen_random_uuid(),'GESTAO_VENDAS',true)");
 await admin.query("INSERT INTO role_page_permissions(role_id,page_id,tenant_id,can_access,can_create,can_delete,can_manage) SELECT $1,id,$2,true,true,true,true FROM app_pages WHERE page_key IN('CAIXA','GESTAO_VENDAS')",[ids.role,ids.tenant]);
 await admin.query("INSERT INTO role_page_permissions(role_id,page_id,tenant_id,can_access,can_create,can_delete,can_manage) SELECT $1,id,$2,true,true,false,false FROM app_pages WHERE page_key IN('CAIXA','GESTAO_VENDAS')",[ids.operatorRole,ids.tenant]);
 await admin.query("INSERT INTO payment_methods(id,tenant_id,code,name,requires_change) VALUES ($1,$2,'CASH','Dinheiro',true)",[cash,ids.tenant]);
 console.log('PostgreSQL', (await admin.query('SHOW server_version')).rows[0].server_version);
 await reset();const same=payload();await Promise.all([transact(a,'PostSale',['actor',same]),transact(b,'PostSale',['actor',same])]);
 assert.equal((await admin.query('SELECT count(*)::int n FROM sales')).rows[0].n,1);assert.equal((await admin.query('SELECT quantity::int n FROM stock_balances')).rows[0].n,19);count++;
 await reset();await heldRace(a,'PostSale',['actor',payload()],b,'CloseCashSession',['actor',session,2500,'']);
 assert.equal((await admin.query('SELECT expected_amount_cents::int n FROM cash_sessions')).rows[0].n,2500);count++;
 await reset();await assert.rejects(heldRace(a,'CloseCashSession',['actor',session,1000,''],b,'PostSale',['actor',payload()]),/POS_REJECTED/);
 assert.equal((await admin.query('SELECT count(*)::int n FROM sales')).rows[0].n,0);count++;
 await reset();await transact(admin,'OpenCashSession',['operator',ids.branch,0,'']);const operatorSession=(await admin.query("SELECT id FROM cash_sessions WHERE opened_by_uid='operator'")).rows[0].id;
 await admin.exec('UPDATE stock_balances SET quantity=1');
 const results=await Promise.allSettled([transact(a,'PostSale',['actor',payload()]),transact(b,'PostSale',['operator',payload('operator',operatorSession)])]);
 assert.equal(results.filter(r=>r.status==='fulfilled').length,1);assert.equal((await admin.query('SELECT quantity::int n FROM stock_balances')).rows[0].n,0);count++;
 await reset();await heldRace(a,'RegisterCashMovement',['actor',session,'SUPPLY',100,'Teste concorrência'],b,'CloseCashSession',['actor',session,1100,'']);
 assert.equal((await admin.query('SELECT expected_amount_cents::int n FROM cash_sessions')).rows[0].n,1100);count++;
 await reset();await assert.rejects(heldRace(a,'CloseCashSession',['actor',session,1000,''],b,'RegisterCashMovement',['actor',session,'WITHDRAWAL',100,'Teste concorrência']),/POS_REJECTED/);
 assert.equal((await admin.query("SELECT count(*)::int n FROM cash_movements WHERE movement_type='WITHDRAWAL'")).rows[0].n,0);count++;
 console.log('POS_CONCURRENCY_PASS',count);
}finally{await Promise.allSettled(clients.map(c=>c.end()));await pg.stop();await rm(directory,{recursive:true,force:true});}
