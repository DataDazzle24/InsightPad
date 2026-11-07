import assert from 'node:assert/strict';
import {mkdtempSync,mkdirSync,writeFileSync,rmSync} from 'node:fs';
import {tmpdir} from 'node:os';
import {join} from 'node:path';
import {chromium} from 'playwright';
import {usePosBranch} from './pos-branch.mjs';

export async function pdvV2({output,sha,origin='http://127.0.0.1:4174'}){
 const dir=output+'/pdv-v2';mkdirSync(dir,{recursive:true});
 const scratch=mkdtempSync(join(tmpdir(),'insightpad-pdv-native-')),extension=join(scratch,'extension');mkdirSync(extension);
 const cases=[],errors=[];let context;
 const record=async(name,fn)=>{try{cases.push({name,result:'passed',observed:await fn()})}catch(e){cases.push({name,result:'failed',error:e.message});console.error('PDV v2 failed:',name,e.message);throw e}};
 try{
  writeFileSync(join(extension,'manifest.json'),JSON.stringify({manifest_version:3,name:'Isolated PDV native zoom proof',version:'1.0',permissions:['tabs'],host_permissions:[origin+'/*'],background:{service_worker:'worker.js'}}));writeFileSync(join(extension,'worker.js'),'chrome.runtime.onInstalled.addListener(()=>{});\n');
  context=await chromium.launchPersistentContext(join(scratch,'profile'),{headless:true,channel:'chromium',viewport:{width:1440,height:900},deviceScaleFactor:1,args:['--disable-extensions-except='+extension,'--load-extension='+extension]});
  await context.route('**/*',r=>new URL(r.request().url()).origin===origin?r.continue():r.abort());
  const worker=context.serviceWorkers()[0]??await context.waitForEvent('serviceworker');const page=await context.newPage();page.setDefaultTimeout(10000);page.on('pageerror',e=>errors.push(e.message));
  const base=origin+'/qa/application.html';
  const go=async(theme='dark',route='/vendas/frente-de-caixa')=>{
   await page.goto(base+'#'+route);await page.locator('.app-frame').waitFor();
   await page.evaluate(t=>{localStorage.setItem('insightpad.theme',t);for(const key of Object.keys(localStorage))if(key.startsWith('insightpad.sale.branch:'))localStorage.removeItem(key)},theme);await page.reload();
   await page.locator('.app-frame').waitFor();await page.locator('.catalog-loader').first().waitFor({state:'hidden'});await page.evaluate(()=>document.fonts.ready);await page.locator('.qa-controls').evaluate(e=>e.style.visibility='hidden');
   if(route==='/vendas/frente-de-caixa')await page.locator('.pos-topbar .pos-cash-toggle:not(:disabled)').waitFor();
  };
  await go();
  const reportedZoom=await worker.evaluate(async origin=>{const tab=(await chrome.tabs.query({})).find(t=>t.url?.startsWith(origin+'/qa/application.html'));if(!tab)throw Error('Missing isolated tab');await chrome.tabs.setZoom(tab.id,1);return chrome.tabs.getZoom(tab.id)},origin);assert.equal(reportedZoom,1);
  const image=async(name)=>{await page.screenshot({path:dir+'/'+name+'.png'});return name+'.png'};
  const stable=()=>page.locator('.pos-entry,.pos-cart,.pos-total').evaluateAll(es=>es.map(e=>{const r=e.getBoundingClientRect();return{x:r.x,y:r.y,width:r.width,height:r.height}}));
  const reachable=async locator=>assert.ok(await locator.evaluate(e=>{const r=e.getBoundingClientRect();return r.left>=0&&r.right<=innerWidth+1&&r.top>=0&&r.bottom<=innerHeight+1}), 'Control outside viewport');
  for(const theme of ['dark','light'])for(const [width,height]of [[1440,900],[1366,768],[1280,800],[1024,600],[390,844],[320,568]])await record(`native100-${theme}-${width}x${height}`,async()=>{
   await page.setViewportSize({width,height});await go(theme);
   assert.equal(await page.locator('.pos-entry select').count(),0);await page.keyboard.press('F8');const d=page.getByRole('dialog',{name:'Controle de caixa'});await d.waitFor();assert.equal(await d.getByLabel('Filial',{exact:true}).inputValue(),'');
   await d.getByLabel('Filial',{exact:true}).selectOption({label:'MATRIZ QA'});await d.getByRole('button',{name:'Retomar caixa',exact:true}).click();await d.waitFor({state:'hidden'});await page.locator('.pos-topbar .pos-cash-toggle:not(:disabled)').waitFor();
   assert.equal(await page.getByRole('button',{name:'Estoque por filial',exact:true}).isDisabled(),true);
   const before=await stable(),search=page.getByRole('combobox',{name:'Produto',exact:true});await page.keyboard.press('F2');assert.equal(await search.evaluate(e=>e===document.activeElement),true);await search.fill('PRODUTO QA');
   const list=page.getByRole('listbox',{name:'Produtos encontrados'});await list.getByRole('option').first().waitFor();const opened=await stable();assert.deepEqual(opened,before,'Opening list must not move the panels/total');
   const count=await list.getByRole('option').count();for(let i=1;i<count;i++)await search.press('ArrowDown');
   const last=list.getByRole('option').last();assert.equal(await last.getAttribute('aria-selected'),'true');
   const scroll=await list.evaluate(e=>({top:e.scrollTop,height:e.clientHeight,total:e.scrollHeight}));assert.ok(scroll.top>0&&scroll.total>scroll.height);
   assert.deepEqual(await stable(),before,'Keyboard list scrolling must not move panels/total');
   await last.click();assert.equal(await list.count(),0);assert.equal(await page.getByRole('button',{name:'Estoque por filial',exact:true}).isDisabled(),false);
   await page.getByRole('button',{name:'Estoque por filial',exact:true}).click();const stock=page.getByRole('dialog',{name:'Estoque por filial',exact:true});await stock.waitFor();assert.equal(await stock.locator('.stock-branches-list>div').count(),2);await stock.getByRole('button',{name:'Fechar',exact:true}).click();
   await page.getByRole('button',{name:/Adicionar ao carrinho/}).click();assert.equal(await page.locator('.pos-cart-scroll article').count(),1);
   await page.keyboard.press('Escape');if(await page.getByRole('button',{name:'Fechar aviso',exact:true}).count())await page.getByRole('button',{name:'Fechar aviso',exact:true}).click();await page.locator('.ip-pos-route').evaluate(e=>e.scrollTop=0);const cartCapture=await image(`${theme}-${width}-cart`);
   const metrics=await page.locator('.ip-pos-route').evaluate(e=>{const s=getComputedStyle(e),entry=e.querySelector('.pos-entry').getBoundingClientRect(),cart=e.querySelector('.pos-cart').getBoundingClientRect();return{viewport:{width:innerWidth,height:innerHeight},cssZoom:s.zoom,nativeVisualScale:visualViewport.scale,documentWidth:document.documentElement.scrollWidth,documentHeight:document.documentElement.scrollHeight,route:{width:e.clientWidth,height:e.clientHeight,scrollWidth:e.scrollWidth,scrollHeight:e.scrollHeight,overflowY:s.overflowY},entryWidth:entry.width,cartWidth:cart.width,entryShare:entry.width/(entry.width+cart.width),background:s.backgroundColor}});
   assert.equal(await page.locator('.pos-search-input>.material-symbols-rounded').evaluate(e=>getComputedStyle(e).paddingLeft),'0px');assert.equal(metrics.cssZoom,'1');assert.equal(metrics.nativeVisualScale,1);assert.ok(metrics.documentWidth<=width+1&&metrics.documentHeight<=height+1);assert.ok(metrics.route.scrollWidth<=metrics.route.width+1);
   if(width>780){assert.ok(metrics.route.scrollHeight<=metrics.route.height+1);assert.ok(Math.abs(metrics.entryShare-.44)<.005)}else {assert.equal(metrics.route.overflowY,'auto');if(width===320)assert.ok(metrics.route.scrollHeight>metrics.route.height)}
   await page.keyboard.press('F4');const checkout=page.getByRole('dialog',{name:'Pagamento da venda'});await checkout.waitFor();const submit=checkout.getByRole('button',{name:/Concluir venda/});await reachable(submit);const checkoutCapture=await image(`${theme}-${width}-payment`);await page.keyboard.press('Escape');await checkout.waitFor({state:'hidden'});assert.equal(await page.locator('.pos-cart-scroll article').count(),1);
   await page.keyboard.press('F8');await d.waitFor();const actions=await d.locator('.cash-session-actions>button').allTextContents();assert.deepEqual(actions.map(s=>s.replace(/close|add_circle|remove_circle/g,'').trim()),['Cancelar','Regras da empresa','Suprimento','Sangria','Fechar caixa']);
   const actionRows=await d.locator('.cash-session-actions>button').evaluateAll(es=>es.map(e=>Math.round(e.getBoundingClientRect().y)));if(width>=1024)assert.equal(new Set(actionRows).size,1);
   await d.getByRole('button',{name:'Fechar caixa',exact:true}).scrollIntoViewIfNeeded();await reachable(d.getByRole('button',{name:'Fechar caixa',exact:true}));const summaryCapture=await image(`${theme}-${width}-cash`);
   const portal=await page.locator('.ip-pos-modal').evaluate(e=>{const parent=e.parentElement,next=e.nextSibling,dialog=e.querySelector('[role=dialog]'),before=getComputedStyle(dialog).backgroundColor;document.body.append(e);const detached=getComputedStyle(dialog).backgroundColor;parent.insertBefore(e,next);return{before,detached,theme:e.dataset.theme}});assert.equal(portal.before,portal.detached);assert.equal(portal.theme,theme);
   await d.getByRole('button',{name:'Cancelar',exact:true}).click();assert.equal(await page.evaluate(()=>window.__insightpadQa.state.logs.filter(n=>['PostSale','OpenCashSession','RegisterCashMovement','CloseCashSession'].includes(n)).length),0);
   return{theme,emulatedViewport:{width,height},physicalDevice:false,nativeZoom:reportedZoom,nativeZoomApi:'chrome.tabs.setZoom/getZoom',metrics,listScroll:scroll,panelsUnmoved:true,portalTheme:portal,summaryActionRows:actionRows,captures:[cartCapture,checkoutCapture,summaryCapture],financialWrites:0};
  });
  await page.setViewportSize({width:1280,height:800});
  await record('draft-cancel-and-positive-other-branch',async()=>{
   await go();await page.keyboard.press('F8');let d=page.getByRole('dialog',{name:'Controle de caixa'});await d.getByLabel('Filial',{exact:true}).selectOption({label:'FILIAL QA'});await d.getByRole('button',{name:'Cancelar',exact:true}).click();assert.equal(await page.getByRole('combobox',{name:'Produto'}).isDisabled(),true);assert.equal(await page.evaluate(()=>window.__insightpadQa.state.logs.includes('OpenCashSession')),false);
   await page.keyboard.press('F8');d=page.getByRole('dialog',{name:'Controle de caixa'});await d.getByLabel('Filial',{exact:true}).selectOption({label:'FILIAL QA'});await d.getByLabel('Fundo de troco inicial',{exact:true}).fill('2500');await d.getByRole('button',{name:'Abrir caixa',exact:true}).click();await d.waitFor({state:'hidden'});await page.locator('.pos-topbar .pos-cash-toggle:not(:disabled)').waitFor();
   const branch=await page.evaluate(()=>localStorage.getItem('insightpad.sale.branch:00000000-0000-4000-8000-000000000010:qa-user'));assert.equal(branch,'00000000-0000-4000-8000-000000000002');const calls=await page.evaluate(()=>window.__insightpadQa.state.requests.filter(r=>r.name==='OpenCashSession'));assert.equal(calls.length,1);assert.equal(calls[0].variables.branchId,branch);assert.equal(calls[0].variables.openingAmountCents,2500);assert.equal(await page.getByRole('combobox',{name:'Produto'}).inputValue(),'');assert.equal(await page.getByLabel('Quantidade',{exact:true}).inputValue(),'1');
   await page.keyboard.press('F8');await d.waitFor();assert.ok((await d.innerText()).includes('FILIAL QA'));return{cancelWrites:0,positiveOpening:calls[0],catalogContext:branch,capture:await image('positive-other-branch')};
  });
  await record('unique-branch-stock-disabled-and-operator-actions',async()=>{
   await go('light','/cadastros/categorias');await page.evaluate(()=>{window.__insightpadQa.state.allowedBranches=['00000000-0000-4000-8000-000000000002'];location.hash='#/vendas/frente-de-caixa'});await page.locator('.pos-topbar .pos-cash-toggle:not(:disabled)').waitFor();assert.equal(await page.getByRole('combobox',{name:'Produto'}).isDisabled(),true);await page.keyboard.press('F8');const d=page.getByRole('dialog',{name:'Controle de caixa'});assert.equal(await d.getByLabel('Filial',{exact:true}).isDisabled(),true);assert.equal(await d.getByLabel('Filial',{exact:true}).inputValue(),'00000000-0000-4000-8000-000000000002');await d.getByRole('button',{name:'Abrir caixa',exact:true}).click();await d.waitFor({state:'hidden'});await page.getByRole('combobox',{name:'Produto'}).fill('PRODUTO QA 002');await page.getByRole('listbox').getByRole('option').first().click();assert.equal(await page.getByRole('button',{name:'Estoque por filial',exact:true}).isDisabled(),true);
   await page.locator('.qa-controls').evaluate(e=>{e.style.visibility='visible';e.open=true});await page.getByLabel('Permissões',{exact:true}).selectOption('operator');await page.locator('.qa-controls').evaluate(e=>e.style.visibility='hidden');await page.keyboard.press('F8');await d.waitFor();assert.equal(await d.getByRole('button',{name:'Suprimento',exact:true}).count(),0);assert.equal(await d.getByRole('button',{name:'Regras da empresa',exact:true}).count(),0);assert.equal(await d.getByRole('button',{name:'Fechar meu caixa',exact:true}).count(),1);return{singleBranchSelected:true,stockDisabled:true,operatorManagerActionsHidden:true,capture:await image('unique-branch-operator')};
  });
  await record('scanner-keyboard-dialog-real-product-component',async()=>{
   await go();await usePosBranch(page);await page.keyboard.press('F6');const scanner=page.getByRole('dialog',{name:/código de barras/i});await scanner.waitFor();assert.ok(await scanner.locator('video').count());await page.keyboard.press('Escape');await scanner.waitFor({state:'hidden'});return{shortcut:'F6',realScannerComponent:true,limit:'camera denied/absent in isolated runner; physical scanner and hardware permission need DEV operator validation'};
  });
  assert.deepEqual(errors,[]);
 }finally{await context?.close();rmSync(scratch,{recursive:true,force:true});writeFileSync(dir+'/results.json',JSON.stringify({sha,nativeZoom:'Chrome tabs.setZoom/getZoom=1.0; no CSS zoom',viewport:'emulated Chromium viewport, not physical devices',auth:'mock',api:'memory fixtures, no real DEV transactions',cases,errors},null,2));}
 assert.equal(cases.length,15);assert.ok(cases.every(c=>c.result==='passed'));
}
