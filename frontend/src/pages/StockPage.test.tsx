// @vitest-environment jsdom
import { act } from 'react'
import { createRoot,type Root } from 'react-dom/client'
import { MemoryRouter } from 'react-router-dom'
import { beforeEach,afterEach,it,expect,vi } from 'vitest'
import { StockPage } from './StockPage'
const mocks=vi.hoisted(()=>({workspace:vi.fn(),reverse:vi.fn(),manage:true}))
vi.mock('firebase/data-connect',()=>({getDataConnect:()=>({})}))
vi.mock('../lib/firebase',()=>({firebaseApp:{}}))
vi.mock('../auth/useAuth',()=>({useAuth:()=>({permissions:{ESTOQUE:{canAccess:true,canCreate:true,canUpdate:true,canDelete:true,canManage:mocks.manage,canExport:true}}})}))
vi.mock('@insightpad/dataconnect',()=>({connectorConfig:{},stockWorkspace:(...args:unknown[])=>mocks.workspace(...args),reverseStockOperation:(...args:unknown[])=>mocks.reverse(...args),postStockTransfer:vi.fn(),saveStockBatch:vi.fn(),stockOperationDetails:vi.fn()}))
let root:Root,container:HTMLDivElement
const click=async(el:Element,shiftKey=false)=>{await act(async()=>el.dispatchEvent(new MouseEvent('click',{bubbles:true,shiftKey})))}
const find=(label:string)=>{const el=[...container.querySelectorAll('button')].find(b=>[...b.childNodes].filter(n=>n.nodeType===Node.TEXT_NODE).map(n=>n.textContent).join('').trim()===label||b.textContent?.trim()===label);if(!el)throw new Error(label);return el}
const move=(n:number)=>({id:'m'+n,operationId:'operation'+n,occurredAt:'2026-10-20T12:00:00Z',quantity:1,unitCostCents:'100',status:'POSTED',typeCode:'MANUAL_IN',typeName:'Entrada',direction:'IN',productId:'p1',productName:'Produto',branchId:'b1',branchName:'Matriz'})
const workspace=()=>({branches:[{id:'b1',name:'Matriz'}],suppliers:[],products:[{id:'p1',name:'Produto',minimumStock:1,maximumStock:10,weightedProduct:true,costPriceCents:'100',balances:[{branchId:'b1',branchName:'Matriz',quantity:10,reservedQuantity:0,availableQuantity:10,averageCostCents:'100'}]}],movements:[move(1),move(2),move(3)],transfers:[],movementCount:3,transferCount:0})
beforeEach(()=>{vi.useFakeTimers();vi.stubGlobal('IS_REACT_ACT_ENVIRONMENT',true);mocks.manage=true;mocks.workspace.mockResolvedValue({data:{_select:[{data:workspace()}]}});mocks.reverse.mockResolvedValue({data:{_execute:1}})})
afterEach(async()=>{if(root)await act(async()=>root.unmount());container?.remove();vi.useRealTimers();vi.unstubAllGlobals()})
async function render(){container=document.createElement('div');document.body.append(container);root=createRoot(container);await act(async()=>root.render(<MemoryRouter><StockPage/></MemoryRouter>));await act(async()=>{await vi.advanceTimersByTimeAsync(0)})}
it('places navigation in the heading and disables transfer with one authorized branch',async()=>{
 await render();expect(container.querySelector('.stock-heading nav')).not.toBeNull();expect([...container.querySelectorAll('.stock-tabs button')].map(x=>x.textContent)).toEqual(['Movimentações','Transferências','Saldo atual']);expect((find('Transferir') as HTMLButtonElement).disabled).toBe(true);expect((find('Editar') as HTMLButtonElement).disabled).toBe(true);expect((find('Estornar') as HTMLButtonElement).disabled).toBe(true);expect(container.textContent).toContain('Registrado');expect(container.querySelector('th')?.parentElement?.textContent).not.toContain('Operação');expect(container.querySelector('a')?.getAttribute('href')).toBe('/');
 await click(find('Estoque alto0'));expect(container.textContent).toContain('Saldo atual');expect(container.querySelector('.stock-table tbody')?.textContent).not.toContain('Produto');
})
it('shift selects only visible movements and reversal sends their exact IDs',async()=>{
 await render();const rows=container.querySelectorAll('.stock-table tbody tr');await click(rows[0]);await click(rows[2],true);expect([...container.querySelectorAll<HTMLInputElement>('.stock-table input')].filter(x=>x.checked)).toHaveLength(3);
 await click(find('Estornar'));const textarea=container.querySelector('textarea')!;await act(async()=>{Object.getOwnPropertyDescriptor(HTMLTextAreaElement.prototype,'value')!.set!.call(textarea,'Correção autorizada');textarea.dispatchEvent(new Event('input',{bubbles:true}))});const buttons=[...container.querySelectorAll('button')].filter(x=>x.textContent?.trim()==='Estornar');await click(buttons.at(-1)!);expect(mocks.reverse.mock.lastCall?.[1]).toMatchObject({operationId:'',movementIds:['m1','m2','m3']});
})

it('combines low and empty cards as a union without losing the branch',async()=>{
 const data=workspace();data.products.push({...data.products[0],id:'p2',name:'Baixo',balances:[{...data.products[0].balances[0],quantity:.5,availableQuantity:.5}]},{...data.products[0],id:'p3',name:'Zerado',balances:[{...data.products[0].balances[0],quantity:0,availableQuantity:0}]});mocks.workspace.mockResolvedValue({data:{_select:[{data}]}});await render();await click(find('Estoque baixo1'));await click(find('Sem saldo1'));expect(container.querySelector<HTMLSelectElement>('.stock-toolbar select')?.value).toBe('b1');const names=[...container.querySelectorAll('.stock-table tbody tr td:first-child strong')].map(el=>el.textContent);expect(names).toEqual(['Baixo','Zerado']);
});
