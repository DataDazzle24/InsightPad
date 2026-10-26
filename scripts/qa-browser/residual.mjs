import assert from 'node:assert/strict';
import {readFileSync,writeFileSync} from 'node:fs';
export async function residual({page,output,sha,run,go,panel,wait,screenshot}){
 const measurements=[];
 const theme=async value=>page.evaluate(value=>document.documentElement.dataset.theme=value,value);
 const focused=locator=>locator.evaluate(e=>e.contains(document.activeElement));
 const cycle=async dialog=>{
  const controls=dialog.locator('button:not([disabled]),a[href],input:not([disabled]),select:not([disabled]),textarea:not([disabled]),[tabindex="0"]').filter({visible:true});
  const first=controls.first(),last=controls.last();await first.focus();await page.keyboard.press('Shift+Tab');assert.equal(await last.evaluate(e=>e===document.activeElement),true,JSON.stringify(await dialog.evaluate(e=>({active:document.activeElement?.outerHTML,controls:[...e.querySelectorAll('button,input,select')].map(n=>({text:n.textContent,disabled:n.disabled}))}))));
  await page.keyboard.press('Tab');assert.equal(await first.evaluate(e=>e===document.activeElement),true);
  for(let i=0;i<await controls.count()+2;i++){await page.keyboard.press('Tab');assert.equal(await focused(dialog),true)}
 };
 const inspect=()=>page.evaluate(()=>window.__insightpadQa.inspect());
 const measure=async(locator,label)=>{
  await locator.evaluate(async e=>{await Promise.all(e.getAnimations().filter(a=>a.effect?.getComputedTiming().iterations!==Infinity).map(a=>a.finished.catch(()=>{})))})
  const colors=await locator.evaluate(e=>{
   const parse=v=>{const a=v.match(/[\d.]+/g).map(Number);return [a[0],a[1],a[2],a[3]??1]};
   const blend=(front,back)=>front.slice(0,3).map((v,i)=>v*front[3]+back[i]*(1-front[3]));
   const chain=[];for(let node=e;node;node=node.parentElement)chain.unshift(node);
   let background=[255,255,255],surrounding=[255,255,255];for(const node of chain){if(node===e)surrounding=[...background];background=blend(parse(getComputedStyle(node).backgroundColor),background)}
   const s=getComputedStyle(e);return {text:s.color,background:s.backgroundColor,effectiveBackground:background,effectiveText:blend(parse(s.color),background),disabled:e.disabled,outline:s.outlineColor,outlineStyle:s.outlineStyle,outlineWidth:parseFloat(s.outlineWidth),focusVisible:e.matches(':focus-visible'),surroundingBackground:surrounding,effectiveOutline:blend(parse(s.outlineColor),surrounding),opacity:s.opacity};
  });
  const luminance=value=>value.map(x=>{x/=255;return x<=.04045?x/12.92:((x+.055)/1.055)**2.4}).reduce((n,x,i)=>n+x*[.2126,.7152,.0722][i],0);
  const a=luminance(colors.effectiveText),b=luminance(colors.effectiveBackground),ratio=(Math.max(a,b)+.05)/(Math.min(a,b)+.05);
  const foreground=luminance(colors.effectiveOutline),surrounding=luminance(colors.surroundingBackground),outlineRatio=(Math.max(foreground,surrounding)+.05)/(Math.min(foreground,surrounding)+.05);
  if(label.endsWith(' focus')){assert.ok(colors.focusVisible&&colors.outlineStyle!=='none'&&colors.outlineWidth>=2,label+' keyboard indicator');assert.ok(outlineRatio>=3,label+' outline contrast '+outlineRatio)}
  measurements.push({label,...colors,ratio,outlineRatio,method:'computed sRGB with alpha composited through ancestor backgrounds; WCAG relative luminance',sha});assert.ok(ratio>=4.5,label+' contrast '+ratio);
 };
 // The previous sale scenario leaves the real receipt prompt open.
 await run('receipt-contrast-two-themes',async()=>{
  const dialog=page.getByRole('dialog').filter({hasText:/Venda concluída/i});await dialog.waitFor();
  for(const mode of ['light','dark']){await theme(mode);for(const name of ['Não imprimir','Imprimir']){
   const b=dialog.getByRole('button',{name:name==='Imprimir'?/Imprimir$/:name,exact:name!=='Imprimir'});assert.equal(await b.isEnabled(),true);
   await page.mouse.move(0,0);await measure(b,mode+' '+name+' normal');await b.hover();await measure(b,mode+' '+name+' hover');await b.focus();await page.keyboard.press('Shift+Tab');await page.keyboard.press('Tab');await measure(b,mode+' '+name+' focus');
  }await screenshot('receipt-'+mode)}
  await dialog.getByRole('button',{name:'Não imprimir',exact:true}).click();
 });
 await run('csv-unit-brl-DEC026',async()=>{
  await go('/estoque');const before=await inspect();const [download]=await Promise.all([page.waitForEvent('download'),page.getByRole('button',{name:/CSV/}).click()]);await download.saveAs(output+'/stock-brl.csv');const lines=readFileSync(output+'/stock-brl.csv','utf8').trim().split(/\r?\n/);assert.match(lines[0],/Custo unitário \(R\$\)/);assert.equal(lines.length,before.movements.length+1);
  const costs=new Set();for(const m of before.movements){const line=lines.find(r=>r.startsWith('"'+m.id+'";'));assert.ok(line);const expected=new Intl.NumberFormat('pt-BR',{style:'currency',currency:'BRL'}).format(Number(m.unitCostCents)/100);assert.equal(line.split(';')[8],'"'+expected+'"');costs.add(m.unitCostCents)}for(const cents of ['0','1','800','1075','1234','100001'])assert.ok(costs.has(cents),'missing monetary control '+cents);
  assert.deepEqual((await inspect()).products,before.products);await screenshot('stock-cost-screen');writeFileSync(output+'/csv-unit-proof.json',JSON.stringify({sha,rows:lines.length-1,rawCents:[...costs],unit:'BRL/reais',storedCentsUnchanged:true},null,2));
 });
 const layouts=[];
 for(const mode of ['dark','light'])for(const width of [1920,1440,1366,375,360,320])await run('sales-header-'+mode+'-'+width,async()=>{
  await page.setViewportSize({width,height:1000});await go('/vendas/registros');await theme(mode);const back=page.getByRole('link',{name:'Voltar ao módulo de vendas',exact:true}),sale=page.getByRole('link',{name:'+ Nova venda',exact:true});const a=await back.boundingBox(),b=await sale.boundingBox();assert.ok(a&&b);assert.ok(a.x+a.width<=b.x||b.x+b.width<=a.x||a.y+a.height<=b.y||b.y+b.height<=a.y,'header controls overlap');assert.ok(a.x>=0&&a.x+a.width<=width&&b.x>=0&&b.x+b.width<=width);
  await back.focus();await page.keyboard.press('Tab');assert.equal(await sale.evaluate(e=>e===document.activeElement),true);await page.keyboard.press('Shift+Tab');assert.equal(await back.evaluate(e=>e===document.activeElement),true);await page.keyboard.press('Tab');await screenshot('sales-header-controls-'+mode+'-'+width);await page.keyboard.press('Enter');await page.waitForURL('**#/vendas/frente-de-caixa');await go('/vendas/registros');await back.click();await page.waitForURL('**#/modulos/vendas');layouts.push({mode,width,back:a,sale:b,keyboard:true,click:true});
 });
 writeFileSync(output+'/sales-header-proof.json',JSON.stringify({sha,layouts},null,2));await page.setViewportSize({width:1440,height:1000});
 await run('stock-distinct-order-DEC026',async()=>{
  await go('/estoque');const header=page.getByRole('button',{name:'Quantidade',exact:true});const rows=()=>page.locator('.stock-table tbody tr').evaluateAll(xs=>xs.map(tr=>({id:tr.title.split(' · ')[0],quantity:Math.abs(Number(tr.cells[5].textContent.replace(/[^0-9,.-]/g,'').replace(',','.')))})));const before=await rows();
  const waitQuantity=async value=>page.waitForFunction(value=>Math.abs(Number(document.querySelector('.stock-table tbody tr td:nth-child(6)')?.textContent.replace(/[^0-9,.-]/g,'').replace(',','.')))===value,value);
  await header.click();await waitQuantity(1);const ascending=await rows();assert.ok(ascending.every((r,i)=>!i||r.quantity>=ascending[i-1].quantity));const next=page.getByRole('button',{name:'Próxima',exact:true});const n=await next.boundingBox(),alert=await page.locator('.channel-alert-readiness').boundingBox();assert.ok(n&&alert);assert.ok(n.x+n.width<=alert.x||alert.x+alert.width<=n.x||n.y+n.height<=alert.y||alert.y+alert.height<=n.y,'order alerts overlap stock pagination');await screenshot('stock-pagination-clear');await next.click();await page.waitForFunction(()=>document.querySelector('.catalog-pagination')?.textContent.includes('101–200'));await page.getByText('Atualizando estoque...',{exact:true}).waitFor({state:'hidden'});const secondPage=await rows();assert.ok(secondPage.every(r=>!ascending.some(a=>a.id===r.id)));assert.ok(secondPage[0].quantity>=ascending.at(-1).quantity);
  await header.click();await waitQuantity(5);const descending=await rows();assert.ok(descending.every((r,i)=>!i||r.quantity<=descending[i-1].quantity));assert.notDeepEqual(ascending,descending);writeFileSync(output+'/stock-order-proof.json',JSON.stringify({sha,before,ascending,secondPage,descending,quantityMeaning:'absolute quantity; direction sign displayed separately'},null,2));
 });
 await run('stock-action-colors',async()=>{
  await go('/estoque');for(const mode of ['light','dark']){await theme(mode);for(const name of ['Transferir','Nova movimentação']){
   const b=page.getByRole('button',{name:new RegExp(name,'i')});await b.waitFor();assert.equal(await b.isEnabled(),true);
   const background=await b.evaluate(e=>getComputedStyle(e).backgroundColor);assert.equal(background,'rgb(18, 104, 167)');await measure(b,mode+' '+name);await b.hover();await measure(b,mode+' '+name+' hover');await b.focus();await page.keyboard.press('Shift+Tab');await page.keyboard.press('Tab');await measure(b,mode+' '+name+' focus');await page.mouse.move(0,0);
  }await screenshot('stock-actions-'+mode)}
  await panel();await page.getByLabel('Permissões',{exact:true}).selectOption('read');await wait();for(const b of await page.locator('.stock-heading__actions button').all())assert.equal(await b.isDisabled(),true);await screenshot('stock-actions-disabled');
 });
 await run('catalog-focus-inert-nesting',async()=>{
  await go('/cadastros/categorias');const opener=page.getByRole('button',{name:/Nova Categoria/i});await opener.click();const parent=page.getByRole('dialog');await cycle(parent);
  await opener.evaluate(e=>e.focus());assert.equal(await focused(parent),true);assert.equal(await opener.evaluate(e=>!!e.closest('[inert]')),true);
  await parent.getByLabel('Nome da Categoria 1',{exact:true}).fill('NESTED QA');await parent.getByRole('button',{name:'CADASTRAR',exact:true}).click();const inner=page.getByRole('alertdialog');await cycle(inner);
  assert.equal(await page.locator('#category-modal-title').evaluate(e=>!!e.closest('[inert]')),true);await screenshot('nested-confirmation');await page.keyboard.press('Escape');assert.equal(await inner.count(),0);assert.equal(await focused(parent),true);
  await page.keyboard.press('Escape');await parent.waitFor({state:'hidden'});assert.equal(await opener.evaluate(e=>e===document.activeElement),true);assert.equal(await opener.evaluate(e=>!!e.closest('[inert]')),false);
 });
 await run('catalog-pending-duplicate-escape',async()=>{
  await go('/cadastros/categorias');await page.getByRole('button',{name:/Nova Categoria/i}).click();await page.getByLabel('Nome da Categoria 1',{exact:true}).fill('ONE REQUEST QA');await page.getByRole('button',{name:'CADASTRAR',exact:true}).click();
  await page.evaluate(()=>window.__insightpadQa.state.delay=1500);const confirmation=page.getByRole('alertdialog');await confirmation.getByRole('button',{name:'Confirmar',exact:true}).click();await page.keyboard.press('Enter');await page.keyboard.press('Escape');
  assert.equal(await confirmation.count(),1);assert.equal(await confirmation.getAttribute('aria-busy'),'true');await screenshot('pending-confirmation');await confirmation.waitFor({state:'hidden'});await page.evaluate(()=>window.__insightpadQa.state.delay=0);
  const calls=await page.evaluate(()=>window.__insightpadQa.state.logs.filter(n=>n==='CreateCategory'));assert.equal(calls.length,1);
 });
 for(const noun of ['categorias','subcategorias'])await run('empty-guidance-'+noun,async()=>{
  await go('/cadastros/'+noun);await page.getByPlaceholder('Pesquisar...').fill('SEM RESULTADO QA');const empty=page.getByRole('status').filter({hasText:/Nenhuma/});await empty.waitFor();await empty.getByRole('button',{name:'Limpar pesquisa e filtros',exact:true}).click();await page.getByText(noun==='categorias'?'CATEGORIA QA 001':'SUBCATEGORIA QA 001',{exact:true}).first().waitFor();
  await panel();await page.getByLabel('Dados vazios',{exact:true}).check();await empty.waitFor();assert.match(await empty.innerText(),/Cadastre/);await screenshot('empty-guidance-'+noun);await page.getByLabel('Permissões',{exact:true}).selectOption('read');await empty.waitFor();assert.match(await empty.innerText(),/responsável/);assert.equal(await empty.getByRole('button').count(),0);
 });
 await run('channel-contracts-and-error',async()=>{
  for(const route of ['/integracoes/canais/conexoes','/integracoes/canais/pedidos']){await go(route);assert.doesNotMatch(await page.locator('body').innerText(),/\b(?:NaN|undefined)\b/i);assert.match(await page.locator('body').innerText(),/Página 1 de 1/i);await screenshot(route.endsWith('pedidos')?'orders-empty-contract':'connections-empty-contract')}
  await panel();await page.getByLabel('Falha sintética de API',{exact:true}).check();await page.getByRole('alert').first().waitFor();assert.doesNotMatch(await page.locator('body').innerText(),/\bNaN\b/i);
 });
 await run('product-price-supplier-contract',async()=>{
  await go('/cadastros/produtos');const row=page.getByRole('row').filter({hasText:'PRODUTO QA 002'});assert.match(await row.innerText(),/12,00/);await screenshot('product-current-price');await go('/cadastros/fornecedores');await page.getByText('FORNECEDOR FICTÍCIO QA 1',{exact:true}).waitFor();await screenshot('supplier-legal-name');
 });
 const fillStock=async transfer=>{
  if(transfer){await page.getByRole('button',{name:/^.*Transferir$/}).click();const d=page.getByRole('dialog');await d.getByLabel(/^Origem/).selectOption({label:'MATRIZ QA'});await d.getByLabel(/^Destino/).selectOption({label:'FILIAL QA'});await d.getByLabel(/^Produto/).selectOption({label:'PRODUTO QA 002'});await d.getByLabel('Quantidade',{exact:true}).fill('1');return d}
  await page.getByRole('button',{name:/Nova movimentação/i}).click();const d=page.getByRole('dialog');await d.getByLabel(/^Filial/).selectOption({label:'MATRIZ QA'});await d.getByRole('button',{name:'Próxima',exact:true}).click();await d.getByLabel(/^Produto/).selectOption({label:'PRODUTO QA 002'});await d.getByLabel('Quantidade',{exact:true}).fill('1');await d.getByLabel('Valor unitário',{exact:true}).fill('800');await d.getByRole('button',{name:'Próxima',exact:true}).click();await d.getByRole('button',{name:'Não',exact:true}).click();await d.getByRole('button',{name:'Próxima',exact:true}).click();return d;
 };
 for(const transfer of [false,true])await run('stock-ack-replay-'+(transfer?'transfer':'entry'),async()=>{
  await go('/estoque');const before=await inspect();await page.evaluate(()=>window.__insightpadQa.state.ackLoss=true);const d=await fillStock(transfer);const submit=d.getByRole('button',{name:transfer?'Concluir transferência':'Concluir',exact:true});await submit.click();const notice=page.locator('[role="alert"]').filter({hasText:transfer?'Confirmação da transferência incerta':'Confirmação da movimentação incerta'});await notice.waitFor();assert.doesNotMatch(await notice.innerText(),/recusad[ao]/i);await screenshot('ack-lost-'+transfer);const persisted=await inspect();assert.equal(persisted.movements.length,before.movements.length+1);const operationId=persisted.movements[0].operationId;assert.ok((await notice.innerText()).includes(operationId));assert.match(await notice.innerText(),/sem alterar os dados/);
  await submit.click();await d.waitFor({state:'hidden'});const after=await inspect();assert.equal(after.movements.length,persisted.movements.length);assert.equal(after.movements[0].operationId,operationId);assert.equal(after.transfers.length,before.transfers.length+(transfer?1:0));
  const a=after.products.find(p=>p.name==='PRODUTO QA 002'),b=before.products.find(p=>p.id===a.id);assert.equal(a.balances[0].quantity,b.balances[0].quantity+(transfer?-1:1));if(transfer)assert.equal(a.balances[1].quantity,b.balances[1].quantity+1);
  writeFileSync(output+'/ack-'+transfer+'.json',JSON.stringify({sha,operation:transfer?'transfer':'entry',operationId,uncertainNotice:await notice.count()===0?'dismissed after confirmation':'present',beforeCount:before.movements.length,persistedCount:persisted.movements.length,retryCount:after.movements.length,product:a},null,2));
 });
 await run('export-handlers-denied',async()=>{
  await go('/dashboards/operacional');await page.getByRole('button',{name:'Clientes',exact:true}).click();await page.getByText('SEM COMPRAR QA 1201',{exact:true}).waitFor();await panel();await page.getByLabel('Permissões',{exact:true}).selectOption('noexport');await wait();
  const result=await page.evaluate(async()=>{
   let blobs=0,prints=0,handlers=0;const create=URL.createObjectURL,print=window.print;URL.createObjectURL=()=>{blobs++;return 'blob:qa-denied'};window.print=()=>prints++;
   try{for(const b of document.querySelectorAll('button'))if(/^(CSV|PDF)$/.test(b.textContent.trim())){const key=Object.keys(b).find(k=>k.startsWith('__reactProps'));const handler=key&&b[key]?.onClick;if(handler){handlers++;await handler({preventDefault(){}})}}return {blobs,prints,handlers}}finally{URL.createObjectURL=create;window.print=print}
  });assert.ok(result.handlers>=3);assert.equal(result.blobs,0);assert.equal(result.prints,0);writeFileSync(output+'/denied-handlers.json',JSON.stringify({sha,...result,method:'invoke current React click callbacks despite disabled controls in isolated QA only'},null,2));
 });
 await run('stock-pending-duplicate',async()=>{
  await go('/estoque');const before=await inspect(),dialog=await fillStock(false);await page.evaluate(()=>window.__insightpadQa.state.delay=1500);
  await dialog.getByRole('button',{name:'Concluir',exact:true}).evaluate(e=>{const key=Object.keys(e).find(k=>k.startsWith('__reactProps'));e[key].onClick();e[key].onClick()});await page.keyboard.press('Enter');await screenshot('stock-pending');await dialog.waitFor({state:'hidden'});const after=await inspect();assert.equal(after.movements.length,before.movements.length+1);assert.equal(await page.evaluate(()=>window.__insightpadQa.state.logs.filter(n=>n==='SaveStockBatch').length),1);
 });
 await run('cash-supply-withdrawal',async()=>{
  await go('/vendas/frente-de-caixa');await page.getByLabel(/^Filial/).selectOption({label:'MATRIZ QA'});const before=await inspect();await page.getByRole('button',{name:'Fechar caixa',exact:true}).click();const dialog=page.getByRole('dialog',{name:'Controle de caixa'});
  for(const [action,reason,message]of [['Suprimento','Motivo do suprimento','Suprimento registrado.'],['Sangria','Motivo da sangria','Sangria registrada.']]){
   await dialog.getByRole('button',{name:action,exact:true}).click();await dialog.getByLabel('Valor',{exact:true}).fill('500');await dialog.getByLabel(reason,{exact:true}).fill('MOTIVO SINTÉTICO QA');await dialog.getByRole('button',{name:'Registrar',exact:true}).click();await page.locator('[role="alert"]').filter({hasText:message}).waitFor();await dialog.waitFor({state:'hidden'});if(action==='Suprimento')await page.getByRole('button',{name:'Fechar caixa',exact:true}).click();
  }
  const after=await inspect();assert.equal(after.cashMovements.length,before.cashMovements.length+2);assert.equal(after.sessions[0].expectedAmountCents,before.sessions[0].expectedAmountCents);await screenshot('cash-movements');
 });
 // Native dialog harness uses real elapsed timers, never a mocked clock.
 for(const [delay,outcome]of [[15,'success'],[60,'failure']])await run('recovery-pending-'+delay+'-'+outcome,async()=>{
  await page.goto('http://127.0.0.1:4174/qa/recovery.html');await wait();await page.getByLabel('Resultado sintético').selectOption(outcome);await page.getByLabel('Tempo pendente').selectOption(String(delay));const opener=page.getByRole('button',{name:'Esqueci minha senha',exact:true});await opener.focus();await page.keyboard.press('Enter');const dialog=page.getByRole('dialog',{name:'Recuperar acesso'});await dialog.getByLabel('E-mail cadastrado',{exact:true}).fill('qa@example.invalid');await cycle(dialog);await opener.evaluate(e=>e.focus());assert.equal(await focused(dialog),true);const started=Date.now();await dialog.getByRole('button',{name:/Enviar/}).click();await page.keyboard.press('Enter');await page.keyboard.press('Escape');assert.equal(await dialog.count(),1);assert.equal(await dialog.getAttribute('aria-busy'),'true');await screenshot('recovery-busy-'+delay);
  await page.getByText('Requisições simuladas: 1',{exact:true}).waitFor();await page.waitForFunction(()=>!document.querySelector('dialog[aria-busy="true"]'),{},{timeout:delay*1000+10000});assert.ok(Date.now()-started>=delay*1000-300);await dialog.waitFor({state:'hidden'});assert.equal(await page.locator('#email').inputValue(),'qa@example.invalid');assert.equal(await opener.evaluate(e=>e===document.activeElement),true);await screenshot('recovery-result-'+outcome);writeFileSync(output+'/recovery-'+delay+'.json',JSON.stringify({sha,outcome,configuredDelaySeconds:delay,elapsedMs:Date.now()-started,requests:1,emailPreserved:true,focusReturned:true,clock:'real elapsed timers'},null,2));await opener.click();assert.equal(await dialog.getByLabel('E-mail cadastrado').inputValue(),'qa@example.invalid');await page.keyboard.press('Escape');assert.equal(await opener.evaluate(e=>e===document.activeElement),true);
 });
 await run('native-nested-dialogs',async()=>{
  await page.goto('http://127.0.0.1:4174/qa/recovery.html');await wait();const opener=page.getByRole('button',{name:'Ensaiar diálogos aninhados'});await opener.click();const outer=page.getByRole('dialog',{name:'Diálogo externo de QA'});await cycle(outer);await outer.getByRole('button',{name:'Abrir diálogo interno'}).click();const inner=page.getByRole('dialog',{name:'Diálogo interno de QA'});await cycle(inner);await page.keyboard.press('Escape');assert.equal(await inner.count(),0);assert.equal(await focused(outer),true);await page.keyboard.press('Escape');assert.equal(await opener.evaluate(e=>e===document.activeElement),true);
 });
 writeFileSync(output+'/contrast.json',JSON.stringify({sha,measurements,limits:['Disabled controls measured only when the application actually disables them; no fabricated receipt-disabled state','Text and keyboard outline ratios measured only on the recorded enabled controls; remaining interface still needs independent review']},null,2));
}
