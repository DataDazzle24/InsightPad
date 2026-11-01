// @vitest-environment jsdom
import {act} from 'react'
import {createRoot,type Root} from 'react-dom/client'
import {MemoryRouter,useLocation} from 'react-router-dom'
import {afterEach,beforeEach,expect,it,vi} from 'vitest'
import {InterfaceLink,InterfaceNavLink} from './InterfaceNavigationLink'
let root:Root,container:HTMLDivElement
function Location(){return <output>{useLocation().pathname}</output>}
beforeEach(()=>{vi.stubGlobal('IS_REACT_ACT_ENVIRONMENT',true);container=document.createElement('div');document.body.append(container);root=createRoot(container)})
afterEach(async()=>{await act(async()=>root.unmount());container.remove();vi.unstubAllGlobals()})
it('calls the original handler once and lets the router navigate immediately',async()=>{
 const click=vi.fn();await act(async()=>root.render(<MemoryRouter><InterfaceLink to="/destination" onClick={click}>Destino</InterfaceLink><Location/></MemoryRouter>));
 const link=container.querySelector('a')!;await act(async()=>link.click());expect(click).toHaveBeenCalledTimes(1);expect(container.querySelector('output')!.textContent).toBe('/destination');
})
it('preserves existing preventDefault and NavLink state/children contracts',async()=>{
 const click=vi.fn((event:React.MouseEvent<HTMLAnchorElement>)=>event.preventDefault());await act(async()=>root.render(<MemoryRouter><InterfaceNavLink to="/destination" onClick={click} className={({isActive})=>isActive?'current':'idle'}>{({isActive})=>isActive?'Atual':'Destino'}</InterfaceNavLink><Location/></MemoryRouter>));
 const link=container.querySelector('a')!;await act(async()=>link.click());expect(click).toHaveBeenCalledTimes(1);expect(container.querySelector('output')!.textContent).toBe('/');expect(link.classList.contains('idle')).toBe(true);expect(link.textContent).toBe('Destino');
})
it('clears reduced-motion feedback on release without requiring animationend',async()=>{
 vi.stubGlobal('matchMedia',vi.fn(()=>({matches:true})));await act(async()=>root.render(<MemoryRouter><InterfaceLink to="/destination">Destino</InterfaceLink></MemoryRouter>));const link=container.querySelector('a')!;
 await act(async()=>link.dispatchEvent(new MouseEvent('pointerdown',{bubbles:true,button:0})));expect(link.classList.contains('is-feedback')).toBe(true);
 await act(async()=>link.dispatchEvent(new MouseEvent('pointerup',{bubbles:true,button:0})));expect(link.classList.contains('is-feedback')).toBe(false);
})
