import assert from 'node:assert/strict';
import {execFileSync} from 'node:child_process';
import {readFileSync} from 'node:fs';
import ts from '../frontend/node_modules/typescript/lib/typescript.js';
import postcss from '../frontend/node_modules/postcss/lib/postcss.mjs';

// Presentation is scoped; retired footer UI is removed, never relocated.
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
for(const path of ['frontend/src/App.css','frontend/src/index.css','frontend/src/home-header-refinements.css','frontend/src/sidebar-refinements.css','frontend/src/components/PosApprovalsModal.tsx','frontend/src/pages/StockPage.tsx','frontend/src/pages/MasterDataPage.tsx','frontend/src/pages/PlatformAdminPage.tsx','frontend/src/pages/SalesManagementPage.tsx','frontend/src/utils/salesOffline.ts','frontend/src/hooks/useModalIsolation.ts','frontend/src/hooks/useDialogAccessibility.ts'])assert.equal(readFileSync(path,'utf8').trim(),git('show',baseline+':'+path),`Functional or print source changed: ${path}`);
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
const removeRetiredFooterCss=source=>source.replace(/^.*\.channel-alert-(?:readiness|settings)[^\n]*\n/gm,'').replace('/* Keep the persistent alert control clear of page actions and mobile navigation. */\n@media screen {\n}\n@media screen and (max-width: 1100px) {\n}\n','');
assert.equal(readFileSync('frontend/src/catalog-standardization.css','utf8').replaceAll('.app-frame:not(.ip-ui) ','').trim(),removeRetiredFooterCss(removeOldAlertReserve(git('show',baseline+':frontend/src/catalog-standardization.css'))).trim(),'Only the approved obsolete footer/alert reserves and legacy selector scope may change; other declarations/print must survive');

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
// Remove only the retired footer readiness/settings UI from the pre-dashboard
// notifier. All order guards, callbacks, leases, hooks, audio and acknowledgement
// must still be exactly the original implementation after this explicit excision.
const notifier='frontend/src/components/ChannelOrderNotifier.tsx';
function removeRetiredFooterNotifierUi(source){
 return source.replace('  const [settingsOpen, setSettingsOpen] = useState(false);\n','')
 .replace('const [browserNotifications, setBrowserNotifications]','const [browserNotifications]')
 .replace('    else setSettingsOpen(false);\n','')
 .replace('useDialogAccessibility(Boolean(order) || settingsOpen, closeActiveDialog);','useDialogAccessibility(Boolean(order), closeActiveDialog);')
 .replace(/  async function toggleBrowserNotifications\(\) \{[\s\S]*?(?=  async function beginReject\(\))/,'')
 .replace(/  if \(!permission\?\.canUpdate\) return null;[\s\S]*?(?=  const validRejection)/,'  if (!permission?.canUpdate || !order) return null;\n');
}
const notifierFile=parse(notifier,readFileSync(notifier,'utf8'));
const expectedNotifier=parse(notifier,removeRetiredFooterNotifierUi(git('show',dashboardBase+':'+notifier)));
assert.equal(canonical(notifierFile,notifierFile),canonical(expectedNotifier,expectedNotifier),'Notifier changed beyond removal of footer-owned UI');
assert.ok(!readFileSync(notifier,'utf8').includes('channel-alert-readiness'));
assert.ok(!readFileSync('frontend/src/components/dashboard-v3/DashboardSurface.tsx','utf8').includes('data-channel-alert-slot'));
const retiredInterface=git('show','a440615bd4b807b6b1484368c32d4149e20ba042:frontend/src/interface.css')
 .replace(/^ +\.ip-ui\[data-theme\] \.channel-alert-readiness \{[^}]*\}\n/gm,'')
 .replace('  /* Preserve existing compact readiness dimensions pending local-slot integration. */\n','');
assert.equal(readFileSync('frontend/src/interface.css','utf8').trim(),retiredInterface.trim(),'Shared shell CSS may only remove retired footer-owned declarations in this refinement');
for(const path of ['frontend/src/pages/LoginPage.tsx','frontend/src/pages/LoginPage.visual.css','frontend/src/pages/DashboardPage.tsx','frontend/src/utils/dashboardExport.ts','frontend/src/utils/stock.ts','frontend/src/utils/dashboardAuthorization.ts'])assert.equal(readFileSync(path,'utf8').trim(),git('show',dashboardBase+':'+path),`Dashboard migration changed preserved source ${path}`);
console.log('Dashboard v3: exact shell JSX, one notifier, original order alert logic without footer readiness UI, API loaders, stale-response guards, filters, money/CSV and login preserved.');
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

// v6 refinements cannot leak into the shell, other dialogs or print.
const refinementCss=postcss.parse(readFileSync('frontend/src/components/dashboard-v3/dashboard-v6.css','utf8'));
refinementCss.walkRules(rule=>{
 for(const selector of postcss.list.comma(rule.selector))assert.match(selector,/^\.(?:ip-dashboard-v3|dashboard-v3-modal(?:-backdrop)?)(?:[.\s[:>]|$)/,'Unscoped v6 selector');
 let scopedToScreen=false;for(let parent=rule.parent;parent;parent=parent.parent)if(parent.type==='atrule'&&parent.name==='media'&&/\bscreen\b/.test(parent.params))scopedToScreen=true;
 assert.ok(scopedToScreen,'Every v6 refinement must be screen-only');
});
for(const path of ['frontend/src/components/dashboard-v3/model.ts','frontend/src/components/dashboard-v3/adapters.ts','frontend/src/components/dashboard-v3/integration.ts','frontend/src/components/dashboard-v3/DashboardPrintReport.tsx'])assert.equal(readFileSync(path,'utf8').trim(),git('show','a440615bd4b807b6b1484368c32d4149e20ba042:'+path),`v6 changed preserved dashboard data/print contract ${path}`);
const geometryPath='frontend/src/components/dashboard-v3/geometry.ts',geometry=parse(geometryPath,readFileSync(geometryPath,'utf8')),originalGeometry=parse(geometryPath,git('show','a440615bd4b807b6b1484368c32d4149e20ba042:'+geometryPath));
for(const name of ['compareRaw','smoothPath','ringSegments','lineSegments','toggleSelection'])assert.equal(canonical(geometry,namedNode(geometry,name)),canonical(originalGeometry,namedNode(originalGeometry,name)),`${name}: v6 may change display sizing and heat opacity, not data/geometry contracts`);
assert.ok(!readFileSync('frontend/src/layout/AppLayout.tsx','utf8').includes('Uma solução Data Dazzle'),'Retired global-footer signature must not reappear');
console.log('v6: screen-only dashboard/modal namespace; original model, adapters, full report, money comparisons and selection preserved.');

// Arthur explicitly authorized only failed-submit focus in the two catalog forms.
// Check that exact hook, then compare the rest of the page with the P48 source.
const catalogPath='frontend/src/pages/CatalogPages.tsx',catalogSource=readFileSync(catalogPath,'utf8'),catalogFile=parse(catalogPath,catalogSource);
const focusHook=namedNode(catalogFile,'useCatalogErrorFocus');
const expectedFocusHook=parse(catalogPath,`function useCatalogErrorFocus(confirmation:Confirmation|null,id:string){
 const requested=useRef(false)
 useEffect(()=>{
  if(confirmation||!requested.current)return
  requested.current=false
  const frame=requestAnimationFrame(()=>document.getElementById(id)?.focus())
  return()=>cancelAnimationFrame(frame)
 },[confirmation,id])
 return useCallback(()=>{requested.current=true},[])
}`);
assert.equal(canonical(catalogFile,focusHook),canonical(expectedFocusHook,namedNode(expectedFocusHook,'useCatalogErrorFocus')),'Only the reviewed post-unmount focus hook is authorized');
let restoredCatalog=catalogSource.slice(0,focusHook.getFullStart())+catalogSource.slice(focusHook.end);
for(const [page,id]of [['SubcategoryPage','subcategory-name-0'],['CategoryPage','category-name-0']]){
 const file=parse(catalogPath,restoredCatalog),node=namedNode(file,page),start=node.getStart(file),end=node.end;
 let body=restoredCatalog.slice(start,end);
 const declaration=` const requestErrorFocus=useCatalogErrorFocus(confirmation,'${id}')\n`;
 assert.equal(body.split(declaration).length,2,`${page}: unexpected focus request wiring`);body=body.replace(declaration,'');
 const replacement="requestErrorFocus();setConfirmation(null);setNotice({type:'error',text:conflict??'Operação não aplicada. Verifique duplicidades e permissões.'})";
 assert.equal(body.split(replacement).length,2,`${page}: focus may change only the failed-confirmation path`);
 body=body.replace(replacement,`setConfirmation(null);setNotice({type:'error',text:conflict??'Operação não aplicada. Verifique duplicidades e permissões.'});focusCatalogField('${id}')`);
 restoredCatalog=restoredCatalog.slice(0,start)+body+restoredCatalog.slice(end);
}
const restoredCatalogFile=parse(catalogPath,restoredCatalog),catalogBefore=parse(catalogPath,git('show','a440615bd4b807b6b1484368c32d4149e20ba042:'+catalogPath));
assert.equal(canonical(restoredCatalogFile,restoredCatalogFile),canonical(catalogBefore,catalogBefore),'Catalog changed beyond the authorized failed-submit focus correction; JSX, validation, requests and data must survive');
console.log('Catalog: exact post-unmount focus exception; original JSX, validation, API calls, drafts and mutations preserved.');

// PDV v2 explicitly replaces the route presentation/branch draft, not sale,
// queue, scanner, approval, money, receipt or shared-shell contracts.
const pdvBase='8efbd9d34e00b9d46a92f545d7d335368ce8f825';
for(const [path,names] of [
 ['frontend/src/pages/PointOfSalePage.tsx',['finish','sync','readProductCode','openCheckout','setPaymentAmount','printReceipt']],
 ['frontend/src/components/CashSessionModal.tsx',['definitiveCashRefusal','refreshConfirmed','signature','movementType','requiresApproval','instruction','operationId']]
]){
 const before=parse(path,git('show',pdvBase+':'+path)),after=parse(path,readFileSync(path,'utf8'));
 for(const name of names)assert.equal(canonical(after,namedNode(after,name)),canonical(before,namedNode(before,name)),`${path}: protected PDV financial contract ${name} changed`);
}
for(const path of ['frontend/src/layout/AppLayout.tsx','frontend/src/interface.css','frontend/src/components/SalesUi.tsx','frontend/src/utils/sales.ts','frontend/src/utils/salesOffline.ts','frontend/src/utils/receipt.ts','frontend/src/utils/serverReceipt.ts'])assert.equal(readFileSync(path,'utf8').trim(),git('show',pdvBase+':'+path),`PDV v2 must preserve shared/financial source ${path}`);
const pdvCss=postcss.parse(readFileSync('frontend/src/pages/PointOfSalePage.v2.css','utf8'));
pdvCss.walkRules(rule=>{
 if(rule.parent.type==='atrule'&&rule.parent.name==='keyframes')return;
 assert.ok(rule.selectors.every(selector=>selector.includes('.ip-pos-route')||selector.includes('.ip-pos-modal')),`PDV selector escapes route/modal: ${rule.selector}`);
 let screen=false;for(let parent=rule.parent;parent;parent=parent.parent)if(parent.type==='atrule'&&parent.name==='media'&&parent.params==='screen')screen=true;
 assert.ok(screen,`PDV styles must be screen-only: ${rule.selector}`);
});
console.log('PDV v2 scope: sale/queue/scanner/payment/receipt and cash financial instructions preserved; all new CSS is screen-only and route/modal scoped.');
