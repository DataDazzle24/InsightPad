import assert from 'node:assert/strict';
import {writeFileSync} from 'node:fs';
export async function residual({page,output,sha,run,go,panel,wait,screenshot}){
 const measurements=[];
 const theme=async value=>page.evaluate(value=>document.documentElement.dataset.theme=value,value);
 const focused=locator=>locator.evaluate(e=>e.contains(document.activeElement));
 const cycle=async dialog=>{
  const controls=dialog.locator('button:not([disabled]),a[href],input:not([disabled]),select:not([disabled]),textarea:not([disabled]),[tabindex="0"]').filter({visible:true});
  const first=controls.first(),last=controls.last();await first.focus();await page.keyboard.press('Shift+Tab');assert.equal(await last.evaluate(e=>e===document.activeElement),true);
  await page.keyboard.press('Tab');assert.equal(await first.evaluate(e=>e===document.activeElement),true);
  for(let i=0;i<await controls.count()+2;i++){await page.keyboard.press('Tab');assert.equal(await focused(dialog),true)}
 };
 const inspect=()=>page.evaluate(()=>window.__insightpadQa.inspect());
 const measure=async(locator,label)=>{
  const colors=await locator.evaluate(e=>{const s=getComputedStyle(e);return {text:s.color,background:s.backgroundColor,disabled:e.disabled,outline:s.outlineColor,opacity:s.opacity}});
  const rgb=value=>value.match(/[\d.]+/g).slice(0,3).map(Number);
  const luminance=value=>rgb(value).map(x=>{x/=255;return x<=.04045?x/12.92:((x+.055)/1.055)**2.4}).reduce((n,x,i)=>n+x*[.2126,.7152,.0722][i],0);
  const a=luminance(colors.text),b=luminance(colors.background),ratio=(Math.max(a,b)+.05)/(Math.min(a,b)+.05);
  measurements.push({label,...colors,ratio,method:'computed opaque sRGB foreground/background; WCAG relative luminance',sha});assert.ok(ratio>=4.5,label+' contrast '+ratio);
 };
 // The previous sale scenario leaves the real receipt prompt open.
 await run('receipt-contrast-two-themes',async()=>{
  const dialog=page.getByRole('dialog').filter({hasText:/Venda concluída/i});await dialog.waitFor();
  for(const mode of ['light','dark']){await theme(mode);for(const name of ['Não imprimir','Imprimir']){
   const b=dialog.getByRole('button',{name:name==='Imprimir'?/Imprimir$/:name,exact:name!=='Imprimir'});assert.equal(await b.isEnabled(),true);
   await page.mouse.move(0,0);await measure(b,mode+' '+name+' normal');await b.hover();await measure(b,mode+' '+name+' hover');await b.focus();await measure(b,mode+' '+name+' focus');
  }await screenshot('receipt-'+mode)}
  await dialog.getByRole('button',{name:'Não imprimir',exact:true}).click();
 });
 await run('stock-action-colors',async()=>{
  await go('/estoque');for(const mode of ['light','dark']){await theme(mode);for(const name of ['Transferir','Nova movimentação']){
   const b=page.getByRole('button',{name:new RegExp(name,'i')});await b.waitFor();assert.equal(await b.isEnabled(),true);
   const background=await b.evaluate(e=>getComputedStyle(e).backgroundColor);assert.equal(background,'rgb(18, 104, 167)');await measure(b,mode+' '+name);await b.hover();await measure(b,mode+' '+name+' hover');await b.focus();await measure(b,mode+' '+name+' focus');await page.mouse.move(0,0);
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
  for(const route of ['/integracoes/canais/conexoes','/integracoes/canais/pedidos']){await go(route);assert.doesNotMatch(await page.locator('body').innerText(),/NaN|undefined/);assert.match(await page.locator('body').innerText(),/Página 1 de 1/);await screenshot(route.endsWith('pedidos')?'orders-empty-contract':'connections-empty-contract')}
  await panel();await page.getByLabel('Falha sintética de API',{exact:true}).check();await page.getByRole('alert').first().waitFor();assert.doesNotMatch(await page.locator('body').innerText(),/NaN/);
 });
 await run('product-price-supplier-contract',async()=>{
  await go('/cadastros/produtos');const row=page.getByRole('row').filter({hasText:'PRODUTO QA 002'});assert.match(await row.innerText(),/12,00/);await screenshot('product-current-price');await go('/cadastros/fornecedores');await page.getByText('FORNECEDOR FICTÍCIO QA 1',{exact:true}).waitFor();await screenshot('supplier-legal-name');
 });
 const fillStock=async transfer=>{
  if(transfer){await page.getByRole('button',{name:/^.*Transferir$/}).click();const d=page.getByRole('dialog');await d.getByLabel('Origem',{exact:true}).selectOption({label:'MATRIZ QA'});await d.getByLabel('Destino',{exact:true}).selectOption({label:'FILIAL QA'});await d.getByLabel('Produto',{exact:true}).selectOption({label:'PRODUTO QA 002'});await d.getByLabel('Quantidade',{exact:true}).fill('1');return d}
  await page.getByRole('button',{name:/Nova movimentação/i}).click();const d=page.getByRole('dialog');await d.getByLabel('Filial',{exact:true}).selectOption({label:'MATRIZ QA'});await d.getByRole('button',{name:'Próxima',exact:true}).click();await d.getByLabel('Produto',{exact:true}).selectOption({label:'PRODUTO QA 002'});await d.getByLabel('Quantidade',{exact:true}).fill('1');await d.getByRole('button',{name:'Próxima',exact:true}).click();await d.getByRole('button',{name:'Não',exact:true}).click();await d.getByRole('button',{name:'Próxima',exact:true}).click();return d;
 };
 for(const transfer of [false,true])await run('stock-ack-replay-'+(transfer?'transfer':'entry'),async()=>{
  await go('/estoque');const before=await inspect();await page.evaluate(()=>window.__insightpadQa.state.ackLoss=true);const d=await fillStock(transfer);const submit=d.getByRole('button',{name:transfer?'Concluir transferência':'Concluir',exact:true});await submit.click();await page.locator('[role="alert"]').filter({hasText:transfer?'Transferência recusada':'Operação recusada'}).waitFor();await screenshot('ack-lost-'+transfer);const persisted=await inspect();assert.equal(persisted.movements.length,before.movements.length+1);
  await submit.click();await d.waitFor({state:'hidden'});const after=await inspect();assert.equal(after.movements.length,persisted.movements.length);assert.equal(after.transfers.length,before.transfers.length+(transfer?1:0));
  const a=after.products.find(p=>p.name==='PRODUTO QA 002'),b=before.products.find(p=>p.id===a.id);assert.equal(a.balances[0].quantity,b.balances[0].quantity+(transfer?-1:1));if(transfer)assert.equal(a.balances[1].quantity,b.balances[1].quantity+1);
  writeFileSync(output+'/ack-'+transfer+'.json',JSON.stringify({sha,operation:transfer?'transfer':'entry',beforeCount:before.movements.length,persistedCount:persisted.movements.length,retryCount:after.movements.length,product:a},null,2));
 });
 // Native dialog harness uses real elapsed timers, never a mocked clock.
 for(const [delay,outcome]of [[15,'success'],[60,'failure']])await run('recovery-pending-'+delay+'-'+outcome,async()=>{
  await page.goto('http://127.0.0.1:4174/qa/recovery.html');await wait();await page.getByLabel('Resultado sintético').selectOption(outcome);await page.getByLabel('Tempo pendente').selectOption(String(delay));const opener=page.getByRole('button',{name:'Esqueci minha senha',exact:true});await opener.focus();await page.keyboard.press('Enter');const dialog=page.getByRole('dialog',{name:'Recuperar acesso'});await dialog.getByLabel('E-mail cadastrado',{exact:true}).fill('qa@example.invalid');await cycle(dialog);const started=Date.now();await dialog.getByRole('button',{name:/Enviar/}).click();await page.keyboard.press('Enter');await page.keyboard.press('Escape');assert.equal(await dialog.count(),1);assert.equal(await dialog.getAttribute('aria-busy'),'true');await screenshot('recovery-busy-'+delay);
  await page.getByText('Requisições simuladas: 1',{exact:true}).waitFor();await page.waitForFunction(()=>!document.querySelector('dialog[aria-busy="true"]'),{},{timeout:delay*1000+10000});assert.ok(Date.now()-started>=delay*1000-300);assert.equal(await dialog.getByLabel('E-mail cadastrado').inputValue(),'qa@example.invalid');await screenshot('recovery-result-'+outcome);await page.keyboard.press('Escape');assert.equal(await opener.evaluate(e=>e===document.activeElement),true);
 });
 await run('native-nested-dialogs',async()=>{
  await page.goto('http://127.0.0.1:4174/qa/recovery.html');await wait();const opener=page.getByRole('button',{name:'Ensaiar diálogos aninhados'});await opener.click();const outer=page.getByRole('dialog',{name:'Diálogo externo de QA'});await cycle(outer);await outer.getByRole('button',{name:'Abrir diálogo interno'}).click();const inner=page.getByRole('dialog',{name:'Diálogo interno de QA'});await cycle(inner);await page.keyboard.press('Escape');assert.equal(await inner.count(),0);assert.equal(await focused(outer),true);await page.keyboard.press('Escape');assert.equal(await opener.evaluate(e=>e===document.activeElement),true);
 });
 writeFileSync(output+'/contrast.json',JSON.stringify({sha,measurements,limits:['Disabled controls measured only when the application actually disables them; no fabricated receipt-disabled state','Focus outlines and the rest of the interface still need independent visual review']},null,2));
}
