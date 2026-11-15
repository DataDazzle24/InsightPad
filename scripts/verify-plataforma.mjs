import assert from 'node:assert/strict';
import {execFileSync} from 'node:child_process';
import {verifyBarrasGlobais,barrasBase,barrasHistoricalSource} from './verify-barras-globais.mjs';
const readFileSync=barrasHistoricalSource;
import ts from '../frontend/node_modules/typescript/lib/typescript.js';
import postcss from '../frontend/node_modules/postcss/lib/postcss.mjs';
export const plataformaBase='7bc4aec60d5455c6a8e6c7cb95f537f196cac6e8';
const git=(...args)=>execFileSync('git',args,{encoding:'utf8'}).trim();
const before=path=>git('show',plataformaBase+':'+path);
const sources=['frontend/src/pages/PlatformAdminPage.tsx','frontend/src/components/PlatformBillingPanel.tsx','frontend/src/components/PlatformPermissions.tsx'];
export const plataformaHistoricalSource=(path,encoding)=>[...sources,'frontend/src/App.tsx'].includes(path)?before(path):readFileSync(path,encoding);
const allowed=new Set([...sources,'frontend/src/App.tsx','frontend/src/plataforma.css',
 'frontend/qa/api.ts','scripts/qa-browser/plataforma.mjs','scripts/qa-browser/run.mjs',
 'scripts/verify-plataforma.mjs','scripts/verify-canais.mjs','scripts/verify-reconciliation.mjs',
 'scripts/reconciliation-scope.json','scripts/qa-browser/canais.mjs','docs/plataforma-ui-dev.md']);
const printer=ts.createPrinter({removeComments:true});
const parse=s=>ts.createSourceFile('source.tsx',s,ts.ScriptTarget.Latest,true,ts.ScriptKind.TSX);
const canonical=(f,n)=>printer.printNode(ts.EmitHint.Unspecified,n,f).replace(/\s+/g,' ');
function collect(f,predicate){const a=[];function visit(n){if(predicate(n))a.push(canonical(f,n));ts.forEachChild(n,visit)}visit(f);return a;}
export function verifyPlataforma(){
 verifyBarrasGlobais();
 git('merge-base','--is-ancestor',plataformaBase,'HEAD');
 const changed=git('diff','--name-only',plataformaBase,barrasBase).split('\n').filter(Boolean);
 for(const p of changed)assert.ok(allowed.has(p),'Plataforma changed an unapproved path: '+p);
 assert.equal(readFileSync('frontend/src/App.tsx','utf8').replace("import './plataforma.css'\n",'').trim(),before('frontend/src/App.tsx'),'Only the scoped stylesheet import may change App');
 for(const path of sources){
  const old=parse(before(path)),now=parse(readFileSync(path,'utf8'));
  const statics=f=>f.statements.filter(n=>!ts.isFunctionDeclaration(n)).map(n=>canonical(f,n));
  assert.deepEqual(statics(now),statics(old),path+': types, imports, constants or contracts changed');
  const prefixes=f=>f.statements.filter(ts.isFunctionDeclaration).map(n=>({name:n.name.text,statements:n.body.statements.filter(s=>!ts.isReturnStatement(s)).map(s=>canonical(f,s))}));
  assert.deepEqual(prefixes(now),prefixes(old),path+': handlers, loaders, validation, idempotency, concurrency, effects or permission rules changed');
  const wiring=f=>collect(f,n=>ts.isJsxAttribute(n)&&/^(?:on[A-Z]|disabled$|value$|checked$|readOnly$|required$|name$|type$|href$|to$|ref$)/.test(n.name.getText(f))).sort();
  assert.deepEqual(wiring(now),wiring(old),path+': business JSX wiring changed');
  const conditions=f=>{const result=[];function visit(n){if(ts.isConditionalExpression(n)){let p=n.parent;while(p&&!ts.isJsxAttribute(p)&&!ts.isJsxElement(p))p=p.parent;if(!(p&&ts.isJsxAttribute(p)&&p.name.getText(f).startsWith('aria-')))result.push(canonical(f,n.condition));}ts.forEachChild(n,visit);}visit(f);return result.sort();};
  assert.deepEqual(conditions(now),conditions(old),path+': conditional eligibility changed');
 }
 const canaisTest='scripts/qa-browser/canais.mjs';
 assert.equal(readFileSync(canaisTest,'utf8').replace("await page.waitForFunction(()=>document.querySelector('.channel-orders-table tbody>tr td strong')?.textContent?.trim()==='#QA-051');",'').replace("await page.waitForFunction(()=>window.__canais.calls.filter(c=>c.name==='SalesChannelOrdersV2').at(-1)?.variables.filters.branchId?.endsWith('000002'));",'').trim(),before(canaisTest),'Only wait for the second-page sentinel and applied branch filter; preserve every Canais assertion');
 const css=postcss.parse(readFileSync('frontend/src/plataforma.css','utf8'));
 css.walkRules(rule=>{
  for(const selector of postcss.list.comma(rule.selector))assert.ok(selector.startsWith('.ip-ui[data-theme')&&/\.work-platform(?:[\s.:#>\[]|$)/.test(selector),'Unscoped Plataforma selector: '+selector);
  let screen=false;for(let p=rule.parent;p;p=p.parent)if(p.type==='atrule'&&p.name==='media'&&/\bscreen\b/.test(p.params))screen=true;
  assert.ok(screen,'Plataforma must preserve print');
 });
 console.log('Plataforma: exact screen scope, original handlers, API/financial contracts, idempotency, versions, permission dependencies, JSX wiring and other modules preserved.');
}
if(import.meta.url===new URL(process.argv[1],'file:').href)verifyPlataforma();
