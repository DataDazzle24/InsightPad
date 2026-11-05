import assert from 'node:assert/strict';
import {execFileSync} from 'node:child_process';
import {readFileSync} from 'node:fs';
import ts from '../frontend/node_modules/typescript/lib/typescript.js';

// Presentation may relocate controls; it must retain their business wiring.
const baseline='3f5ba5b67567e3bf831575fb229d16a79d6ed6b1';
const git=(...args)=>execFileSync('git',args,{encoding:'utf8'}).trim();
git('merge-base','--is-ancestor',baseline,'HEAD');
const families=['layout/AppLayout.tsx','pages/DashboardPage.tsx','pages/ModuleMenuPage.tsx','pages/PlatformAdminMenuPage.tsx','pages/LoginPage.tsx','pages/AccessDeniedPage.tsx'];
const businessProps=new Set(['onChangeCapture','onFocusCapture','onClick','onSubmit','onKeyDown','onCancel','disabled','value','checked','readOnly','required','name','id','type','ref','aria-controls']);
const printer=ts.createPrinter({removeComments:true});
function attributes(source,path){
 const file=ts.createSourceFile(path,source,ts.ScriptTarget.Latest,true,ts.ScriptKind.TSX),counts=new Map();
 function visit(node){
  if(ts.isJsxAttribute(node)&&businessProps.has(node.name.getText(file))){const text=printer.printNode(ts.EmitHint.Unspecified,node,file);counts.set(text,(counts.get(text)??0)+1)}
  ts.forEachChild(node,visit);
 }
 visit(file);return counts;
}
for(const family of families){
 const path='frontend/src/'+family,before=attributes(git('show',baseline+':'+path),path),after=attributes(readFileSync(path,'utf8'),path);
 for(const [attribute,count]of before)assert.ok((after.get(attribute)??0)>=count,`${path}: removed or changed business wiring ${attribute}`);
}
for(const path of ['frontend/src/App.css','frontend/src/index.css','frontend/src/home-header-refinements.css','frontend/src/sidebar-refinements.css','frontend/src/components/CashSessionModal.tsx','frontend/src/components/PosApprovalsModal.tsx','frontend/src/pages/PointOfSalePage.tsx','frontend/src/pages/StockPage.tsx','frontend/src/pages/MasterDataPage.tsx','frontend/src/pages/PlatformAdminPage.tsx','frontend/src/pages/SalesManagementPage.tsx','frontend/src/utils/salesOffline.ts','frontend/src/hooks/useModalIsolation.ts','frontend/src/hooks/useDialogAccessibility.ts'])assert.equal(readFileSync(path,'utf8').trim(),git('show',baseline+':'+path),`Functional or print source changed: ${path}`);
const changed=git('diff','--name-only',baseline).split('\n').filter(Boolean);
assert.ok(!changed.some(p=>/^(dataconnect\/|functions\/|frontend\/src\/dataconnect-generated\/|frontend\/src\/auth\/)/.test(p)||/package(?:-lock)?\.json$/.test(p)),'Visual scope changed domain/backend/dependencies');
const css=readFileSync('frontend/src/interface.css','utf8');assert.ok(!css.includes('!important')&&!/@media\s+print/.test(css),'Screen stylesheet must not weaken cascade or redesign print');
console.log('Interface preservation: original callbacks, refs, fields, domain/print sources and scope retained.');

const shell=ts.createSourceFile('AppLayout.tsx',readFileSync('frontend/src/layout/AppLayout.tsx','utf8'),ts.ScriptTarget.Latest,true,ts.ScriptKind.TSX);
const hasClass=(node,name)=>node.openingElement.attributes.properties.some(p=>ts.isJsxAttribute(p)&&p.name.getText(shell)==='className'&&ts.isStringLiteral(p.initializer)&&p.initializer.text.split(/\s+/).includes(name));
let printStagePreserved=false;
function checkShell(node){if(ts.isJsxElement(node)&&node.openingElement.tagName.getText(shell)==='main'&&hasClass(node,'app-frame'))printStagePreserved=node.children.some(child=>ts.isJsxElement(child)&&hasClass(child,'app-stage'));ts.forEachChild(node,checkShell)}
checkShell(shell);assert.ok(printStagePreserved,'Existing print stylesheet needs .app-stage directly below .app-frame');

const removeOldAlertReserve=source=>source.replace(/^  \.app-frame:has\(> \.channel-alert-readiness\) > \.app-stage \{ padding-bottom: (?:4\.5|8\.7)rem; \}\n/gm,'');
assert.equal(readFileSync('frontend/src/catalog-standardization.css','utf8').replaceAll('.app-frame:not(.ip-ui) ','').trim(),removeOldAlertReserve(git('show',baseline+':frontend/src/catalog-standardization.css')),'Only the approved obsolete footer/alert reserves and legacy selector scope may change; other declarations/print must survive');

// Approved dashboard v3 replaces presentation, never the loader/session/domain contracts.
const dashboardBase='b753891db86b3219e9f11cc113405a83bf3fedb5';
const parse=(path,source)=>ts.createSourceFile(path,source,ts.ScriptTarget.Latest,true,ts.ScriptKind.TSX);
function namedNode(file,name){let found;function visit(node){if((ts.isVariableDeclaration(node)||ts.isFunctionDeclaration(node))&&node.name?.getText(file)===name)found=node;ts.forEachChild(node,visit)}visit(file);assert.ok(found,`Missing ${name}`);return found}
const canonical=(file,node)=>printer.printNode(ts.EmitHint.Unspecified,node,file).replace(/\s+/g,' ');
const stripGeneration=source=>source.replace(/setGeneratedAt\(new Date\(\)\);/g,'');
for(const [family,names]of [['DailyProfitDashboardPage.tsx',['load','toggle','apply','choosePeriod']],['DashboardHubPage.tsx',['load']],['ChannelDashboardPage.tsx',['load']]]){
 const path='frontend/src/pages/'+family,before=parse(path,git('show',dashboardBase+':'+path)),after=parse(path,stripGeneration(readFileSync(path,'utf8')));
 for(const name of names)assert.equal(canonical(after,namedNode(after,name)),canonical(before,namedNode(before,name)),`${family}: preserved ${name} changed`);
}
const shellBefore=parse('AppLayout.tsx',git('show',dashboardBase+':frontend/src/layout/AppLayout.tsx'));
for(const className of ['legacy-header','ip-top']){
 const find=file=>{let found;function visit(n){if(ts.isJsxElement(n)&&n.openingElement.attributes.properties.some(p=>ts.isJsxAttribute(p)&&p.name.getText(file)==='className'&&ts.isStringLiteral(p.initializer)&&p.initializer.text.split(/\s+/).includes(className)))found=n;ts.forEachChild(n,visit)}visit(file);assert.ok(found,`Missing ${className}`);return found.getText(file)};
 assert.equal(find(shell),find(shellBefore),`${className}: original JSX must be byte-identical`);
}
assert.equal((readFileSync('frontend/src/layout/AppLayout.tsx','utf8').match(/<ChannelOrderNotifier\s*\/>/g)||[]).length,1);
assert.ok(!readFileSync('frontend/src/layout/AppLayout.tsx','utf8').includes('className="ip-bottom"'));
// Invert only the reviewed portal plumbing; the entire notifier must then be original.
const notifier='frontend/src/components/ChannelOrderNotifier.tsx';
const unportal=readFileSync(notifier,'utf8').replace("import { createPortal } from 'react-dom';\n",'').replace("import { useChannelAlertTarget } from '../hooks/useChannelAlertTarget';\n",'').replace('  const alertTarget = useChannelAlertTarget(Boolean(permission?.canUpdate));\n','').replace('return alertTarget ? createPortal(<button className="channel-alert-readiness"','return <button className="channel-alert-readiness"').replace('</button>, alertTarget) : null;','</button>;');
assert.equal(unportal.trim(),git('show',dashboardBase+':'+notifier),'Notifier audio/order/session/permission logic changed');
for(const path of ['frontend/src/pages/LoginPage.tsx','frontend/src/pages/LoginPage.visual.css','frontend/src/pages/DashboardPage.tsx','frontend/src/utils/dashboardExport.ts','frontend/src/utils/stock.ts','frontend/src/utils/dashboardAuthorization.ts'])assert.equal(readFileSync(path,'utf8').trim(),git('show',dashboardBase+':'+path),`Dashboard migration changed preserved source ${path}`);
console.log('Dashboard v3: exact shell JSX, one notifier, original alert logic, API loaders, stale-response guards, filters, money/CSV and login preserved.');
// The complete original report mappings survive separately from the active screen.
const reportPath='frontend/src/components/dashboard-v3/DashboardPrintReport.tsx';
const report=parse(reportPath,readFileSync(reportPath,'utf8'));
const reportMappings=file=>{const mappings=[];function visit(n){if(ts.isJsxAttribute(n)&&['rows','headers','columns'].includes(n.name.getText(file)))mappings.push(canonical(file,n));ts.forEachChild(n,visit)}visit(file);return mappings};
const completeMappings=new Set(reportMappings(report));
for(const family of ['DashboardHubPage.tsx','ChannelDashboardPage.tsx']){
 const path='frontend/src/pages/'+family,before=parse(path,git('show',dashboardBase+':'+path));
 for(const mapping of reportMappings(before))assert.ok(completeMappings.has(mapping),`Original full print mapping missing: ${family}: ${mapping.slice(0,140)}`);
}
function reportControls(n){assert.ok(!(ts.isJsxAttribute(n)&&/^on[A-Z]/.test(n.name.getText(report))),'Print report must not duplicate live handlers');if(ts.isJsxOpeningElement(n)||ts.isJsxSelfClosingElement(n))assert.notEqual(n.tagName.getText(report),'button','Print keeps report data, not hidden duplicate buttons');ts.forEachChild(n,reportControls)}
reportControls(report);
console.log('Full original operational/channel report rows, columns and headers preserved; no duplicate report actions.');
