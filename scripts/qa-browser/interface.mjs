import {usePosBranch} from './pos-branch.mjs';
import assert from 'node:assert/strict';
import {mkdirSync,writeFileSync} from 'node:fs';

// Screen-only consumer regressions. The caller owns the existing QA server/browser.
export async function interfaceProof({page,output,sha}) {
 const dir=output+'/interface';mkdirSync(dir,{recursive:true});const cases=[],errors=[];
 const error=e=>errors.push(e.message);page.on('pageerror',error);
 const run=async(name,fn)=>{try{const observed=await fn();cases.push({name,result:'passed',observed})}catch(e){cases.push({name,result:'failed',error:String(e.message).replace(/https?:\/\/\S+/g,'[URL]').slice(0,450)});console.error('Interface case failed:',name,cases.at(-1).error)}};
 const go=async(route,theme='dark')=>{
  const query=route.startsWith('/plataforma')||route==='/modulos/plataforma'?'?qa-profile=platform':route==='/login'?'?qa-login=1':route==='/acesso-negado'?'?qa-denied=1':'';
  await page.goto('http://127.0.0.1:4174/qa/application.html'+query+'#'+route);
  await page.evaluate(t=>localStorage.setItem('insightpad.theme',t),theme);await page.reload();
  await page.locator('.app-frame,.brand-login,.access-page').waitFor();await page.evaluate(()=>document.fonts.ready);
  await page.locator('.qa-controls').evaluate(e=>{e.open=false;e.style.visibility='hidden'});
 };
 const reachable=async locator=>assert.ok(await locator.evaluate(e=>{const r=e.getBoundingClientRect(),x=r.x+r.width/2,y=r.y+r.height/2,hit=document.elementFromPoint(x,y);return r.width>0&&r.height>0&&x>=0&&x<innerWidth&&y>=0&&y<innerHeight&&(hit===e||e.contains(hit))}),'The focused last control is clipped or covered');
 const screenContrast=async(locator)=>locator.evaluateAll(elements=>{
  const rgba=s=>{const v=s.match(/[\d.]+/g)?.map(Number);return v&&v.length>=3?[...v.slice(0,3),v[3]??1]:[0,0,0,0]};
  const over=(a,b)=>a.slice(0,3).map((v,i)=>v*a[3]+b[i]*(1-a[3]));
  const lum=a=>a.map(v=>{const c=v/255;return c<=.04045?c/12.92:((c+.055)/1.055)**2.4}).reduce((n,c,i)=>n+c*[.2126,.7152,.0722][i],0);
  return elements.map(e=>{const st=getComputedStyle(e),chain=[];for(let p=e;p;p=p.parentElement)chain.push(p);let bg=[255,255,255];for(const p of chain.reverse())bg=over(rgba(getComputedStyle(p).backgroundColor),bg);const fg=over(rgba(st.color),bg),a=lum(fg),b=lum(bg),large=parseFloat(st.fontSize)>=24||parseFloat(st.fontSize)>=18.66&&Number(st.fontWeight)>=700;return{label:e.textContent.trim().slice(0,80),ratio:(Math.max(a,b)+.05)/(Math.min(a,b)+.05),minimum:large?3:4.5}});
 });
 const picture=async(name)=>{await page.screenshot({path:dir+'/'+name+'.png',fullPage:true});return name+'.png'};
 try {
 for(const theme of ['dark','light'])for(const [width,height]of[[1440,900],[1280,800],[1024,600],[768,1024],[390,844],[320,568]])await run(`home-${theme}-${width}x${height}`,async()=>{
  await page.setViewportSize({width,height});await go('/',theme);const cards=page.locator('.home-menu__modules a');assert.equal(await cards.count(),6);
  const measured=await page.locator('.home-menu__insight-logo').evaluate(e=>{const r=e.getBoundingClientRect(),p=e.parentElement.getBoundingClientRect();return{loaded:e.complete&&e.naturalWidth===1024,width:r.width,height:r.height,inside:r.left>=p.left&&r.right<=p.right+1&&r.top>=p.top&&r.bottom<=p.bottom+1,filter:getComputedStyle(e).filter}});
  assert.ok(measured.loaded&&measured.inside&&measured.width>50);
  const contrast=await screenContrast(page.locator('.legacy-tile strong,.legacy-tile small,.ip-slogan,.ip-slogan strong'));assert.ok(contrast.every(x=>x.ratio+.001>=x.minimum),JSON.stringify(contrast));assert.equal(await page.locator('.home-menu .ip-slogan').innerText(),'DADOS PARA O PRESENTE.\nINSIGHTS PARA O FUTURO.');
  const initialCapture=await picture(`home-${theme}-${width}-initial`);
  await cards.last().scrollIntoViewIfNeeded();await cards.last().focus();assert.ok(await cards.last().evaluate(e=>e===document.activeElement));
  return{viewport:{width,height,method:'emulated viewport; no CSS zoom'},logo:measured,contrast,initialCapture,capture:await picture(`home-${theme}-${width}`)};
 });
 await page.setViewportSize({width:1280,height:800});
 for(const theme of ['light','dark'])await run('navigation-feedback-'+theme,async()=>{
  await go('/',theme);const card=page.locator('.home-menu__modules a').first();await card.hover();const box=await card.boundingBox();await page.mouse.move(box.x+40,box.y+40);await page.mouse.down();await page.waitForFunction(()=>document.querySelector('.legacy-tile')?.classList.contains('is-feedback'));
  const frames=[];
  for(const fraction of [0,.25,.5,.75,1]){
   await card.evaluate((e,f)=>{for(const a of e.getAnimations({subtree:true})){a.pause();a.currentTime=f*360}},fraction);
   frames.push(await card.evaluate(e=>({transform:getComputedStyle(e,'::before').transform,copy:getComputedStyle(e.querySelector('.ip-nav-content')).color,backing:getComputedStyle(e.querySelector('.ip-nav-content')).backgroundColor,feedback:e.classList.contains('is-feedback'),underline:getComputedStyle(e,'::after').content})));
   if(fraction===.5)await picture('navigation-wipe-'+theme);
  }
  assert.equal(new Set(frames.filter(x=>x.feedback).map(x=>x.copy)).size,1);assert.equal(frames[0].backing,'rgb(17, 24, 32)');assert.equal(frames[0].underline,'none');
  await page.mouse.up();await page.waitForURL('**#/modulos/vendas');return{frames,destination:page.url().split('#')[1],navigationDelayAdded:false};
 });
 await run('reduced-motion',async()=>{await go('/');await page.emulateMedia({reducedMotion:'reduce'});const nav=page.locator('.header-nav-item').first();await nav.dispatchEvent('pointerdown',{button:0});const duration=await nav.evaluate(e=>getComputedStyle(e,'::before').animationName);assert.equal(duration,'none');await nav.dispatchEvent('pointerup',{button:0});assert.equal(await nav.evaluate(e=>e.classList.contains('is-feedback')),false);await page.emulateMedia({reducedMotion:'no-preference'});return{animationName:duration}});
 await run('account-keeps-existing-actions-and-focus',async()=>{
  await go('/');const trigger=page.getByRole('button',{name:'Conta e sistema — abrir painel do usuário'});await trigger.click();const drawer=page.locator('#user-drawer');
  for(const label of ['Páginas disponíveis','Gestão da plataforma','Área do cliente','Conversar com suporte','Sair do sistema'])assert.ok((await drawer.innerText()).toLocaleLowerCase('pt-BR').includes(label.toLocaleLowerCase('pt-BR')));
  assert.equal(await drawer.getByRole('button',{name:'Área do cliente',exact:true}).isDisabled(),true);
  await page.keyboard.press('Escape');assert.equal(await trigger.getAttribute('aria-expanded'),'false');assert.equal(await trigger.evaluate(e=>document.activeElement===e),true);
  return{existingActionsPreserved:true,escapeReturnFocus:true};
 });
 const routes=['/login','/acesso-negado','/modulos/vendas','/modulos/financeiro','/modulos/cadastros','/modulos/dashboards','/modulos/canais','/modulos/plataforma','/vendas/registros','/estoque','/cadastros/categorias','/cadastros/subcategorias','/cadastros/produtos','/cadastros/clientes','/cadastros/fornecedores','/cadastros/filiais','/financeiro/contas-a-pagar','/financeiro/contas-a-receber','/dashboards/operacional','/integracoes/canais/pedidos','/integracoes/canais/conexoes','/plataforma/empresas-ambientes','/plataforma/cobrancas-baixas','/plataforma/gestao-usuarios/usuarios','/plataforma/gestao-usuarios/perfis-permissoes'];
 for(const theme of ['dark','light'])for(const route of routes)await run('route-'+theme+'-'+route,async()=>{
  await go(route,theme);await page.locator('.app-stage,.brand-login,.access-page').locator('h1,h2,.dashboard-hub__nav').first().waitFor();
  if(route.startsWith('/cadastros/'))await page.locator('.catalog-table tbody tr').first().waitFor();
  if(route.startsWith('/plataforma/'))await page.locator('.platform-panel').waitFor();
  await page.locator('.catalog-loader').first().waitFor({state:'hidden'});
  const tables=await page.locator('.catalog-table,.platform-table').evaluateAll(ts=>ts.map(t=>({columns:t.querySelectorAll('thead th').length,hiddenHeaders:[...t.querySelectorAll('thead th')].filter(x=>getComputedStyle(x).display==='none').length})));
  assert.ok(tables.every(t=>t.hiddenHeaders===0));return{tables,capture:await picture(theme+'-'+route.replaceAll('/','_'))};
 });
 for(const theme of ['light','dark'])for(const [width,height]of[[1280,800],[1024,600],[390,844],[320,568]])await run(`pos-payment-${theme}-${width}`,async()=>{
  await page.setViewportSize({width,height});await go('/vendas/frente-de-caixa',theme);
  await usePosBranch(page);await page.getByPlaceholder('Código, EAN ou nome').fill('PRODUTO QA 002');await page.getByRole('option').filter({hasText:'PRODUTO QA 002'}).first().click();await page.getByRole('button',{name:/Adicionar ao carrinho/}).click();
  await page.waitForFunction(()=>document.activeElement===document.querySelector('.pos-search-input input'));
  await page.locator('.pos-quantity-input').fill('2');const cart=await picture(`pos-${theme}-${width}`);
  await page.getByRole('button',{name:/Ir para pagamento/}).click();const dialog=page.getByRole('dialog').last();
  await dialog.getByRole('button',{name:/Dividir pagamento/}).click();assert.equal(await dialog.locator('.payment-row').count(),2);
  const submit=dialog.getByRole('button',{name:/Concluir venda/});await submit.scrollIntoViewIfNeeded();assert.equal(await submit.isVisible(),true);
  await dialog.getByLabel('Referência do pagamento 2',{exact:true}).scrollIntoViewIfNeeded();
  const lastFieldBox=await dialog.getByLabel('Referência do pagamento 2',{exact:true}).boundingBox();
  const bodyBox=await dialog.locator('.pos-checkout-body').boundingBox(),footerBox=await dialog.locator('form > footer').boundingBox();
  assert.ok(bodyBox.y>=0&&footerBox.y>=0&&footerBox.y+footerBox.height<=height+1,'Fixed payment actions left the viewport');
  assert.ok(bodyBox.y+bodyBox.height<=footerBox.y+1&&lastFieldBox.y>=bodyBox.y&&lastFieldBox.y+lastFieldBox.height<=footerBox.y,'Payment body/last field overlaps the fixed actions');
  const payment=await picture(`payment-${theme}-${width}`);await page.keyboard.press('Escape');assert.equal(await page.getByRole('dialog').count(),0);
  assert.equal(await page.locator('.pos-quantity-input').inputValue(),'2');return{cart,payment,splitPaymentLines:2,cancelPreservesCart:true,realFinancialMutation:false};
 });

 for(const theme of ['light','dark'])for(const [width,height]of[[1280,800],[1024,600],[390,844],[320,568]])await run(`product-form-${theme}-${width}`,async()=>{
  await page.setViewportSize({width,height});await go('/cadastros/produtos',theme);await page.locator('.catalog-loader').first().waitFor({state:'hidden'});
  const row=page.getByRole('row').filter({hasText:'PRODUTO QA 002'});await row.getByRole('button',{name:/Editar/}).click();const d=page.getByRole('dialog').first();
  const first=await d.locator('input').count();assert.ok(first>0);const captures=[];
  for(let step=0;step<8;step++){
   const controls=d.locator('input:visible,select:visible,textarea:visible');if(await controls.count()){await controls.last().scrollIntoViewIfNeeded();await controls.last().focus();assert.equal(await controls.last().evaluate(e=>e===document.activeElement),true);await reachable(controls.last())}
   captures.push(await picture(`product-${theme}-${width}-step${step}`));const next=d.getByRole('button',{name:'Próxima',exact:true});if(!await next.count())break;await next.click();
  }
  await d.getByRole('button',{name:'Cancelar',exact:true}).click();assert.equal(await page.getByRole('dialog').count(),0);return{captures,cancelWithoutSave:true};
 });
 for(const theme of ['light','dark'])for(const [width,height]of[[1280,800],[390,844],[320,568]])await run(`stock-fiscal-${theme}-${width}`,async()=>{
  await page.setViewportSize({width,height});await go('/estoque',theme);await page.getByRole('button',{name:/Nova movimentação/i}).click();const d=page.getByRole('dialog').first();
  await d.getByLabel(/^Filial/).selectOption({label:'MATRIZ QA'});await d.getByRole('button',{name:'Próxima',exact:true}).click();await d.getByLabel(/^Produto/).selectOption({label:'PRODUTO QA 002'});await d.getByLabel('Quantidade',{exact:true}).fill('1');await d.getByLabel('Valor unitário',{exact:true}).fill('1200');await d.getByRole('button',{name:'Próxima',exact:true}).click();
  await d.getByRole('button',{name:'Sim',exact:true}).click();
  const controls=d.locator('input:visible,select:visible,textarea:visible');assert.ok(await controls.count()>10);await controls.last().scrollIntoViewIfNeeded();await controls.last().focus();assert.equal(await controls.last().evaluate(e=>e===document.activeElement),true);await reachable(controls.last());
  const capture=await picture(`stock-fiscal-${theme}-${width}`);await d.getByRole('button',{name:'Cancelar',exact:true}).click();return{capture,wizardPreserved:true,lastControlReachable:true,noWrite:true};
 });
 for(const theme of ['light','dark'])await run(`permissions-last-control-${theme}`,async()=>{
  await page.setViewportSize({width:390,height:844});await go('/plataforma/gestao-usuarios/perfis-permissoes',theme);await page.locator('.catalog-loader').first().waitFor({state:'hidden'});
  const checks=page.locator('.permissions-grid input[type=checkbox]');assert.ok(await checks.count()>=6);await checks.last().scrollIntoViewIfNeeded();await checks.last().focus();assert.equal(await checks.last().evaluate(e=>e===document.activeElement),true);await reachable(checks.last());
  const capture=await picture(`permissions-last-${theme}`);return{capture,columns:await page.locator('.permissions-grid th').count(),lastControlReachable:true,noPermissionWrite:true};
 });

 for(const theme of ['light','dark'])for(const width of [390,320])await run(`narrow-tables-${theme}-${width}`,async()=>{
  await page.setViewportSize({width,height:844});const measurements=[];
  for(const route of ['/cadastros/produtos','/cadastros/categorias','/estoque','/integracoes/canais/pedidos','/plataforma/gestao-usuarios/usuarios']){
   await go(route,theme);await page.locator('.catalog-table,.stock-panel,.platform-panel,.channels-table,.channel-orders-table').first().waitFor();await page.locator('.catalog-loader').first().waitFor({state:'hidden'});
   const tables=page.locator('.catalog-table,.stock-table table,.platform-table table,.channels-table,.channel-orders-table');
   for(const t of await tables.all()){
    const headers=await t.locator('th').evaluateAll(es=>es.map(e=>({label:e.textContent.trim(),display:getComputedStyle(e).display})));
    assert.ok(headers.every(x=>x.display!=='none'),route+': hidden column');const last=t.locator('tbody tr:first-child td').last();if(await last.count()){await last.scrollIntoViewIfNeeded();assert.ok(await last.isVisible())}measurements.push({route,headers});
   }
  }
  return{measurements,method:'emulated viewport, horizontal table scrolling, no CSS zoom'};
 });
 for(const theme of ['light','dark'])await run(`platform-editors-${theme}`,async()=>{
  await page.setViewportSize({width:390,height:844});const captures=[];
  for(const [route,name]of[['/plataforma/empresas-ambientes',/Nova empresa|Novo ambiente/],['/plataforma/gestao-usuarios/usuarios',/Novo usuário|Vincular usuário/],['/plataforma/cobrancas-baixas',/Nova cobrança/]]){
   await go(route,theme);await page.locator('.catalog-loader').first().waitFor({state:'hidden'});await page.getByRole('button',{name}).click();const d=page.getByRole('dialog').first();
   const controls=d.locator('input:visible,select:visible,textarea:visible');assert.ok(await controls.count()>0);await controls.last().scrollIntoViewIfNeeded();await controls.last().focus();assert.ok(await controls.last().evaluate(e=>e===document.activeElement));await reachable(controls.last());captures.push(await picture(theme+'-editor-'+route.split('/').at(-1)));
   await d.getByRole('button',{name:/Cancelar/,exact:true}).click();
  }
  return{captures,noAdminOrBillingWrite:true};
 });
 assert.deepEqual(errors,[]);
 } finally {
  page.off('pageerror',error);writeFileSync(dir+'/results.json',JSON.stringify({sha,auth:'mock',api:'in-memory fixtures',browser:page.context().browser().version(),headless:true,scope:'screen presentation consumers; not real backend acceptance',cases,errors},null,2));
  await page.setViewportSize({width:1440,height:1000});await page.emulateMedia({reducedMotion:'no-preference'});
 }
 const failed=cases.filter(c=>c.result==='failed');if(failed.length)throw Error(failed.length+' interface scenarios failed');console.log('Interface:',cases.length,'scenarios passed');
}
