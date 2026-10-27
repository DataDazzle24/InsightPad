// @vitest-environment jsdom
import { act } from 'react'
import { createRoot,type Root } from 'react-dom/client'
import { MemoryRouter } from 'react-router-dom'
import { beforeEach,afterEach,it,expect,vi } from 'vitest'
import { PosHeader } from '../components/PosHeader'
import { CashSessionModal } from '../components/CashSessionModal'
import type { DataConnect } from 'firebase/data-connect'
const api=vi.hoisted(()=>({execute:vi.fn()}))
vi.mock('firebase/data-connect',()=>({executeMutation:api.execute,mutationRef:(_dc:unknown,name:string,variables:unknown)=>({name,variables})}))
vi.mock('@insightpad/dataconnect',()=>({updatePosPolicy:vi.fn(),requestPosCashApproval:vi.fn(),posCashApprovalStatus:vi.fn()}))
let root:Root,container:HTMLDivElement
beforeEach(()=>{vi.stubGlobal('IS_REACT_ACT_ENVIRONMENT',true);api.execute.mockReset();container=document.createElement('div');document.body.append(container);root=createRoot(container)})
afterEach(async()=>{await act(async()=>root.unmount());container.remove();vi.restoreAllMocks();vi.unstubAllGlobals()})
const buttons=()=>[...container.querySelectorAll('button')]
const button=(text:string)=>{const result=buttons().find(el=>el.textContent?.includes(text));if(!result)throw Error(text);return result}
const click=async(text:string)=>{await act(async()=>button(text).click())}
it('AJU-PDV-01..03: groups back with clock, announces connection and routes cash through its control',async()=>{
 const cash=vi.fn(),sync=vi.fn(),confirm=vi.spyOn(window,'confirm').mockReturnValue(false)
 const props={clock:new Date('2026-10-20T10:00:00Z'),online:false,pending:2,blocked:1,syncing:false,cashReady:true,cashOpen:true,cashDisabled:false,canManage:false,hasCart:true,onCash:cash,onSync:sync,onQueue:vi.fn(),onApprovals:vi.fn()}
 await act(async()=>root.render(<MemoryRouter><PosHeader {...props}/></MemoryRouter>))
 expect(container.querySelector('.pos-clock-group a')).toBeTruthy()
 expect(container.querySelector('[role="status"]')?.textContent).toContain('Offline · 2 pendente(s)')
 expect(button('Fechar caixa').className).toContain('--close')
 await click('Fechar caixa');expect(cash).toHaveBeenCalledTimes(1);expect(api.execute).not.toHaveBeenCalled()
 const event=new MouseEvent('click',{bubbles:true,cancelable:true})
 await act(async()=>{container.querySelector('a')!.dispatchEvent(event)})
 expect(confirm).toHaveBeenCalledTimes(1);expect(event.defaultPrevented).toBe(true)
 await act(async()=>root.render(<MemoryRouter><PosHeader {...props} cashOpen={false} online cashDisabled/></MemoryRouter>))
 expect(button('Abrir caixa').disabled).toBe(true);expect(button('Abrir caixa').className).toContain('--open')
 await click('Sincronizar');expect(sync).toHaveBeenCalledTimes(1)
})
const session={id:'session',openedAt:'2026-10-20T10:00:00Z',openingAmountCents:'1000',expectedAmountCents:'1500',movementCount:2}
it('AJU-PDV-04: cancel closes without mutation; cash movements retain manager permissions',async()=>{
 const close=vi.fn(),props={dc:{} as DataConnect,branchId:'branch',branchName:'Teste',session,canManage:true,onClose:close,onChanged:vi.fn(),onNotice:vi.fn()}
 await act(async()=>root.render(<CashSessionModal {...props}/>))
 expect(button('Sangria').querySelector('[aria-hidden="true"]')?.textContent).toBe('remove_circle')
 expect(button('Suprimento').className).toBe('cash-action--supply')
 await click('Cancelar');expect(close).toHaveBeenCalledTimes(1);expect(api.execute).not.toHaveBeenCalled()
 await act(async()=>root.render(<CashSessionModal {...props} canManage={false} pendingCount={2}/>))
 expect(buttons().some(el=>el.textContent?.includes('Suprimento'))).toBe(false)
 expect(button('Fechar meu caixa').disabled).toBe(true)
 expect(container.querySelector('[role="status"]')?.textContent).toContain('2 venda(s)')
})

it('cash ACK loss keeps the same operation and payload, announces uncertainty and confirms retry once',async()=>{
 const notice=vi.fn(),changed=vi.fn(async()=>{}),close=vi.fn();api.execute.mockRejectedValueOnce(Object.assign(new TypeError('Failed to fetch'),{code:'unavailable'})).mockResolvedValueOnce({data:{_execute:1}})
 await act(async()=>root.render(<CashSessionModal dc={{} as DataConnect} branchId="branch" branchName="Teste" session={session} canManage onClose={close} onChanged={changed} onNotice={notice}/>));await click('Suprimento')
 for(const [selector,value]of [['input','500'],['textarea','MOTIVO QA']]){const el=container.querySelector(selector)!;await act(async()=>{const proto=selector==='input'?HTMLInputElement.prototype:HTMLTextAreaElement.prototype;Object.getOwnPropertyDescriptor(proto,'value')!.set!.call(el,value);el.dispatchEvent(new Event('input',{bubbles:true}))})}
 const submit=async()=>act(async()=>{container.querySelector('form')!.dispatchEvent(new Event('submit',{bubbles:true,cancelable:true}))});await submit();expect(notice.mock.calls[0][0]).toMatch(/confirmação.*incerta/i);expect(close).not.toHaveBeenCalled();expect(changed).not.toHaveBeenCalled();const first=structuredClone(api.execute.mock.calls[0][0]);await submit();expect(api.execute.mock.calls[1][0]).toEqual(first);expect(changed).toHaveBeenCalledOnce();expect(close).toHaveBeenCalledOnce()
})
