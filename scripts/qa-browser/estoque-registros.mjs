import {chromium} from 'playwright';
import {mkdirSync,writeFileSync,mkdtempSync,rmSync,readFileSync} from 'node:fs';
import {tmpdir} from 'node:os';
import {join} from 'node:path';
import assert from 'node:assert/strict';

// Actual React routes, synthetic Auth/API only; never contacts Firebase or iFood.
export async function estoqueRegistrosProof({output,sha,origin='http://127.0.0.1:4174'}){
 const dir=output+'/estoque-registros';mkdirSync(dir,{recursive:true});const cases=[],errors=[];
 const scratch=mkdtempSync(join(tmpdir(),'estoque-registros-')),ext=join(scratch,'ext');mkdirSync(ext);
 writeFileSync(join(ext,'manifest.json'),JSON.stringify({manifest_version:3,name:'Workspace native zoom',version:'1.0',permissions:['tabs'],host_permissions:[origin+'/*'],background:{service_worker:'worker.js'}}));
 writeFileSync(join(ext,'worker.js'),'chrome.runtime.onInstalled.addListener(()=>{});');
 let context,navigation=0;
 try{
  context=await chromium.launchPersistentContext(join(scratch,'profile'),{headless:true,channel:'chromium',viewport:{width:1280,height:800},deviceScaleFactor:1,args:['--disable-extensions-except='+ext,'--load-extension='+ext]});
  await context.route('**/*',r=>new URL(r.request().url()).origin===origin?r.continue():r.abort());
  const worker=context.serviceWorkers()[0]??await context.waitForEvent('serviceworker');const page=await context.newPage();page.setDefaultTimeout(9000);page.on('pageerror',e=>errors.push(e.message));
  const uuid=n=>'00000000-0000-4000-8000-'+String(n).padStart(12,'0');
  const call=(name,v)=>page.evaluate(async({name,v})=>window.__insightpadQa.operate(name,v),{name,v});
  async function zoom(value){const actual=await worker.evaluate(async({origin,value})=>{const tab=(await chrome.tabs.query({})).find(t=>t.url?.startsWith(origin));await chrome.tabs.setZoom(tab.id,value);return chrome.tabs.getZoom(tab.id)},{origin,value});assert.equal(actual,value)}
  async function ready(){await page.locator('.catalog-loader').waitFor({state:'hidden'});await page.evaluate(()=>document.fonts.ready)}
  async function go(route='/estoque',theme='dark'){
   await page.goto(origin+'/qa/application.html?workspace_case='+(++navigation)+'#'+route);await page.evaluate(t=>localStorage.setItem('insightpad.theme',t),theme);await page.reload();await page.locator('.qa-controls').evaluate(e=>e.style.visibility='hidden');await page.locator(route==='/estoque'?'.work-stock':'.work-sales').waitFor();await ready();await zoom(1);
  }
  async function capture(name){const file=name+'.png';await page.screenshot({path:dir+'/'+file});return file}
  async function reachable(locator){await locator.scrollIntoViewIfNeeded();assert.ok(await locator.isVisible());const r=await locator.boundingBox(),v=await page.evaluate(()=>({width:innerWidth,height:innerHeight}));assert.ok(r&&r.x>=-1&&r.y>=-1&&r.x+r.width<=v.width+1&&r.y+r.height<=v.height+1,JSON.stringify({r,v}));}
  async function run(name,ids,fn){
   try{await page.emulateMedia({media:'screen'});const observed=await fn();cases.push({name,ids,result:'passed',observed,capture:await capture(name)})}
   catch(e){cases.push({name,ids,result:'failed',error:e.message,capture:await capture(name+'-failed')});console.error(name+': '+e.message.slice(0,250))}
   writeFileSync(dir+'/results.json',JSON.stringify({sha,auth:'mock',api:'in-memory fixtures',nativeZoomAPI:'chrome.tabs.setZoom/getZoom',browser:context.browser()?.version(),cases,errors},null,2));console.log('Estoque/Registros '+name+': '+cases.at(-1).result);
  }
  const modal=()=>page.locator('.stock-operation-modal');
  async function newItems(){await page.getByRole('button',{name:/Nova movimentação/}).click();await modal().locator('.stock-wizard button').nth(1).click();await modal().locator('.stock-item-row select').first().selectOption(uuid(101));await modal().getByRole('button',{name:'+ Adicionar',exact:true}).click();await modal().locator('.stock-item-row select').last().selectOption(uuid(102));}
  for(const theme of ['dark','light'])for(const [width,height]of [[1280,800],[1024,600],[390,844],[320,568]])await run(`layout-${theme}-${width}`,['ES-UX-01','ES-UX-11','V2-01','V3-01','V3-02','V3-03','V3-04'],async()=>{
   await page.setViewportSize({width,height});await go('/estoque',theme);
   for(const tab of await page.locator('.stock-tabs button').all())await reachable(tab);
   const icon=page.locator('.ux-kpi-icon').first();assert.equal(await icon.evaluate(e=>getComputedStyle(e).textTransform),'none');
   await capture(`lista-${theme}-${width}`);await newItems();const body=modal().locator('.stock-wizard-body');
   assert.ok(await body.evaluate(e=>e.scrollWidth<=e.clientWidth+1),'Creation body overflows horizontally');
   await reachable(modal().getByRole('button',{name:'+ Adicionar',exact:true}));await reachable(modal().locator('footer').getByRole('button',{name:'Próxima',exact:true}));await capture(`produtos-${theme}-${width}`);
   await modal().locator('.stock-wizard button').nth(2).click();await modal().getByRole('button',{name:'Sim',exact:true}).click();await reachable(modal().getByLabel(/^UF/));await reachable(modal().locator('footer').getByRole('button',{name:'Próxima',exact:true}));await capture(`nota-${theme}-${width}`);
   await modal().getByRole('button',{name:'Não',exact:true}).click();await modal().locator('.stock-wizard button').nth(3).click();assert.equal(await modal().locator('.stock-review>div,.stock-review>article').count(),6);await reachable(modal().getByRole('button',{name:'Concluir',exact:true}));await capture(`revisao-${theme}-${width}`);
   const dimensions=await body.evaluate(e=>({clientWidth:e.clientWidth,scrollWidth:e.scrollWidth}));await page.keyboard.press('Escape');assert.equal(await modal().count(),0);return{theme,width,height,nativeZoom:1,dimensions};
  });
  await page.setViewportSize({width:1280,height:800});
  await run('filter-escape-focus',['ES-UX-05','V2-02'],async()=>{
   await go();const trigger=page.getByRole('button',{name:/Pesquisa avançada/});await trigger.click();const d=page.locator('.stock-filter-modal');const facet=d.locator('.filter-select-trigger').first();await facet.click();await d.getByPlaceholder('Digite para filtrar...').fill('Entrada');await page.keyboard.press('Escape');assert.equal(await d.locator('.filter-dropdown').count(),0);assert.ok(await facet.evaluate(e=>e===document.activeElement));assert.equal(await d.count(),1);
   const calendar=d.locator('.date-range-trigger');await calendar.click();await page.keyboard.press('Escape');assert.equal(await d.locator('.range-calendar').count(),0);assert.ok(await calendar.evaluate(e=>e===document.activeElement));await page.keyboard.press('Escape');assert.equal(await d.count(),0);assert.ok(await trigger.evaluate(e=>e===document.activeElement));return{childThenParent:true,focusRestored:true};
  });
  await run('table-ends-csv',['ES-UX-02','ES-UX-04','ES-UX-10'],async()=>{
   await go();const seen=[];for(const label of ['Movimentações','Transferências','Saldo atual']){
    await page.getByRole('button',{name:label,exact:true}).click();await ready();const grid=page.locator('.stock-table');const cols=await grid.locator('thead th').count();assert.equal(cols,label==='Movimentações'?8:label==='Transferências'?6:10);
    await grid.evaluate(e=>{e.scrollLeft=e.scrollWidth;e.scrollTop=e.scrollHeight});await reachable(grid.locator('tbody tr').last().locator('td').last());
    const pending=page.waitForEvent('download');await page.getByRole('button',{name:/CSV/}).click();const download=await pending;const path=await download.path();const csv=readFileSync(path,'utf8');assert.ok(csv.includes(';'));assert.ok(csv.split('\n').length>1);seen.push({view:label,columns:cols,csvLines:csv.trim().split('\n').length,filename:download.suggestedFilename()});
   }return seen;
  });
  await run('uncertain-ack-retry',['ES-UX-09'],async()=>{
   await go();await page.evaluate(()=>window.__insightpadQa.state.ackLoss=true);await newItems();await modal().locator('.stock-wizard button').nth(3).click();await modal().getByRole('button',{name:'Concluir',exact:true}).click();await modal().getByRole('alert').waitFor();const notice=await modal().getByRole('alert').innerText();assert.match(notice,/Confirmação da/);const first=await page.evaluate(()=>window.__insightpadQa.state.requests.filter(x=>x.name==='SaveStockBatch').at(-1).variables.payload);assert.ok(notice.includes(first.clientOperationId));await modal().getByRole('button',{name:'Concluir',exact:true}).click();await modal().waitFor({state:'hidden'});const requests=await page.evaluate(()=>window.__insightpadQa.state.requests.filter(x=>x.name==='SaveStockBatch'));assert.equal(requests.length,2);assert.deepEqual(requests[0].variables,requests[1].variables);return{samePayload:true,referenceVisible:true,noAutomaticRetry:true};
  });
  await run('transfer-edit-reversal',['ES-UX-03','ES-UX-07','ES-UX-08','V3-05'],async()=>{
   await go();await page.locator('.stock-heading-action--transfer').click();const transfer=page.locator('.stock-transfer-modal');assert.equal(await page.locator('.stock-operation-modal--create').count(),0);await reachable(transfer.getByRole('button',{name:'Concluir transferência'}));await page.keyboard.press('Escape');
   await page.locator('.stock-table tbody tr').nth(2).click();await page.getByRole('button',{name:'Editar',exact:true}).click();await page.locator('.stock-operation-modal--edit').waitFor();assert.match(await modal().innerText(),/Referência/);await page.keyboard.press('Escape');await page.getByRole('button',{name:'Estornar',exact:true}).click();const d=page.getByRole('alertdialog');await d.getByRole('button',{name:'Estornar',exact:true}).click();await d.getByRole('alert').waitFor();await d.getByRole('textbox').fill('Revisão sintética autorizada');await d.getByRole('button',{name:'Estornar',exact:true}).click();await d.waitFor({state:'hidden'});return{editVariant:true,shortReasonRejected:true,syntheticReversal:true};
  });
  async function seedSale(){await call('PostSale',{payload:{clientOperationId:uuid(900001),branchId:uuid(1),cashSessionId:uuid(60),items:[{product_id:uuid(101),quantity:1,requested_price:1200}],payments:[{payment_method_id:uuid(50),amount_cents:1200,sequence:0}],discountCents:0,surchargeCents:0}});await page.evaluate(()=>location.hash='#/estoque');await page.locator('.work-stock').waitFor();await page.evaluate(()=>location.hash='#/vendas/registros');await page.locator('.work-sales tbody tr').waitFor();await ready();}
  await run('sales-columns-details-csv-print',['RV-UX-01','RV-UX-03','RV-UX-06','DEV-03'],async()=>{
   await go('/vendas/registros');await seedSale();const expected=['Venda','Origem','Data','Cliente','Filial','Total','Pagamento','Status','Ações','Itens','Subtotal','Desconto','Acréscimo','Troco','Usuário','Operação'];assert.deepEqual(await page.locator('.work-sales thead th').allTextContents(),expected);
   const pending=page.waitForEvent('download');await page.getByRole('button',{name:/Exportar CSV/}).click();const dl=await pending;assert.ok(readFileSync(await dl.path(),'utf8').includes('R$'));
   await page.getByRole('button',{name:'Detalhes',exact:true}).click();const d=page.locator('.sale-details');await reachable(d.getByRole('button',{name:'Imprimir',exact:true}));await page.emulateMedia({media:'print'});const printHidden=await d.evaluate(e=>{for(let n=e;n;n=n.parentElement)if(getComputedStyle(n).display==='none')return true;return false});assert.equal(printHidden,true,'Original print rule still hides catalog-backdrop');await page.pdf({path:dir+'/detalhe-impressao-preexistente.pdf'});await page.emulateMedia({media:'screen'});await page.keyboard.press('Escape');return{columns:expected,print:'existing catalog-backdrop hiding rule preserved; authenticated DEV comparison pending'};
  });
  await run('sales-filter-cancel-focus',['RV-UX-02','RV-UX-04','RV-UX-08'],async()=>{
   await go('/vendas/registros');await seedSale();await page.getByRole('button',{name:/Pesquisa avançada/}).click();const d=page.locator('.sales-filter-modal');await d.locator('.date-range-trigger').click();await page.keyboard.press('Escape');assert.equal(await d.count(),1);await page.keyboard.press('Escape');await page.getByRole('button',{name:'Cancelar',exact:true}).click();const c=page.getByRole('alertdialog');await c.getByRole('button',{name:'Confirmar cancelamento'}).click();await c.getByRole('alert').waitFor();await page.keyboard.press('Escape');return{calendarThenParent:true,cancelReasonRejected:true};
  });
  for(const theme of ['dark','light'])await run('native-reflow-'+theme,['DEV-02','RV-UX-08'],async()=>{
   await page.setViewportSize({width:1280,height:800});await go('/estoque',theme);await zoom(2);await newItems();await reachable(modal().getByRole('button',{name:'+ Adicionar',exact:true}));await reachable(modal().locator('footer').getByRole('button',{name:'Próxima',exact:true}));const widths=await modal().locator('.stock-wizard-body').evaluate(e=>({client:e.clientWidth,scroll:e.scrollWidth}));assert.ok(widths.scroll<=widths.client+1);await page.keyboard.press('Escape');await zoom(1);return{nativeZoom:2,widths};
  });
  assert.deepEqual(errors,[],'Browser JavaScript errors');assert.ok(cases.every(c=>c.result==='passed'),'Workspace browser cases failed; inspect results.json');
 }finally{await context?.close();rmSync(scratch,{recursive:true,force:true});}
}
