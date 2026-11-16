import assert from 'node:assert/strict';
import {execFileSync} from 'node:child_process';
import {fineBase,fineHistoricalSource,verifyAjustesFinos} from './verify-ajustes-finos.mjs';
const readFileSync=fineHistoricalSource;
import ts from '../frontend/node_modules/typescript/lib/typescript.js';
import postcss from '../frontend/node_modules/postcss/lib/postcss.mjs';
export const menusBase='1fff0fe154ad473ee61437929b93a17843215a0a';
const git=(...args)=>execFileSync('git',args,{encoding:'utf8'}).trim();
const before=path=>git('show',menusBase+':'+path);
const pages=['frontend/src/pages/DashboardPage.tsx','frontend/src/pages/ModuleMenuPage.tsx','frontend/src/pages/PlatformAdminMenuPage.tsx'];
export const menusHistoricalSource=(path,encoding)=>['frontend/src/App.tsx',...pages].includes(path)?before(path):readFileSync(path,encoding);
const allowed=new Set(['frontend/src/App.tsx',...pages,'frontend/src/components/MenuCard.tsx','frontend/src/menus.css','frontend/src/components/MenuCard.test.tsx','frontend/src/pages/MenuPages.test.tsx','frontend/qa/application.tsx','scripts/verify-menus.mjs','scripts/verify-barras-globais.mjs','scripts/verify-reconciliation.mjs','scripts/reconciliation-scope.json','scripts/qa-browser/menus.mjs','scripts/qa-browser/run.mjs','scripts/qa-browser/cadastros.mjs','scripts/qa-browser/interface.mjs']);
const parse=(s)=>ts.createSourceFile('source.tsx',s,ts.ScriptTarget.Latest,true,ts.ScriptKind.TSX),printer=ts.createPrinter({removeComments:true});
const canonical=(f,n)=>printer.printNode(ts.EmitHint.Unspecified,n,f).replace(/\s+/g,' ');
function collect(f,predicate){const a=[];function visit(n){if(predicate(n))a.push(canonical(f,n));ts.forEachChild(n,visit)}visit(f);return a;}
export function verifyMenus(){
 verifyAjustesFinos();
 git('merge-base','--is-ancestor',menusBase,'HEAD');
 for(const p of [...git('diff','--name-only',menusBase,fineBase).split('\n')].filter(Boolean))assert.ok(allowed.has(p),'Menus changed an unapproved path: '+p);
 assert.equal(readFileSync('frontend/src/App.tsx','utf8').replace("import './menus.css'\n",'').trim(),before('frontend/src/App.tsx'),'Only menus CSS import can change App/router/guards');
 assert.match(readFileSync('frontend/src/App.tsx','utf8'),/import '\.\/barras-globais.css'\nimport '\.\/menus.css'/);
 for(const path of pages){
  const old=parse(before(path)),now=parse(readFileSync(path,'utf8'));
  const statics=f=>f.statements.filter(n=>!ts.isFunctionDeclaration(n)&&!ts.isImportDeclaration(n)).map(n=>canonical(f,n));assert.deepEqual(statics(now),statics(old),'Menu definitions changed: '+path);
  const prefix=f=>collect(f,n=>ts.isFunctionDeclaration(n)).map((_,i)=>{const fn=f.statements.filter(ts.isFunctionDeclaration)[i];return fn.body.statements.filter(n=>!ts.isReturnStatement(n)).map(n=>canonical(f,n));});assert.deepEqual(prefix(now),prefix(old),'Menu filters/auth/hooks changed: '+path);
  const routes=f=>collect(f,n=>ts.isVariableDeclaration(n)&&n.name.getText(f)==='route');assert.deepEqual(routes(now),routes(old),'Route fallback/resolution changed');
  for(const prop of ['to','label','description','icon'])assert.match(readFileSync(path,'utf8'),new RegExp('\\b'+prop+'=\\{(?:module|item)\\.'+(prop==='to'?'(?:to|route)':prop)+'\\}|\\b'+prop+'=\\{route\\}'),'MenuCard binding missing: '+prop);
 }
 const home='frontend/src/pages/DashboardPage.tsx';const brand=f=>collect(f,n=>ts.isJsxElement(n)&&n.openingElement.attributes.properties.some(a=>ts.isJsxAttribute(a)&&a.name.getText(f)==='className'&&ts.isStringLiteral(a.initializer)&&a.initializer.text==='home-menu__brand'));
 assert.deepEqual(brand(parse(readFileSync(home,'utf8'))),brand(parse(before(home))),'Home brand/welcome/logo/slogan changed');
 const css=postcss.parse(readFileSync('frontend/src/menus.css','utf8'));
 css.walkRules(rule=>{for(const selector of postcss.list.comma(rule.selector))assert.ok(/^\.ip-ui\[data-theme/.test(selector)&&/\.menus-(?:card|submenu)/.test(selector),'Unscoped menu style');let screen=false;for(let n=rule.parent;n;n=n.parent)if(n.type==='atrule'&&n.name==='media'&&n.params==='screen')screen=true;assert.ok(screen,'Menus must preserve print');});
 console.log('Menus: six product paths; original routing/guards, permissions, texts/order, home brand and shell preserved; CSS menu/screen-only.');
}
if(import.meta.url===new URL(process.argv[1],'file:').href)verifyMenus();
