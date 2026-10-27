// @vitest-environment jsdom
import { act } from 'react'
import { createRoot,type Root } from 'react-dom/client'
import { MemoryRouter } from 'react-router-dom'
import { beforeEach,afterEach,it,expect,vi } from 'vitest'
import { StockPage } from './StockPage'
const mocks=vi.hoisted(()=>({workspace:vi.fn(),reverse:vi.fn(),transfer:vi.fn(),manage:true}))
vi.mock('firebase/data-connect',()=>({getDataConnect:()=>({})}))
vi.mock('../lib/firebase',()=>({firebaseApp:{}}))
vi.mock('../auth/useAuth',()=>({useAuth:()=>({permissions:{ESTOQUE:{canAccess:true,canCreate:true,canUpdate:true,canDelete:true,canManage:mocks.manage,canExport:true}}})}))
vi.mock('@insightpad/dataconnect',()=>({connectorConfig:{},stockWorkspace:(...args:unknown[])=>mocks.workspace(...args),reverseStockOperation:(...args:unknown[])=>mocks.reverse(...args),postStockTransfer:(...args:unknown[])=>mocks.transfer(...args),saveStockBatch:vi.fn(),stockOperationDetails:vi.fn()}))
let root:Root,container:HTMLDivElement
const click=async(el:Element,shiftKey=false)=>{await act(async()=>el.dispatchEvent(new MouseEvent('click',{bubbles:true,shiftKey})))}
const find=(label:string)=>{const el=[...container.querySelectorAll('button')].find(b=>[...b.childNodes].filter(n=>n.nodeType===Node.TEXT_NODE).map(n=>n.textContent).join('').trim()===label||b.textContent?.trim()===label);if(!el)throw new Error(label);return el}
const move=(n:number)=>({id:'m'+n,operationId:'operation'+n,occurredAt:'2026-10-20T12:00:00Z',quantity:1,unitCostCents:'100',status:'POSTED',typeCode:'MANUAL_IN',typeName:'Entrada',direction:'IN',productId:'p1',productName:'Produto',branchId:'b1',branchName:'Matriz'})
const workspace=()=>({branches:[{id:'b1',name:'Matriz'}],suppliers:[],products:[{id:'p1',name:'Produto',minimumStock:1,maximumStock:10 as number|null,weightedProduct:true,costPriceCents:'100',balances:[{branchId:'b1',branchName:'Matriz',quantity:10,reservedQuantity:0,availableQuantity:10,averageCostCents:'100'}]}],movements:[move(1),move(2),move(3)],transfers:[],movementCount:3,transferCount:0})
beforeEach(()=>{vi.useFakeTimers();vi.stubGlobal('IS_REACT_ACT_ENVIRONMENT',true);mocks.manage=true;mocks.workspace.mockResolvedValue({data:{_select:[{data:workspace()}]}});mocks.reverse.mockResolvedValue({data:{_execute:1}});mocks.transfer.mockReset().mockResolvedValue({data:{_execute:1}})})
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

it('retries a transfer with the same operation ID and creates a fresh ID for a new identical transfer',async()=>{
 const data=workspace();data.branches.push({id:'b2',name:'Filial'});mocks.workspace.mockResolvedValue({data:{_select:[{data}]}});mocks.transfer.mockRejectedValueOnce(new Error('network lost')).mockImplementationOnce((_dc:unknown,vars:{payload:{clientOperationId:string}})=>Promise.resolve({data:{_execute:0,confirmation:{receipt:{confirmed:true,replay:true,operationId:vars.payload.clientOperationId,kind:'STOCK_TRANSFER'}}}}));await render();
 const fill=async()=>{await click(find('Transferir'));const selects=container.querySelectorAll<HTMLSelectElement>('.stock-transfer-modal select');await act(async()=>{selects[1].value='b2';selects[1].dispatchEvent(new Event('change',{bubbles:true}));selects[2].value='p1';selects[2].dispatchEvent(new Event('change',{bubbles:true}))})};
 await fill();await click(find('Concluir transferência'));const first=mocks.transfer.mock.calls[0][1].payload.clientOperationId;expect(container.querySelector('[role=alert]')?.textContent).toContain('Confirmação da transferência incerta');expect(container.textContent).toContain(first);expect(container.textContent).not.toContain('Transferência recusada');await click(find('Concluir transferência'));expect(mocks.transfer.mock.calls[1][1].payload).toEqual(mocks.transfer.mock.calls[0][1].payload);expect(container.querySelector('.stock-transfer-modal')).toBeNull();await fill();await click(find('Concluir transferência'));expect(mocks.transfer.mock.calls[2][1].payload.clientOperationId).not.toBe(first);
});

for(const reply of [{_execute:0},{_execute:0,confirmation:{receipt:{confirmed:true,replay:true,operationId:'another-operation',kind:'STOCK_TRANSFER'}}}])it('keeps an unconfirmed transfer open and never treats a zero or another receipt as success',async()=>{
 const data=workspace();data.branches.push({id:'b2',name:'Filial'});mocks.workspace.mockResolvedValue({data:{_select:[{data}]}});mocks.transfer.mockResolvedValue({data:reply});await render();await click(find('Transferir'));const selects=container.querySelectorAll<HTMLSelectElement>('.stock-transfer-modal select');await act(async()=>{selects[1].value='b2';selects[1].dispatchEvent(new Event('change',{bubbles:true}));selects[2].value='p1';selects[2].dispatchEvent(new Event('change',{bubbles:true}))});await click(find('Concluir transferência'));
 expect(container.querySelector('.stock-transfer-modal')).not.toBeNull();expect(container.querySelector('[role=alert]')?.textContent).toContain('Confirmação da transferência incerta');expect(container.textContent).not.toContain('Transferência concluída');const payload=mocks.transfer.mock.calls[0][1].payload;await click(find('Concluir transferência'));expect(mocks.transfer.mock.calls[1][1].payload).toEqual(payload);
});


it('exports BRL costs matching the screen without mutating stored cents, including fractional reais and zero',async()=>{
 const data=workspace(),costs=['800','1075','0'];data.movements=costs.map((unitCostCents,i)=>({...move(i),unitCostCents}));mocks.workspace.mockResolvedValue({data:{_select:[{data}]}});
 await render();const original=structuredClone(data);let csv='';
 vi.stubGlobal('Blob',class {constructor(parts:unknown[]){csv=parts.join('')}});
 const oldCreate=URL.createObjectURL,oldRevoke=URL.revokeObjectURL;URL.createObjectURL=()=> 'blob:qa-cost';URL.revokeObjectURL=()=>{};
 const anchor=vi.spyOn(HTMLAnchorElement.prototype,'click').mockImplementation(()=>{});
 try{await click(find('downloadCSV'));expect(csv).toContain('Custo unitário (R$)');for(const cents of costs){const label=new Intl.NumberFormat('pt-BR',{style:'currency',currency:'BRL'}).format(Number(cents)/100);expect(container.textContent).toContain(label);expect(csv).toContain(label)}expect(data).toEqual(original);expect(csv).not.toContain('"1075"');
 await click(find('Saldo atual'));await click(find('downloadCSV'));expect(csv).toContain('Custo médio (R$)');expect(csv).toContain('Valor total (R$)');expect(csv).toContain('R$');expect(data).toEqual(original)
 }finally{URL.createObjectURL=oldCreate;URL.revokeObjectURL=oldRevoke;anchor.mockRestore()}
})

it('exports the selected balance levels in the same displayed order and clears the recorte',async()=>{
 const data=workspace();data.products.push({...data.products[0],id:'p2',name:'OUTRO SALDO',balances:[{...data.products[0].balances[0],quantity:1,availableQuantity:1}] } as typeof data.products[number]);data.products[1].minimumStock=2;
 mocks.workspace.mockResolvedValue({data:{_select:[{data}]}});await render();await click(find('Saldo atual'));await click([...container.querySelectorAll('button')].find(b=>b.textContent?.includes('Estoque baixo'))!);
 let csv='';const OriginalBlob=globalThis.Blob;vi.stubGlobal('Blob',class{constructor(parts:string[]){csv=parts.join('')}});const oldCreate=URL.createObjectURL,oldRevoke=URL.revokeObjectURL;URL.createObjectURL=()=> 'blob:qa-filter';URL.revokeObjectURL=()=>{};vi.spyOn(HTMLAnchorElement.prototype,'click').mockImplementation(()=>{});
 try{await click(find('downloadCSV'));expect(csv).toContain('OUTRO SALDO');expect(csv).not.toContain('"Produto";""');expect(csv.trim().split('\n')).toHaveLength(2);await click(find('Limpar filtros'));await click(find('downloadCSV'));expect(csv.trim().split('\n')).toHaveLength(3)}finally{vi.stubGlobal('Blob',OriginalBlob);URL.createObjectURL=oldCreate;URL.revokeObjectURL=oldRevoke}
})

it('counts high stock only strictly above a positive maximum and preserves all physical quantities',async()=>{
 const data=workspace();data.products=[...data.products,...[10.001,100,100].map((quantity,i)=>({...data.products[0],id:'edge'+i,name:'EDGE'+i,maximumStock:i===0?10:i===1?0:null,balances:[{...data.products[0].balances[0],quantity,availableQuantity:quantity}]}))];mocks.workspace.mockResolvedValue({data:{_select:[{data}]}});
 await render();expect(find('Estoque alto1')).toBeTruthy();await click(find('Estoque alto1'));expect(container.querySelector('.stock-table tbody')?.textContent).toContain('EDGE0');expect(container.querySelectorAll('.stock-table tbody tr')).toHaveLength(1)
})
it('rejects transfer on a second visible branch when manage permission is absent',async()=>{const data=workspace();data.branches.push({id:'b2',name:'Filial'});mocks.manage=false;mocks.workspace.mockResolvedValue({data:{_select:[{data}]}});await render();expect((find('Transferir') as HTMLButtonElement).disabled).toBe(true);await click(find('Transferir'));expect(mocks.transfer).not.toHaveBeenCalled()})
