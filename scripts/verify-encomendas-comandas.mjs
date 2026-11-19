import assert from 'node:assert/strict';
import {execFileSync} from 'node:child_process';
import {readFileSync as actualRead} from 'node:fs';
import ts from '../frontend/node_modules/typescript/lib/typescript.js';
export const ecBase='72f9b629337ae2c0e799863f3ef4ab01c8b71326';
const git=(...args)=>execFileSync('git',args,{encoding:'utf8'}).trim();
export const ecExistingPaths=new Set([
 '.gitignore','dataconnect/schema/schema.gql','dataconnect/app/queries.gql','dataconnect/app/mutations.gql',
 'frontend/src/App.tsx','frontend/src/config/pages.ts','frontend/src/config/navigation.ts','frontend/src/pages/SalesManagementPage.tsx',
 'frontend/qa/api.ts','frontend/qa/application.tsx','frontend/src/pages/MenuPages.test.tsx','frontend/src/pages/DailyProfitDashboardPage.tsx','frontend/src/components/dashboard-v3/DashboardPrintReport.tsx',
 'frontend/src/dataconnect-generated/README.md','frontend/src/dataconnect-generated/index.cjs.js','frontend/src/dataconnect-generated/index.d.ts','frontend/src/dataconnect-generated/esm/index.esm.js',
 'frontend/src/dataconnect-generated/react/README.md','frontend/src/dataconnect-generated/react/index.cjs.js','frontend/src/dataconnect-generated/react/index.d.ts','frontend/src/dataconnect-generated/react/esm/index.esm.js',
 'functions/src/dataconnect-admin-generated/index.cjs.js','functions/src/dataconnect-admin-generated/index.d.ts','functions/src/dataconnect-admin-generated/esm/index.esm.js',
 'scripts/verify-ajustes-finos.mjs','scripts/verify-interface.mjs','scripts/verify-reconciliation.mjs','scripts/reconciliation-scope.json',
 'scripts/qa-browser/install-chromium.sh','scripts/qa-browser/install-chromium.test.mjs','scripts/qa-browser/session-runtime.py','scripts/qa-browser/menus.mjs','.github/workflows/ci.yml',
]);
const additions=[
 'frontend/src/pages/EncomendasComandasPage.tsx','frontend/src/encomendas-comandas.css',
 ...['LedgerDetails.tsx','ActionDialog.tsx','DocumentEditor.tsx','Calendar.tsx','calendarDates.ts','types.ts','ui.tsx','money.ts','money.test.ts','pending.ts','pending.test.ts','service.ts','service.test.ts','print.ts'].map(p=>'frontend/src/encomendas-comandas/'+p),
 ...['20261118-encomendas-comandas.sql','20261118-ec-functions.sql','20261118-ec-ledger.sql','20261118-ec-allocation-parts.sql','20261118-ec-advanced.sql','20261118-ec-commands.sql','20261118-ec-queries.sql'].map(p=>'dataconnect/migrations/'+p),
 ...['runtime_support.py','test_runtime.py','browser_runtime.py','fixtures.sql'].map(p=>'scripts/ec/'+p),
 'scripts/verify-encomendas-comandas.mjs','scripts/qa-browser/encomendas-comandas.mjs',
 ...['base-e-plano.md','decisoes.json','reservas-integracao.json','rastreabilidade.tsv','validacao.md','manual.md','publicacao-e-reversao.md','CORE-handoff.json'].map(p=>'docs/encomendas-comandas/'+p),
];
export const ecAllowedPaths=new Set([...ecExistingPaths,...additions]);
// Same staged preservation pattern used by Cadastros→Canais→Plataforma→Menus.
// This is used only AFTER the current EC delta has its own nominal-scope checks.
export const ecHistoricalSource=(path,encoding)=>ecExistingPaths.has(path)
 ? execFileSync('git',['show',ecBase+':'+path],{encoding}) : actualRead(path,encoding);
const old=path=>git('show',ecBase+':'+path),now=path=>actualRead(path,'utf8');
const parse=s=>ts.createSourceFile('source.tsx',s,ts.ScriptTarget.Latest,true,ts.ScriptKind.TSX);
const printer=ts.createPrinter({removeComments:true});
const canonical=(file,node)=>printer.printNode(ts.EmitHint.Unspecified,node,file).replace(/\s+/g,' ');
function named(file,name){let found;function visit(node){if((ts.isVariableDeclaration(node)||ts.isFunctionDeclaration(node))&&node.name?.getText(file)===name)found=node;ts.forEachChild(node,visit)}visit(file);assert.ok(found,'Missing '+name);return found}
export function verifyEncomendasComandas(){
 git('merge-base','--is-ancestor',ecBase,'HEAD');
 const changed=[...git('diff','--name-only',ecBase).split('\n'),...git('ls-files','--others','--exclude-standard').split('\n')].filter(Boolean);
 for(const path of changed)assert.ok(ecAllowedPaths.has(path),'EC changed an unapproved path: '+path);
 // The original schema and public provider implementations remain intact.
 const schema=now('dataconnect/schema/schema.gql');assert.ok(schema.startsWith(old('dataconnect/schema/schema.gql')),'Legacy schema changed instead of an additive extension');
 const newTypes=[...schema.slice(old('dataconnect/schema/schema.gql').length).matchAll(/^type (\w+)/gm)].map(m=>m[1]);
 assert.equal(newTypes.length,17);assert.ok(newTypes.every(n=>n.startsWith('Ec')));
 for(const path of ['functions/src/ifood.ts','functions/src/index.ts','functions/src/worker.ts','frontend/src/utils/salesOffline.ts','frontend/src/components/PosApprovalsModal.tsx','frontend/src/layout/AppLayout.tsx','frontend/src/pages/DashboardPage.tsx','frontend/src/components/MenuCard.tsx','frontend/src/barras-globais.css','frontend/src/menus.css','frontend/src/hooks/useModalIsolation.ts','frontend/src/auth/AuthProvider.tsx'])assert.equal(now(path).trim(),old(path),'Unrelated/protected capability changed: '+path);
 for(const path of ['dataconnect/app/queries.gql','dataconnect/app/mutations.gql']){
  const signatures=s=>new Map([...s.matchAll(/^(query|mutation)\s+(\w+)([\s\S]*?)\{/gm)].map(m=>[m[2],m[0]]));
  const before=signatures(old(path)),current=signatures(now(path));for(const [name,signature]of before)assert.equal(current.get(name),signature,'Legacy connector signature changed: '+name);
 }
 assert.match(now('dataconnect/app/mutations.gql'),/mutation EcCommand[\s\S]*?@auth\(level: USER\) @transaction/);
 assert.match(now('dataconnect/app/mutations.gql'),/COALESCE\(s\.source,'POS'\) NOT IN\('IFOOD','ORDER','TAB'\)/);
 const sql=additions.filter(p=>p.startsWith('dataconnect/migrations/')).map(now).join('\n');
 assert.doesNotMatch(sql,/\b(?:TRUNCATE|DELETE\s+FROM|INSERT\s+INTO\s+(?:user|role)_page_permissions)\b/i,'Operational migration destroys history or grants permissions');
 assert.match(sql,/DEFERRABLE INITIALLY DEFERRED/);assert.match(sql,/expectedCommand/);assert.match(sql,/FOR SHARE OF u,t,r,s/);
 // Existing operator sale handlers/scanner/offline behavior stay exactly P57.
 const pos='frontend/src/pages/PointOfSalePage.tsx';assert.equal(now(pos).trim(),old(pos),'Unrelated POS implementation changed');
 const sales='frontend/src/pages/SalesManagementPage.tsx',a=parse(old(sales)),b=parse(now(sales));
 for(const name of ['load','openDetails'])assert.equal(canonical(b,named(b,name)),canonical(a,named(a,name)),'Existing sales loader changed: '+name);
 const finance='frontend/src/pages/DailyProfitDashboardPage.tsx',fa=parse(old(finance)),fb=parse(now(finance));
 for(const name of ['load','clear','csv','choosePeriod'])assert.equal(canonical(fb,named(fb,name)),canonical(fa,named(fa,name)),'Existing financial control changed: '+name);
 const report='frontend/src/components/dashboard-v3/DashboardPrintReport.tsx';
 assert.equal(now(report).replace(/^      \{c\.deliveryFeeCents.*\n/m,'').trim(),old(report),'Only EC delivery-fee disclosure may extend the complete existing print report');
 // New-origin guards may precede legacy cancellation/correction, never replace it.
 for(const name of ['confirmCancel','correction']){
  const before=named(a,name).body.statements,after=[...named(b,name).body.statements];
  const ec=after.findIndex(n=>ts.isIfStatement(n)&&n.expression.getText(b).includes("['ORDER','TAB']"));assert.ok(ec>=0,'Typed EC-origin guard missing: '+name);after.splice(ec,1);
  assert.deepEqual(after.map(n=>canonical(b,n)),[...before].map(n=>canonical(a,n)),'Non-EC sales path changed: '+name);
 }
 const qa='frontend/qa/api.ts',qaA=ts.createSourceFile(qa,old(qa),ts.ScriptTarget.Latest,true,ts.ScriptKind.TS),qaB=ts.createSourceFile(qa,now(qa),ts.ScriptTarget.Latest,true,ts.ScriptKind.TS);assert.equal(canonical(qaB,named(qaB,'qaDefaultOperation')),canonical(qaA,named(qaA,'qaDefaultOperation')),'Existing QA default behavior changed');
 const decisions=JSON.parse(now('docs/encomendas-comandas/decisoes.json'));
 if(decisions.D07.status==='pending_user'){
  assert.equal(decisions.readyForActivation,false);assert.match(now('dataconnect/migrations/20261118-ec-commands.sql'),/FUNCTION ec_sensitive[\s\S]*?SELECT false/);
 }
 if(decisions.D07.status.startsWith('approved_user'))assert.match(now('dataconnect/migrations/20261118-ec-commands.sql'),/FUNCTION ec_sensitive[\s\S]*?SELECT ec_can\(actor,page,'manage'\)/);
 console.log('EC construction scope verified: additive contracts, original provider APIs/shell/POS/queue preserved; activation status: '+decisions.readyForActivation+'. CORE not written.');
}
if(import.meta.url===new URL(process.argv[1],'file:').href)verifyEncomendasComandas();
