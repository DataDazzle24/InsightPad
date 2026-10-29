import {test} from 'node:test';import assert from 'node:assert/strict';import {generateKeyPairSync} from 'node:crypto';import {mkdtempSync,mkdirSync,readFileSync,writeFileSync,rmSync} from 'node:fs';import {tmpdir} from 'node:os';import {join} from 'node:path';import {execFileSync} from 'node:child_process';import {fileURLToPath} from 'node:url';
test('review evidence round-trips privately and refuses a tampered envelope',()=>{
 const root=mkdtempSync(join(tmpdir(),'qa-evidence-'));
 try{const pair=generateKeyPairSync('rsa',{modulusLength:2048,publicKeyEncoding:{format:'pem',type:'spki'},privateKeyEncoding:{format:'pem',type:'pkcs8'}});writeFileSync(join(root,'public.pem'),pair.publicKey);writeFileSync(join(root,'private.pem'),pair.privateKey,{mode:0o600});mkdirSync(join(root,'artifacts/browser-private'),{recursive:true});writeFileSync(join(root,'artifacts/browser-private/proof.json'),'private synthetic report');
 execFileSync(process.execPath,[fileURLToPath(new URL('./seal.mjs',import.meta.url))],{cwd:root,env:{...process.env,QA_EVIDENCE_PUBLIC_KEY:join(root,'public.pem')}});
 const envelope=join(root,'artifacts/browser-sealed/evidence.enc'),decrypt=fileURLToPath(new URL('./decrypt.mjs',import.meta.url)),output=join(root,'result.tar.gz');assert.ok(!readFileSync(envelope,'utf8').includes('private synthetic report'));
 execFileSync(process.execPath,[decrypt,join(root,'private.pem'),envelope,output]);assert.ok(readFileSync(output).length>50);
 const e=JSON.parse(readFileSync(envelope,'utf8')),data=Buffer.from(e.data,'base64');data[0]^=1;e.data=data.toString('base64');writeFileSync(envelope,JSON.stringify(e));assert.throws(()=>execFileSync(process.execPath,[decrypt,join(root,'private.pem'),envelope,join(root,'bad.tar.gz')],{stdio:'pipe'}));
 }finally{rmSync(root,{recursive:true,force:true})}
});
test('public workflow uploads only sealed visual evidence and never a private key',()=>{
 const workflow=readFileSync(new URL('../../.github/workflows/ci.yml',import.meta.url),'utf8');assert.match(workflow,/path: artifacts\/browser-sealed\/evidence.enc/);assert.doesNotMatch(workflow,/path:.*browser-private|path:.*private\.pem|path:.*trace/);assert.equal(readFileSync(new URL('./evidence-public.pem',import.meta.url),'utf8').includes('PRIVATE KEY'),false);
});

test('CI runs sales empty-state regression after browser preparation and before sealing',()=>{
 const workflow=readFileSync(new URL('../../.github/workflows/ci.yml',import.meta.url),'utf8');
 const install=workflow.indexOf('playwright/cli.js install --with-deps chromium');
 const regression=workflow.indexOf('run: node scripts/qa-browser/empty-sales.mjs');
 const seal=workflow.indexOf('node scripts/qa-browser/seal.mjs');
 assert.ok(install>=0 && regression>install && seal>regression);
 assert.match(workflow,/Regressão do estado vazio de vendas\n\s+run: node scripts\/qa-browser\/empty-sales\.mjs/);
});

test('CI runs the closure and disposable PG18 proofs before sealing, without exposing their originals',()=>{
 const workflow=readFileSync(new URL('../../.github/workflows/ci.yml',import.meta.url),'utf8'),coverage=readFileSync(new URL('./coverage.mjs',import.meta.url),'utf8'),pg=readFileSync(new URL('./pg18-abort.py',import.meta.url),'utf8');
 assert.match(coverage,/import \{closure\} from '\.\/closure.mjs'/);assert.match(coverage,/await closure\(\{page,output,sha,run,go,panel,wait,screenshot\}\)/);
 assert.ok(workflow.indexOf('python3 scripts/qa-browser/pg18-abort.py')<workflow.indexOf('node scripts/qa-browser/seal.mjs'));
 assert.match(pg,/'--network','none'/);assert.match(pg,/'--tmpfs','\/var\/lib\/postgresql:rw'/);assert.doesNotMatch(pg,/--publish|--volume|DATABASE_URL|GOOGLE_APPLICATION_CREDENTIALS/);
 assert.match(pg,/artifacts\/browser-private\/pg18-abort.json/);
});

test('full CI entry invokes individual residual consumers and themed report proofs before old coverage',()=>{
 const runner=readFileSync(new URL('./run.mjs',import.meta.url),'utf8'),cases=readFileSync(new URL('./consolidated.mjs',import.meta.url),'utf8');
 assert.match(runner,/import \{reports\} from '\.\/reports.mjs'/);assert.match(runner,/import \{consolidated\} from '\.\/consolidated.mjs'/);
 assert.ok(runner.indexOf('await reports(')<runner.indexOf('await consolidated('));assert.ok(runner.indexOf('await consolidated(')<runner.indexOf('await coverage('));assert.match(cases,/CI must execute all consolidated cases/);
});

test('public browser failure summaries exclude private values and retain useful failure categories',async()=>{
 const {sanitizeScenarioError}=await import('./coverage.mjs');
 assert.equal(sanitizeScenarioError(new Error('locator.click: Timeout 8000ms exceeded.\nSelector contains cpf=52998224725 token=private-value')),'click timed out after 8000ms');
 assert.equal(sanitizeScenarioError(Object.assign(new Error('customer=Private Name expected secret value'),{code:'ERR_ASSERTION'})),'assertion failed');
 assert.equal(sanitizeScenarioError(new Error('locator.click: strict mode violation: private document')),'ambiguous locator');
 assert.equal(sanitizeScenarioError(new Error('authorization=private-value')),'browser scenario error');
});
