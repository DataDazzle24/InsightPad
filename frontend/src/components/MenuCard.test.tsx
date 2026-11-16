// @vitest-environment jsdom
import {act} from 'react'
import {createRoot,type Root} from 'react-dom/client'
import {MemoryRouter,useLocation} from 'react-router-dom'
import {afterEach,beforeEach,describe,expect,it,vi} from 'vitest'
import {MenuCard} from './MenuCard'
let root:Root,container:HTMLDivElement
function Location(){return <output data-location>{useLocation().pathname}</output>}
async function mount(){container=document.createElement('div');document.body.append(container);root=createRoot(container);await act(async()=>root.render(<MemoryRouter><MenuCard to="/cadastros/produtos" label="Produtos" description="Gerencie o catálogo" icon="sell"/><Location/></MemoryRouter>))}
const link=()=>container.querySelector<HTMLAnchorElement>('a')!
const location=()=>container.querySelector('[data-location]')?.textContent
async function click(options:MouseEventInit={}){
 const event=new MouseEvent('click',{bubbles:true,cancelable:true,button:0,...options});let preventedByRouter=false
 // Observe React's result, then stop jsdom's unsupported native hyperlink task.
 document.addEventListener('click',e=>{preventedByRouter=e.defaultPrevented;e.preventDefault()},{once:true})
 await act(async()=>{link().dispatchEvent(event)});return {defaultPrevented:preventedByRouter}
}
beforeEach(()=>{vi.stubGlobal('IS_REACT_ACT_ENVIRONMENT',true);vi.useFakeTimers();window.history.replaceState(null,'','/')})
afterEach(async()=>{if(root)await act(async()=>root.unmount());container?.remove();vi.useRealTimers();vi.unstubAllGlobals()})
describe('MenuCard native link and activation feedback',()=>{
 it('keeps href, decorative duplicate hidden and system icons',async()=>{await mount();expect(link().getAttribute('href')).toBe('/cadastros/produtos');expect(container.querySelector('.menus-card__face--filled')?.getAttribute('aria-hidden')).toBe('true');expect(container.querySelectorAll('.menus-card__icon')).toHaveLength(2);expect(container.querySelector('.menus-card__icon')?.textContent).toBe('sell')})
 it('shows pressed feedback and navigates only after 160ms',async()=>{await mount();const event=await click();expect(event.defaultPrevented).toBe(true);expect(link().classList.contains('menus-card--pressed')).toBe(true);await act(async()=>vi.advanceTimersByTime(159));expect(location()).toBe('/');await act(async()=>vi.advanceTimersByTime(1));expect(location()).toBe('/cadastros/produtos');expect(link().classList.contains('menus-card--pressed')).toBe(false)})
 it('ignores repeated simple activation while feedback is pending',async()=>{await mount();await click();await click();expect(vi.getTimerCount()).toBe(1);await act(async()=>vi.advanceTimersByTime(160));expect(location()).toBe('/cadastros/produtos');expect(vi.getTimerCount()).toBe(0)})
 for(const modifier of ['ctrlKey','metaKey','shiftKey','altKey'] as const)it(`preserves native ${modifier} click without timer or pressed state`,async()=>{await mount();const event=await click({[modifier]:true});expect(event.defaultPrevented).toBe(false);expect(vi.getTimerCount()).toBe(0);expect(location()).toBe('/');expect(link().classList.contains('menus-card--pressed')).toBe(false)})
 it('preserves middle-click behavior',async()=>{await mount();const event=await click({button:1});expect(event.defaultPrevented).toBe(false);expect(vi.getTimerCount()).toBe(0);expect(location()).toBe('/')})
 it('cancels pending feedback navigation on unmount',async()=>{await mount();await click();await act(async()=>root.render(<span>Outra página</span>));expect(vi.getTimerCount()).toBe(0);await act(async()=>vi.advanceTimersByTime(200));expect(container.textContent).toBe('Outra página')})
 it('does not replace another navigation during the feedback delay',async()=>{await mount();await click();window.history.pushState(null,'','/outra-rota');await act(async()=>vi.advanceTimersByTime(160));expect(location()).toBe('/');expect(window.location.pathname).toBe('/outra-rota')})
})
