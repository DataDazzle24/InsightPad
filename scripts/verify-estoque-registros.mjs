import assert from 'node:assert/strict';
import {execFileSync} from 'node:child_process';
import {readFileSync} from 'node:fs';
import ts from '../frontend/node_modules/typescript/lib/typescript.js';
import postcss from '../frontend/node_modules/postcss/lib/postcss.mjs';

export const estoqueBase='6e727a05fcd987b236ee11646c4c70e4bc88fcf5';
export const estoqueHistoricalPaths=new Set(['frontend/src/App.tsx','frontend/src/components/SalesUi.tsx','frontend/src/pages/StockPage.tsx','frontend/src/pages/SalesManagementPage.tsx']);
const git=(...args)=>execFileSync('git',args,{encoding:'utf8'}).trim();
const printer=ts.createPrinter({removeComments:true});
const parse=source=>ts.createSourceFile('source.tsx',source,ts.ScriptTarget.Latest,true,ts.ScriptKind.TSX);
const canonical=(file,node)=>printer.printNode(ts.EmitHint.Unspecified,node,file).replace(/\s+/g,' ');
const before=path=>git('show',estoqueBase+':'+path);
export const estoqueHistoricalSource=(path,encoding)=>estoqueHistoricalPaths.has(path)?before(path):readFileSync(path,encoding);
const allowed=new Set([
 ...estoqueHistoricalPaths,'frontend/src/estoque-registros.css','frontend/src/hooks/useWorkDialog.ts',
 'frontend/src/hooks/useWorkDialog.test.tsx','frontend/src/components/WorkspaceFilters.test.tsx','frontend/src/pages/StockPage.test.tsx',
 'scripts/verify-estoque-registros.mjs','scripts/verify-cadastros.mjs','scripts/verify-interface.mjs',
 'scripts/verify-reconciliation.mjs','scripts/reconciliation-scope.json','scripts/qa-browser/estoque-registros.mjs','scripts/qa-browser/consolidated.mjs','scripts/qa-browser/residual.mjs','scripts/qa-browser/seal.mjs','scripts/qa-browser/evidence.test.mjs','scripts/qa-browser/run.mjs',
 'docs/estoque-registros-ui-dev.md',
]);
function declarations(file){const result=new Map();function visit(n){if((ts.isVariableDeclaration(n)||ts.isFunctionDeclaration(n))&&n.name&&ts.isIdentifier(n.name))result.set(n.name.text,n);ts.forEachChild(n,visit)}visit(file);return result}
function wiring(file){const result=[];function visit(n){if(ts.isJsxAttribute(n)&&(/^(?:on[A-Z]|disabled$|value$|checked$|readOnly$|required$|name$|type$)/.test(n.name.getText(file))))result.push(canonical(file,n));ts.forEachChild(n,visit)}visit(file);return result}
export function verifyEstoqueRegistros(){
 git('merge-base','--is-ancestor',estoqueBase,'HEAD');
 const changed=[...git('diff','--name-only',estoqueBase).split('\n'),...git('ls-files','--others','--exclude-standard').split('\n')].filter(Boolean);
 for(const path of changed)assert.ok(allowed.has(path),'Estoque/Registros modified source outside exact approved scope: '+path);
 assert.equal(readFileSync('frontend/src/App.tsx','utf8').replace("import './estoque-registros.css'\n",'').trim(),before('frontend/src/App.tsx'),'App may only import the scoped stylesheet');
 for(const path of ['frontend/src/pages/StockPage.tsx','frontend/src/pages/SalesManagementPage.tsx']){
  const a=parse(readFileSync(path,'utf8')),b=parse(before(path));
  const old=declarations(b),now=declarations(a);
  // Every original named calculation, request, mutation, export and guard survives.
  // Page/component functions contain the approved presentation replacement.
  const presentation=new Set(['StockPage','SalesManagementPage','ItemEditor','OperationModal','TransferModal']);
  for(const[name,node]of old)if(!presentation.has(name))assert.equal(canonical(a,now.get(name)),canonical(b,node),path+': protected declaration '+name);
  for(const name of ['StockPage','SalesManagementPage'].filter(n=>old.has(n))){
   const prefix=(file,node)=>node.body.statements.filter(n=>!ts.isReturnStatement(n)&&!(ts.isExpressionStatement(n)&&ts.isCallExpression(n.expression)&&n.expression.expression.getText(file)==='useWorkDialog')).map(n=>canonical(file,n)).join(' ').replaceAll('useDialogAccessibility(', 'useWorkDialog(');
   // Sales places its three accessibility calls in one expression statement.
   const strip=s=>s.replace(/useWorkDialog\([^;]*\);\s*/g,'');
   assert.equal(strip(prefix(a,now.get(name))),strip(prefix(b,old.get(name))),path+': page logic changed before JSX');
  }
  const original=wiring(b),current=wiring(a);for(const attribute of new Set(original))assert.ok(current.filter(x=>x===attribute).length>=original.filter(x=>x===attribute).length,path+': removed business wiring '+attribute);
 }
 let shared=readFileSync('frontend/src/components/SalesUi.tsx','utf8');
 shared=shared.replace(/    <div className="filter-field" ref=\{root\} onKeyDown=\{event=>\{[\s\S]*?\n    \}\}>/,'    <div className="filter-field" ref={root}>')
  .replace('  workspaceUX = false,\n','').replace('  workspaceUX?: boolean;\n','')
  .replace('!(cadastros || workspaceUX)','!cadastros').replace('cadastros || workspaceUX ? open : undefined','cadastros ? open : undefined');
 shared=shared.replace(`    // Inline workspace dropdowns change the dialog height when dismissed.
    // Let the outside control receive its click before the layout can move.
    const outsideEvent = root.current?.closest(".work-stock,.work-sales") ? "click" : "pointerdown";
    document.addEventListener(outsideEvent, close);
    return () => document.removeEventListener(outsideEvent, close);`,`    document.addEventListener("pointerdown", close);
    return () => document.removeEventListener("pointerdown", close);`)
  .replace(`    const outsideEvent = workspaceUX ? "click" : "pointerdown";
    document.addEventListener(outsideEvent, closeOutside, true);
    return () => document.removeEventListener(outsideEvent, closeOutside, true);
  }, [open, workspaceUX]);`,`    document.addEventListener("pointerdown", closeOutside, true);
    return () => document.removeEventListener("pointerdown", closeOutside, true);
  }, [open]);`)
  .replace('const close = (event: Event)', 'const close = (event: PointerEvent)')
  .replace('const closeOutside = (event: Event)', 'const closeOutside = (event: PointerEvent)');
 assert.equal(shared.trim(),before('frontend/src/components/SalesUi.tsx'),'Shared UI changed beyond scoped Escape, click-safe dismissal and explicit calendar opt-in');
 const css=postcss.parse(readFileSync('frontend/src/estoque-registros.css','utf8'));
 css.walkRules(rule=>{
  for(const selector of postcss.list.comma(rule.selector))assert.ok(selector.startsWith('.ip-ui[data-theme')&&(selector.includes('.stock-page.work-stock')||selector.includes('.sales-page.work-sales')),'Unscoped workspace selector: '+selector);
  let screen=false;for(let p=rule.parent;p;p=p.parent)if(p.type==='atrule'&&p.name==='media'&&/\bscreen\b/.test(p.params))screen=true;
  assert.ok(screen,'Workspace CSS changed print: '+rule.selector);
 });
 console.log('Estoque/Registros: exact route scope, original calculations, requests, mutation guards, exports, business wiring and shared UI defaults preserved.');
}
if(import.meta.url===new URL(process.argv[1],'file:').href)verifyEstoqueRegistros();
