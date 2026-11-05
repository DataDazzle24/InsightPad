import assert from 'node:assert/strict';
import {mkdirSync,readFileSync,writeFileSync} from 'node:fs';

// Actual React controllers with the existing isolated API boundary. No remote access.
export async function dashboardV3({page,output,sha,origin='http://127.0.0.1:4174',filter=null}){
 const dir=output+'/dashboard-v3';mkdirSync(dir,{recursive:true});const cases=[],errors=[];
 const error=e=>errors.push(e.message);page.on('pageerror',error);
 if(process.env.GITHUB_ACTIONS&&filter)throw Error('CI must run all dashboard v3 cases');
 const run=async(name,fn)=>{if(filter&&!name.includes(filter))return;try{cases.push({name,result:'passed',observed:await fn()})}catch(e){cases.push({name,result:'failed',error:String(e.stack).slice(0,1700)});console.error('Dashboard v3:',name,e.message)}};
 const views=['Vendas','Canais','Estoque','Clientes','Categorias'];
 const subpages=[['Visão geral','Produtos','Comparativos'],['Visão geral','Lojas e taxas','Pagamentos e produtos'],['Visão geral','Produtos'],['Visão geral','Relacionamento','Regiões'],['Categorias','Subcategorias']];
 const sizes=[[1440,900],[1280,800],[1366,768],[1024,600],[390,844],[320,568]];
 const go=async(theme,route='/dashboards/operacional')=>{await page.goto(origin+'/qa/application.html#'+route);await page.evaluate(t=>localStorage.setItem('insightpad.theme',t),theme);await page.reload();await page.evaluate(()=>document.fonts.ready);await page.locator('.qa-controls').evaluate(e=>{e.open=false;e.style.visibility='hidden'});};
 const ready=async()=>{await page.locator('.catalog-loader').first().waitFor({state:'hidden'});await page.locator('.dv-kpi').first().waitFor();};
 const reachable=async(locator)=>assert.ok(await locator.evaluate(e=>{const r=e.getBoundingClientRect(),x=r.x+r.width/2,y=r.y+r.height/2,hit=document.elementFromPoint(x,y);return r.width>0&&r.height>0&&x>=0&&x<innerWidth&&y>=0&&y<innerHeight&&(hit===e||e.contains(hit))}), 'control clipped or covered');
 const baseline=process.env.IP_DASHBOARD_BASELINE_HEADERS?JSON.parse(readFileSync(process.env.IP_DASHBOARD_BASELINE_HEADERS,'utf8')):null;
 try{
 for(const theme of ['dark','light'])for(const [width,height]of sizes){
  await page.setViewportSize({width,height});await go(theme);
  for(const [v,view]of views.entries())await run(`matrix-${theme}-${width}x${height}-${view}`,async()=>{
   await page.getByRole('button',{name:view,exact:true}).click();await ready();
   const headers=await page.locator('.legacy-header,.ip-top').evaluateAll(es=>es.map(e=>{const r=e.getBoundingClientRect(),s=getComputedStyle(e);return{class:e.className,rect:{x:r.x,y:r.y,width:r.width,height:r.height},color:s.color,background:s.backgroundColor,font:s.font,padding:s.padding}}));
   if(baseline)assert.deepEqual(headers,baseline.records.find(r=>r.theme===theme&&r.width===width&&r.height===height).headers,'global header computed geometry/styles changed');
   assert.equal(await page.locator('.ip-bottom').count(),0);assert.equal(await page.locator('.app-frame > .app-stage .ip-dashboard-v3').count(),1);
   const button=page.getByRole('button',{name:'Configurar e testar alertas de pedidos',exact:true});await button.waitFor();await reachable(button);
   const art=await page.locator('.dv-art').evaluateAll(es=>es.filter(e=>e.getBoundingClientRect().width>0).map(e=>({display:getComputedStyle(e).display,src:e.querySelector('img').currentSrc,loaded:e.querySelector('img').complete&&e.querySelector('img').naturalWidth>1})));
   if(width<=390)assert.equal(art.length,0);else if(width>=1280)assert.ok(art.length>0&&art.every(a=>a.loaded));
   const pages=[];
   for(const name of subpages[v]){
    await page.locator('.dv-subnav').getByRole('button',{name,exact:true}).click();
    const grid=page.locator('.dv-panel-grid[data-screen-active="true"]');const count=await grid.locator('.dv-panel-cell').count(),mobile=width<=390;
    const panels=[];
    for(let i=0;i<(mobile?count:1);i++){
     if(i)await page.locator('.dv-pager').click();
     for(const region of await grid.getByRole('region',{name:/tabela completa/}).all()){
      await region.focus();await region.evaluate(e=>e.scrollTo({left:e.scrollWidth,top:e.scrollHeight,behavior:'instant'}));
      const measured=await region.evaluate(e=>{const rgba=s=>{const a=s.match(/[\d.]+/g)?.map(Number);return a&&a.length>=3?[...a.slice(0,3),a[3]??1]:[0,0,0,0]},over=(a,b)=>a.slice(0,3).map((c,i)=>c*a[3]+b[i]*(1-a[3])),lum=a=>a.map(v=>{const c=v/255;return c<=.04045?c/12.92:((c+.055)/1.055)**2.4}).reduce((n,c,i)=>n+c*[.2126,.7152,.0722][i],0);const contrasts=[...e.querySelectorAll('td')].filter(c=>c.textContent.trim()).map(c=>{let bg=[255,255,255];const chain=[];for(let p=c;p;p=p.parentElement)chain.push(p);for(const p of chain.reverse())bg=over(rgba(getComputedStyle(p).backgroundColor),bg);const fg=over(rgba(getComputedStyle(c).color),bg),a=lum(fg),b=lum(bg);return(Math.max(a,b)+.05)/(Math.min(a,b)+.05)});const r=e.getBoundingClientRect(),last=e.querySelector('tbody tr:last-child td:last-child')?.getBoundingClientRect(),headers=[...e.querySelectorAll('thead th')];return{minTextContrast:Math.min(...contrasts),contrastSamples:contrasts.length,columns:headers.length,visibleColumns:headers.filter(h=>getComputedStyle(h).display!=='none').length,clientHeight:e.clientHeight,scrollHeight:e.scrollHeight,last:last?{left:last.left,right:last.right,top:last.top,bottom:last.bottom,width:last.width}:null,region:{left:r.left,right:r.right,top:r.top,bottom:r.bottom}}});
      assert.equal(measured.columns,measured.visibleColumns);assert.ok(measured.minTextContrast>=4.5,'table text contrast '+measured.minTextContrast);assert.ok(measured.clientHeight>20,'table has no usable scrolling area');if(measured.last){assert.ok(measured.last.right<=measured.region.right+2,'last column clipped');assert.ok(measured.last.bottom<=measured.region.bottom+2,'last row clipped');assert.ok(measured.last.top>=measured.region.top-2,'last row out of viewport');}panels.push(measured);
     }
    }
    const outside=await page.evaluate(()=>({width:innerWidth,height:innerHeight,scrollWidth:document.documentElement.scrollWidth,scrollHeight:document.documentElement.scrollHeight}));assert.ok(outside.scrollWidth<=width+1&&outside.scrollHeight<=height+1,JSON.stringify(outside));
    if([1440,390,320].includes(width))await page.screenshot({path:dir+`/${theme}-${width}-${view}-${name.replaceAll(' ','-')}.png`});
    pages.push({name,panels,outerFits:true});
   }
   return{viewport:{width,height,method:'Chromium emulated CSS viewport'},headers,headerCompared:Boolean(baseline),art,pages};
  });
 }
 for(const theme of ['dark','light'])for(const width of [1440,320])for(const view of views)await run(`dialogs-${theme}-${width}-${view}`,async()=>{
  await page.setViewportSize({width,height:width===320?568:900});await go(theme);await page.getByRole('button',{name:view,exact:true}).click();await ready();
  const out=[];
  for(const label of ['Detalhes da análise','Filtros']){const trigger=page.getByRole('button',{name:label,exact:true});await trigger.focus();await trigger.press('Enter');const dialog=page.getByRole('dialog').last();await dialog.waitFor();await page.waitForFunction(()=>document.querySelector('[role="dialog"]')?.contains(document.activeElement));
   const controls=dialog.locator('button:visible:not([disabled]),input:visible:not([disabled]),select:visible:not([disabled]),[tabindex="0"]:visible');await controls.last().focus();await page.keyboard.press('Tab');assert.ok(await dialog.evaluate(e=>e.contains(document.activeElement)));await controls.first().focus();await page.keyboard.press('Shift+Tab');assert.ok(await dialog.evaluate(e=>e.contains(document.activeElement)));
   await controls.last().scrollIntoViewIfNeeded();await reachable(controls.last());await page.screenshot({path:dir+`/modal-${theme}-${width}-${view}-${label}.png`});await page.keyboard.press('Escape');await dialog.waitFor({state:'hidden'});assert.equal(await trigger.evaluate(e=>e===document.activeElement),true);out.push({label,focusTrapped:true,escapeReturnsFocus:true,lastActionReachable:true});
  }return out;
 });
 await run('ABC-local-CSV-clear-vs-full-print',async()=>{
  await page.setViewportSize({width:1440,height:900});await go('light');await page.getByRole('button',{name:'Clientes',exact:true}).click();await ready();const before=await page.locator('.dv-kpis').innerText();const table=page.getByRole('region',{name:'Curva ABC: tabela completa com rolagem interna',exact:true});const all=await table.locator('tbody tr').allTextContents();
  const abc=page.getByRole('group',{name:'Filtrar tabela por classe ABC',exact:true});await abc.getByRole('button',{name:/Clientes A/}).click();assert.equal(await table.locator('tbody tr').count(),10);await abc.getByRole('button',{name:/Clientes B/}).click({modifiers:['Control']});assert.equal(await table.locator('tbody tr').count(),all.length);
  await abc.getByRole('button',{name:/Clientes B/}).click();const [download]=await Promise.all([page.waitForEvent('download'),page.getByRole('button',{name:'Exportar CSV de Curva ABC',exact:true}).click()]);const file=dir+'/ABC-B.csv';await download.saveAs(file);const csv=readFileSync(file,'utf8');assert.equal(csv.trim().split(/\r?\n/).length,all.length-10+1);assert.ok(csv.includes('CLIENTE ATIVO QA 65'));assert.ok(!csv.includes('"CLIENTE ATIVO QA 1"'));assert.equal(await page.locator('.dv-kpis').innerText(),before);assert.equal(await page.locator('.dv-original-print .analytics-table').first().locator('tbody tr').count(),all.length);await page.getByRole('button',{name:'Limpar filtros',exact:true}).click();assert.equal(await abc.locator('[aria-pressed="true"]').count(),0);assert.equal(await table.locator('tbody tr').count(),all.length);return{all:all.length,localCSVRows:all.length-10,kpisUnchanged:true,fullPrintRows:all.length};
 });
 await run('notifier-persistent-mount-readiness-pending-settings',async()=>{
  // A fresh browser context avoids inheriting a live poll lease from a previous
  // intentionally reloaded fixture page. Real queues/leases are never cleared.
  const previousPage=page,isolated=await page.context().browser().newContext({viewport:{width:390,height:844},locale:'pt-BR'});
  await isolated.route('**/*',r=>new URL(r.request().url()).origin===origin?r.continue():r.abort());
  await isolated.addInitScript(()=>localStorage.setItem('insightpad.theme','dark'));
  page=await isolated.newPage();page.on('pageerror',error);
  try {
  await page.goto(origin+'/qa/application.html#/');await page.evaluate(()=>document.fonts.ready);await page.locator('.qa-controls').evaluate(e=>e.style.visibility='hidden');
  const soundKey='insightpad:channel-order-sound';
  const trigger=()=>page.getByRole('button',{name:'Configurar e testar alertas de pedidos',exact:true});await trigger().waitFor();await trigger().click();let dialog=page.getByRole('dialog',{name:'Testar alertas',exact:true});await dialog.getByRole('button',{name:'Desativar',exact:true}).first().click();await dialog.getByRole('button',{name:'Concluir',exact:true}).click();
  const pollBefore=await page.evaluate(()=>localStorage.getItem('insightpad:channel-order-poll-lease'));const routes=['/modulos/dashboards','/dashboards/operacional','/estoque','/vendas/frente-de-caixa','/cadastros/produtos','/integracoes/canais/pedidos'];const positions=[];
  for(const route of routes){await page.evaluate(route=>{location.hash=route},route);await page.locator('.catalog-loader').first().waitFor({state:'hidden'});await trigger().waitFor();await page.waitForTimeout(120);await page.locator('.catalog-loader').first().waitFor({state:'hidden'});assert.equal(await trigger().count(),1);try{await reachable(trigger())}catch(error){throw Error(route+': '+error.message+' '+JSON.stringify(await trigger().evaluate(e=>{const r=e.getBoundingClientRect();return{rect:r.toJSON(),hit:document.elementFromPoint(r.x+r.width/2,r.y+r.height/2)?.outerHTML.slice(0,180),inert:!!e.closest("[inert]"),parent:e.parentElement.parentElement.className}})))}positions.push({route,parent:await trigger().evaluate(e=>e.parentElement.parentElement.className)});}
  await trigger().click();dialog=page.getByRole('dialog',{name:'Testar alertas',exact:true});assert.ok(await dialog.getByText('Desativado neste navegador',{exact:true}).isVisible());
  await page.evaluate(()=>{window.__insightpadQa.state.pendingChannelOrders=[{id:'qa-pending-dashboard',alertKind:'RECEPTION',displayCode:'QA-DASH',provider:'IFOOD',catalogProfile:'UNVERIFIED',authorizationStatus:'PENDING',branchName:'MATRIZ QA',customerName:'CLIENTE SINTÉTICO',totalCents:'1200',receivedAt:new Date().toISOString(),version:7,items:[{name:'PRODUTO SINTÉTICO',quantity:1}]}]});await dialog.getByRole('button',{name:'Verificar pedidos agora',exact:true}).click();const order=page.getByRole('alertdialog',{name:'Novo pedido recebido',exact:true});await order.waitFor();assert.ok(await order.getByText('Pedido #QA-DASH',{exact:true}).isVisible());assert.equal(await order.getByRole('button',{name:'Aceitar pedido',exact:true}).isDisabled(),true);assert.equal(await page.getByRole('alertdialog').count(),1);await page.screenshot({path:dir+'/pending-order-390.png'});await order.getByRole('button',{name:'Dispensar alerta',exact:true}).click();await order.waitFor({state:'hidden'});const settings=page.getByRole('dialog',{name:'Testar alertas',exact:true});if(await settings.count())await settings.getByRole('button',{name:'Concluir',exact:true}).click();await trigger().waitFor();await reachable(trigger());const result=await page.evaluate(()=>({mutations:window.__insightpadQa.state.requests.filter(r=>r.name==='AcknowledgeSalesChannelOrderAlert'),poll:localStorage.getItem('insightpad:channel-order-poll-lease')}));assert.ok(pollBefore&&result.poll);assert.equal(pollBefore.split(':')[0],result.poll.split(':')[0],'notifier remounted on route change');assert.equal(await page.evaluate(key=>localStorage.getItem(key),soundKey),'off');assert.equal(result.mutations.length,1);assert.equal(result.mutations[0].variables.version,7);return{positions,pollBefore,pollAfter:result.poll,soundPreferencePreserved:true,syntheticAcknowledgement:result.mutations[0],remoteCalls:false,soundOutputAudiblyVerified:false,soundPreferenceKey:soundKey};
  } finally {page.off('pageerror',error);await isolated.close();page=previousPage;}
 });
 await run('reduced-motion',async()=>{await go('dark');await ready();await page.emulateMedia({reducedMotion:'reduce'});assert.equal(await page.locator('.dv-kpi').first().evaluate(e=>getComputedStyle(e).animationName),'none');await page.emulateMedia({reducedMotion:'no-preference'});return{animation:'none'};});
 assert.deepEqual(errors,[],'uncaught browser errors');
 }finally{page.off('pageerror',error);await page.emulateMedia({media:'screen',reducedMotion:'no-preference'});writeFileSync(dir+'/results.json',JSON.stringify({sha,browser:page.context().browser().version(),filter,auth:'memory fixtures, no real authenticated session',api:'existing isolated boundary, all external requests blocked',physicalDevice:false,nativeZoom:false,cases,errors},null,2));}
 assert.equal(cases.filter(c=>c.result==='failed').length,0, 'Dashboard v3 regressions: '+cases.filter(c=>c.result==='failed').map(c=>c.name).join(', '));
}
