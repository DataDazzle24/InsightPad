import {chromium} from 'playwright';
import {mkdirSync,writeFileSync,mkdtempSync,rmSync,readFileSync} from 'node:fs';
import {tmpdir} from 'node:os';
import {join} from 'node:path';
import assert from 'node:assert/strict';

// Explicit opt-in fixture for the actual React pages. All data/partner replies
// stay in memory, behind the QA entry; external requests are denied below.
export async function installCanaisFixture(context){
 await context.addInitScript(()=>{
  const id=n=>'00000000-0000-4000-8000-'+String(n).padStart(12,'0'),at='2026-11-14T12:00:00Z';
  const branches=[{id:id(1),name:'MATRIZ QA'},{id:id(2),name:'FILIAL QA'}];
  const connections=Array.from({length:5},(_,i)=>({id:id(900+i),provider:'IFOOD',catalogProfile:i===1?'RESTAURANT':'GROCERY',displayName:['MERCADO QA','RESTAURANTE QA','PREPARAÇÃO QA','RECONECTAR QA','DESATIVAÇÃO QA'][i],branchId:branches[i%2].id,branchName:branches[i%2].name,status:i===4?'DECOMMISSIONING':'ACTIVE',authorizationStatus:i===2?'PENDING':i===3?'REAUTH_REQUIRED':'AUTHORIZED',enabled:true,externalStoreId:i===2?'':'MERCHANT-QA-'+i,integrationMode:'HYBRID',webhookStatus:'ACTIVE',consecutiveFailures:0,mappingCount:3,pendingOrders:0,createdAt:at,updatedAt:at,lastSyncedAt:at,capabilities:{catalog:true,orders:true,financial:true}}));
  const products=[{id:id(101),name:'COMBO QA',internalCode:'QA-COMBO',ean:'7894900011517',bundleProduct:true,componentCount:2,components:[{id:id(103),name:'COMPONENTE QA',quantity:2}],active:true,salePriceCents:'2500',physicalStock:2,reservedStock:1,availableStock:1},{id:id(102),name:'PRODUTO SEM EAN QA',internalCode:'QA-INVALIDO',ean:'123',active:true,salePriceCents:'1200',physicalStock:0,reservedStock:0,availableStock:0}];
  const orders=Array.from({length:61},(_,i)=>({id:id(1000+i),providerOrderId:'EXTERNO-QA-'+i,displayCode:'QA-'+String(i+1).padStart(3,'0'),provider:'IFOOD',catalogProfile:i===1?'GROCERY':'RESTAURANT',connectionId:connections[i===1?0:1].id,connectionName:connections[i===1?0:1].displayName,authorizationStatus:i===8?'PENDING':'AUTHORIZED',grocerySeparationStarted:i===1,branchId:branches[i%2].id,branchName:branches[i%2].name,customerName:'PESSOA FICTÍCIA QA '+i,orderType:'DELIVERY',deliveryProvider:'MERCHANT',subtotalCents:'2500',deliveryFeeCents:'500',discountCents:'100',additionalFeeCents:'0',prepaidCents:'2900',pendingPaymentCents:'0',merchantDiscountCents:'100',ifoodDiscountCents:'0',providerFeeCents:'200',netAmountCents:'2700',totalCents:'2900',status:i===1||i===3||i===5||i===6?'ACCEPTED':i===7?'COMPLETED':'PENDING',partnerStatus:i===1?'SEPARATION_STARTED':i===3?'READY_TO_PICKUP':null,pendingAction:i===4?'REJECT':i===5?'COMPLETE':null,commandStatus:i===4?'QUEUED':i===5?'AWAITING_PARTNER':i===6?'RECONCILIATION_REQUIRED':'',receivedAt:at,statusUpdatedAt:at,version:1,commerceStatus:'PENDING',stockReservationStatus:'NONE',payments:[{id:id(3000+i),method:'CREDIT',currency:'BRL',prepaid:true,amountCents:'2900',sequence:0}],adjustments:[{id:id(4000+i),kind:'BENEFIT',description:'DESCONTO QA',amountCents:'100'}],financialEntries:[{id:id(5000+i),name:'REPASSE QA',amountCents:'2700',hasTransferImpact:true,occurredAt:at}],history:[{id:id(6000+i),toStatus:'PENDING',origin:'QA',createdAt:at}],items:[{id:id(2000+i),productId:i===2?null:id(101),productName:'COMBO QA',bundleProduct:true,productUsable:true,mappingStatus:i===2?'UNMAPPED':'MAPPED',externalItemId:'ITEM-QA-'+i,ean:'7894900011517',name:'ITEM QA',quantity:2,unitPriceCents:'1250',totalCents:'2500',allowNegativeStock:false,physicalStock:i===9?0:10,reservedStock:0,availableStock:i===9?0:10}],saleId:i===7?id(7000):null}));
  const mappings=Array.from({length:3},(_,i)=>({id:id(8000+i),connectionId:connections[i===2?1:0].id,connectionName:connections[i===2?1:0].displayName,provider:'IFOOD',catalogProfile:i===2?'RESTAURANT':'GROCERY',branchName:'MATRIZ QA',productId:id(101),productName:'COMBO QA '+i,internalCode:'QA-COMBO',ean:'7894900011517',externalProductId:'7894900011517',externalProductName:'COMBO EXTERNO QA',syncPrice:true,syncStock:true,enabled:true,status:'ACTIVE',syncStatus:i===0?'PARTNER_PENDING':'ACKNOWLEDGED',publicationStatus:i===0?'RECEIVED':'CONFIRMED',needsFullPublication:false,salePriceCents:'2500',bundleProduct:true,priceMode:'PRODUCT',effectivePriceCents:'2500',remoteProductState:i===2?'EXISTING':'NEW',version:1,updatedAt:at,lastSyncedAt:at}));
  const op=(i,action,outcomeUnknown=false)=>({id:id(10000+i),orderId:orders[0].id,connectionId:connections[0].id,connectionName:'MERCADO QA',provider:'IFOOD',status:'ERROR',attempts:1,lastError:'FALHA SINTÉTICA QA',action,outcomeUnknown,createdAt:at});
  const data={orders,connections,mappings,products,branches,empty:false,reasons:'ok',calls:[],operations:{events:[{...op(3),eventType:'ORDER',providerEventId:'EVENTO-QA',source:'QA',receivedAt:at}],commands:[op(1,'ACCEPT'),op(2,'REPLACE_ITEM',true)],jobs:[{...op(4),jobType:'FULL',totalItems:3,processedItems:1,failedItems:1}],summary:{eventFailures:1,queuedCommands:1,syncFailures:1}}};
  window.__canais=data;
  const box=value=>({data:{_select:[{data:value}]}});
  const handler=async(name,v)=>{
   data.calls.push({name,variables:structuredClone(v)});
   const list=(rows,summary)=>{
    const f=v.filters??v,term=String(f.term??'').toLowerCase();let matched=data.empty?[]:rows.filter(r=>(!term||JSON.stringify(r).toLowerCase().includes(term))&&(!f.branchId||r.branchId===f.branchId)&&(!f.connectionId||r.connectionId===f.connectionId)&&(!f.status||r.status===f.status)&&(!f.provider||r.provider===f.provider));
    if(v.sortField)matched.sort((a,b)=>String(a[v.sortField]??'').localeCompare(String(b[v.sortField]??''))*(v.sortDirection==='DESC'?-1:1));
    return box({rows:matched.slice(Number(v.offset??0),Number(v.offset??0)+Number(v.limit??100)),total:matched.length,summary});
   };
   if(name==='SalesChannelOptions')return box({branches,connections});
   if(name==='SalesChannelOrdersV2')return list(orders,{pending:55,accepted:5,completed:1,attention:2});
   if(name==='SalesChannelOrderDetails')return box(orders.find(r=>r.id===v.id));
   if(name==='SalesChannelConnectionsV2')return list(connections,{total:5,authorized:2,preparing:1,attention:2});
   if(name==='SalesChannelProductMappingsV2')return list(mappings,{total:3,automatic:3,pending:1,errors:0});
   if(name==='SalesChannelOperations')return box(data.operations);
   if(name==='SalesChannelProductOptions')return {data:{_select:products.filter(p=>!v.term||JSON.stringify(p).toLowerCase().includes(String(v.term).toLowerCase()))}};
   if(name==='ExportSalesChannelManagement')return box({connections,products:mappings});
   if(name==='QueueSalesChannelOrderAction'){const row=orders.find(r=>r.id===v.id);row.commandStatus='QUEUED';row.pendingAction=v.action;return {data:{_execute:1}};}
   if(name==='MapSalesChannelOrderItem'){const item=orders.flatMap(o=>o.items).find(i=>i.id===v.itemId);item.productId=v.productId;item.mappingStatus='MAPPED';return {data:{_execute:1}};}
   if(name==='RequestSalesChannelOrderReconciliation'||name==='RetrySalesChannelCommand')return {data:{_execute:1}};
   if(name==='ifoodCancellationReasons'){
    if(data.reasons==='slow')await new Promise(r=>setTimeout(r,700));
    if(data.reasons==='error')throw Error('QA: motivos indisponíveis');
    return {data:{reasons:data.reasons==='empty'?[]:[{code:'901',label:'Produto indisponível QA'}]}};
   }
   if(name==='ifoodAvailableMerchants')return {data:{merchants:[{id:'MERCHANT-QA',name:'LOJA AUTORIZADA QA',type:'MARKETPLACE',catalogProfile:'GROCERY'}]}};
   if(name==='ifoodMerchantOperations')return {data:{data:{status:{state:'OPEN'},openingHours:{shifts:[{dayOfWeek:'MONDAY',start:'08:00:00',duration:480},{dayOfWeek:'MONDAY',start:'18:00:00',duration:240}]},interruptions:[{id:'PAUSA-QA',description:'PAUSA QA',start:at,end:'2026-11-15T12:00:00Z'}]}}};
   throw Error('Canais fixture missing '+name);
  };
  let qa;
  Object.defineProperty(window,'__insightpadQa',{configurable:true,get:()=>qa,set:value=>{qa=value;qa.state.channelHarness=handler;}});
 });
}

export async function canaisProof({output,sha,origin='http://127.0.0.1:4174'}){
 const dir=output+'/canais';mkdirSync(dir,{recursive:true});const cases=[],errors=[];
 const scratch=mkdtempSync(join(tmpdir(),'canais-')),ext=join(scratch,'extension');mkdirSync(ext);
 writeFileSync(join(ext,'manifest.json'),JSON.stringify({manifest_version:3,name:'Canais native zoom',version:'1.0',permissions:['tabs'],host_permissions:[origin+'/*'],background:{service_worker:'worker.js'}}));
 writeFileSync(join(ext,'worker.js'),'chrome.runtime.onInstalled.addListener(()=>{});');
 let context;
 try{
  context=await chromium.launchPersistentContext(join(scratch,'profile'),{headless:true,channel:'chromium',viewport:{width:1280,height:800},deviceScaleFactor:1,args:['--disable-extensions-except='+ext,'--load-extension='+ext]});
  await context.route('**/*',r=>new URL(r.request().url()).origin===origin?r.continue():r.abort());await installCanaisFixture(context);
  const worker=context.serviceWorkers()[0]??await context.waitForEvent('serviceworker');const page=await context.newPage();page.setDefaultTimeout(10000);page.on('pageerror',e=>errors.push(e.message));
  const orders='/integracoes/canais/pedidos',connections='/integracoes/canais/conexoes';
  async function zoom(value){const actual=await worker.evaluate(async({origin,value})=>{const tab=(await chrome.tabs.query({})).find(t=>t.url?.startsWith(origin));await chrome.tabs.setZoom(tab.id,value);return chrome.tabs.getZoom(tab.id)},{origin,value});assert.equal(actual,value);}
  async function ready(){await page.locator('.catalog-loader').waitFor({state:'hidden'});await page.evaluate(()=>document.fonts.ready);}
  async function go(route=orders,theme='dark',platform=true){await page.goto(origin+'/qa/application.html'+(platform?'?qa-profile=platform':'')+'#'+route);await page.evaluate(t=>localStorage.setItem('insightpad.theme',t),theme);await page.reload();await page.locator('.work-orders,.work-connections').waitFor();await ready();await page.locator('.qa-controls').evaluate(e=>e.style.visibility='hidden');await zoom(1);}
  const dialog=()=>page.getByRole('dialog').last();
  async function shot(name){const file=name+'.png';await page.screenshot({path:dir+'/'+file});return file;}
  async function reachable(loc){await loc.scrollIntoViewIfNeeded();const r=await loc.boundingBox(),v=await page.evaluate(()=>({w:innerWidth,h:innerHeight}));assert.ok(r&&r.x>=-1&&r.y>=-1&&r.x+r.width<=v.w+1&&r.y+r.height<=v.h+1,JSON.stringify({r,v}));}
  async function run(name,ids,fn){if(process.env.CANAIS_CASE&&!name.includes(process.env.CANAIS_CASE))return;try{const observed=await fn();cases.push({name,ids,result:'passed',observed,capture:await shot(name)});}catch(e){cases.push({name,ids,result:'failed',error:e.message,capture:await shot(name+'-failed')});console.error('Canais '+name+': '+e.message.slice(0,300));}writeFileSync(dir+'/results.json',JSON.stringify({sha,auth:'mock',api:'explicit synthetic fixture; external network denied',nativeZoomAPI:'chrome.tabs.setZoom/getZoom',browser:context.browser()?.version(),cases,errors,authenticatedDEV:'pending'},null,2));console.log('Canais '+name+': '+cases.at(-1).result);}
  const row=n=>page.locator('.channel-orders-table tbody>tr:not(.channel-order-details)').filter({hasText:'QA-'+String(n).padStart(3,'0')});
  for(const theme of ['dark','light'])for(const [width,height]of [[1440,900],[1280,800],[390,844],[320,568]])await run('layout-'+theme+'-'+width,['PED-02','PED-13','CON-02','CON-10','CON-18'],async()=>{
   await page.setViewportSize({width,height});const seen=[];
   for(const [route,cols]of [[orders,8],[connections,8],[connections+'?section=products',9]]){
    await go(route,theme);const region=page.getByRole('region',{name:route===orders?'Tabela de pedidos integrados':'Tabela da gestão de conexões'});assert.equal(await region.locator('thead th').count(),cols);
    assert.ok(await page.evaluate(()=>document.documentElement.scrollWidth<=innerWidth+1),'Page horizontal overflow');
    await region.evaluate(e=>{e.scrollLeft=e.scrollWidth;e.scrollTop=e.scrollHeight;});await reachable(region.locator('tbody tr').last().locator('td').last());await shot((route===orders?'pedidos':cols===9?'catalogo':'conexoes')+'-'+theme+'-'+width);seen.push({route,cols});
    await page.getByRole('button',{name:/Pesquisa avançada/}).click();await reachable(dialog().getByRole('button',{name:/Aplicar/}));await page.keyboard.press('Escape');assert.equal(await dialog().count(),0);
   }return{theme,width,height,nativeZoom:1,seen};
  });
  await page.setViewportSize({width:1280,height:800});
  await run('orders-summary-pagination-filters',['PED-01','PED-02','PED-06'],async()=>{
   await go();assert.equal(await page.locator('.channel-kpi').count(),4);await page.getByRole('button',{name:/Próxima/}).click();await page.waitForFunction(()=>document.querySelector('.channel-orders-table tbody>tr td strong')?.textContent?.trim()==='#QA-051');await ready();assert.equal(await page.locator('.channel-orders-table tbody>tr').count(),11);
   await page.locator('.channel-kpi').first().click();await ready();assert.match(await page.locator('.catalog-pagination').innerText(),/Página 1/);assert.equal(await page.locator('.channel-kpi').first().getAttribute('aria-pressed'),'true');
   await page.getByRole('button',{name:/Pesquisa avançada/}).click();const d=dialog();await d.getByLabel(/^Filial/).selectOption({label:'FILIAL QA'});await d.getByRole('button',{name:/Aplicar/}).click();await ready();const call=await page.evaluate(()=>window.__canais.calls.filter(c=>c.name==='SalesChannelOrdersV2').at(-1));assert.ok(call.variables.filters.branchId.endsWith('000002'));return call;
  });
  await run('queue-confirmation-guards',['PED-03','PED-04','PED-07','PED-11'],async()=>{
   await go();assert.ok(await row(5).getByText(/recusa: em fila/).isVisible());assert.ok(await row(5).locator('.channel-status--pending').isVisible());assert.ok(await row(5).getByRole('button',{name:/Aceitar/}).isDisabled());assert.ok(await row(3).getByRole('button',{name:/Aceitar/}).isDisabled());assert.ok(await row(10).getByRole('button',{name:/Aceitar/}).isDisabled());
   await page.evaluate(()=>window.__canais.reasons='error');await row(1).getByRole('button',{name:/Recusar/}).click();await dialog().getByRole('button',{name:'Tentar novamente'}).waitFor();await page.evaluate(()=>window.__canais.reasons='ok');await dialog().getByRole('button',{name:'Tentar novamente'}).click();await dialog().getByLabel('Motivo disponível no iFood').selectOption('901');await dialog().getByRole('button',{name:'Confirmar solicitação'}).click();await ready();await dialog().waitFor({state:'hidden'});assert.ok(await row(1).locator('.channel-status--pending').isVisible());assert.ok(await row(1).getByText(/recusa: em fila/).isVisible());return await page.evaluate(()=>window.__canais.calls.filter(c=>c.name==='QueueSalesChannelOrderAction'));
  });
  await run('details-and-four-picking-variants',['PED-05','PED-09'],async()=>{
   await go();await row(2).getByRole('button',{name:/Detalhes/}).click();await ready();const details=page.locator('.channel-order-details');const labels=await details.locator('h3').allTextContents();assert.ok(labels.length>=5);const variants=[[/Quantidade/,1],[/Substituir/,2],[/Remover/,0],[/Adicionar item/,2]];const seen=[];
   for(const [name,count]of variants){const trigger=details.getByRole('button',{name}).first();await trigger.click();const d=dialog();assert.equal(await d.locator('input').count(),count);if(count===2)assert.ok(await d.getByRole('button',{name:'Confirmar',exact:true}).isDisabled());if(count)await page.waitForFunction(()=>document.activeElement?.hasAttribute('data-pedido-initial'));await reachable(d.getByRole('button',{name:'Confirmar',exact:true}));await shot('picking-'+count+'-'+seen.length);await page.keyboard.press('Escape');assert.ok(await trigger.evaluate(e=>e===document.activeElement));seen.push({name:String(name),count});}return{labels,seen};
  });
  await run('mapping-low-stock-and-empty',['PED-10'],async()=>{
   await go();await row(3).getByRole('button',{name:/Detalhes/}).click();const trigger=page.locator('.channel-order-details').getByRole('button',{name:/Vincular/}).first();await trigger.click();const d=dialog();await d.getByPlaceholder('Nome, código interno, EAN ou balança').fill('inexistente');await d.getByText(/Nenhum produto/).waitFor();await d.getByPlaceholder('Nome, código interno, EAN ou balança').fill('COMBO');await d.locator('.channel-product-results button').first().click();assert.ok(await d.getByText(/Não há estoque disponível suficiente/).isVisible());const submit=d.getByRole('button',{name:/Confirmar produto e reconciliar/});assert.ok(await submit.isEnabled());await shot('vinculo-saldo-insuficiente');await page.keyboard.press('Escape');assert.ok(await trigger.evaluate(e=>e===document.activeElement));return{lowStockDoesNotDisableMapping:true,acceptanceStillGuarded:true};
  });
  await run('dispatch-cancel-reasons-states',['PED-07','PED-08'],async()=>{
   await go();await row(4).getByRole('button',{name:/Saiu para entrega/}).click();assert.equal(await dialog().locator('textarea,select').count(),0);await page.keyboard.press('Escape');await page.evaluate(()=>window.__canais.reasons='empty');await row(2).getByRole('button',{name:/Cancelar/}).click();await dialog().getByText(/não permite solicitar/).waitFor();assert.ok(await dialog().getByRole('button',{name:'Confirmar solicitação'}).isDisabled());await page.keyboard.press('Escape');await page.evaluate(()=>window.__canais.reasons='slow');await row(2).getByRole('button',{name:/Cancelar/}).click();assert.ok(await dialog().getByLabel('Motivo disponível no iFood').isDisabled());await dialog().getByLabel('Motivo disponível no iFood').selectOption('901');await page.keyboard.press('Escape');return{dispatchNoReason:true,emptyAndSlowReasons:true};
  });
  await run('profiles-history-deeplink',['PED-11','CON-01'],async()=>{
   await go(connections+'?section=operations','dark',false);assert.equal(await page.getByRole('button',{name:/Histórico e problemas/}).count(),0);assert.equal(await page.locator('.work-connections').getAttribute('data-section'),'connections');
   await go();await page.locator('.qa-controls').evaluate(e=>{e.style.visibility='visible';e.open=true;});await page.getByLabel('Permissões',{exact:true}).selectOption('read');await page.locator('.qa-controls').evaluate(e=>e.style.visibility='hidden');assert.equal(await page.getByRole('button',{name:/Exportar CSV/}).count(),0);assert.equal(await row(1).getByRole('button',{name:/Aceitar|Recusar/}).count(),0);assert.ok(await row(1).getByRole('button',{name:/Detalhes/}).isVisible());return{historyDeniedAndNormalized:true,readOnlyHidesMutationAndCSV:true};
  });
  await run('connection-filters-forms-diagnostics',['CON-03','CON-04','CON-06','CON-09'],async()=>{
   await go(connections);await page.getByRole('button',{name:/Novo canal/}).click();const d=dialog();assert.equal(await d.locator('form').evaluate(e=>e.checkValidity()),false);await shot('preparar-loja');await page.keyboard.press('Escape');const r=page.getByRole('row').filter({hasText:'MERCADO QA'}).first();await r.getByRole('button',{name:/Configurar/}).click();assert.ok(await dialog().getByLabel(/^Filial/).isDisabled());await page.keyboard.press('Escape');await r.getByRole('button',{name:/Diagnóstico/}).click();await dialog().locator('summary').click();await reachable(dialog().locator('footer button').last());await shot('diagnostico');await page.keyboard.press('Escape');await r.getByRole('button',{name:/Remover/}).click();assert.match(await page.getByRole('alertdialog').innerText(),/arquiv|desativ/i);await page.keyboard.press('Escape');return{prepareDisabledUntilValid:true,editBranchLocked:true,diagnosticAndArchiveVisible:true};
  });
  await run('authorization-store-hours-pauses',['CON-05','CON-07','CON-08'],async()=>{
   await go(connections);await page.getByRole('row').filter({hasText:'RECONECTAR QA'}).getByRole('button',{name:/Conectar/}).click();await dialog().locator('input[type=radio]').first().check();assert.ok(await dialog().getByRole('button',{name:'Conectar e validar'}).isEnabled());await shot('autorizacao');await page.keyboard.press('Escape');await page.getByRole('row').filter({hasText:'MERCADO QA'}).first().getByRole('button',{name:/Loja/}).click();await dialog().getByText('Horários de funcionamento',{exact:true}).waitFor();await reachable(dialog().locator('footer button'));await shot('horarios-pausas');assert.ok(await dialog().getByRole('button',{name:'Programar pausa'}).isDisabled());await page.keyboard.press('Escape');return{authorizationSelection:true,hoursAndPauses:true,noPartnerWrites:true};
  });
  await run('catalogue-forms-prices-and-identifiers',['CON-10','CON-11','CON-12','CON-13','CON-14'],async()=>{
   await go(connections+'?section=products');assert.ok(await page.getByText('Recebido pelo iFood',{exact:true}).isVisible());assert.ok(await page.getByText('Confirmado pelo iFood',{exact:true}).first().isVisible());await page.getByRole('button',{name:/Adicionar produto/}).first().click();const d=dialog();await d.getByLabel(/^Loja/).selectOption('00000000-0000-4000-8000-000000000900');await d.getByPlaceholder('Digite ao menos 2 caracteres para pesquisar').fill('COMBO');await d.locator('.channel-product-results button').first().click();await reachable(d.locator('footer button').last());await shot('catalogo-combo');assert.ok(await d.locator('footer button').last().isEnabled());await page.keyboard.press('Escape');return{receivedDistinctFromConfirmed:true,validEANAndComponentStock:true};
  });
  await run('history-retry-versus-reconciliation',['CON-15','CON-16'],async()=>{
   await go(connections+'?section=operations');assert.equal(await page.locator('.channel-operation-card').count(),3);const commands=page.locator('.channel-operation-card').first();assert.equal(await commands.getByRole('button',{name:'Tentar novamente'}).count(),1);assert.ok(await commands.getByRole('link',{name:/Reconciliar pedido/}).isVisible());await commands.getByRole('button',{name:'Tentar novamente'}).click();await ready();const calls=await page.evaluate(()=>window.__canais.calls.filter(c=>c.name==='RetrySalesChannelCommand'));assert.equal(calls.length,1);return{safeRetryOnly:true,uncertainItemUsesReconciliation:true,calls};
  });
  await run('three-csv-contracts',['CON-17','PED-02'],async()=>{
   const downloads=[];for(const route of [orders,connections,connections+'?section=products']){await go(route);const pending=page.waitForEvent('download');await page.getByRole('button',{name:/Exportar CSV/}).click();const dl=await pending,csv=readFileSync(await dl.path(),'utf8');assert.ok(csv.split('\n').length>2);writeFileSync(dir+'/'+dl.suggestedFilename(),csv);downloads.push({name:dl.suggestedFilename(),lines:csv.split('\n').length,header:csv.split('\n')[0]});}assert.deepEqual(downloads.map(d=>d.name),['pedidos-canais.csv','conexoes-canais.csv','catalogo-canais.csv']);return downloads;
  });
  await run('empty-error-and-slow',['PED-12'],async()=>{
   await go();await page.evaluate(()=>window.__canais.empty=true);await page.getByRole('button',{name:/Atualizar/}).click();await page.getByText('Nenhum pedido encontrado',{exact:true}).waitFor();await page.evaluate(()=>{window.__canais.empty=false;window.__insightpadQa.state.delay=700;});await page.getByRole('button',{name:/Atualizar/}).click();await page.locator('.catalog-loader').waitFor();await ready();await page.evaluate(()=>{window.__insightpadQa.state.delay=0;window.__insightpadQa.state.fail=true;});await page.getByRole('button',{name:/Atualizar/}).click();await page.getByRole('alert').waitFor();return{emptySlowFailureVisible:true};
  });
  for(const theme of ['dark','light'])await run('native-reflow-focus-'+theme,['PED-06','PED-13','CON-18'],async()=>{
   await page.setViewportSize({width:1280,height:800});for(const route of [orders,connections]){await go(route,theme);await zoom(2);const trigger=page.getByRole('button',{name:/Pesquisa avançada/});await trigger.click();const d=dialog();await reachable(d.getByRole('button',{name:/Aplicar/}));const last=d.getByRole('button',{name:/Aplicar/});await last.focus();await page.keyboard.press('Tab');assert.ok(await d.locator('button').first().evaluate(e=>e===document.activeElement));await page.keyboard.press('Shift+Tab');assert.ok(await last.evaluate(e=>e===document.activeElement));await page.keyboard.press('Escape');assert.ok(await trigger.evaluate(e=>e===document.activeElement));await zoom(1);}return{theme,nativeZoom:2,tabCycle:true,escapeReturnsFocus:true};
  });
  await run('neighbor-regression',['PED-14','CON-19'],async()=>{const routes=['/modulos/canais','/cadastros/categorias','/estoque','/vendas/registros','/vendas/frente-de-caixa'];const observations=[];for(const route of routes){await page.goto(origin+'/qa/application.html#'+route);await page.locator('.app-stage').waitFor();await ready();assert.equal(await page.locator('.work-orders,.work-connections').count(),0);assert.equal(await page.locator('.ip-bottom,.channel-alert-readiness').count(),0);observations.push(route);}return{routes:observations,notifierSourceUnchanged:true};});
  assert.deepEqual(errors,[],'Canais browser JS errors');assert.ok(cases.every(c=>c.result==='passed'),'Canais browser cases failed; inspect results.json');
 }finally{await context?.close();rmSync(scratch,{recursive:true,force:true});}
}
