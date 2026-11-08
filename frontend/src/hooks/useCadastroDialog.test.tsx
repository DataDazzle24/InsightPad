// @vitest-environment jsdom
import { act, useState } from 'react'
import { createRoot, type Root } from 'react-dom/client'
import { afterEach, beforeEach, expect, it, vi } from 'vitest'
import { useCadastroDialog } from './useCadastroDialog'

let root: Root, host: HTMLDivElement
function Dialog({close, child=false}:{close:()=>void;child?:boolean}) {
  useCadastroDialog(true,close)
  return <section role="dialog" aria-modal="true" tabIndex={-1}>
    <button>Primeiro</button>
    {!child && <details className="filter-multiselect"><summary>Opções</summary><input aria-label="Opção"/></details>}
    <button>Último</button>
  </section>
}
function Stack({close}:{close:()=>void}) {
  const [child,setChild]=useState(false)
  useCadastroDialog(true,close)
  return <section role="dialog" aria-modal="true"><button onClick={()=>setChild(true)}>Abrir filho</button>
    {child && <Dialog child close={()=>setChild(false)}/>}</section>
}
beforeEach(()=>{
  vi.stubGlobal('IS_REACT_ACT_ENVIRONMENT',true)
  vi.spyOn(HTMLElement.prototype,'getClientRects').mockReturnValue([{width:10,height:10}] as unknown as DOMRectList)
  host=document.createElement('div');host.dataset.cadastros='';host.innerHTML='<button id="opener">Abrir</button><div class="cad-page"></div>'
  document.body.append(host);host.querySelector<HTMLButtonElement>('#opener')!.focus();root=createRoot(host.querySelector('.cad-page')!)
})
afterEach(async()=>{await act(async()=>root.unmount());host.remove();vi.restoreAllMocks();vi.unstubAllGlobals()})
const key=async(value:string,shiftKey=false)=>{await act(async()=>document.activeElement!.dispatchEvent(new KeyboardEvent('keydown',{key:value,shiftKey,bubbles:true,cancelable:true}))) }
it('closes the open facet before its parent and restores the opener on unmount',async()=>{
  const close=vi.fn();await act(async()=>root.render(<Dialog close={close}/>))
  const details=host.querySelector('details')!;details.open=true;host.querySelector<HTMLInputElement>('input')!.focus()
  await key('Escape');expect(details.open).toBe(false);expect(document.activeElement).toBe(details.querySelector('summary'));expect(close).not.toHaveBeenCalled()
  await key('Escape');expect(close).toHaveBeenCalledOnce()
  await act(async()=>root.render(null));expect(document.activeElement?.id).toBe('opener')
})
it('keeps Tab/Shift+Tab at the edges of the enabled visible controls',async()=>{
  await act(async()=>root.render(<Dialog close={()=>{}}/>));const buttons=host.querySelectorAll<HTMLButtonElement>('.cad-page button');buttons[1].focus()
  await key('Tab');expect(document.activeElement).toBe(buttons[0]);await key('Tab',true);expect(document.activeElement).toBe(buttons[1])
})
it('does not close a parent when a child consumes Escape',async()=>{
  const close=vi.fn();await act(async()=>root.render(<Stack close={close}/>));await act(async()=>host.querySelector<HTMLButtonElement>('.cad-page button')!.click())
  expect(host.querySelectorAll('[role="dialog"]')).toHaveLength(2)
  await key('Escape');expect(host.querySelectorAll('[role="dialog"]')).toHaveLength(1);expect(close).not.toHaveBeenCalled()
  await key('Escape');expect(close).toHaveBeenCalledOnce()
})
it('honors consumed calendar/select Escape and never installs behavior outside Cadastros',async()=>{
  const close=vi.fn();await act(async()=>root.render(<Dialog close={close}/>));const input=host.querySelector('input')!;input.addEventListener('keydown',e=>e.preventDefault());input.focus()
  await key('Escape');expect(close).not.toHaveBeenCalled()
  await act(async()=>root.render(null));delete host.dataset.cadastros;await act(async()=>root.render(<Dialog close={close}/>));await key('Escape');expect(close).not.toHaveBeenCalled()
})
