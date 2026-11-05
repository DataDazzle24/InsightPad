import assert from 'node:assert/strict';
import {mkdtempSync,mkdirSync,writeFileSync,rmSync} from 'node:fs';
import {tmpdir} from 'node:os';
import {join} from 'node:path';
import {chromium} from 'playwright';

// Native browser page zoom, isolated temporary profile and loopback-only host.
export async function dashboardV3Zoom({output,sha,origin='http://127.0.0.1:4174'}){
 const dir=output+'/dashboard-v3-native-zoom';mkdirSync(dir,{recursive:true});const scratch=mkdtempSync(join(tmpdir(),'insightpad-dv-zoom-')),extension=join(scratch,'extension');mkdirSync(extension);let context;const cases=[];
 try{
 writeFileSync(join(extension,'manifest.json'),JSON.stringify({manifest_version:3,name:'Isolated dashboard native zoom proof',version:'1.0',permissions:['tabs'],host_permissions:[origin+'/*'],background:{service_worker:'worker.js'}}));writeFileSync(join(extension,'worker.js'),'chrome.runtime.onInstalled.addListener(()=>{});\n');
 context=await chromium.launchPersistentContext(join(scratch,'profile'),{headless:true,channel:'chromium',viewport:{width:1280,height:800},deviceScaleFactor:1,args:['--disable-extensions-except='+extension,'--load-extension='+extension]});await context.route('**/*',r=>new URL(r.request().url()).origin===origin?r.continue():r.abort());
 let worker=context.serviceWorkers()[0];if(!worker)worker=await context.waitForEvent('serviceworker');const page=await context.newPage();await page.goto(origin+'/qa/application.html#/dashboards/operacional');await page.locator('.dv-kpi').first().waitFor();
 for(const theme of ['dark','light'])for(const factor of [2,4]){
  await page.evaluate(t=>localStorage.setItem('insightpad.theme',t),theme);await page.reload();await page.locator('.dv-kpi').first().waitFor();await page.locator('.qa-controls').evaluate(e=>e.style.visibility='hidden');
  const zoom=await worker.evaluate(async({factor,origin})=>{const tab=(await chrome.tabs.query({})).find(t=>t.url?.startsWith(origin+'/qa/application.html'));if(!tab)throw Error('QA tab missing');await chrome.tabs.setZoom(tab.id,factor);return chrome.tabs.getZoom(tab.id)},{factor,origin});assert.equal(Math.round(zoom*100),factor*100);
  for(const view of ['Vendas','Canais','Estoque','Clientes','Categorias']){
   await page.getByRole('button',{name:view,exact:true}).click();await page.locator('.dv-kpi').first().waitFor();await page.locator('.catalog-loader').first().waitFor({state:'hidden'});
   const metrics=await page.locator('.ip-dashboard-v3').evaluate(e=>({innerWidth,innerHeight,devicePixelRatio,visualViewportScale:visualViewport.scale,cssZoom:getComputedStyle(e).zoom,scrollWidth:document.documentElement.scrollWidth,scrollHeight:document.documentElement.scrollHeight,clientWidth:e.clientWidth}));assert.equal(metrics.cssZoom,'1');assert.equal(metrics.visualViewportScale,1);assert.ok(metrics.scrollWidth<=metrics.innerWidth+1&&metrics.scrollHeight<=metrics.innerHeight+1);
   const trigger=page.getByRole('button',{name:'Detalhes da análise',exact:true});await trigger.scrollIntoViewIfNeeded();await trigger.focus();await trigger.press('Enter');const d=page.getByRole('dialog',{name:'Detalhes da análise',exact:true});await d.waitFor();const end=d.getByRole('button',{name:'Entendi',exact:true});await end.scrollIntoViewIfNeeded();assert.ok(await end.evaluate(e=>{const r=e.getBoundingClientRect();return r.top>=0&&r.bottom<=innerHeight}));await page.screenshot({path:dir+`/${theme}-${factor*100}-${view}-modal.png`});await page.keyboard.press('Escape');await d.waitFor({state:'hidden'});assert.equal(await trigger.evaluate(e=>e===document.activeElement),true);
   const sub={Vendas:'Produtos',Canais:'Lojas e taxas',Estoque:'Produtos',Clientes:'Regiões',Categorias:'Categorias'}[view];await page.locator('.dv-subnav').getByRole('button',{name:sub,exact:true}).click();if(!await page.getByRole('region',{name:/tabela completa/}).count())await page.locator('.dv-pager').click();const region=page.getByRole('region',{name:/tabela completa/}).first();await region.scrollIntoViewIfNeeded();await region.focus();await region.evaluate(e=>e.scrollTo({left:e.scrollWidth,top:e.scrollHeight,behavior:'instant'}));const last=await region.evaluate(e=>{const c=e.querySelector('tbody tr:last-child td:last-child'),r=e.getBoundingClientRect(),b=c?.getBoundingClientRect();return{inside:!b||b.right<=r.right+2&&b.bottom<=r.bottom+2&&b.top>=r.top,columns:e.querySelectorAll('thead th').length}});assert.ok(last.inside,JSON.stringify(last));await page.screenshot({path:dir+`/${theme}-${factor*100}-${view}-table.png`});cases.push({theme,view,requestedFactor:factor,reportedFactor:zoom,api:'chrome.tabs.setZoom/getZoom',metrics,lastColumn:last.columns,lastRowAndColumnAccessible:true,modalEndReachable:true,escapeReturn:true});
  }
 }
 }finally{await context?.close();rmSync(scratch,{recursive:true,force:true});writeFileSync(dir+'/results.json',JSON.stringify({sha,method:'Chromium native tabs.setZoom/getZoom, headless browser window viewport1280x800',auth:'QA memory fixtures only',physicalDevice:false,cases},null,2));}
 assert.equal(cases.length,20);
}
