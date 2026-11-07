// Exercise the real UI transition. Reading the chosen preference is only a wait
// condition; the helper never injects a branch or bypasses the cash modal.
export async function usePosBranch(page,label='MATRIZ QA'){
 await page.locator('.pos-topbar .pos-cash-toggle:not(:disabled)').waitFor();
 const current=await page.evaluate(()=>localStorage.getItem('insightpad.sale.branch:00000000-0000-4000-8000-000000000010:qa-user'));
 const target=label==='MATRIZ QA'?'00000000-0000-4000-8000-000000000001':'00000000-0000-4000-8000-000000000002';
 if(current===target)return;
 await page.locator('.pos-topbar .pos-cash-toggle').click();
 const d=page.getByRole('dialog',{name:'Controle de caixa'});
 if(!await d.getByLabel('Filial',{exact:true}).count())throw Error('A different branch already has an active cash context; close or leave it explicitly');
 await d.getByLabel('Filial',{exact:true}).selectOption({label});
 const action=d.getByRole('button',{name:/^(Retomar caixa|Abrir caixa)$/});await action.click();
 await d.waitFor({state:'hidden'});await page.locator('.pos-topbar .pos-cash-toggle:not(:disabled)').waitFor();
}
