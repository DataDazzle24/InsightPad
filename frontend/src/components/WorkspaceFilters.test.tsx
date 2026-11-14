// @vitest-environment jsdom
import {act} from 'react'
import {createRoot,type Root} from 'react-dom/client'
import {beforeEach,afterEach,it,expect,vi} from 'vitest'
import {DateRangePicker,SearchableMultiSelect} from './SalesUi'
let root:Root,host:HTMLDivElement
beforeEach(()=>{vi.stubGlobal('IS_REACT_ACT_ENVIRONMENT',true);host=document.createElement('div');document.body.append(host);root=createRoot(host)})
afterEach(async()=>{await act(async()=>root.unmount());host.remove();vi.unstubAllGlobals()})
it.each(['work-stock','work-sales',''])('facet Escape is consumed only in the approved route: %s',async(scope)=>{
 host.className=scope
 await act(async()=>root.render(<SearchableMultiSelect label="Tipos" options={[{value:'IN',label:'Entrada'}]} value={[]} onChange={()=>{}}/>))
 const trigger=host.querySelector<HTMLButtonElement>('button')!
 await act(async()=>trigger.click())
 const input=host.querySelector('input')!;input.focus()
 const event=new KeyboardEvent('keydown',{key:'Escape',bubbles:true,cancelable:true})
 await act(async()=>input.dispatchEvent(event))
 expect(event.defaultPrevented).toBe(Boolean(scope));expect(Boolean(host.querySelector('.filter-dropdown__options'))).toBe(!scope)
 if(scope)expect(document.activeElement).toBe(trigger)
})
it.each([false,true])('calendar opts in without changing existing callers: %s',async(workspaceUX)=>{
 await act(async()=>root.render(<DateRangePicker workspaceUX={workspaceUX} from="" to="" onChange={()=>{}}/>))
 const trigger=host.querySelector<HTMLButtonElement>('.date-range-trigger')!
 await act(async()=>trigger.click());const event=new KeyboardEvent('keydown',{key:'Escape',bubbles:true,cancelable:true})
 await act(async()=>trigger.dispatchEvent(event))
 expect(event.defaultPrevented).toBe(workspaceUX);expect(Boolean(host.querySelector('.range-calendar'))).toBe(!workspaceUX)
 if(workspaceUX)expect(document.activeElement).toBe(trigger)
})
it.each([false,true])('inline calendar preserves the outside click only for workspace callers: %s',async(workspaceUX)=>{
 const applied=vi.fn()
 await act(async()=>root.render(<><DateRangePicker workspaceUX={workspaceUX} from="" to="" onChange={()=>{}}/><button id="outside" onClick={applied}>Aplicar</button></>))
 await act(async()=>host.querySelector<HTMLButtonElement>('.date-range-trigger')!.click())
 const outside=host.querySelector<HTMLButtonElement>('#outside')!
 await act(async()=>outside.dispatchEvent(new Event('pointerdown',{bubbles:true})))
 expect(Boolean(host.querySelector('.range-calendar'))).toBe(workspaceUX)
 await act(async()=>outside.click());expect(applied).toHaveBeenCalledOnce();expect(host.querySelector('.range-calendar')).toBeNull()
})
it.each(['work-stock',''])('inline facet preserves the outside click only in its approved scope: %s',async(scope)=>{
 host.className=scope;const applied=vi.fn()
 await act(async()=>root.render(<><SearchableMultiSelect label="Tipos" options={[{value:'IN',label:'Entrada'}]} value={[]} onChange={()=>{}}/><button id="outside" onClick={applied}>Aplicar</button></>))
 await act(async()=>host.querySelector<HTMLButtonElement>('.filter-select-trigger')!.click())
 const outside=host.querySelector<HTMLButtonElement>('#outside')!
 await act(async()=>outside.dispatchEvent(new Event('pointerdown',{bubbles:true})))
 expect(Boolean(host.querySelector('.filter-dropdown'))).toBe(Boolean(scope))
 await act(async()=>outside.click());expect(applied).toHaveBeenCalledOnce();expect(host.querySelector('.filter-dropdown')).toBeNull()
})
