// @vitest-environment jsdom
import { act } from 'react'
import { createRoot, type Root } from 'react-dom/client'
import { afterEach, beforeEach, expect, it, vi } from 'vitest'
import { DateRangePicker } from './SalesUi'
let root:Root,host:HTMLDivElement
beforeEach(()=>{vi.stubGlobal('IS_REACT_ACT_ENVIRONMENT',true);host=document.createElement('div');document.body.append(host);root=createRoot(host)})
afterEach(async()=>{await act(async()=>root.unmount());host.remove();vi.unstubAllGlobals()})
it.each([false,true])('calendar Escape and aria-expanded change only for explicit Cadastros origin: %s',async(cadastros)=>{
 await act(async()=>root.render(<DateRangePicker cadastros={cadastros} from="" to="" onChange={()=>{}}/>));const trigger=host.querySelector<HTMLButtonElement>('.date-range-trigger')!
 expect(trigger.getAttribute('aria-expanded')).toBe(cadastros?'false':null);await act(async()=>trigger.click());expect(host.querySelector('.range-calendar')).not.toBeNull()
 await act(async()=>trigger.dispatchEvent(new KeyboardEvent('keydown',{key:'Escape',bubbles:true,cancelable:true})))
 expect(Boolean(host.querySelector('.range-calendar'))).toBe(!cadastros);if(cadastros)expect(document.activeElement).toBe(trigger)
})
