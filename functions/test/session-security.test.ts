import { afterAll,afterEach,beforeAll,beforeEach,describe,expect,it } from 'vitest';
import { readFileSync } from 'node:fs';
import { createHash } from 'node:crypto';
import { database,ids,operation,seed } from './sql-fixture.js';
let db:Awaited<ReturnType<typeof database>>;
beforeAll(async()=>{db=await database();await seed(db);await db.exec("UPDATE app_pages SET page_key='ESTOQUE'");},30000);
beforeEach(async()=>{await db.exec('BEGIN')});afterEach(async()=>{await db.exec('ROLLBACK')});afterAll(async()=>{await db.close()});
async function claim(user='actor'){
 const result=await operation(db,'ClaimDeviceSession',[user,'synthetic-device-123456','Synthetic browser']);
 return (result as typeof result & {query:{issued:{token:string}}}).query.issued.token;
}
const valid=async(token:string,user='actor')=>(await operation(db,'ValidateDeviceSession',[user,token,'test'])).rows[0];
const write=(token:string|null)=>operation(db,'SaveStockBatch',['actor',{
 clientOperationId:crypto.randomUUID(),branchId:ids.branch,direction:'IN',reason:'Teste',
 items:[{product_id:ids.product,quantity:1,unit_cost_cents:100,unit_gross_cents:100}],
}],{sessionToken:token});
describe('server session authorization',()=>{
 it('issues server secrets and stores hashes; direct writes reject missing, guessed, hashed or displaced credentials',async()=>{
  const a=await claim(),b=await claim();expect(a).toMatch(/^[a-f0-9]{64}$/);expect(b).not.toBe(a);
  const hash=createHash('sha256').update(b).digest('hex');
  expect((await db.query("SELECT session_token FROM user_device_sessions WHERE user_id='actor'")).rows[0]).toEqual({session_token:hash});
  expect(await valid(a)).toEqual({valid:false});expect(await valid(b)).toEqual({valid:true});
  for(const token of [a,null,'0'.repeat(64),hash])await expect(write(token)).rejects.toThrow('SESSION_REQUIRED');
  expect((await db.query('SELECT * FROM stock_movements')).rows).toHaveLength(0);
  expect((await write(b)).affectedRows).toBe(1);expect((await db.query('SELECT * FROM stock_movements')).rows).toHaveLength(1);
  expect(await valid(b,'operator')).toEqual({valid:false});
 });
 it('old logout cannot revoke the replacement, while explicit release rejects writes and heartbeat',async()=>{
  const a=await claim(),b=await claim();expect((await operation(db,'ReleaseDeviceSession',['actor',a])).affectedRows).toBe(0);
  expect(await valid(b)).toEqual({valid:true});expect((await operation(db,'ReleaseDeviceSession',['actor',b])).affectedRows).toBe(1);
  expect(await valid(b)).toEqual({valid:false});await expect(write(b)).rejects.toThrow('SESSION_REQUIRED');
  await expect(operation(db,'TouchDeviceSession',['actor',b],{sessionToken:b})).rejects.toThrow('SESSION_REQUIRED');
 });
 it.each([
  ['idle',"UPDATE user_device_sessions SET last_seen_at=now()-interval '16 minutes'"],
  ['absolute',"UPDATE user_device_sessions SET claimed_at=now()-interval '13 hours'"],
 ])('rejects %s expiry without heartbeat resurrection',async(_name,sql)=>{
  const token=await claim();await db.exec(sql);expect(await valid(token)).toEqual({valid:false});await expect(write(token)).rejects.toThrow('SESSION_REQUIRED');
  await expect(operation(db,'TouchDeviceSession',['actor',token],{sessionToken:token})).rejects.toThrow('SESSION_REQUIRED');
 });
 it('heartbeats a live lease without extending its absolute deadline',async()=>{
  const token=await claim();await db.exec("UPDATE user_device_sessions SET last_seen_at=now()-interval '10 minutes'");
  const before=(await db.query("SELECT claimed_at FROM user_device_sessions WHERE user_id='actor'")).rows[0];
  expect((await operation(db,'TouchDeviceSession',['actor',token],{sessionToken:token})).affectedRows).toBe(1);
  expect((await db.query("SELECT claimed_at FROM user_device_sessions WHERE user_id='actor'")).rows[0]).toEqual(before);expect(await valid(token)).toEqual({valid:true});
 });
 it.each([
  ['inactive user',"UPDATE users SET active=false WHERE id='actor'"],['deleted user',"UPDATE users SET deleted_at=now() WHERE id='actor'"],
  ['blocked user',"UPDATE users SET blocked_until=now()+interval '1 hour' WHERE id='actor'"],
  ['inactive tenant','UPDATE tenants SET active=false'],['deleted tenant','UPDATE tenants SET deleted_at=now()'],
  ['inactive role','UPDATE roles SET active=false'],['deleted role','UPDATE roles SET deleted_at=now()'],
  ['foreign role',"UPDATE roles SET tenant_id='00000000-0000-4000-8000-000000000002'"],
 ])('rechecks %s on claim, validation, heartbeat and critical writes',async(_name,sql)=>{
  const token=await claim();await db.exec(sql);expect(await valid(token)).toEqual({valid:false});await expect(write(token)).rejects.toThrow('SESSION_REQUIRED');
  await expect(claim()).rejects.toThrow('SESSION_REQUIRED');await expect(operation(db,'TouchDeviceSession',['actor',token],{sessionToken:token})).rejects.toThrow('SESSION_REQUIRED');
 });
 it('requires the lease for privileged lookups used by user-invoked partner calls',async()=>{
  const token=await claim();await db.exec("UPDATE app_pages SET page_key='CANAIS_VENDA'");
  const lookup=(secret:string|null)=>operation(db,'SystemSalesChannelConnectionForActor',['actor',ids.connection,secret]);
  expect((await lookup(token)).rows).toHaveLength(1);expect((await lookup(null)).rows).toHaveLength(0);await claim();expect((await lookup(token)).rows).toHaveLength(0);
 });
 it('revocation survives user reactivation and changed role binding',async()=>{
  const token=await claim('operator');expect((await operation(db,'SetPlatformUserStatus',['actor','operator',false])).affectedRows).toBe(1);
  expect((await operation(db,'SetPlatformUserStatus',['actor','operator',true])).affectedRows).toBe(1);expect(await valid(token,'operator')).toEqual({valid:false});
  const next=await claim('operator');await operation(db,'LinkPlatformUser',['actor',{uid:'operator',tenantId:ids.tenant,roleId:ids.operatorRole,name:'Synthetic Operator',email:'operator@example.invalid'}]);
  expect(await valid(next,'operator')).toEqual({valid:false});
 });
 it('executes every protected operation SQL guard before any direct-call payload',async()=>{
  let count=0;
  for(const file of ['queries.gql','mutations.gql'])for(const m of readFileSync(new URL('../../dataconnect/app/'+file,import.meta.url),'utf8').matchAll(/^(query|mutation) (\w+)([^{}]*?)\{\n([\s\S]*?)\n\}/gm)){
   if(!m[3]!.includes('@auth(level: USER)')||!m[4]!.includes('session: _selectFirst'))continue;
   await expect(operation(db,m[2]!,['actor'],{sessionToken:null}),m[2]).rejects.toThrow('SESSION_REQUIRED');count++;
  }
  expect(count).toBeGreaterThan(100);
 });
 it('guards all user business operations and preserves background NO_ACCESS boundaries',()=>{
  for(const file of ['queries.gql','mutations.gql']){
   const source=readFileSync(new URL('../../dataconnect/app/'+file,import.meta.url),'utf8');
   for(const m of source.matchAll(/^(query|mutation) (\w+)([^{}]*?)\{\n([\s\S]*?)\n\}/gm)){
    const [,kind,name,signature,body]=m;
    if(!signature!.includes('@auth(level: USER)')||['GetCurrentUser','GetCurrentUserAccess','ValidateDeviceSession','ClaimDeviceSession','ReleaseDeviceSession'].includes(name!))continue;
    expect(body,name).toContain('message: "SESSION_REQUIRED"');expect(signature,name).toContain('$sessionToken:');
    if(kind==='mutation'){expect(signature,name).toContain('@transaction');expect(body,name).toContain(name==='TouchDeviceSession'?'FOR UPDATE OF s FOR SHARE OF u,t,r':'FOR SHARE OF s,u,t,r');}
   }
   for(const m of source.matchAll(/^(?:query|mutation) (System\w+)([^{}]*?)\{/gm))expect(m[2],m[1]).toContain('@auth(level: NO_ACCESS)');
  }
 });
});
