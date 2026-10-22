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
