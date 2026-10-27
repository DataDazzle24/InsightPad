import { strict as assert } from 'node:assert';
import { readFileSync,mkdtempSync,rmSync,writeFileSync,mkdirSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { execFileSync } from 'node:child_process';
import { test } from 'node:test';
import { fileURLToPath } from 'node:url';
import { validateScope,verifyRepository } from './verify-reconciliation.mjs';
const policy = JSON.parse(readFileSync(new URL('./reconciliation-scope.json',import.meta.url),'utf8'));
test('accepts CatalogPages authorized by the matrix; rejects unrelated billing and protected offline source',()=>{
  assert.equal(validateScope(policy,['frontend/src/pages/CatalogPages.tsx']),true);
  assert.throws(()=>validateScope(policy,['functions/src/unreviewed-billing.ts']),/outside approved scope/);
  assert.throws(()=>validateScope(policy,['frontend/src/utils/salesOffline.ts']),/outside approved scope/);
});
test('rejects directory wildcards, excluded IDs and replacement of the immutable ancestor',()=>{
  for (const path of ['frontend/src/','frontend/src/**','frontend/../secrets.txt','frontend/.env']) {
    const modified=structuredClone(policy);modified.paths[path]={ids:['AJU-CAT-01'],reason:'synthetic'};
    assert.throws(()=>validateScope(modified,[path]));
  }
  const invalid=structuredClone(policy);invalid.paths['frontend/src/pages/CatalogPages.tsx'].ids=['AJU-SUB-16'];
  assert.throws(()=>validateScope(invalid,[]),/Unjustified/);
  assert.throws(()=>validateScope({...policy,ancestor:'0'.repeat(40)},[]),/ancestor/);
});
test('refuses an unrelated Git history even when paths/policy look valid',()=>{
  const root=mkdtempSync(join(tmpdir(),'insightpad-scope-'));
  try {
    execFileSync('git',['init','-q'],{cwd:root});mkdirSync(join(root,'scripts'));
    writeFileSync(join(root,'scripts/reconciliation-scope.json'),JSON.stringify(policy));
    execFileSync('git',['add','.'],{cwd:root});execFileSync('git',['-c','user.name=Fixture','-c','user.email=fixture@example.invalid','commit','-qm','unrelated'],{cwd:root});
    assert.throws(()=>verifyRepository(root),/Command failed/);
  } finally {rmSync(root,{recursive:true,force:true});}
});
test('Git-discovered authorized source edit passes and an unrelated source edit fails in an isolated clone',()=>{
  const scratch=mkdtempSync(join(tmpdir(),'insightpad-repo-scope-'));
  const root=join(scratch,'repo');
  try {
    execFileSync('git',['clone','--quiet','--shared',fileURLToPath(new URL('..',import.meta.url)),root]);
    writeFileSync(join(root,'scripts/reconciliation-scope.json'),JSON.stringify(policy));
    const path=join(root,'frontend/src/pages/CatalogPages.tsx');
    writeFileSync(path,readFileSync(path,'utf8')+'\n// Synthetic authorized scope fixture.\n');
    assert.doesNotThrow(()=>verifyRepository(root,true));
    writeFileSync(join(root,'frontend/src/pages/OutsideScope.tsx'),'// Unauthorized synthetic fixture.\n');
    assert.throws(()=>verifyRepository(root,true),/outside approved scope/);
  } finally {rmSync(scratch,{recursive:true,force:true});}
});

test('accepts exact session and read-only preflight sources, rejects siblings',()=>{
 assert.equal(validateScope(policy,['frontend/src/auth/session-data-connect.ts','functions/src/worker.ts','dataconnect/preflight/name-key.sql']),true);
 assert.throws(()=>validateScope(policy,['functions/src/unguarded-session.ts']),/outside approved scope/);
 assert.throws(()=>validateScope(policy,['dataconnect/preflight/execute-migration.sql']),/outside approved scope/);
});

test('accepts exact isolated application QA sources and rejects adjacent unauthorized code',()=>{
 assert.equal(validateScope(policy,['frontend/qa/application.tsx','frontend/qa/api.ts','functions/test/stock-receipts.test.ts']),true);
 assert.throws(()=>validateScope(policy,['frontend/qa/network-proxy.ts']),/outside approved scope/);
});

test('accepts the exact shared alert layout correction and rejects unrelated styles',()=>{
 assert.equal(validateScope(policy,['frontend/src/catalog-standardization.css']),true);
 assert.throws(()=>validateScope(policy,['frontend/src/unreviewed-global.css']),/outside approved scope/);
});

test('accepts only the exact sales empty-state browser regression path',()=>{
 assert.equal(validateScope(policy,['scripts/qa-browser/empty-sales.mjs']),true);
 for(const path of ['scripts/qa-browser/empty-sales.test.mjs','scripts/qa-browser/empty-sales-extra.mjs','scripts/qa-browser/empty-sales.mjs.bak','scripts/qa-browser/nested/empty-sales.mjs']){
  assert.throws(()=>validateScope(policy,[path]),/outside approved scope/);
 }
});

test('permits only the exact isolated closure and disposable PG18 proofs, rejects adjacent files',()=>{
 assert.equal(validateScope(policy,['scripts/qa-browser/closure.mjs','scripts/qa-browser/pg18-abort.py']),true);
 for(const path of ['scripts/qa-browser/closure-extra.mjs','scripts/qa-browser/closure.mjs.bak','scripts/qa-browser/pg18-abort.sql','scripts/qa-browser/pg18-remote.py'])assert.throws(()=>validateScope(policy,[path]),/outside approved scope/);
});

test('permits only the exact existing reports regression and rejects neighboring scripts',()=>{
 assert.equal(validateScope(policy,['scripts/qa-browser/reports.mjs']),true);
 for(const path of ['scripts/qa-browser/reports-extra.mjs','scripts/qa-browser/reports.mjs.bak','scripts/qa-browser/remote-reports.mjs'])assert.throws(()=>validateScope(policy,[path]),/outside approved scope/);
});

test('permits only the exact consolidated isolated consumer proof and rejects neighbors',()=>{
 assert.equal(validateScope(policy,['scripts/qa-browser/consolidated.mjs']),true);
 for(const path of ['scripts/qa-browser/consolidated-extra.mjs','scripts/qa-browser/consolidated.mjs.bak','scripts/qa-browser/consolidated/remote.mjs'])assert.throws(()=>validateScope(policy,[path]),/outside approved scope/);
});
