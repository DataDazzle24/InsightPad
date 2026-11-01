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
for(const path of ['frontend/src/App.css','frontend/src/index.css','frontend/src/home-header-refinements.css','frontend/src/sidebar-refinements.css','frontend/src/components/CashSessionModal.tsx','frontend/src/components/PosApprovalsModal.tsx','frontend/src/pages/PointOfSalePage.tsx','frontend/src/pages/StockPage.tsx','frontend/src/pages/MasterDataPage.tsx','frontend/src/pages/PlatformAdminPage.tsx','frontend/src/pages/SalesManagementPage.tsx','frontend/src/pages/DashboardHubPage.tsx','frontend/src/utils/salesOffline.ts','frontend/src/hooks/useModalIsolation.ts','frontend/src/hooks/useDialogAccessibility.ts'])assert.equal(readFileSync(path,'utf8').trim(),git('show',baseline+':'+path),`Functional or print source changed: ${path}`);
const changed=git('diff','--name-only',baseline).split('\n').filter(Boolean);
assert.ok(!changed.some(p=>/^(dataconnect\/|functions\/|frontend\/src\/dataconnect-generated\/|frontend\/src\/auth\/)/.test(p)||/package(?:-lock)?\.json$/.test(p)),'Visual scope changed domain/backend/dependencies');
const css=readFileSync('frontend/src/interface.css','utf8');assert.ok(!css.includes('!important')&&!/@media\s+print/.test(css),'Screen stylesheet must not weaken cascade or redesign print');
console.log('Interface preservation: original callbacks, refs, fields, domain/print sources and scope retained.');

const shell=ts.createSourceFile('AppLayout.tsx',readFileSync('frontend/src/layout/AppLayout.tsx','utf8'),ts.ScriptTarget.Latest,true,ts.ScriptKind.TSX);
const hasClass=(node,name)=>node.openingElement.attributes.properties.some(p=>ts.isJsxAttribute(p)&&p.name.getText(shell)==='className'&&ts.isStringLiteral(p.initializer)&&p.initializer.text.split(/\s+/).includes(name));
let printStagePreserved=false;
function checkShell(node){if(ts.isJsxElement(node)&&node.openingElement.tagName.getText(shell)==='main'&&hasClass(node,'app-frame'))printStagePreserved=node.children.some(child=>ts.isJsxElement(child)&&hasClass(child,'app-stage'));ts.forEachChild(node,checkShell)}
checkShell(shell);assert.ok(printStagePreserved,'Existing print stylesheet needs .app-stage directly below .app-frame');

assert.equal(readFileSync('frontend/src/catalog-standardization.css','utf8').replaceAll('.app-frame:not(.ip-ui) ','').trim(),git('show',baseline+':frontend/src/catalog-standardization.css'),'Only the legacy mobile channel selector scope may change; declarations/print must survive');
