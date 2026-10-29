// @vitest-environment jsdom
import { act } from 'react'
import { createRoot, type Root } from 'react-dom/client'
import { MemoryRouter } from 'react-router-dom'
import { afterEach, beforeEach, expect, it, vi } from 'vitest'
import { CatalogPages } from './CatalogPages'

const mocks=vi.hoisted(()=>({canCreate:true,create:vi.fn(),list:vi.fn(),options:vi.fn()}))
vi.mock('../auth/useAuth',()=>({useAuth:()=>({permissions:{CAD_CATEGORIA:{canCreate:mocks.canCreate},CAD_SUBCATEGORIA:{canCreate:mocks.canCreate}}})}))
vi.mock('firebase/data-connect',()=>({getDataConnect:()=>({})}))
vi.mock('../lib/firebase',()=>({firebaseApp:{}}))
vi.mock('@insightpad/dataconnect',()=>({connectorConfig:{},categoryOptions:()=>mocks.options(),listCategories:(...args:unknown[])=>mocks.list(...args),listSubcategories:(...args:unknown[])=>mocks.list(...args),createCategory:(...args:unknown[])=>mocks.create(...args),createCategoriesBatch:vi.fn(),createSubcategory:vi.fn(),createSubcategoriesBatch:vi.fn(),updateCategory:vi.fn(),updateSubcategory:vi.fn(),setCategoriesStatusBatch:vi.fn(),setSubcategoriesStatusBatch:vi.fn()}))
let root:Root,container:HTMLDivElement
const button=(text:string)=>{const result=[...container.querySelectorAll('button')].find(el=>el.textContent===text);if(!result)throw new Error(text);return result}
const click=async(el:HTMLElement)=>{await act(async()=>el.click())}
const input=async(el:HTMLInputElement,value:string)=>{await act(async()=>{Object.getOwnPropertyDescriptor(HTMLInputElement.prototype,'value')!.set!.call(el,value);el.dispatchEvent(new Event('input',{bubbles:true}))})}
async function render(pageKey:'CAD_CATEGORIA'|'CAD_SUBCATEGORIA'){
 container=document.createElement('div');document.body.append(container);root=createRoot(container)
 await act(async()=>root.render(<MemoryRouter><CatalogPages pageKey={pageKey}/></MemoryRouter>))
 await act(async()=>{await vi.advanceTimersByTimeAsync(350)})
}
beforeEach(()=>{vi.useFakeTimers();vi.stubGlobal('IS_REACT_ACT_ENVIRONMENT',true);mocks.canCreate=true;mocks.list.mockResolvedValue({data:{_select:[]}});mocks.options.mockResolvedValue({data:{_select:[{id:'11111111-1111-4111-8111-111111111111',name:'BEBIDAS'}]}});mocks.create.mockReset()})
afterEach(async()=>{if(root)await act(async()=>root.unmount());container?.remove();vi.useRealTimers();vi.unstubAllGlobals()})

it('AJU-CAT-06..11: names creation controls and appends a blank category without submitting',async()=>{
 await render('CAD_CATEGORIA');await click(button('+ Nova Categoria'))
 expect(container.querySelector('[role="dialog"]')?.getAttribute('aria-labelledby')).toBe('category-modal-title')
 expect(container.querySelector('h2')?.textContent).toBe('Nova Categoria')
 const field=container.querySelector('input[placeholder="Ex.: Bebidas"]') as HTMLInputElement
 expect(field.closest('label')?.querySelector('span')?.textContent).toBe('Nome da Categoria')
 await input(field,'Bebidas');await click(button('ADICIONAR OUTRA CATEGORIA'))
 const fields=container.querySelectorAll<HTMLInputElement>('[role="dialog"] input')
 expect(fields).toHaveLength(2);expect(fields[0].value).toBe('Bebidas');expect(fields[1].value).toBe('')
 expect([...fields].map(el=>el.id)).toEqual(['category-name-0','category-name-1'])
 expect(fields[1].getAttribute('aria-label')).toBe('Nome da Categoria 2')
 expect(button('CADASTRAR')).toBeTruthy();expect(mocks.create).not.toHaveBeenCalled()
})
it('AJU-SUB-03..08/13: parent starts empty on opening and on each appended row',async()=>{
 await render('CAD_SUBCATEGORIA');await click(button('+ Nova Subcategoria'))
 expect(container.querySelector('h2')?.textContent).toBe('Nova Subcategoria')
 const select=container.querySelector('select')!
 expect(select.value).toBe('')
 const field=container.querySelector('input[placeholder="Bebidas"]') as HTMLInputElement
 expect(field.closest('label')?.querySelector('span')?.textContent).toBe('Nome da Subcategoria')
 await act(async()=>{select.value='11111111-1111-4111-8111-111111111111';select.dispatchEvent(new Event('change',{bubbles:true}))})
 await input(field,'Refrigerantes');await click(button('+ ADICIONAR OUTRA SUBCATEGORIA'))
 expect([...container.querySelectorAll('select')].map(el=>el.value)).toEqual(['11111111-1111-4111-8111-111111111111',''])
 expect([...container.querySelectorAll('input[placeholder="Bebidas"]')].map(el=>el.id)).toEqual(['subcategory-name-0','subcategory-name-1'])
 expect(button('CADASTRAR')).toBeTruthy()
})
it('does not offer category creation without permission',async()=>{mocks.canCreate=false;await render('CAD_CATEGORIA');expect(container.textContent).not.toContain('+ Nova Categoria')})
it('allows only one category mutation while confirmation is pending',async()=>{
 let resolve!:(value:unknown)=>void;mocks.create.mockImplementation(()=>new Promise(r=>{resolve=r}))
 await render('CAD_CATEGORIA');await click(button('+ Nova Categoria'))
 await input(container.querySelector('input[placeholder="Ex.: Bebidas"]')!,'Bebidas')
 await act(async()=>{container.querySelector('form')!.dispatchEvent(new Event('submit',{bubbles:true,cancelable:true}))})
 await act(async()=>{button('Confirmar').click();button('Confirmar').click()})
 expect(mocks.create).toHaveBeenCalledTimes(1)
 await act(async()=>resolve({data:{_execute:1}}))
})

it('uses the server total for paging and sends filters with a reset offset',async()=>{
 mocks.list.mockResolvedValue({data:{_select:[{id:'11111111-1111-4111-8111-111111111111',name:'BEBIDAS',active:true,createdAt:'2026-10-20',updatedAt:'2026-10-20',subcategoryCount:3,productCount:2}],_selectFirst:{totalCount:300}}});
 await render('CAD_CATEGORIA');expect(container.textContent).toContain('1–100 de 300 registros');
 await click(button('Próxima →'));await act(async()=>{await vi.advanceTimersByTimeAsync(350)});expect(mocks.list.mock.lastCall?.[1]).toMatchObject({offset:100});
 await click([...container.querySelectorAll('button')].find(el=>el.textContent?.includes('Pesquisa avançada'))!);
 const status=[...container.querySelectorAll('label')].find(el=>el.textContent==='Inativo')!.querySelector('input')!;
 await click(status);await act(async()=>{await vi.advanceTimersByTimeAsync(350)});
 expect(mocks.list.mock.lastCall?.[1]).toMatchObject({offset:0,filters:{active:['false']}});
});

it.each(['CAD_CATEGORIA','CAD_SUBCATEGORIA'] as const)('limits %s UI batch to twenty named rows and never appends a twenty-first',async(key)=>{
 await render(key);await click(button(key==='CAD_CATEGORIA'?'+ Nova Categoria':'+ Nova Subcategoria'));
 for(let i=0;i<20;i++){
  const field=container.querySelectorAll<HTMLInputElement>('[role="dialog"] input')[i];await input(field,'NOME '+i);
  if(key==='CAD_SUBCATEGORIA'){const el=container.querySelectorAll('select')[i];await act(async()=>{el.value='11111111-1111-4111-8111-111111111111';el.dispatchEvent(new Event('change',{bubbles:true}))})}
  if(i<19)await click(button(key==='CAD_CATEGORIA'?'ADICIONAR OUTRA CATEGORIA':'+ ADICIONAR OUTRA SUBCATEGORIA'))
 }
 expect(container.querySelectorAll('[role="dialog"] input')).toHaveLength(20);expect([...container.querySelectorAll('button')].some(b=>b.textContent?.includes('ADICIONAR OUTRA'))).toBe(false);
 await click(button('Cancelar'));expect(container.querySelector('[role="dialog"]')).toBeNull();expect(mocks.create).not.toHaveBeenCalled()
})
it('does not offer subcategory creation without its own canCreate permission',async()=>{mocks.canCreate=false;await render('CAD_SUBCATEGORIA');expect(container.textContent).not.toContain('+ Nova Subcategoria')})

it('refuses an incomplete second subcategory instead of silently submitting only the first',async()=>{
 await render('CAD_SUBCATEGORIA');await click(button('+ Nova Subcategoria'));
 const parent=container.querySelector('select')!;
 await act(async()=>{parent.value='11111111-1111-4111-8111-111111111111';parent.dispatchEvent(new Event('change',{bubbles:true}))});
 await input(container.querySelector<HTMLInputElement>('#subcategory-name-0')!,'PRIMEIRA');await click(button('+ ADICIONAR OUTRA SUBCATEGORIA'));
 await input(container.querySelector<HTMLInputElement>('#subcategory-name-1')!,'SEGUNDA SEM PAI');
 await act(async()=>{container.querySelector('form')!.dispatchEvent(new Event('submit',{bubbles:true,cancelable:true}))});
 expect(container.querySelector('[role="alertdialog"]')).toBeNull();expect(container.querySelector('[role="alert"]')?.textContent).toContain('Informe combinações');
 await act(async()=>{await vi.advanceTimersByTimeAsync(20)});expect(document.activeElement?.id).toBe('subcategory-parent-1');expect(document.activeElement?.getAttribute('aria-invalid')).toBe('true');
});
