// @vitest-environment jsdom
import { act, useRef } from 'react';
import { createRoot, type Root } from 'react-dom/client';
import { beforeEach, afterEach, expect, it, vi } from 'vitest';
import { useDashboardMeasurements, usePlotDimensions } from './useDashboardMeasurements';

let root:Root, host:HTMLDivElement;
let frames:Map<number,FrameRequestCallback>, nextFrame:number;
let callbacks:Array<()=>void>, disconnects:Array<ReturnType<typeof vi.fn>>;
let fonts:EventTarget & {ready:Promise<void>}, previousFonts:PropertyDescriptor|undefined;
let diameter:number, textWidth:number, lineWidths:number[]|undefined;
function Fixture({revision='initial'}:{revision?:string}) {
 const ref=useRef<HTMLElement>(null);
 useDashboardMeasurements(ref,revision);
 return <section ref={element=>{ref.current=element;if(element)Object.defineProperty(element,'clientWidth',{value:500,configurable:true})}} style={{padding:'10px 20px'}}>
  <nav className="dv-nav"><button aria-pressed="true" data-rect="active">View</button></nav>
  <div className="dv-sub-line" style={{columnGap:9}}><nav className="dv-subnav" style={{columnGap:4,padding:'0 4px',border:'1px solid'}}><button data-rect="button">One</button><button data-rect="button">Two</button></nav><button className="dv-pager" data-rect="pager">Panel</button></div>
  <div className="dv-donut-graphic"><svg data-rect="svg"/><div className="dv-donut-total"><strong style={{fontSize:21}}>R$ 1.234,56</strong></div></div>
 </section>;
}
async function measure() {
 await act(async()=>{});
 const pending=[...frames.values()];frames.clear();
 await act(async()=>pending.forEach(fn=>fn(0)));
}
beforeEach(()=>{
 vi.stubGlobal('IS_REACT_ACT_ENVIRONMENT',true);frames=new Map();nextFrame=0;callbacks=[];disconnects=[];diameter=220;textWidth=100;lineWidths=undefined;
 vi.stubGlobal('requestAnimationFrame',(cb:FrameRequestCallback)=>{frames.set(++nextFrame,cb);return nextFrame});
 vi.stubGlobal('cancelAnimationFrame',(id:number)=>frames.delete(id));
 vi.stubGlobal('ResizeObserver',class {constructor(callback:()=>void){callbacks.push(callback);disconnects.push(this.disconnect)}observe=vi.fn();disconnect=vi.fn()});
 fonts=Object.assign(new EventTarget(),{ready:Promise.resolve()});previousFonts=Object.getOwnPropertyDescriptor(document,'fonts');Object.defineProperty(document,'fonts',{value:fonts,configurable:true});
 vi.spyOn(Element.prototype,'getBoundingClientRect').mockImplementation(function(this:HTMLElement){const kind=this.dataset.rect;return new DOMRect(kind==='active'?260:100,0,kind==='svg'?diameter:kind==='pager'||kind==='button'?80:500,kind==='svg'?diameter:40)});
 vi.spyOn(Element.prototype,'getClientRects').mockImplementation(function(this:HTMLElement){const box=this.getBoundingClientRect();return {0:box,length:1,item:(index:number)=>index===0?box:null} as DOMRectList});
 vi.spyOn(document,'createRange').mockImplementation(()=>({selectNodeContents:vi.fn(),getBoundingClientRect:()=>new DOMRect(0,0,textWidth,20),getClientRects:()=>(lineWidths??[textWidth]).map(width=>new DOMRect(0,0,width,20))}) as unknown as Range);
 host=document.createElement('div');document.body.append(host);root=createRoot(host);
});
afterEach(async()=>{await act(async()=>root.unmount());host.remove();if(previousFonts)Object.defineProperty(document,'fonts',previousFonts);else Reflect.deleteProperty(document,'fonts');vi.restoreAllMocks();vi.unstubAllGlobals()});
it('clamps the active submenu to intrinsic button and pager widths, and fits the donut without changing data',async()=>{
 await act(async()=>root.render(<Fixture/>));await measure();
 expect(host.querySelector<HTMLElement>('.dv-sub-line')!.style.getPropertyValue('--dv-submenu-offset')).toBe('140px');
 const graphic=host.querySelector<HTMLElement>('.dv-donut-graphic')!;expect(graphic.classList.contains('is-compact')).toBe(false);expect(graphic.style.getPropertyValue('--dv-donut-font')).toBe('21px');
 diameter=150;textWidth=400;callbacks.forEach(callback=>callback());await measure();
 expect(graphic.classList.contains('is-compact')).toBe(true);expect(graphic.style.getPropertyValue('--dv-donut-font')).toBe('12px');expect(graphic.textContent).toBe('R$ 1.234,56');
 diameter=220;textWidth=100;lineWidths=[100,100,100];callbacks.forEach(callback=>callback());await measure();expect(graphic.classList.contains('is-compact')).toBe(true);expect(graphic.textContent).toBe('R$ 1.234,56');
});
it('disconnects observers/listeners and cancels frames on rerender and unmount, including deferred font work',async()=>{
 const remove=vi.spyOn(fonts,'removeEventListener'),windowRemove=vi.spyOn(window,'removeEventListener');
 await act(async()=>root.render(<Fixture/>));await measure();callbacks[0]();expect(frames.size).toBe(1);
 await act(async()=>root.render(<Fixture revision="new-page"/>));await measure();expect(disconnects[0]).toHaveBeenCalledOnce();
 const late=callbacks.at(-1)!;late();await act(async()=>root.unmount());expect(frames.size).toBe(0);expect(disconnects.at(-1)).toHaveBeenCalledOnce();late();fonts.dispatchEvent(new Event('loadingdone'));await act(async()=>{});expect(frames.size).toBe(0);expect(remove).toHaveBeenCalledWith('loadingdone',expect.any(Function));expect(windowRemove).toHaveBeenCalledWith('resize',expect.any(Function));
 // afterEach may safely unmount an already-unmounted root.
});

it('resizes only the plot pixel geometry and stops observing after unmount',async()=>{
 function Plot(){const ref=useRef<SVGSVGElement>(null);const size=usePlotDimensions(ref);return <><svg ref={ref} data-rect="svg"/><output>{size.width}×{size.height}</output></>}
 await act(async()=>root.render(<Plot/>));await measure();expect(host.querySelector('output')!.textContent).toBe('220×220');
 diameter=310;callbacks[0]();await measure();expect(host.querySelector('output')!.textContent).toBe('310×310');
 await act(async()=>root.unmount());expect(disconnects[0]).toHaveBeenCalledOnce();callbacks[0]();expect(frames.size).toBe(0);
});
