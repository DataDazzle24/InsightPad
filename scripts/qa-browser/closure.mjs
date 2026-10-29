import assert from 'node:assert/strict';
import {readFileSync,writeFileSync} from 'node:fs';
import {execFileSync} from 'node:child_process';
// New residual cases only. Existing runner supplies the app, pinned browser and sealed output.
export async function closure({page,output,sha,run,go,panel,wait,screenshot}){
 const inspect=()=>page.evaluate(()=>window.__insightpadQa.inspect());
 // Python's csv parser is independent of the application's serializer.
 const parse=path=>JSON.parse(execFileSync('python3',['-c',"import csv,json,sys;print(json.dumps(list(csv.reader(open(sys.argv[1],encoding='utf-8-sig',newline=''),delimiter=';'))))",path],{encoding:'utf8'}));
 const download=async(button,name)=>{const [d]=await Promise.all([page.waitForEvent('download'),button.click()]);const path=output+'/closure-'+name+'.csv';await d.saveAs(path);return parse(path)};
 const assertions=[];
 await run('closure-financial-csv-brl-filter-clear',async()=>{
  await go('/dashboards/operacional');await page.locator('.finance-table-card tbody tr').first().waitFor();const before=await inspect();
  const all=await download(page.getByRole('button',{name:'CSV',exact:true}).first(),'financial-all');assert.equal(all.length,66);assert.match(all[0][4],/\(R\$\)/);
  const ledger=before.ledger;
  const brl=n=>Number(String(n).replace(/^'/,'').replace(',','.'));
  for(const r of all.slice(1)){const record=ledger.find(p=>p.name===r[0]);assert.ok(record);assert.equal(brl(r[4]),record.revenueCents/100);assert.equal(brl(r[7]),record.costCents/100);assert.equal(brl(r[8]),record.profitCents/100)}
  await page.locator('.finance-table-card tbody tr').filter({hasText:'PRODUTO QA 018'}).click();await page.waitForFunction(()=>document.querySelectorAll('.finance-table-card tbody tr').length===1);
  const filtered=await download(page.getByRole('button',{name:'CSV',exact:true}).first(),'financial-filtered');assert.deepEqual(filtered,[all[0],all.find(r=>r[0]==='PRODUTO QA 018')]);
  await page.getByRole('button',{name:'Limpar filtros',exact:true}).click();await page.waitForFunction(()=>document.querySelectorAll('.finance-table-card tbody tr').length===65);
  assert.deepEqual(await download(page.getByRole('button',{name:'CSV',exact:true}).first(),'financial-clear'),all);assert.deepEqual((await inspect()).ledger,before.ledger);
  assertions.push({case:'financial-csv',rows:65,filteredRows:1,parser:'Python csv',units:'BRL; one cents conversion; negative prefix removed only for numeric oracle',sha});
 });
 await run('closure-channel-exporters-actual-files',async()=>{
  await go('/dashboards/operacional');await page.getByRole('button',{name:'Canais',exact:true}).click();await page.locator('.channel-dashboard .finance-kpis article').first().waitFor();const ledger=(await inspect()).ledger.filter(r=>r.source==='IFOOD');const records=[];
  for(const [index,title,count]of [[0,'Resultado por loja',1],[1,'Taxas confirmadas pelo iFood',1],[2,'Formas de pagamento',1],[3,'Produtos mais vendidos nos canais',32]]){
   const region=page.getByRole('region',{name:title+': tabela completa com rolagem horizontal',exact:true}),article=region.locator('..');const dom=await region.locator('tbody tr').evaluateAll(rows=>rows.map(row=>[...row.querySelectorAll('td')].map(c=>c.textContent)));
   const csv=await download(article.getByRole('button',{name:'CSV',exact:true}),'channel-'+index);assert.equal(csv.length,count+1);assert.deepEqual(csv.slice(1).map(row=>row.map(cell=>/^'[=+\-@]/.test(cell)?cell.slice(1):cell)),dom);records.push({title,rows:count});
   if(index===0){const gross=ledger.reduce((n,r)=>n+r.revenueCents,0),fees=ledger.reduce((n,r)=>n+r.providerFeeCents,0);const value=s=>Number(s.replace(/[^0-9,-]/g,'').replace(',','.'));assert.equal(value(csv[1][3]),gross/100);assert.equal(value(csv[1][4]),fees/100)}
  }
  assertions.push({case:'channel-files',sha,records,limit:'completed synthetic channel sales only; no partner state transition, real permission or external financial reconciliation'});
 });
 await run('closure-existing-exporters-complete-and-filtered',async()=>{
  await go('/estoque');const before=await inspect();
  for(const [tab,field,expected]of [['Movimentações','movements',501],['Transferências','transfers',201]]){
   await page.getByRole('button',{name:tab,exact:true}).click();await wait();const rows=await download(page.getByRole('button',{name:/CSV/}),'stock-'+field);
   assert.equal(rows.length,expected+1);assert.deepEqual(new Set(rows.slice(1).map(r=>r[0])),new Set(before[field].map(r=>r.id)));for(const r of rows.slice(1)){const source=before[field].find(x=>x.id===r[0]);if(field==='movements'){assert.equal(Number(r[7]),source.quantity);assert.equal(Number(r[8].replace(/[^0-9,-]/g,'').replace(',','.')),Number(source.unitCostCents)/100)}else{assert.equal(Number(r[4]),source.itemCount);assert.equal(Number(r[5]),source.totalQuantity)}};
   if(field==='transfers'){
    await page.getByRole('button',{name:'Próxima',exact:true}).click();await wait();await page.getByRole('button',{name:'Próxima',exact:true}).click();await wait();assert.match(await page.locator('.stock-panel').innerText(),/201–201 de 201/i);
    await page.getByPlaceholder('Pesquisar...').fill('qa-transfer-200');await page.locator('.catalog-pagination span').filter({hasText:/1–1 de 1 registros/i}).waitFor();assert.match(await page.locator('.stock-panel').innerText(),/1–1 de 1/i);assert.equal(await page.locator('.stock-panel tbody tr').count(),1);
    await page.getByRole('button',{name:'Limpar filtros',exact:true}).click();await wait();
   }
  }
  await page.getByRole('button',{name:'Saldo atual',exact:true}).click();await wait();
  const balance=await download(page.getByRole('button',{name:/CSV/}),'stock-balance');assert.equal(balance.length,66);
  await page.getByRole('button',{name:/Estoque baixo/}).click();await wait();const shown=await page.locator('.stock-panel tbody tr td:first-child strong').allTextContents();
  const low=await download(page.getByRole('button',{name:/CSV/}),'stock-low');assert.deepEqual(low.slice(1).map(r=>r[0]),shown.map(s=>s.trim()));assert.ok(low.length<balance.length);
  for(const noun of ['categorias','subcategorias']){await go('/cadastros/'+noun);await page.locator('.catalog-table tbody tr').first().waitFor();const rows=await download(page.getByRole('button',{name:/CSV/}),'catalog-'+noun);assert.equal(rows.length,301);assert.equal(new Set(rows.slice(1).map(r=>r[0])).size,300)}
  assertions.push({case:'existing-exporters',stockMovementIDs:501,transferIDs:201,balanceProducts:65,categories:300,subcategories:300,filters:'low balance matches visible rows; transfer last page and search resets offset',sha});
 });
 await run('closure-customer-pdf-1317-no-duplicate-section-boundaries',async()=>{
  // The preceding PDF proof generated this same revision's file with the app print handler.
  const path=output+'/customers.pdf',text=execFileSync('pdftotext',['-layout',path,'-'],{encoding:'utf8'}),pages=text.split('\f');if(!pages.at(-1).trim())pages.pop();
  const sections=[['CLIENTE ATIVO QA',65],['ANIVERSARIANTE QA',51],['SEM COMPRAR QA',1201]],transitions=new Set([pages.length]);
  for(const [label,count]of sections){const matches=[...text.matchAll(new RegExp(label+'\\s+(\\d+)','g'))].map(m=>Number(m[1]));assert.equal(matches.length,count);assert.deepEqual([...matches].sort((a,b)=>a-b),Array.from({length:count},(_,i)=>i+1));
   const first=pages.findIndex(p=>p.includes(label+' 1')),last=pages.findLastIndex(p=>p.includes(label+' '+count));assert.ok(first>=0&&last>=first);for(const index of [first,last]){transitions.add(index+1);if(index>0)transitions.add(index)}
  }
  assert.match(pages.at(-1),/SEM COMPRAR QA 1201/);
  for(const p of transitions)execFileSync('pdftoppm',['-f',String(p),'-l',String(p),'-scale-to','1400','-png',path,output+'/closure-customer-boundary']);
  assertions.push({case:'customer-pdf',sha,counts:{active:65,birthdays:51,dormant:1201},duplicates:0,omissions:0,pages:pages.length,rasterizedPages:[...transitions].sort((a,b)=>a-b),limit:'Chromium print renderer; native print dialog not exercised'});
 });
 for(const [cost,sale]of [['1200','1200'],['800','1200']])await run('closure-product-cost-boundary-'+cost+'-'+sale,async()=>{
  await go('/cadastros/produtos');const row=page.getByRole('row').filter({hasText:'PRODUTO QA 002'});await row.getByRole('button',{name:/Editar/}).click();const dialog=page.getByRole('dialog').first();
  for(let i=0;i<10&&!await dialog.getByLabel('Preço de custo',{exact:true}).isVisible();i++)await dialog.getByRole('button',{name:'Próxima',exact:true}).click();
  await dialog.getByLabel('Preço de custo',{exact:true}).fill(cost);await dialog.getByLabel('Preço de venda',{exact:false}).fill(sale);
  for(let i=0;i<10&&await dialog.getByRole('button',{name:'Próxima',exact:true}).count();i++)await dialog.getByRole('button',{name:'Próxima',exact:true}).click();
  await dialog.getByRole('button',{name:'Salvar',exact:true}).click();const confirm=page.getByRole('alertdialog');await confirm.waitFor();assert.doesNotMatch(await confirm.innerText(),/abaixo do custo/);await confirm.getByRole('button',{name:'Confirmar',exact:true}).click();await dialog.waitFor({state:'hidden'});
  const p=(await inspect()).products.find(p=>p.internalCode==='QA2');assert.equal(p.costPriceCents,cost);assert.equal(p.salePriceCents,sale);
 });
 await run('closure-product-quantity-drafts-and-cancel',async()=>{
  await go('/cadastros/produtos');const before=await inspect();await page.getByRole('row').filter({hasText:'PRODUTO QA 002'}).getByRole('button',{name:/Editar/}).click();const d=page.getByRole('dialog').first();
  for(let i=0;i<10&&!await d.getByLabel('Estoque mínimo',{exact:true}).isVisible();i++)await d.getByRole('button',{name:'Próxima',exact:true}).click();
  const field=d.getByLabel('Estoque mínimo',{exact:true});for(const text of ['', '1,5', '0', '2']){await field.fill(text);assert.equal(await field.inputValue(),text)}
  await field.focus();await page.keyboard.press('ControlOrMeta+A');await page.keyboard.press('Backspace');assert.equal(await field.inputValue(),'');await page.keyboard.insertText('2');assert.equal(await field.inputValue(),'2');
  await d.getByRole('button',{name:'Cancelar',exact:true}).click();await page.getByRole('alertdialog').getByRole('button',{name:'Confirmar',exact:true}).click();await d.waitFor({state:'hidden'});assert.deepEqual((await inspect()).products,before.products);
 });
 for(const [route,label]of [['clientes','Nome / Razão social'],['fornecedores','Razão social / Nome'],['filiais','Nome da filial']])await run('closure-registration-'+route+'-create-edit-cancel',async()=>{
  await go('/cadastros/'+route);const opener=page.getByRole('button',{name:/Novo cadastro/i});await opener.click();let d=page.getByRole('dialog').first();await d.getByLabel(label,{exact:false}).fill('CANCELAR QA');await d.getByRole('button',{name:'Cancelar',exact:true}).click();await page.getByRole('alertdialog').getByRole('button',{name:'Confirmar',exact:true}).click();await d.waitFor({state:'hidden'});
  await opener.click();d=page.getByRole('dialog').first();await d.getByLabel(label,{exact:false}).fill('CADASTRO NOVO QA');
  for(let i=0;i<12&&await d.getByRole('button',{name:'Próxima',exact:true}).count();i++)await d.getByRole('button',{name:'Próxima',exact:true}).click();await d.getByRole('button',{name:'Salvar',exact:true}).click();await page.getByRole('alertdialog').getByRole('button',{name:'Confirmar',exact:true}).click();await d.waitFor({state:'hidden'});
  await page.getByPlaceholder('Pesquisar...').fill('CADASTRO NOVO QA');const row=page.getByRole('row').filter({hasText:'CADASTRO NOVO QA'});await row.waitFor();await row.getByRole('button',{name:/Editar/}).click();d=page.getByRole('dialog').first();await d.getByLabel(label,{exact:false}).fill('CADASTRO EDITADO QA');
  for(let i=0;i<12&&await d.getByRole('button',{name:'Próxima',exact:true}).count();i++)await d.getByRole('button',{name:'Próxima',exact:true}).click();await d.getByRole('button',{name:'Salvar',exact:true}).click();await page.getByRole('alertdialog').getByRole('button',{name:'Confirmar',exact:true}).click();await d.waitFor({state:'hidden'});await page.getByPlaceholder('Pesquisar...').fill('CADASTRO EDITADO QA');await page.getByRole('row').filter({hasText:'CADASTRO EDITADO QA'}).waitFor();
 });
 await run('closure-integrated-sale-cash-stock-cancel-and-export',async()=>{
  await go('/cadastros/categorias');await page.evaluate(()=>{window.__insightpadQa.flow();location.hash='#/vendas/frente-de-caixa'});await wait();await page.getByLabel(/^Filial/).selectOption({label:'MATRIZ QA'});
  const before=await inspect();await page.getByPlaceholder('Código, EAN ou nome').fill('PRODUTO QA 002');await page.getByRole('option').filter({hasText:'PRODUTO QA 002'}).first().click();await page.getByLabel(/^Quantidade/).fill('2');await page.getByRole('button',{name:/Adicionar ao carrinho/}).click();await page.getByRole('button',{name:/Ir para pagamento/}).click();await page.getByLabel('Valor do pagamento 1',{exact:true}).fill('3000');await page.getByRole('button',{name:/Concluir venda/}).click();await page.getByText(/Venda concluída/i).first().waitFor();
  const sold=await inspect();assert.equal(sold.sessions[0].expectedAmountCents,'12400');assert.equal(sold.products[0].balances[0].quantity,8);const id=sold.sales[0].id;assert.equal(sold.sales[0].changeCents,600);
  await page.evaluate(()=>location.hash='#/vendas/registros');await page.getByRole('button',{name:'Detalhes',exact:true}).waitFor();const csv=await download(page.getByRole('button',{name:'Exportar CSV',exact:true}),'sales');assert.equal(csv.length,2);assert.equal(csv[1][0],id);assert.match(csv[1][9],/24,00/);assert.match(csv[1][10],/6,00/);
  await page.getByRole('button',{name:'Detalhes',exact:true}).click();const details=page.getByRole('dialog');await details.waitFor();assert.doesNotMatch(await details.innerText(),/NaN|undefined/);assert.match(await details.innerText(),/24,00/);await details.getByRole('button',{name:'Fechar',exact:true}).click();
  await page.getByRole('button',{name:'Cancelar',exact:true}).click();await page.getByLabel('Motivo',{exact:true}).fill('CANCELAMENTO ISOLADO QA');await page.getByRole('button',{name:'Confirmar cancelamento',exact:true}).click();await page.getByText('Venda cancelada e estoque estornado com sucesso.',{exact:true}).waitFor();
  const after=await inspect();assert.equal(after.sessions[0].expectedAmountCents,'10000');assert.equal(after.products[0].balances[0].quantity,10);assert.equal(after.sales[0].id,id);assert.equal(after.sales[0].status,'CANCELLED');assert.deepEqual(after.cashMovements.filter(m=>m.saleId===id).map(m=>[m.movementType,m.amountCents]),[['SALE',2400],['SALE_REVERSAL',-2400]]);
  for(const state of [before,sold,after]){const physical=state.movements.filter(m=>m.status==='POSTED'&&m.branchId===state.products[0].balances[0].branchId).reduce((n,m)=>n+(m.direction==='IN'?1:-1)*m.quantity,0);assert.equal(physical,state.products[0].balances[0].quantity)}
  assertions.push({case:'integrated-sale-cash-stock-cancel',sha,id,before,sold,after,limit:'interactive synthetic memory profile; no external backend or partner; original authenticated smoke remains unchanged'});
 });
 await run('closure-catalog-form-error-retains-input-and-parent',async()=>{
  await go('/cadastros/subcategorias');const opener=page.getByRole('button',{name:/Nova Subcategoria/i});await opener.click();const d=page.getByRole('dialog');const name=d.getByLabel('Nome da Subcategoria 1',{exact:true});await name.fill('ÁGUA TESTE QA');const parent=d.locator('select');assert.equal(await parent.inputValue(),'');await parent.selectOption({label:'CATEGORIA QA 002'});
  await d.getByRole('button',{name:'CADASTRAR',exact:true}).click();await page.evaluate(()=>window.__insightpadQa.state.fail=true);const confirm=page.getByRole('alertdialog');await confirm.getByRole('button',{name:'Confirmar',exact:true}).click();await page.getByRole('alert').first().waitFor();
  assert.equal(await name.inputValue(),'ÁGUA TESTE QA');assert.equal(await parent.inputValue(),'00000000-0000-4000-8000-000000000301');assert.equal((await inspect()).subcategories.length,300);await page.evaluate(()=>window.__insightpadQa.state.fail=false);
  // Close any confirmation left by the error before cancelling the parent form.
  if(await confirm.count())await confirm.getByRole('button',{name:'Cancelar',exact:true}).click();await page.keyboard.press('Escape');assert.equal((await inspect()).subcategories.length,300);
 });
 for(const seconds of [15,60])await run('closure-stock-pending-ack-'+seconds,async()=>{
  await go('/estoque');const before=await inspect();await page.getByRole('button',{name:/Nova movimentação/i}).click();const d=page.getByRole('dialog');await d.getByLabel(/^Filial/).selectOption({label:'MATRIZ QA'});await d.getByRole('button',{name:'Próxima',exact:true}).click();await d.getByLabel(/^Produto/).selectOption({label:'PRODUTO QA 002'});await d.getByLabel('Quantidade',{exact:true}).fill('1');await d.getByLabel('Valor unitário',{exact:true}).fill('800');await d.getByRole('button',{name:'Próxima',exact:true}).click();await d.getByRole('button',{name:'Não',exact:true}).click();await d.getByRole('button',{name:'Próxima',exact:true}).click();
  await page.evaluate(seconds=>{window.__insightpadQa.state.delay=seconds*1000;window.__insightpadQa.state.ackLoss=true},seconds);const start=Date.now();await d.getByRole('button',{name:'Concluir',exact:true}).click();await page.keyboard.press('Enter');await page.keyboard.press('Escape');assert.equal(await d.count(),1);assert.equal(await page.locator('.catalog-loader').count(),1);await page.evaluate(()=>{const b=[...document.querySelectorAll('[role=dialog] button')].find(b=>b.textContent.trim()==='Concluir'),key=Object.keys(b).find(k=>k.startsWith('__reactProps'));b[key].onClick();b[key].onClick()});assert.equal(await page.evaluate(()=>window.__insightpadQa.state.logs.filter(n=>n==='SaveStockBatch').length),1);await screenshot('closure-stock-busy-'+seconds);
  const notice=page.getByRole('alert').filter({hasText:'Confirmação da movimentação incerta'});await notice.waitFor({timeout:seconds*1000+10000});assert.ok(Date.now()-start>=seconds*1000-300);const persisted=await inspect();assert.equal(persisted.movements.length,before.movements.length+1);const operationId=persisted.movements[0].operationId;assert.ok((await notice.innerText()).includes(operationId));
  await page.evaluate(()=>window.__insightpadQa.state.delay=0);await d.getByRole('button',{name:'Concluir',exact:true}).click();await d.waitFor({state:'hidden'});const after=await inspect();assert.deepEqual(after.movements,persisted.movements);assert.equal(after.movements[0].operationId,operationId);assert.equal(await page.evaluate(()=>window.__insightpadQa.state.logs.filter(n=>n==='SaveStockBatch').length),2);assertions.push({case:'stock-pending-ack',seconds,elapsedMs:Date.now()-start,operationId,attempts:2,effects:1,sha,limit:'synthetic memory, real timers, no crash/reload durability claim'});
 });
 // Consumer-specific data/empty/error checks, not inventory-as-acceptance.
 for(const view of ['Vendas','Estoque','Clientes','Categorias','Canais'])await run('closure-dashboard-states-'+view,async()=>{
  await go('/dashboards/operacional');await page.getByRole('button',{name:view,exact:true}).click();await page.locator('.finance-kpis article').first().waitFor();assert.ok(await page.locator('.finance-kpis article').count()>0);assert.doesNotMatch(await page.locator('main').innerText(),/\b(?:NaN|undefined)\b/);
  await panel();await page.getByLabel('Dados vazios',{exact:true}).check();await page.getByRole('button',{name:view,exact:true}).click();await wait();assert.doesNotMatch(await page.locator('main').innerText(),/\bNaN\b/);await screenshot('closure-'+view+'-empty');
  await page.getByLabel('Dados vazios',{exact:true}).uncheck();await page.getByLabel('Falha sintética de API',{exact:true}).check();await page.getByRole('button',{name:view,exact:true}).click();await page.getByRole('alert').first().waitFor();await screenshot('closure-'+view+'-error');
 });
 for(const theme of ['light','dark'])for(const width of [320,375,1366,1920])await run('closure-dashboard-consumers-'+theme+'-'+width,async()=>{
  await page.setViewportSize({width,height:1000});await go('/dashboards/operacional');await page.evaluate(theme=>localStorage.setItem('insightpad.theme',theme),theme);await page.reload();await wait();
  for(const view of ['Vendas','Estoque','Clientes','Categorias','Canais']){
   await page.getByRole('button',{name:view,exact:true}).click();await wait();const heading=page.locator('.finance-heading');assert.ok(await heading.getByRole('heading').count()>0);
   const buttons=heading.locator('button');for(const b of await buttons.all())assert.ok((await b.getAttribute('aria-label'))||(await b.innerText()).trim());
   const overlaps=await heading.evaluate(e=>{const rects=[...e.querySelectorAll('button')].map(b=>b.getBoundingClientRect()).filter(r=>r.width&&r.height);return rects.some((a,i)=>rects.slice(i+1).some(b=>Math.min(a.right,b.right)-Math.max(a.left,b.left)>2&&Math.min(a.bottom,b.bottom)-Math.max(a.top,b.top)>2))});assert.equal(overlaps,false,'header buttons overlap');
   await screenshot('closure-'+view+'-'+theme+'-'+width);
  }
 });
 await page.setViewportSize({width:1440,height:1000});
 writeFileSync(output+'/closure-proof.json',JSON.stringify({sha,assertions,viewport:'emulated CSS pixels, not a physical device',limits:['5 dashboard state consumers and header actions checked, not all route overlays','Native zoom and interactive print dialog remain unproved','Reserved channel stock and complete fiscal documents not modeled by this browser fixture; existing SQL tests are separate','Original private images and PDF raster pages require CTO inspection; no attachment delivery implied']},null,2));
}
