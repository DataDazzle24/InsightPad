import {chromium} from 'playwright';
import {mkdirSync,writeFileSync,mkdtempSync,rmSync} from 'node:fs';
import {tmpdir} from 'node:os';
import {join} from 'node:path';
import assert from 'node:assert/strict';

// Real React components with the existing synthetic Auth/API boundary only.
// These checks never authenticate against Firebase or mutate a DEV database.
export async function cadastrosProof({output,sha,origin='http://127.0.0.1:4174'}){
 if(process.env.GITHUB_ACTIONS&&process.env.CAD_CASE)throw Error('CI must execute every Cadastros case');
 const dir=output+'/cadastros';mkdirSync(dir,{recursive:true});const cases=[],errors=[];
 const scratch=mkdtempSync(join(tmpdir(),'cadastros-focus-')),ext=join(scratch,'ext');mkdirSync(ext);
 writeFileSync(join(ext,'manifest.json'),JSON.stringify({manifest_version:3,name:'Cadastros native zoom',version:'1.0',permissions:['tabs'],host_permissions:[origin+'/*'],background:{service_worker:'worker.js'}}));writeFileSync(join(ext,'worker.js'),'chrome.runtime.onInstalled.addListener(()=>{});');
 let context,navigation=0;
 try{
  context=await chromium.launchPersistentContext(join(scratch,'profile'),{headless:true,channel:'chromium',viewport:{width:1440,height:900},deviceScaleFactor:1,args:['--disable-extensions-except='+ext,'--load-extension='+ext]});
  await context.route('**/*',route=>new URL(route.request().url()).origin===origin?route.continue():route.abort());
  const worker=context.serviceWorkers()[0]??await context.waitForEvent('serviceworker');const page=await context.newPage();page.setDefaultTimeout(8000);page.on('pageerror',e=>errors.push(e.message));
  const uuid=n=>'00000000-0000-4000-8000-'+String(n).padStart(12,'0');
  async function zoom(value){const actual=await worker.evaluate(async({origin,value})=>{const tab=(await chrome.tabs.query({})).find(t=>t.url?.startsWith(origin));await chrome.tabs.setZoom(tab.id,value);return chrome.tabs.getZoom(tab.id)},{origin,value});assert.equal(actual,value);return actual}
  async function go(route,theme='dark'){
   await page.goto(origin+'/qa/application.html?cadastros_case='+(++navigation)+'#'+route);await page.evaluate(t=>localStorage.setItem('insightpad.theme',t),theme);await page.reload();await page.locator('.qa-controls').evaluate(e=>e.style.visibility='hidden');await page.locator(route.startsWith('/cadastros/')?'.cad-page':'.cad-module').waitFor();await page.locator('.catalog-loader').waitFor({state:'hidden'});await page.evaluate(()=>document.fonts.ready);await zoom(1);
  }
  const call=(name,v)=>page.evaluate(async({name,v})=>window.__insightpadQa.operate(name,v),{name,v});
  async function capture(name){const file=name+'.png';await page.screenshot({path:dir+'/'+file});return file}
  async function run(name,criteria,fn){
   if(process.env.CAD_CASE&&!new RegExp(process.env.CAD_CASE).test(name))return;
   try{const observed=await fn();cases.push({name,criteria,result:'passed',observed,capture:await capture(name),sha})}
   catch(e){cases.push({name,criteria,result:'failed',error:e.message,capture:await capture(name+'-failed'),sha});console.error(name+': '+e.message.slice(0,180))}
   console.log('Cadastros '+name+': '+cases.at(-1).result);writeFileSync(dir+'/results.json',JSON.stringify({sha,auth:'mock',api:'existing in-memory fixtures',nativeZoomAPI:'chrome.tabs.setZoom/getZoom',physicalDevice:false,cases,errors},null,2));
  }
  const form=()=>page.locator('.master-modal[aria-label="Formulário de cadastro"]');
  const add=()=>page.locator('.catalog-header-actions>.catalog-primary');
  async function mode(value){await page.locator('.qa-controls').evaluate(e=>{e.style.visibility='visible';e.open=true});await page.getByLabel('Permissões',{exact:true}).selectOption(value);await page.locator('.qa-controls').evaluate(e=>e.style.visibility='hidden')}
  async function reachable(locator){await locator.scrollIntoViewIfNeeded();assert.ok(await locator.isVisible());const r=await locator.boundingBox();const v=await page.evaluate(()=>({width:innerWidth,height:innerHeight}));assert.ok(r&&r.x>=-1&&r.y>=-1&&r.x+r.width<=v.width+1&&r.y+r.height<=v.height+1,JSON.stringify({r,v}));}
  await run('routes-permissions',['CAD-01','CAD-03'],async()=>{
   await go('/modulos/cadastros');assert.equal(await page.locator('.cad-module .legacy-module__grid a').count(),6);
   for(const route of ['categorias','subcategorias','produtos','clientes','fornecedores','filiais']){
    await go('/cadastros/'+route);assert.equal(await page.locator('[data-cadastros] .cad-page').count(),1);await mode('read');assert.equal(await add().count(),0);assert.equal(await page.locator('.catalog-action').count(),0);assert.equal(await page.getByRole('button',{name:'Exportar CSV',exact:true}).count(),0);
   }
   await mode('denied');await page.waitForFunction(()=>!location.hash.includes('/cadastros/'));return{sixReadOnlyPages:true,directRouteGuard:true};
  });
  for(const theme of ['dark','light'])await run('hover-focus-'+theme,['CAD-04','CAD-08','CAD-09'],async()=>{
   await go('/cadastros/produtos',theme);const seen={};
   for(const[selector,color]of [['.catalog-header-actions>.catalog-primary','rgb(84, 222, 244)'],['.catalog-table .catalog-action--edit','rgb(246, 204, 97)'],['.catalog-table .catalog-action--info','rgb(84, 222, 244)'],['.catalog-table .catalog-action--danger','rgb(255, 103, 125)'],['.catalog-table .catalog-action--success','rgb(160, 237, 84)']]){
    if(selector.endsWith('--success'))await go('/cadastros/categorias',theme);
    const button=page.locator(selector).first();await button.hover();await page.waitForTimeout(220);const style=await button.evaluate(e=>{const s=getComputedStyle(e);return{background:s.backgroundColor,color:s.color}});assert.equal(style.background,color);assert.equal(style.color,'rgb(17, 24, 32)');seen[selector]=style;
   }
   await add().focus();assert.equal(await add().evaluate(e=>e===document.activeElement),true);return seen;
  });
  await run('filters-escape-focus',['CAD-11','CAD-12','CAD-27'],async()=>{
   for(const route of ['categorias','produtos']){
    await go('/cadastros/'+route);const trigger=page.getByRole('button',{name:/Pesquisa avançada/});await trigger.click();const d=page.locator('.advanced-search-modal');const summary=d.locator('summary').first();await summary.click();await summary.press('Escape');assert.equal(await d.locator('details[open]').count(),0);assert.equal(await summary.evaluate(e=>e===document.activeElement),true);
    const calendar=d.locator('.date-range-trigger').first();await calendar.click();await calendar.press('Escape');assert.equal(await d.locator('.range-calendar').count(),0);assert.equal(await calendar.evaluate(e=>e===document.activeElement),true);await page.keyboard.press('Escape');await d.waitFor({state:'hidden'});assert.equal(await trigger.evaluate(e=>e===document.activeElement),true);
   }
   return{facetThenParent:true,calendarThenParent:true,focusRestored:true};
  });
  await run('combo-contract-and-local-select',['CAD-18','CAD-19','CAD-20','CAD-27','CAD-28'],async()=>{
   await go('/cadastros/produtos');const make=async(name,cost)=>call('SaveProduct',{payload:{name,active:true,bundleProduct:false,weightedProduct:false,categoryId:uuid(301),costPriceCents:cost,salePriceCents:cost+1000},components:[]});
   await make('CAFÉ COMPOSIÇÃO SINTÉTICO',1600);await make('BISCOITO COMPOSIÇÃO SINTÉTICO',450);
   // Reload the route without resetting the in-memory fixtures.
   await page.evaluate(()=>location.hash='#/cadastros/clientes');await page.locator('.catalog-loader').waitFor({state:'hidden'});await page.evaluate(()=>location.hash='#/cadastros/produtos');await page.locator('.catalog-loader').waitFor({state:'hidden'});
   await add().click();await page.locator('.product-kind-option--combo').click();const d=form();await d.waitFor();assert.equal(await d.locator('.master-form-grid').evaluate(e=>getComputedStyle(e).display),'none');
   let select=d.getByRole('combobox',{name:'Pesquisar produto simples'}).first();await select.fill('CAFÉ COMPOSIÇÃO');await select.press('Escape');assert.equal(await d.locator('.product-search-select.is-open').count(),0);assert.equal(await d.count(),1);
   await select.fill('CAFÉ COMPOSIÇÃO');await d.getByRole('option').filter({hasText:'CAFÉ COMPOSIÇÃO'}).click();await d.getByLabel('Quantidade',{exact:true}).first().fill('2');
   await d.getByRole('button',{name:/Adicionar produto/}).click();select=d.getByRole('combobox',{name:'Pesquisar produto simples'}).last();await select.fill('BISCOITO COMPOSIÇÃO');await d.getByRole('option').filter({hasText:'BISCOITO COMPOSIÇÃO'}).click();await d.getByLabel('Quantidade',{exact:true}).last().fill('1');assert.match(await d.locator('.combo-total').innerText(),/36,50/);
   await capture('combo-dark-total-3650');await d.getByRole('button',{name:'Próxima',exact:true}).click();await d.getByLabel(/^Nome/).fill('COMBO SINTÉTICO VISUAL');await d.getByLabel(/^Categoria/).selectOption(uuid(301));await d.getByRole('button',{name:'Próxima',exact:true}).click();await d.getByLabel(/Preço de venda/i).fill('5000');await d.getByRole('button',{name:'Salvar',exact:true}).click();await page.getByRole('alertdialog').getByRole('button',{name:'Confirmar',exact:true}).click();await d.waitFor({state:'hidden'});
   const request=await page.evaluate(()=>window.__insightpadQa.state.requests.filter(x=>x.name==='SaveProduct').at(-1));assert.equal(request.variables.payload.costPriceCents,3650);assert.equal(request.variables.components.length,2);
   await page.getByPlaceholder('Pesquisar...').fill('COMBO SINTÉTICO VISUAL');const row=page.locator('.catalog-table tbody tr').filter({hasText:'COMBO SINTÉTICO VISUAL'});await row.getByRole('button',{name:/Editar/}).click();await d.waitFor();assert.deepEqual(await d.getByLabel('Quantidade',{exact:true}).evaluateAll(es=>es.map(e=>e.value)),['2','1']);
   return{totalCents:3650,components:request.variables.components,reopenedQuantities:true};
  });
  await run('combo-responsive-matrix',['CAD-04','CAD-18','CAD-31'],async()=>{
   const observed=[];
   for(const theme of ['dark','light'])for(const[width,height]of[[1440,900],[1280,800],[1366,768],[1024,600],[390,844],[320,568]]){
    await page.setViewportSize({width,height});await go('/cadastros/produtos',theme);await add().click();await page.locator('.product-kind-option--combo').click();const d=form(),select=d.getByRole('combobox',{name:'Pesquisar produto simples'});await select.fill('PRODUTO QA');const list=d.getByRole('listbox');await list.getByRole('option').last().scrollIntoViewIfNeeded();await reachable(list.getByRole('option').last());await select.press('Escape');assert.equal(await list.count(),0);
    await select.fill('PRODUTO QA 002');await d.getByRole('option').first().click();await reachable(d.locator(':scope>form>footer').getByRole('button',{name:'Próxima',exact:true}));await reachable(d.locator('.combo-total'));const grid=await d.locator('.component-row').evaluate(e=>getComputedStyle(e).gridTemplateColumns);const file=await capture(`combo-${theme}-${width}x${height}-zoom100`);observed.push({theme,viewport:{width,height},zoom:1,grid,capture:file});
   }await page.setViewportSize({width:1440,height:900});return observed;
  });
  await run('client-email-and-form-error',['CAD-21','CAD-28'],async()=>{
   await go('/cadastros/clientes');await add().click();const d=form();await d.getByRole('button',{name:'Próxima',exact:true}).click();assert.match(await d.getByRole('alert').innerText(),/obrigatórios/);await d.getByLabel(/^Nome/).fill('CLIENTE SINTÉTICO');await d.getByRole('button',{name:'Próxima',exact:true}).click();const email=d.getByRole('combobox');await email.fill('teste@gm');await d.getByRole('listbox').waitFor();await email.press('Escape');assert.equal(await d.getByRole('listbox').count(),0);assert.equal(await d.count(),1);return{errorInsideForm:true,emailEscapeConsumed:true};
  });
  for(const[route,count]of [['clientes',4],['fornecedores',4],['filiais',2]])await run('modal-'+route,['CAD-21','CAD-22','CAD-23'],async()=>{
   const images=[];for(const theme of ['dark','light'])for(const [width,height]of[[1440,900],[320,568]]){
    await page.setViewportSize({width,height});await go('/cadastros/'+route,theme);await add().click();const d=form();await d.waitFor();assert.equal(await d.locator('.master-modal-tabs button').count(),count);await reachable(d.locator(':scope>form>footer').getByRole('button',{name:'Cancelar',exact:true}));images.push(await capture(`${route}-${theme}-${width}-modal`));
    for(const tab of await d.locator('.master-modal-tabs button').all()){await tab.click();await reachable(d.locator(':scope>form>footer').getByRole('button',{name:/Próxima|Salvar/,exact:true}));}
   }await page.setViewportSize({width:1440,height:900});return{steps:count,captures:images};
  });
  await run('promotion-refresh-preserves-query',['CAD-24','CAD-25'],async()=>{
   await go('/cadastros/produtos');await page.getByPlaceholder('Pesquisar...').fill('PRODUTO QA 002');const row=page.locator('.catalog-table tbody tr').filter({hasText:'PRODUTO QA 002'});await row.getByRole('button',{name:/Promoções/}).click();const d=page.locator('.product-extras');await d.waitFor();await page.waitForFunction(()=>!document.querySelector('.extras-loading'));
   await d.getByLabel(/^Preço promocional/).fill('900');await d.getByLabel(/Início/).fill('2026-01-01T00:00');await d.getByLabel(/Fim/).fill('2099-01-01T00:00');await d.getByRole('button',{name:/Cadastrar promoção/}).click();await d.getByText('Promoção cadastrada com sucesso.',{exact:true}).waitFor();const before=await page.evaluate(()=>window.__insightpadQa.state.requests.filter(x=>x.name==='ListProducts').length);await d.getByRole('button',{name:'Cancelar',exact:true}).click();await page.waitForFunction(n=>window.__insightpadQa.state.requests.filter(x=>x.name==='ListProducts').length>n,before);assert.equal(await page.getByPlaceholder('Pesquisar...').inputValue(),'PRODUTO QA 002');return{refreshAfterAcknowledgedSave:true,searchPreserved:true};
  });
  await run('scanner-origins-and-close',['CAD-26'],async()=>{
   await go('/cadastros/produtos');await add().click();await page.locator('.product-kind-option--simple').click();const d=form();const scan=d.getByRole('button',{name:/câmera|Escanear/i}).first();await scan.click();let scanner=page.getByRole('dialog',{name:'Leitor de código de barras'});await scanner.waitFor();assert.equal(await scanner.locator('video').count(),1);await page.keyboard.press('Escape');await scanner.waitFor({state:'hidden'});assert.equal(await d.count(),1);assert.equal(await scan.evaluate(e=>e===document.activeElement),true);
   await page.keyboard.press('Escape');await page.getByRole('button',{name:/Pesquisa avançada/}).click();const filters=page.locator('.advanced-search-modal');await filters.getByRole('button',{name:/câmera|Escanear/i}).first().click();scanner=page.getByRole('dialog',{name:'Leitor de código de barras'});await scanner.waitFor();await page.keyboard.press('Escape');await scanner.waitFor({state:'hidden'});assert.equal(await filters.count(),1);return{origins:['form','filter'],realScannerComponent:true,physicalCamera:'pending authorized DEV hardware'};
  });
  await run('global-order-alert-scope',['CAD-02','CAD-27'],async()=>{
   await go('/cadastros/produtos');await add().click();await page.locator('.product-kind-option--simple').click();const d=form();await d.getByLabel(/^Nome/).fill('RASCUNHO SINTÉTICO');
   await page.evaluate(()=>{localStorage.removeItem('insightpad:channel-order-poll-lease');window.__insightpadQa.state.pendingChannelOrders=[{id:'qa-cadastros-pending',alertKind:'RECEPTION',displayCode:'QA-CAD',provider:'IFOOD',catalogProfile:'UNVERIFIED',authorizationStatus:'PENDING',branchName:'MATRIZ QA',customerName:'CLIENTE SINTÉTICO',totalCents:'1200',receivedAt:new Date().toISOString(),version:7,items:[{name:'PRODUTO SINTÉTICO',quantity:1}]}];document.dispatchEvent(new Event('visibilitychange'))});
   const alert=page.getByRole('alertdialog',{name:'Novo pedido recebido',exact:true});await alert.waitFor();assert.equal(await alert.evaluate(e=>Boolean(e.closest('.cad-page'))),false);assert.equal(await alert.evaluate(e=>getComputedStyle(e.closest('.catalog-backdrop')).getPropertyValue('--cad-dialog').trim()),'');
   assert.equal(await alert.getByRole('button',{name:'Aceitar pedido',exact:true}).isDisabled(),true);await capture('cadastros-with-global-order-alert');await alert.getByRole('button',{name:'Dispensar alerta',exact:true}).click();await alert.waitFor({state:'hidden'});assert.equal(await d.getByLabel(/^Nome/).inputValue(),'RASCUNHO SINTÉTICO');return{globalAlertUnstyledByCadastros:true,parentDraftPreserved:true,integration:'synthetic order only; real iFood unchanged'};
  });
  await run('cep-success-and-manual-fallback',['CAD-21','CAD-22','CAD-23'],async()=>{
   await go('/cadastros/filiais');
   // The QA entry has connect-src none. Stub only ViaCEP in this synthetic page;
   // no intercepted request is mistaken for live DEV service validation.
   await page.evaluate(()=>{const original=window.fetch;window.__cadCepUnavailable=false;window.fetch=async(...args)=>{
    if(String(args[0]).startsWith('https://viacep.com.br/ws/')){if(window.__cadCepUnavailable)throw Error('Synthetic ViaCEP unavailable');return new Response(JSON.stringify({uf:'SP',localidade:'CIDADE SINTÉTICA',bairro:'BAIRRO SINTÉTICO',logradouro:'RUA SINTÉTICA'}),{headers:{'Content-Type':'application/json'}})}return original(...args);
   }});
   await add().click();const d=form();await d.locator('.master-modal-tabs').getByRole('button',{name:/Endereço/}).click();await d.getByLabel(/^CEP/).fill('01001000');await d.getByLabel(/^CEP/).press('Tab');await page.waitForFunction(()=>[...document.querySelectorAll('input')].some(e=>e.value==='CIDADE SINTÉTICA'));
   assert.equal(await d.getByLabel(/^Cidade/).inputValue(),'CIDADE SINTÉTICA');await page.evaluate(()=>window.__cadCepUnavailable=true);await d.getByLabel(/^CEP/).fill('02002000');await d.getByLabel(/^CEP/).press('Tab');await page.getByRole('alert').filter({hasText:/Preencha o endereço manualmente/}).waitFor();await d.getByLabel(/^Cidade/).fill('ENDEREÇO MANUAL');assert.equal(await d.getByLabel(/^Cidade/).inputValue(),'ENDEREÇO MANUAL');return{ViaCepResponses:'synthetic page fetch stub: success and network failure; not live service validation',manualEntryPreserved:true};
  });
  await run('zoom200-and-reduced-motion',['CAD-30'],async()=>{
   await page.setViewportSize({width:1280,height:800});await go('/cadastros/produtos');await add().click();await page.locator('.product-kind-option--combo').click();await zoom(2);const d=form();await reachable(d.locator(':scope>form>footer').getByRole('button',{name:'Próxima',exact:true}));await reachable(d.getByRole('combobox'));await page.emulateMedia({reducedMotion:'reduce'});const motion=await d.evaluate(e=>({animation:getComputedStyle(e).animationName,transition:getComputedStyle(e).transitionDuration}));assert.equal(motion.animation,'none');assert.ok(parseFloat(motion.transition)<=0.00001);await capture('combo-native-zoom200-reduced-motion');await zoom(1);return{nativeZoom:2,nativeAPI:'chrome.tabs.setZoom/getZoom',motion};
  });
  assert.deepEqual(errors,[]);if(!process.env.CAD_CASE)assert.equal(cases.length,15);assert.ok(cases.every(c=>c.result==='passed'),'Cadastros browser failures; inspect private result JSON');
 }finally{await context?.close();rmSync(scratch,{recursive:true,force:true});}
 return cases;
}
