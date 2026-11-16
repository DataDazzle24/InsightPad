import assert from 'node:assert/strict';
import {execFileSync} from 'node:child_process';
import {readFileSync} from 'node:fs';
import ts from '../frontend/node_modules/typescript/lib/typescript.js';
import postcss from '../frontend/node_modules/postcss/lib/postcss.mjs';
export const fineBase='fd8f10c8575982ace35613e58363adb0ea28522c';
const git=(...args)=>execFileSync('git',args,{encoding:'utf8'}).trim();
const before=path=>git('show',fineBase+':'+path);
const product=[
 'frontend/src/components/PosHeader.tsx','frontend/src/pages/PointOfSalePage.tsx','frontend/src/pages/PointOfSalePage.v2.css',
 'frontend/src/components/dashboard-v3/DashboardSurface.tsx','frontend/src/components/dashboard-v3/model.ts','frontend/src/components/dashboard-v3/adapters.ts','frontend/src/components/dashboard-v3/dashboard-v6.css','frontend/src/components/dashboard-v3/DashboardPrintReport.tsx',
 'frontend/src/pages/DailyProfitDashboardPage.tsx','frontend/src/pages/DashboardHubPage.tsx','frontend/src/pages/ChannelDashboardPage.tsx',
];
// Only AFTER proving this round's exact delta, replay the previous approved
// source through older preservation verifiers. Their original assertions remain.
export const fineHistoricalSource=(path,encoding)=>product.includes(path)?before(path):readFileSync(path,encoding);
const allowed=new Set([...product,'frontend/qa/api.ts','frontend/qa/application.tsx',
 'frontend/src/components/dashboard-v3/dashboard-print.css','frontend/src/components/dashboard-v3/DashboardPrintReport.test.tsx','frontend/src/components/dashboard-v3/DashboardSurface.test.tsx','frontend/src/pages/DashboardHubPage.test.tsx','frontend/src/pages/PointOfSalePage.test.tsx',
 'scripts/verify-ajustes-finos.mjs','scripts/verify-menus.mjs','scripts/verify-reconciliation.mjs','scripts/reconciliation-scope.json',
 'scripts/qa-browser/ajustes-finos.mjs','scripts/qa-browser/run.mjs','scripts/qa-browser/reports.mjs','scripts/qa-browser/pdv-v2.mjs','scripts/qa-browser/dashboard-v3.mjs','scripts/qa-browser/consolidated.mjs',
]);
const parse=s=>ts.createSourceFile('source.tsx',s,ts.ScriptTarget.Latest,true,ts.ScriptKind.TSX),printer=ts.createPrinter({removeComments:true});
const canonical=(file,node)=>printer.printNode(ts.EmitHint.Unspecified,node,file).replace(/\s+/g,' ');
function collect(file,predicate){const result=[];function visit(node){if(predicate(node))result.push(node);ts.forEachChild(node,visit)}visit(file);return result;}
function named(file,name){const nodes=collect(file,node=>(ts.isVariableDeclaration(node)||ts.isFunctionDeclaration(node))&&node.name?.getText(file)===name);assert.ok(nodes.length,'Missing preserved '+name);return nodes[0];}
function preserve(path,names,callback=false){const a=parse(before(path)),b=parse(readFileSync(path,'utf8'));for(const name of names){const old=named(a,name),now=named(b,name),body=n=>callback?n.initializer.arguments[0]:n;assert.equal(canonical(b,body(now)),canonical(a,body(old)),`Financial/API/session behavior changed: ${path} ${name}`)}}
export function verifyAjustesFinos(){
 git('merge-base','--is-ancestor',fineBase,'HEAD');
 const changed=[...git('diff','--name-only',fineBase).split('\n'),...git('ls-files','--others','--exclude-standard').split('\n')].filter(Boolean);
 for(const path of changed)assert.ok(allowed.has(path),'Fine adjustments changed an unapproved path: '+path);
 preserve('frontend/src/pages/PointOfSalePage.tsx',['add','readProductCode','finish','printReceipt','shortcuts','offlineOwner','canOpenCashControl','itemEntryDisabled']);
 preserve('frontend/src/pages/PointOfSalePage.tsx',['sync','load'],true);
 for(const name of ['DailyProfitDashboardPage','DashboardHubPage','ChannelDashboardPage'])preserve(`frontend/src/pages/${name}.tsx`,['load'],true);
 preserve('frontend/src/pages/DailyProfitDashboardPage.tsx',['csv','toggle']);
 preserve('frontend/src/components/dashboard-v3/DashboardSurface.tsx',['exportRows']);
 const header=readFileSync(product[0],'utf8');assert.match(header,/\(!p\.cashReady \|\| !p\.cashOpen \|\| p\.canManage\)/);assert.match(header,/to="\/modulos\/vendas"/);assert.match(header,/if\(p\.hasCart&&!window\.confirm/);
 // QA additions only introduce opt-in synthetic fixture functions.
 const qaPath='frontend/qa/api.ts',qaBefore=ts.createSourceFile(qaPath,before(qaPath),ts.ScriptTarget.Latest,true,ts.ScriptKind.TS),qaNow=ts.createSourceFile(qaPath,readFileSync(qaPath,'utf8'),ts.ScriptTarget.Latest,true,ts.ScriptKind.TS);
 const baseStatements=file=>file.statements.filter(node=>!ts.isFunctionDeclaration(node)||!['useFinePrintFixtures','useFineBundleFixture'].includes(node.name?.getText(file))).map(node=>canonical(file,node));
 assert.deepEqual(baseStatements(qaNow),baseStatements(qaBefore),'Existing QA adapter defaults/contracts changed');
 // Complete existing operational detail and totals survive the print redesign.
 const path='frontend/src/components/dashboard-v3/DashboardPrintReport.tsx',old=parse(before(path)),now=parse(readFileSync(path,'utf8'));
 for(const tag of ['tbody','tfoot']){
  const nodes=file=>collect(file,n=>ts.isJsxElement(n)&&n.openingElement.tagName.getText(file)===tag).map(n=>canonical(file,n));
  const retained=nodes(now);for(const node of nodes(old))assert.ok(retained.includes(node),'Print detail/totals removed: '+tag);
 }
 preserve(path,['CustomerPrintView','CategoryPrintView','Table','DashboardTable']);
 const print=postcss.parse(readFileSync('frontend/src/components/dashboard-v3/dashboard-print.css','utf8'));
 print.walkRules(rule=>{assert.ok(postcss.list.comma(rule.selector).every(selector=>selector.startsWith('.ip-analysis-report')),'Print must stay report-scoped');let scoped=false;for(let n=rule.parent;n;n=n.parent)if(n.type==='atrule'&&n.name==='media'&&n.params==='print')scoped=true;assert.ok(scoped,'Print stylesheet may not affect screen');});
 assert.ok(readFileSync('frontend/src/components/dashboard-v3/dashboard-v6.css','utf8').startsWith(before('frontend/src/components/dashboard-v3/dashboard-v6.css')),'Previous analytical CSS must survive');
 console.log('Fine adjustments: precise frontend scope; sale/scanner/queue/cash policy, session, API loaders, CSV guards, full printed detail and totals preserved. No backend, shell or other module delta.');
}
if(import.meta.url===new URL(process.argv[1],'file:').href)verifyAjustesFinos();
