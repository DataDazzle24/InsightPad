// @vitest-environment jsdom
import { act } from 'react'
import { createRoot, type Root } from 'react-dom/client'
import { afterEach, beforeEach, expect, it, vi } from 'vitest'
import { ProductExtras } from './ProductExtras'

const mocks=vi.hoisted(()=>({load:vi.fn(),save:vi.fn(),status:vi.fn()}))
vi.mock('firebase/data-connect',()=>({getDataConnect:()=>({})}))
vi.mock('../lib/firebase',()=>({firebaseApp:{}}))
vi.mock('@insightpad/dataconnect',()=>({connectorConfig:{},productPromotions:(...args:unknown[])=>mocks.load(...args),savePromotion:(...args:unknown[])=>mocks.save(...args),setPromotionStatus:(...args:unknown[])=>mocks.status(...args)}))
let root:Root,container:HTMLDivElement
const close=vi.fn(),changed=vi.fn()
const promotion={id:'11111111-1111-4111-8111-111111111111',promotionalPriceCents:'1000',startsAt:'2020-01-01T00:00:00Z',endsAt:'2099-01-01T00:00:00Z',active:true,status:'ACTIVE',createdAt:'2026-01-01T00:00:00Z',updatedAt:'2026-01-01T00:00:00Z'}
const button=(text:string)=>[...container.querySelectorAll('button')].find(b=>b.textContent?.includes(text))!
async function mount(){await act(async()=>root.render(<ProductExtras product={{id:'22222222-2222-4222-8222-222222222222',name:'Produto sintético',active:true,salePriceCents:'2000',costPriceCents:'800'}} onClose={close} onChanged={changed}/>));await act(async()=>{await vi.advanceTimersByTimeAsync(1)})}
beforeEach(()=>{vi.useFakeTimers();vi.stubGlobal('IS_REACT_ACT_ENVIRONMENT',true);container=document.createElement('div');document.body.append(container);root=createRoot(container);mocks.load.mockResolvedValue({data:{_select:[promotion]}});mocks.save.mockReset();mocks.status.mockReset();mocks.load.mockClear();close.mockReset();changed.mockReset()})
afterEach(async()=>{await act(async()=>root.unmount());container.remove();vi.useRealTimers();vi.unstubAllGlobals();vi.restoreAllMocks()})
it('does not refresh the listing when closing without an acknowledged mutation',async()=>{await mount();await act(async()=>button('Cancelar').click());expect(close).toHaveBeenCalledOnce();expect(changed).not.toHaveBeenCalled()})
it('refreshes exactly once on close after a successful status change',async()=>{mocks.status.mockResolvedValue({data:{_execute:1}});await mount();await act(async()=>button('Inativar').click());expect(changed).not.toHaveBeenCalled();await act(async()=>button('Cancelar').click());await act(async()=>button('Cancelar').click());expect(changed).toHaveBeenCalledOnce();expect(close).toHaveBeenCalledOnce()})
it('does not refresh after a refused operation',async()=>{vi.spyOn(console,'error').mockImplementation(()=>{});mocks.status.mockResolvedValue({data:{_execute:0}});await mount();await act(async()=>button('Inativar').click());await act(async()=>button('Cancelar').click());expect(changed).not.toHaveBeenCalled()})
it('refreshes on a positive acknowledgment arriving after close, without replaying a write',async()=>{
  let resolve!:(value:{data:{_execute:number}})=>void;mocks.status.mockReturnValue(new Promise(r=>{resolve=r}));await mount()
  await act(async()=>button('Inativar').click());await act(async()=>button('Cancelar').click());await act(async()=>root.render(null));expect(changed).not.toHaveBeenCalled()
  await act(async()=>resolve({data:{_execute:1}}));expect(changed).toHaveBeenCalledOnce();expect(mocks.status).toHaveBeenCalledOnce()
})
it('uses the latest parent refresh callback after the listing context changes',async()=>{
  mocks.status.mockResolvedValue({data:{_execute:1}});await mount();await act(async()=>button('Inativar').click());const latest=vi.fn()
  await act(async()=>root.render(<ProductExtras product={{id:'22222222-2222-4222-8222-222222222222',name:'Produto sintético',active:true,salePriceCents:'2000',costPriceCents:'800'}} onClose={close} onChanged={latest}/>))
  await act(async()=>button('Cancelar').click());expect(latest).toHaveBeenCalledOnce();expect(changed).not.toHaveBeenCalled()
})
