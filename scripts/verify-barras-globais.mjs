import assert from 'node:assert/strict';
import {execFileSync} from 'node:child_process';
import {readFileSync} from 'node:fs';
import ts from '../frontend/node_modules/typescript/lib/typescript.js';
import postcss from '../frontend/node_modules/postcss/lib/postcss.mjs';
export const barrasBase='9230247b8f6f3ddfa1868ed66a67ddf2eb276ed7';
const git=(...args)=>execFileSync('git',args,{encoding:'utf8'}).trim();
const before=path=>git('show',barrasBase+':'+path);
const sources=['frontend/src/App.tsx','frontend/src/layout/AppLayout.tsx'];
export const barrasHistoricalSource=(path,encoding)=>sources.includes(path)?before(path):readFileSync(path,encoding);
const allowed=new Set([...sources,'frontend/src/barras-globais.css','frontend/src/layout/AppLayout.test.tsx',
 'scripts/verify-barras-globais.mjs','scripts/verify-plataforma.mjs','scripts/verify-reconciliation.mjs','scripts/reconciliation-scope.json',
 'scripts/qa-browser/barras-globais.mjs','scripts/qa-browser/run.mjs']);
const parse=s=>ts.createSourceFile('AppLayout.tsx',s,ts.ScriptTarget.Latest,true,ts.ScriptKind.TSX);
const printer=ts.createPrinter({removeComments:true});
const canonical=(f,n)=>printer.printNode(ts.EmitHint.Unspecified,n,f).replace(/\s+/g,' ');
function collect(f,predicate){const result=[];function visit(n){if(predicate(n))result.push(canonical(f,n));ts.forEachChild(n,visit);}visit(f);return result;}
function named(f,name){let found;function visit(n){if((ts.isFunctionDeclaration(n)||ts.isVariableDeclaration(n))&&n.name?.getText(f)===name)found=n;ts.forEachChild(n,visit);}visit(f);assert.ok(found,'Missing preserved '+name);return canonical(f,found);}
export function verifyBarrasGlobais(){
 git('merge-base','--is-ancestor',barrasBase,'HEAD');
 const changed=[...git('diff','--name-only',barrasBase).split('\n'),...git('ls-files','--others','--exclude-standard').split('\n')].filter(Boolean);
 for(const path of changed)assert.ok(allowed.has(path),'Barras globais changed an unapproved path: '+path);
 assert.equal(readFileSync(sources[0],'utf8').replace("import './barras-globais.css'\n",'').trim(),before(sources[0]),'Only the global-bar stylesheet import may change App/routes');
 const path=sources[1],old=parse(before(path)),now=parse(readFileSync(path,'utf8'));
 for(const name of ['WhatsAppIcon','isAdministrator','modules','availablePages','pageTitle','handleSignOut'])assert.equal(named(now,name),named(old,name),'Barras changed preserved auth/session/page/support logic: '+name);
 const calls=f=>collect(f,n=>ts.isCallExpression(n)&&['useAuth','useTheme','useLocation','useState'].includes(n.expression.getText(f)));
 assert.deepEqual(calls(now),calls(old),'Auth, theme, route or state contracts changed');
 const captures=f=>collect(f,n=>ts.isJsxAttribute(n)&&['onChangeCapture','onFocusCapture','data-cadastros'].includes(n.name.getText(f)));
 assert.deepEqual(captures(now),captures(old),'Global masks/shortcuts/route attribute changed');
 const attrs=f=>collect(f,n=>ts.isJsxAttribute(n)&&/^(?:onClick|onSubmit|disabled|href|to|target|rel|type)$/.test(n.name.getText(f)));
 const original=attrs(old);const theme=original.indexOf('onClick={toggleTheme}');assert.ok(theme>=0);original.splice(theme,1);
 const removedThemeType=original.indexOf('type="button"');assert.ok(removedThemeType>=0);original.splice(removedThemeType,1);
 const current=attrs(now).map(x=>x.startsWith('onClick={(event) =>')&&x.includes('event.target === event.currentTarget')?'onClick={() => setDrawerOpen(false)}':x);
 assert.deepEqual(current.sort(),original.sort(),'Only move theme/account controls and gate the backdrop target; preserve support, auth links, disabled states and logout wiring');
 const text=readFileSync(path,'utf8');
 assert.equal((text.match(/<ChannelOrderNotifier\s*\/>/g)||[]).length,1);
 assert.ok(text.includes('<section className="app-stage"><Outlet /></section>'),'Print needs the original direct app-stage/Outlet');
 assert.ok(text.includes('useDialogAccessibility(drawerOpen, () => setDrawerOpen(false))'),'Use original dialog focus/Escape hook');
 assert.ok(text.includes('import { Link, NavLink, Outlet, useLocation } from "react-router-dom";'));
 assert.ok(!text.includes('InterfaceNavigationLink'),'Only the rail drops the feedback wrapper; other surfaces are protected by exact scope');
 const css=postcss.parse(readFileSync('frontend/src/barras-globais.css','utf8'));
 css.walkAtRules(n=>assert.ok(['media','keyframes'].includes(n.name),'Unapproved stylesheet directive: '+n.name));
 css.walkRules(rule=>{
  let screen=false,keyframe=false;for(let p=rule.parent;p;p=p.parent){if(p.type==='atrule'&&p.name==='media'&&p.params==='screen')screen=true;if(p.type==='atrule'&&p.name==='keyframes'){keyframe=true;assert.ok(['shell-fade-in','shell-drawer-in'].includes(p.params));}}
  assert.ok(screen,'Global bars must preserve print');
  if(!keyframe)for(const selector of postcss.list.comma(rule.selector))assert.match(selector,/^\.(?:app-frame\.)?ip-ui\.ip-shell\[data-theme/,'Unscoped global-bar rule');
 });
 console.log('Barras globais: only three product paths; original auth/session/theme/permission/support/mask/Outlet/notifier contracts retained; CSS shell/screen-only.');
}
if(import.meta.url===new URL(process.argv[1],'file:').href)verifyBarrasGlobais();
