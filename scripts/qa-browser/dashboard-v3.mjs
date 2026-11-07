import assert from 'node:assert/strict';
import {mkdirSync,readFileSync,writeFileSync} from 'node:fs';

// Actual React controllers with the existing isolated API boundary. No remote access.
export async function dashboardV3({page,output,sha,origin='http://127.0.0.1:4174',filter=null}){
 const dir=output+'/dashboard-v3';mkdirSync(dir,{recursive:true});const cases=[],errors=[];
 const error=e=>errors.push(e.message);page.on('pageerror',error);
 if(process.env.GITHUB_ACTIONS&&filter)throw Error('CI must run all dashboard v3 cases');
 const run=async(name,fn)=>{if(filter&&!name.includes(filter))return;try{cases.push({name,result:'passed',observed:await fn()});console.log('Dashboard v3:',name,'passed')}catch(e){cases.push({name,result:'failed',error:String(e.stack).slice(0,1700)});console.error('Dashboard v3:',name,e.message)}};
 const views=['Vendas','Canais','Estoque','Clientes','Categorias'];
 const subpages=[['Visão geral','Produtos','Comparativos'],['Visão geral','Lojas e taxas','Pagamentos e produtos'],['Visão geral','Produtos'],['Visão geral','Relacionamento','Regiões'],['Categorias','Subcategorias']];
 const sizes=[[1920,1080],[1440,900],[1280,800],[1366,768],[1366,650],[1024,600],[1024,480],[1072,677],[1286,770],[390,844],[320,568]];
 const go=async(theme,route='/dashboards/operacional')=>{await page.goto(origin+'/qa/application.html#'+route);await page.evaluate(t=>localStorage.setItem('insightpad.theme',t),theme);await page.reload();await page.evaluate(()=>document.fonts.ready);await page.locator('.qa-controls').evaluate(e=>{e.open=false;e.style.visibility='hidden'});};
 const ready=async()=>{await page.locator('.catalog-loader').first().waitFor({state:'hidden'});await page.locator('.dv-kpi').first().waitFor();await page.evaluate(()=>new Promise(resolve=>requestAnimationFrame(()=>requestAnimationFrame(resolve))));};
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
   assert.equal(await page.locator('.channel-alert-readiness,.channel-alert-slot,[data-channel-alert-slot],.ip-bottom').count(),0);
   const top=await page.locator('.dv-head').evaluate(e=>({display:getComputedStyle(e).display,height:e.getBoundingClientRect().height}));assert.equal(top.display,'grid');assert.equal(Math.round(top.height),width<=900?78:height<=740?46:52);
   for(const control of await page.locator('.dv-actions button').all())await reachable(control);
   const contentWidth=await page.locator('.ip-dashboard-v3').evaluate(e=>e.clientWidth-parseFloat(getComputedStyle(e).paddingLeft)-parseFloat(getComputedStyle(e).paddingRight));
   const fit=await page.locator('.ip-dashboard-v3').evaluate(e=>({bottom:e.getBoundingClientRect().bottom,workspace:e.querySelector('.dv-workspace').getBoundingClientRect().bottom,padding:parseFloat(getComputedStyle(e).paddingBottom)}));assert.ok(Math.abs(fit.bottom-fit.padding-fit.workspace)<2,'workspace must use the full content slot without an empty grid row');

   const art=await page.locator('.dv-art').evaluateAll(es=>es.filter(e=>e.getBoundingClientRect().width>0).map(e=>({display:getComputedStyle(e).display,src:e.querySelector('img').currentSrc,loaded:e.querySelector('img').complete&&e.querySelector('img').naturalWidth>1})));
   if(width<=390)assert.equal(art.length,0);else if(width>=1280)assert.ok(art.length>0&&art.every(a=>a.loaded));
   const pages=[];
   for(const name of subpages[v]){
    await page.locator('.dv-subnav').getByRole('button',{name,exact:true}).click();
    const grid=page.locator('.dv-panel-grid[data-screen-active="true"]');const count=await grid.locator('.dv-panel-cell').count(),mobile=await page.locator('.dv-pager').isVisible();
    const panels=[];
    const displayed=await grid.locator('.dv-panel-cell:visible').count();assert.equal(displayed,contentWidth<=960?1:count);
    const submenu=page.locator('.dv-subnav button').last();await submenu.scrollIntoViewIfNeeded();await reachable(submenu);
    const requests=()=>page.evaluate(()=>window.__insightpadQa.state.requests.filter(r=>/Dashboard$/i.test(r.name)).length);
    for(let i=0;i<(mobile?count:1);i++){
     if(i){const beforeRequests=await requests();await page.locator('.dv-pager').click();assert.equal(await requests(),beforeRequests,'panel switch must not reload data');}
     await page.evaluate(()=>new Promise(resolve=>requestAnimationFrame(()=>requestAnimationFrame(resolve))));
     for(const graphic of await grid.locator('.dv-donut-graphic:visible').all()){
      const measured=await graphic.evaluate(e=>{const svg=e.querySelector('svg').getBoundingClientRect(),strong=e.querySelector('strong'),value=strong.getBoundingClientRect(),range=document.createRange();range.selectNodeContents(strong);return{compact:e.classList.contains('is-compact'),diameter:Math.min(svg.width,svg.height),textWidth:range.getBoundingClientRect().width,font:parseFloat(getComputedStyle(strong).fontSize),valueTop:value.top,svgBottom:svg.bottom}});
      if(measured.compact)assert.ok(measured.valueTop>=measured.svgBottom-1,'compact total must sit below the ring');else {assert.ok(measured.font>=12&&measured.font<=21);assert.ok(measured.textWidth<=measured.diameter*.54+2,'center total overlaps ring '+JSON.stringify(measured));}
     }
     for(const svg of await grid.locator('.dv-chart>svg:visible').all()){
      const plot=await svg.evaluate(e=>({width:e.getBoundingClientRect().width,viewWidth:e.viewBox.baseVal.width,height:e.getBoundingClientRect().height,font:parseFloat(getComputedStyle(e.querySelector('text')).fontSize)}));assert.ok(Math.abs(plot.width-plot.viewWidth)<1,'plot labels must use CSS-pixel geometry');assert.ok(plot.height>=150&&plot.font>=11);
     }
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
 for(const theme of ['dark','light'])for(const [width,height] of sizes)for(const view of views)await run(`dialogs-${theme}-${width}-${view}`,async()=>{
  await page.setViewportSize({width,height});await go(theme);await page.getByRole('button',{name:view,exact:true}).click();await ready();
  const out=[];
  for(const label of ['Detalhes da análise','Filtros']){const trigger=page.getByRole('button',{name:label,exact:true});await trigger.focus();await trigger.press('Enter');const dialog=page.getByRole('dialog').last();await dialog.waitFor();assert.equal(await dialog.getAttribute('data-theme'),theme);assert.equal(await dialog.evaluate(e=>getComputedStyle(e).backgroundColor),theme==='dark'?'rgb(24, 30, 37)':'rgb(255, 255, 255)');await page.waitForFunction(()=>document.querySelector('[role="dialog"]')?.contains(document.activeElement));
   const controls=dialog.locator('button:visible:not([disabled]),input:visible:not([disabled]),select:visible:not([disabled]),[tabindex="0"]:visible');await controls.last().focus();await page.keyboard.press('Tab');assert.ok(await dialog.evaluate(e=>e.contains(document.activeElement)));await controls.first().focus();await page.keyboard.press('Shift+Tab');assert.ok(await dialog.evaluate(e=>e.contains(document.activeElement)));
   await controls.last().scrollIntoViewIfNeeded();await reachable(controls.last());await page.screenshot({path:dir+`/modal-${theme}-${width}-${view}-${label}.png`});await page.keyboard.press('Escape');await dialog.waitFor({state:'hidden'});assert.equal(await trigger.evaluate(e=>e===document.activeElement),true);out.push({label,focusTrapped:true,escapeReturnsFocus:true,lastActionReachable:true});
  }return out;
 });
 await run('ABC-local-CSV-clear-vs-full-print',async()=>{
  await page.setViewportSize({width:1440,height:900});await go('light');await page.getByRole('button',{name:'Clientes',exact:true}).click();await ready();const before=await page.locator('.dv-kpis').innerText();const table=page.getByRole('region',{name:'Curva ABC: tabela completa com rolagem interna',exact:true});const all=await table.locator('tbody tr').allTextContents();
  const abc=page.getByRole('group',{name:'Filtrar tabela por classe ABC',exact:true});await abc.getByRole('button',{name:/Clientes A/}).click();assert.equal(await table.locator('tbody tr').count(),10);await abc.getByRole('button',{name:/Clientes B/}).click({modifiers:['Control']});assert.equal(await table.locator('tbody tr').count(),all.length);
  await abc.getByRole('button',{name:/Clientes B/}).click();const [download]=await Promise.all([page.waitForEvent('download'),page.getByRole('button',{name:'Exportar CSV de Curva ABC',exact:true}).click()]);const file=dir+'/ABC-B.csv';await download.saveAs(file);const csv=readFileSync(file,'utf8');assert.equal(csv.trim().split(/\r?\n/).length,all.length-10+1);assert.ok(csv.includes('CLIENTE ATIVO QA 65'));assert.ok(!csv.includes('"CLIENTE ATIVO QA 1"'));assert.equal(await page.locator('.dv-kpis').innerText(),before);assert.equal(await page.locator('.dv-original-print .analytics-table').first().locator('tbody tr').count(),all.length);await page.getByRole('button',{name:'Limpar filtros',exact:true}).click();assert.equal(await abc.locator('[aria-pressed="true"]').count(),0);assert.equal(await table.locator('tbody tr').count(),all.length);return{all:all.length,localCSVRows:all.length-10,kpisUnchanged:true,fullPrintRows:all.length};
 });
 await run('notifier-persistent-mount-without-retired-footer-ui',async()=>{
  // A fresh browser context avoids inheriting a live poll lease from a previous
  // intentionally reloaded fixture page. Real queues/leases are never cleared.
  const previousPage=page,isolated=await page.context().browser().newContext({viewport:{width:390,height:844},locale:'pt-BR'});
  await isolated.route('**/*',r=>new URL(r.request().url()).origin===origin?r.continue():r.abort());
  await isolated.addInitScript(()=>{localStorage.setItem('insightpad.theme','dark');localStorage.setItem('insightpad:channel-order-sound','off')});
  page=await isolated.newPage();page.on('pageerror',error);
  try {
  await page.goto(origin+'/qa/application.html#/');await page.evaluate(()=>document.fonts.ready);await page.locator('.qa-controls').evaluate(e=>e.style.visibility='hidden');
  const soundKey='insightpad:channel-order-sound';
  const retired=()=>page.locator('.channel-alert-readiness,.channel-alert-slot,[data-channel-alert-slot],.channel-alert-settings');assert.equal(await retired().count(),0);await page.waitForFunction(()=>localStorage.getItem('insightpad:channel-order-poll-lease'));
  const pollBefore=await page.evaluate(()=>localStorage.getItem('insightpad:channel-order-poll-lease'));const routes=['/modulos/dashboards','/dashboards/operacional','/estoque','/vendas/frente-de-caixa','/cadastros/produtos','/integracoes/canais/pedidos'];const positions=[];
  for(const route of routes){await page.evaluate(route=>{location.hash=route},route);await page.locator('.catalog-loader').first().waitFor({state:'hidden'});assert.equal(await retired().count(),0);positions.push({route,retiredFooterUiAbsent:true});}
  await page.evaluate(()=>{window.__insightpadQa.state.pendingChannelOrders=[{id:'qa-pending-dashboard',alertKind:'RECEPTION',displayCode:'QA-DASH',provider:'IFOOD',catalogProfile:'UNVERIFIED',authorizationStatus:'PENDING',branchName:'MATRIZ QA',customerName:'CLIENTE SINTÉTICO',totalCents:'1200',receivedAt:new Date().toISOString(),version:7,items:[{name:'PRODUTO SINTÉTICO',quantity:1}]}]});await page.evaluate(()=>document.dispatchEvent(new Event('visibilitychange')));const order=page.getByRole('alertdialog',{name:'Novo pedido recebido',exact:true});await order.waitFor();assert.ok(await order.getByText('Pedido #QA-DASH',{exact:true}).isVisible());assert.equal(await order.getByRole('button',{name:'Aceitar pedido',exact:true}).isDisabled(),true);assert.equal(await page.getByRole('alertdialog').count(),1);await page.screenshot({path:dir+'/pending-order-390.png'});await order.getByRole('button',{name:'Dispensar alerta',exact:true}).click();await order.waitFor({state:'hidden'});assert.equal(await retired().count(),0);const result=await page.evaluate(()=>({mutations:window.__insightpadQa.state.requests.filter(r=>r.name==='AcknowledgeSalesChannelOrderAlert'),poll:localStorage.getItem('insightpad:channel-order-poll-lease')}));assert.ok(pollBefore&&result.poll);assert.equal(pollBefore.split(':')[0],result.poll.split(':')[0],'notifier remounted on route change');assert.equal(await page.evaluate(key=>localStorage.getItem(key),soundKey),'off');assert.equal(result.mutations.length,1);assert.equal(result.mutations[0].variables.version,7);return{positions,pollBefore,pollAfter:result.poll,soundPreferencePreserved:true,syntheticAcknowledgement:result.mutations[0],remoteCalls:false,soundOutputAudiblyVerified:false,soundPreferenceKey:soundKey};
  } finally {page.off('pageerror',error);await isolated.close();page=previousPage;}
 });
 for(const theme of ['dark','light'])await run('donut-font-converges-'+theme,async()=>{
  await page.setViewportSize({width:1440,height:900});await go(theme);await ready();const graphic=page.locator('.dv-donut-graphic:visible').first();
  const frames=await graphic.evaluate(async e=>{const frames=[];for(let i=0;i<30;i++){await new Promise(requestAnimationFrame);const value=e.querySelector('strong'),range=document.createRange();range.selectNodeContents(value);const svg=e.querySelector('svg').getBoundingClientRect();frames.push({font:getComputedStyle(value).fontSize,width:[...range.getClientRects()].reduce((n,r)=>n+r.width,0),diameter:Math.min(svg.width,svg.height),compact:e.classList.contains('is-compact')})}return frames});
  const stable=frames.slice(-12);assert.equal(new Set(stable.map(frame=>frame.font)).size,1,'donut font must converge, not react to its own font changes forever');assert.ok(stable.every(frame=>frame.compact||frame.width<=frame.diameter*.54+2));return{frames,stableFrames:stable.length};
 });
 await run('reduced-motion',async()=>{await go('dark');await ready();await page.emulateMedia({reducedMotion:'reduce'});assert.equal(await page.locator('.dv-kpi').first().evaluate(e=>getComputedStyle(e).animationName),'none');await page.emulateMedia({reducedMotion:'no-preference'});return{animation:'none'};});
 assert.deepEqual(errors,[],'uncaught browser errors');
 }finally{page.off('pageerror',error);await page.emulateMedia({media:'screen',reducedMotion:'no-preference'});writeFileSync(dir+'/results.json',JSON.stringify({sha,browser:page.context().browser().version(),filter,auth:'memory fixtures, no real authenticated session',api:'existing isolated boundary, all external requests blocked',physicalDevice:false,nativeZoom:false,cases,errors},null,2));}
 assert.equal(cases.filter(c=>c.result==='failed').length,0, 'Dashboard v3 regressions: '+cases.filter(c=>c.result==='failed').map(c=>c.name).join(', '));
}
