// Private stdin/stdout bridge. Never prints tokens, SQL statements or customer rows.
const {parse}=require('libpg-query');
const fs=require('node:fs');
async function run(input){
 if(input.mode==='parse')return parse(input.sql);
 if(input.mode!=='sql'||typeof input.readOnly!=='boolean'||typeof input.owner!=='boolean'||!Array.isArray(input.sql)||!input.sql.length||input.sql.length>200||!input.sql.every(s=>typeof s==='string'&&s.length<1048576)||!input.readOnly&&!input.owner)throw Object.assign(Error(),{code:'SQL_CONTRACT_DENIED'});
 const {Connector}=require('@google-cloud/cloud-sql-connector');
 const {OAuth2Client}=require('google-auth-library');
 const {Client}=require('pg');
 if(input.instance!=='insightpad-dd-dev:southamerica-east1:insightpad-fdc'||input.database!=='fdcdb'||input.user!=='datadazzletecnologia@gmail.com')throw Object.assign(Error(),{code:'TARGET_DENIED'});
 const auth=new OAuth2Client();auth.setCredentials({access_token:input.token,expiry_date:Date.now()+3000000});
 const connector=new Connector({auth});let client;
 try{
  const options=await connector.getOptions({instanceConnectionName:input.instance,authType:'IAM',ipType:input.ipType});
  client=new Client({...options,user:input.user,database:input.database,connectionTimeoutMillis:15000,query_timeout:120000});
  client.on('error',()=>{});await client.connect();
  await client.query(input.readOnly?'BEGIN READ ONLY':'BEGIN');
  await client.query("SET LOCAL lock_timeout='5s'; SET LOCAL statement_timeout='90s'; SET LOCAL search_path=public,pg_catalog");
  if(input.owner)await client.query('SET LOCAL ROLE "firebaseowner_fdcdb_public"');
  if(!input.readOnly){const lock=await client.query("SELECT pg_try_advisory_xact_lock(hashtext('InsightPad-P58-DEV')) AS locked");if(!lock.rows[0].locked)throw Object.assign(Error(),{code:'OPERATION_LOCKED'});}
  const results=[];for(const sql of input.sql){const r=await client.query(sql);results.push(Array.isArray(r)?r.map(x=>({rows:x.rows,rowCount:x.rowCount})):({rows:r.rows,rowCount:r.rowCount}));}
  await client.query('COMMIT');return results;
 }catch(error){if(client)await client.query('ROLLBACK').catch(()=>{});throw error}
 finally{if(client)await client.end().catch(()=>{});connector.close()}
}
if(require.main===module){let raw='';process.stdin.setEncoding('utf8');process.stdin.on('data',s=>raw+=s);process.stdin.on('end',async()=>{try{process.stdout.write(JSON.stringify({ok:true,result:await run(JSON.parse(raw))}));}catch(error){process.stdout.write(JSON.stringify({ok:false,code:String(error.code||'SQL_CONNECTION_OR_EXECUTION_FAILED').replace(/[^A-Za-z0-9_-]/g,'').slice(0,80)}));process.exitCode=1;}})}
module.exports={run};
