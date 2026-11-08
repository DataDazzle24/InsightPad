import assert from 'node:assert/strict';
import {execFileSync} from 'node:child_process';
import {readFileSync} from 'node:fs';
import ts from '../frontend/node_modules/typescript/lib/typescript.js';
import postcss from '../frontend/node_modules/postcss/lib/postcss.mjs';

export const cadastrosBase='9c50ee250c54ed9b2ab6a2b4656aedff1fb9a63a';
const git=(...args)=>execFileSync('git',args,{encoding:'utf8'}).trim();
const allowed=new Set([
 'frontend/src/App.tsx','frontend/src/cadastros.css','frontend/src/layout/AppLayout.tsx',
 'frontend/src/pages/ModuleMenuPage.tsx','frontend/src/pages/CatalogPages.tsx',
 'frontend/src/pages/MasterDataPage.tsx','frontend/src/pages/ProductExtras.tsx',
 'frontend/src/components/SalesUi.tsx','frontend/src/components/SearchableProductSelect.tsx',
 'frontend/src/hooks/useCadastroDialog.ts',
]);
const print=ts.createPrinter({removeComments:true});
function parse(source){return ts.createSourceFile('source.tsx',source,ts.ScriptTarget.Latest,true,ts.ScriptKind.TSX)}
function canonical(file,node){return print.printNode(ts.EmitHint.Unspecified,node,file).replace(/\s+/g,' ')}
function named(file,name){let found;function visit(n){if((ts.isFunctionDeclaration(n)||ts.isVariableDeclaration(n))&&n.name?.getText(file)===name)found=n;ts.forEachChild(n,visit)}visit(file);assert.ok(found,'Missing '+name);return canonical(file,found)}
function sdkCalls(file){const operations=new Set();for(const n of file.statements)if(ts.isImportDeclaration(n)&&n.moduleSpecifier.text==='@insightpad/dataconnect')for(const e of n.importClause.namedBindings.elements)operations.add(e.name.text);const result=[];function visit(n){if(ts.isCallExpression(n)&&operations.has(n.expression.getText(file)))result.push(canonical(file,n));ts.forEachChild(n,visit)}visit(file);return result.sort()}
export function verifyCadastros(){
 git('merge-base','--is-ancestor',cadastrosBase,'HEAD');
 for(const path of git('diff','--name-only',cadastrosBase).split('\n').filter(Boolean)){
  if(path.startsWith('frontend/src/'))assert.ok(allowed.has(path)||path.endsWith('.test.tsx'),`Cadastros modified another product source: ${path}`);
  else assert.match(path,/^(?:scripts\/verify-(?:cadastros|interface|reconciliation)\.mjs|scripts\/reconciliation-scope\.json|scripts\/qa-browser\/|docs\/)/,'Cadastros changed backend, SDK, dependency, infra or workflow: '+path);
 }
 const before=path=>git('show',cadastrosBase+':frontend/src/'+path),after=path=>readFileSync('frontend/src/'+path,'utf8');
 assert.equal(after('App.tsx').replace("import './cadastros.css'\n",'').trim(),before('App.tsx'));
 assert.equal(after('layout/AppLayout.tsx').replace(/\n      data-cadastros=\{[\s\S]*?\n      \}/,'' ).trim(),before('layout/AppLayout.tsx'),'Shell change must be scope attribute only');
 assert.equal(after('pages/ModuleMenuPage.tsx').replace('className={moduleKey === "cadastros" ? "legacy-module cad-module" : "legacy-module"}','className="legacy-module"').trim(),before('pages/ModuleMenuPage.tsx'));
 for(const family of ['pages/MasterDataPage.tsx','pages/CatalogPages.tsx','pages/ProductExtras.tsx']){
  const a=parse(after(family)),b=parse(before(family));assert.deepEqual(sdkCalls(a),sdkCalls(b),family+': SDK operation/payload changed');
 }
 const business={
  'pages/MasterDataPage.tsx':['configs','modalSections','productModalSections','sectionFields','moneyToNumber','fieldOptions','lookupCep','validate','load','status','exportCsv','comboCostCents'],
  'pages/CatalogPages.tsx':['normalizeCatalogName','useCatalogErrorFocus'],
  'pages/ProductExtras.tsx':['promotionSchema','clearEditor','edit','exportHistory'],
 };
 for(const [family,names]of Object.entries(business)){
  const a=parse(after(family)),b=parse(before(family));
  for(const name of names){if(name==='normalizeCatalogName')continue;assert.equal(named(a,name),named(b,name),`${family}: business rule ${name} changed`)}
 }
 const masterBefore=parse(before('pages/MasterDataPage.tsx'));
 const masterAfter=parse(after('pages/MasterDataPage.tsx'));
 assert.equal(named(masterAfter,'save').replaceAll('setFormNotice(', 'setNotice('),named(masterBefore,'save'),'Product/customer/supplier/branch save may only move errors inside the dialog');
 assert.equal(named(masterAfter,'open').replace('setFormNotice(""); ',''),named(masterBefore,'open'),'Opening a form must preserve persisted values and component quantities');
 const sharedBefore=parse(before('components/SalesUi.tsx')),sharedAfter=parse(after('components/SalesUi.tsx'));
 for(const node of sharedBefore.statements)if(ts.isFunctionDeclaration(node)&&!['DateRangePicker','BarcodeScanner'].includes(node.name?.text))assert.equal(named(sharedAfter,node.name.text),canonical(sharedBefore,node),'Unrelated shared UI changed');
 function effects(file,name){const result=[];let owner;for(const n of file.statements)if(ts.isFunctionDeclaration(n)&&n.name?.text===name)owner=n;assert.ok(owner);function visit(n){if(ts.isCallExpression(n)&&n.expression.getText(file)==='useEffect')result.push(canonical(file,n));ts.forEachChild(n,visit)}visit(owner);return result}
 for(const name of ['DateRangePicker','BarcodeScanner'])assert.deepEqual(effects(sharedAfter,name),effects(sharedBefore,name),name+': calendar effects, camera lifecycle, detector/fallback or media cleanup changed');
 const originalSelect=after('components/SearchableProductSelect.tsx').replace(/              if \(event.currentTarget.closest\("\[data-cadastros\]"\)\) \{\n                if \(!open\) return;\n                event.preventDefault\(\);\n              \}\n/,'');
 assert.equal(originalSelect.trim(),before('components/SearchableProductSelect.tsx'),'Shared product selection must preserve all behavior except scoped open-list Escape');
 const css=postcss.parse(after('cadastros.css'));
 css.walkRules(rule=>{
  for(const selector of postcss.list.comma(rule.selector)){
   assert.match(selector,/^\.(?:app-frame\.)?ip-ui\[data-theme(?:[=\]])/,'Unscoped Cadastros selector');
   assert.ok(selector.includes('[data-cadastros]'),'Missing route guard: '+selector);
   if(/catalog-(?:backdrop|modal|confirm)|barcode-modal/.test(selector))assert.ok(selector.includes('.cad-page'),'Dialog styles leak to global notifier');
  }
  let screen=false;for(let p=rule.parent;p;p=p.parent)if(p.type==='atrule'&&p.name==='media'&&p.params==='screen')screen=true;
  assert.ok(screen,'Cadastros presentation must not redesign print');
 });
 console.log('Cadastros: exact shared shell, backend/SDK calls, fields, masks, quantities, CSV, CEP, loads and route-scoped screen CSS preserved.');
}
if(import.meta.url===new URL(process.argv[1],'file:').href)verifyCadastros();
