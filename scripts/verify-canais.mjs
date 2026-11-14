import assert from 'node:assert/strict';
import {execFileSync} from 'node:child_process';
import {readFileSync} from 'node:fs';
import ts from '../frontend/node_modules/typescript/lib/typescript.js';
import postcss from '../frontend/node_modules/postcss/lib/postcss.mjs';

export const canaisBase='68abdac1ca10e30e953c626ebefc58cd89216666';
const git=(...args)=>execFileSync('git',args,{encoding:'utf8'}).trim();
const before=path=>git('show',canaisBase+':'+path);
const pages=['frontend/src/pages/ChannelOrdersPage.tsx','frontend/src/pages/SalesChannelsPage.tsx'];
export const canaisHistoricalSource=(path,encoding)=>[...pages,'frontend/src/App.tsx'].includes(path)?before(path):readFileSync(path,encoding);
const allowed=new Set([
 ...pages,'frontend/src/App.tsx','frontend/src/pedidos.css','frontend/src/conexoes.css',
 '.github/workflows/ci.yml','frontend/qa/api.ts','scripts/verify-canais.mjs','scripts/verify-estoque-registros.mjs',
 'scripts/verify-reconciliation.mjs','scripts/reconciliation-scope.json',
 'scripts/qa-browser/run.mjs','scripts/qa-browser/canais.mjs','docs/canais-ui-dev.md',
]);
const printer=ts.createPrinter({removeComments:true});
const parse=s=>ts.createSourceFile('source.tsx',s,ts.ScriptTarget.Latest,true,ts.ScriptKind.TSX);
const canonical=(f,n)=>printer.printNode(ts.EmitHint.Unspecified,n,f).replace(/\s+/g,' ');
function collect(f,predicate){const result=[];function visit(n){if(predicate(n))result.push(canonical(f,n));ts.forEachChild(n,visit)}visit(f);return result;}
function prefixes(f){return f.statements.filter(ts.isFunctionDeclaration).map(n=>({name:n.name.text,prefix:n.body.statements.filter(s=>!ts.isReturnStatement(s)).map(s=>canonical(f,s)).filter(s=>s!=='useInitialFieldFocus();'&&!s.startsWith('const actionBlock =')&&!s.startsWith('const inlineBlock =')).join(' ')})).filter(x=>x.name!=='useInitialFieldFocus');}
export function verifyCanais(){
 git('merge-base','--is-ancestor',canaisBase,'HEAD');
 const changed=[...git('diff','--name-only',canaisBase).split('\n'),...git('ls-files','--others','--exclude-standard').split('\n')].filter(Boolean);
 for(const path of changed)assert.ok(allowed.has(path),'Canais changed an unapproved path: '+path);
 assert.equal(readFileSync('frontend/src/App.tsx','utf8').replace("import './pedidos.css'\nimport './conexoes.css'\n",'').trim(),before('frontend/src/App.tsx'),'App may only import the two screen stylesheets');
 assert.equal(readFileSync('.github/workflows/ci.yml','utf8').replace('    # Preserve the full prior suite plus the Canais acceptance proof.\n    timeout-minutes: 40','    timeout-minutes: 30').trim(),before('.github/workflows/ci.yml'),'CI may only extend the timeout for added browser proof');
 for(const path of pages){
  const old=parse(before(path)),now=parse(readFileSync(path,'utf8'));
  const staticStatements=f=>f.statements.filter(n=>!ts.isFunctionDeclaration(n)).map(n=>canonical(f,n)).filter(s=>!s.startsWith('const commandLabels:'));
  assert.deepEqual(staticStatements(now),staticStatements(old),path+': imports, types or top-level contracts changed');
  assert.deepEqual(prefixes(now),prefixes(old),path+': loader, effects, timers, permissions, calculations, handlers or modal validation changed');
  const wiring=f=>collect(f,n=>ts.isJsxAttribute(n)&&/^(?:on[A-Z]|disabled$|value$|checked$|readOnly$|required$|name$|type$|href$|to$)/.test(n.name.getText(f)));
  const original=wiring(old),current=wiring(now);
  assert.deepEqual(current.sort(),original.sort(),path+': business JSX wiring changed');
  const calls=f=>collect(f,n=>ts.isCallExpression(n)&&/^(?:queryRef|mutationRef|fetchCancellationReasons|fetchAvailableMerchants|runMerchantOperation)$/.test(n.expression.getText(f)));
  assert.deepEqual(calls(now),calls(old),path+': backend operation/payload changed');
 }
 for(const [path,root]of [['frontend/src/pedidos.css','work-orders'],['frontend/src/conexoes.css','work-connections']]){
  const css=postcss.parse(readFileSync(path,'utf8'));
  css.walkRules(rule=>{
   for(const selector of postcss.list.comma(rule.selector))assert.ok(selector.startsWith('.ip-ui[data-theme')&&new RegExp('\\.'+root+'(?:[\\s.:#>\\[]|$)').test(selector),'Unscoped Canais selector: '+selector);
   let screen=false;for(let p=rule.parent;p;p=p.parent)if(p.type==='atrule'&&p.name==='media'&&/\bscreen\b/.test(p.params))screen=true;
   assert.ok(screen,'Canais must preserve print: '+rule.selector);
  });
 }
 console.log('Canais: exact route paths, business handlers, permissions, timers, API payloads, CSVs, JSX wiring and screen-only CSS preserved.');
}
if(import.meta.url===new URL(process.argv[1],'file:').href)verifyCanais();
