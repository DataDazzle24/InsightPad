// @vitest-environment jsdom
import { act } from 'react'
import { createRoot,type Root } from 'react-dom/client'
import { MemoryRouter } from 'react-router-dom'
import { beforeEach,afterEach,it,expect,vi } from 'vitest'
import * as exports from '../utils/dashboardExport'
import { DashboardHubPage } from './DashboardHubPage'
const mocks=vi.hoisted(()=>({financial:vi.fn(),operational:vi.fn(),canExport:true}))
vi.mock('firebase/data-connect',()=>({getDataConnect:()=>({}),queryRef:(_dc:unknown,name:string,vars:unknown)=>({name,vars}),executeQuery:(...args:unknown[])=>mocks.operational(...args)}))
vi.mock('../auth/useAuth',()=>({useAuth:()=>({permissions:{RELATORIOS_OPERACIONAIS:{canAccess:true,canExport:mocks.canExport}}})}))
vi.mock('../lib/firebase',()=>({firebaseApp:{}}))
vi.mock('@insightpad/dataconnect',()=>({connectorConfig:{},financialIndicatorsDashboard:(...args:unknown[])=>mocks.financial(...args)}))
let root:Root,container:HTMLDivElement
beforeEach(()=>{mocks.canExport=true;vi.useFakeTimers();vi.stubGlobal('IS_REACT_ACT_ENVIRONMENT',true);mocks.financial.mockResolvedValue({data:{_select:[{data:{options:{branches:[],products:[],categories:[],subcategories:[],suppliers:[],sources:[]},cards:{volume:1,revenueCents:'100',providerFeeCents:'0',netRevenueCents:'100',costCents:'50',grossProfitCents:'50',profitCents:'50',marginPercent:50,ticketCents:'100',financialPendingSales:0},monthly:{lastVolume:1,averageVolume:1,volumeGrowth:0,lastProfitCents:'50',averageProfitCents:'50',profitGrowth:0,months:1},daily:[{date:'2026-10-20',volume:1,revenueCents:'100',profitCents:'50'}],products:[]}}]}});mocks.operational.mockReset()})
afterEach(async()=>{if(root)await act(async()=>root.unmount());container?.remove();vi.useRealTimers();vi.unstubAllGlobals();vi.restoreAllMocks()})
async function render(){container=document.createElement('div');document.body.append(container);root=createRoot(container);await act(async()=>root.render(<MemoryRouter><DashboardHubPage/></MemoryRouter>));await act(async()=>{await vi.advanceTimersByTimeAsync(0)})}
async function click(el:Element){await act(async()=>el.dispatchEvent(new MouseEvent('click',{bubbles:true})));await act(async()=>{await vi.advanceTimersByTimeAsync(0)})}
it('places icon navigation in the heading and exposes six KPIs, year grouping and print action',async()=>{
 const print=vi.spyOn(window,'print').mockImplementation(()=>{});await render();expect(container.querySelector('.finance-heading nav')).not.toBeNull();expect(container.querySelector('button[aria-label="Vendas"]')?.getAttribute('title')).toBe('Vendas');expect(container.querySelectorAll('.finance-kpis article')).toHaveLength(6);expect(container.querySelector('[aria-label="Agrupar período"]')).not.toBeNull();expect(container.querySelector('[aria-label="Métricas do gráfico"]')).not.toBeNull();
 await click([...container.querySelectorAll('button')].find(x=>x.textContent==='Ano')!);expect(container.textContent).toContain('Visão anual');await click([...container.querySelectorAll('button')].find(x=>x.textContent==='PDF')!);expect(print).toHaveBeenCalledOnce();expect(container.querySelector('.finance-workspace .finance-table-card button')?.textContent).toBe('CSV');
})
it('a failed operational view does not prevent loading the next view',async()=>{
 mocks.operational.mockRejectedValueOnce(new Error('fixture failure'));await render();await click(container.querySelector('button[aria-label="Estoque"]')!);expect(container.textContent).toContain('Não foi possível calcular este painel.');mocks.operational.mockResolvedValue({data:{_select:[{data:{stock:{cards:{},monthly:[],products:[]},customers:{cards:{},abc:[],regions:[],birthdays:[],dormant:[]},categories:[]}}]}});await click(container.querySelector('button[aria-label="Categorias"]')!);expect(container.textContent).toContain('Nenhum dado no período.');expect(container.textContent).not.toContain('Não foi possível calcular este painel.');expect(mocks.operational).toHaveBeenCalledTimes(2);
})

it('blocks CSV and print controls with canExport=false in every dashboard tab',async()=>{
 mocks.canExport=false;const print=vi.spyOn(window,'print').mockImplementation(()=>{});const download=vi.spyOn(HTMLAnchorElement.prototype,'click').mockImplementation(()=>{});
 mocks.operational.mockResolvedValue({data:{_select:[{data:{stock:{cards:{},monthly:[],products:[]},customers:{cards:{},abc:[],regions:[],birthdays:[],dormant:[]},categories:[],options:{branches:[],connections:[]},cards:{},daily:[],byChannel:[],fees:[],payments:[],topProducts:[]}}]}});
 await render();
 for(const name of ['Vendas','Estoque','Clientes','Categorias','Canais']){
  await click(container.querySelector(`button[aria-label="${name}"]`)!);
  const buttons=[...container.querySelectorAll('button')].filter(b=>['CSV','PDF'].includes(b.textContent?.trim()??''));expect(buttons.length).toBeGreaterThan(0);
  for(const button of buttons){expect(button.disabled).toBe(true);button.disabled=false;await click(button)}
 }
 expect(print).not.toHaveBeenCalled();expect(download).not.toHaveBeenCalled();
})
it.each([ [51,101],[501,1201] ])('exports complete caller datasets (%s birthdays/%s dormant) and renders all rows for print',async(birthdays,dormant)=>{
 const csv=vi.spyOn(exports,'downloadDashboardCsv').mockImplementation(()=>{});
 mocks.operational.mockResolvedValue({data:{_select:[{data:{customers:{cards:{},abc:[],regions:[],birthdays:Array.from({length:birthdays},(_,i)=>({name:'Aniversariante '+i,birthDate:'2000-01-01'})),dormant:Array.from({length:dormant},(_,i)=>({name:'Inativo '+i,lastPurchase:null,revenueCents:0}))}}}]}});
 await render();await click(container.querySelector('button[aria-label="Clientes"]')!);
 for(const [label,count] of [['Aniversariantes',birthdays],['Clientes sem comprar',dormant]] as const){
  const article=[...container.querySelectorAll('article')].find(a=>a.querySelector('header span')?.textContent===label)!;expect(article.querySelectorAll('tbody tr')).toHaveLength(count);
  await click(article.querySelector('button')!);expect(csv.mock.calls.at(-1)![2]).toHaveLength(count);
 }
 expect(container.textContent).toContain('Aniversariante '+(birthdays-1));expect(container.textContent).toContain('Inativo '+(dormant-1));
})

it('exposes all seven category columns in a named keyboard-focusable scrolling region',async()=>{
 mocks.operational.mockResolvedValue({data:{_select:[{data:{categories:[{id:'qa',name:'Categoria sintética',level:'Categoria',quantity:1,revenueCents:'100',costCents:'80',profitCents:'20',marginPercent:20,growthPercent:0}]}}]}});
 await render();await click(container.querySelector('button[aria-label="Categorias"]')!);
 const region=container.querySelector('[role="region"][tabindex="0"]')!;expect(region).not.toBeNull();expect(region.getAttribute('aria-label')).toContain('tabela completa');expect(region.querySelectorAll('th')).toHaveLength(7);
})
