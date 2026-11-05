// @vitest-environment jsdom
import { act } from 'react';
import { createRoot, type Root } from 'react-dom/client';
import { afterEach, beforeEach, expect, it, vi } from 'vitest';
import { DashboardSurface } from './DashboardSurface';
import { buildCategoryModel, buildChannelModel, buildCustomerModel, buildSalesModel, money, type SalesData } from './adapters';
import { compareRaw, lineSegments, smoothPath, toggleSelection } from './geometry';
import { dashboardViews } from './integration';
import type { DashboardActions, DashboardModel, View } from './model';

let root: Root, container: HTMLDivElement;
beforeEach(() => {vi.stubGlobal('IS_REACT_ACT_ENVIRONMENT', true); container=document.createElement('div');document.body.append(container);root=createRoot(container);});
afterEach(async()=>{await act(async()=>root.unmount());container.remove();vi.unstubAllGlobals();});
const actions=(): DashboardActions=>({onViewChange:vi.fn(),onBack:vi.fn(),onFilters:vi.fn(),onClear:vi.fn(),onDetails:vi.fn(),onPrint:vi.fn(),onExportTable:vi.fn()});
async function render(model:DashboardModel,a:DashboardActions,options:{view?:View;canExport?:boolean;busy?:boolean;filterResetToken?:number}={}){await act(async()=>root.render(<DashboardSurface model={model} actions={a} views={dashboardViews} view={options.view??'customers'} canExport={options.canExport??true} busy={options.busy??false} filterResetToken={options.filterResetToken} theme="dark" printSlot={<div>Relatório completo preservado</div>}/>));}
async function click(el:Element,init:MouseEventInit={}){await act(async()=>el.dispatchEvent(new MouseEvent('click',{bubbles:true,...init})));}
const button=(name:string)=>[...container.querySelectorAll('button')].find(e=>e.getAttribute('aria-label')===name||e.textContent===name)!;
function freeze<T>(value:T):T{if(value&&typeof value==='object'){Object.values(value).forEach(freeze);Object.freeze(value);}return value;}
const customer=()=>freeze({cards:{active:3,new:1,withoutPurchase:0,ticketCents:'9007199254740993',frequency:1200},abc:[{id:'a',name:'Cliente A',class:'A',purchases:1200,revenueCents:'9007199254740993',lastPurchase:null},{id:'b',name:'Cliente B',class:'B',purchases:3,revenueCents:'102',lastPurchase:'2026-10-20'},{id:'c',name:'Cliente C',class:'C',purchases:2,revenueCents:'101',lastPurchase:null}],regions:[{region:'Norte',customers:1200,revenueCents:'200'}],birthdays:[],dormant:[]});
it('uses received ABC classes, filters only that table and exports its ordered subset',async()=>{
 const model=buildCustomerModel(customer()),a=actions();await render(model,a);const kpis=container.querySelector('.dv-kpis')!.textContent;
 const abc=()=>container.querySelector('.dv-abc')!;const classes=()=>abc().querySelectorAll('button');
 expect([...classes()].map(e=>e.querySelector('strong')!.textContent)).toEqual(['1','1','1']);
 await click(classes()[0]);await click(button('Exportar CSV de Curva ABC'));expect(a.onExportTable).toHaveBeenLastCalledWith('customers-abc',['a']);
 await click(classes()[1],{metaKey:true});await click(button('Exportar CSV de Curva ABC'));expect(a.onExportTable).toHaveBeenLastCalledWith('customers-abc',['a','b']);
 await click(button('Combinar seleções'));await click(classes()[2]);await click(button('Exportar CSV de Curva ABC'));expect(a.onExportTable).toHaveBeenLastCalledWith('customers-abc',['a','b','c']);
 expect(container.querySelector('.dv-kpis')!.textContent).toBe(kpis);expect(customer().abc.map(r=>r.class)).toEqual(['A','B','C']);
 await click(button('Limpar filtros'));expect(a.onClear).toHaveBeenCalledOnce();expect([...classes()].every(e=>e.getAttribute('aria-pressed')==='false')).toBe(true);
 expect(model.pages[0].panels[0]).toMatchObject({kind:'table',rows:[{csv:['Cliente A','A',1200,'R$\u00a090.071.992.547.409,93','Nunca']},{id:'b'},{id:'c'}]});
});
it('rechecks export handlers when permissions, data availability or busy state change',async()=>{
 const model=buildCustomerModel(customer()),a=actions();
 for(const options of [{canExport:false},{busy:true},{canExport:false,busy:true}]){await render(model,a,options);for(const label of ['Exportar PDF','Exportar CSV de Curva ABC']){const b=button(label);expect(b.disabled).toBe(true);b.disabled=false;await click(b);b.disabled=true;}}
 expect(a.onPrint).not.toHaveBeenCalled();expect(a.onExportTable).not.toHaveBeenCalled();
 await render(buildCustomerModel({...customer(),abc:[]}),a);const b=button('Exportar CSV de Curva ABC');expect(b.disabled).toBe(true);b.disabled=false;await click(b);expect(a.onExportTable).not.toHaveBeenCalled();
});
it('resets only local ABC selection on controller clear while retaining table sort and metric state',async()=>{
 const model=buildCustomerModel(customer()),a=actions();const table=model.pages[0].panels[0];if(table.kind!=='table')throw Error();table.columns[3].sortable=true;
 await render(model,a);await click(container.querySelector('.dv-abc button')!);await click([...container.querySelectorAll('th button')][0]);await render(model,a,{filterResetToken:1});
 expect(container.querySelector('th[aria-sort="descending"]')?.textContent).toContain('Faturamento');expect(container.querySelector('.dv-abc [aria-pressed="true"]')).toBeNull();
 await click(button('Exportar CSV de Curva ABC'));expect(a.onExportTable).toHaveBeenLastCalledWith('customers-abc',['a','b','c']);
});
it('preserves exact Int64 sorting, cents and totals without mutating the received payload',()=>{
 const data=freeze({cards:{volume:2,revenueCents:'18014398509481985',providerFeeCents:'0',netRevenueCents:'18014398509481985',profitCents:'-1',marginPercent:0,ticketCents:'1',financialPendingSales:0},monthly:{lastVolume:0,averageVolume:1,volumeGrowth:-100,lastProfitCents:'-1',averageProfitCents:'3',profitGrowth:-133.33,months:2},daily:[],products:['9007199254740992','9007199254740993'].map((n,i)=>({id:String(i),name:'Produto '+i,quantity:1,revenueCents:n,providerFeeCents:'0',netRevenueCents:n,costCents:n,profitCents:i?'0':'-1',marginPercent:0}))}) satisfies SalesData;
 const model=buildSalesModel(data,[]),panel=model.pages[1].panels[0];if(panel.kind!=='table')throw Error();
 expect(money('9007199254740993')).toBe('R$ 90.071.992.547.409,93');expect(panel.totals?.[4]).toBe('R$ 180.143.985.094.819,85');expect(compareRaw('9007199254740993','9007199254740992')).toBe(1);
 expect([...panel.rows].sort((a,b)=>compareRaw(b.cells[4].raw,a.cells[4].raw)).map(r=>r.id)).toEqual(['1','0']);
 expect(data.products.map(r=>r.id)).toEqual(['0','1']);expect(model.pages[2].panels).toHaveLength(2);for(const comparison of model.pages[2].panels){if(comparison.kind==='comparison')expect(comparison.bars).toHaveLength(2);}
});
it('separates category levels, sorts exact money and keeps all seven columns',async()=>{
 const rows=freeze([{id:'cat1',name:'Categoria 1',level:'Categoria',quantity:1,revenueCents:'9007199254740992',costCents:'0',profitCents:'9007199254740992',marginPercent:100,growthPercent:1},{id:'cat2',name:'Categoria 2',level:'Categoria',quantity:2,revenueCents:'9007199254740993',costCents:'0',profitCents:'9007199254740993',marginPercent:100,growthPercent:2},{id:'sub',name:'Subcategoria',level:'Subcategoria',quantity:3,revenueCents:'18014398509481985',costCents:'0',profitCents:'0',marginPercent:0,growthPercent:0}]);
 const model=buildCategoryModel(rows);await render(model,actions(),{view:'categories'});const visible=model.pages[0].panels[1];if(visible.kind!=='table')throw Error();expect(visible.columns).toHaveLength(7);expect(visible.rows.map(r=>r.id)).toEqual(['cat1','cat2']);expect(container.querySelector('.dv-bars .dv-bar-row')?.textContent).toContain('Categoria 2');
 await click([...container.querySelectorAll('.dv-segment button')].find(b=>b.textContent==='Volume')!);expect(container.querySelector('.dv-bars .dv-bar-row')?.textContent).toContain('Categoria 2');
});
it('keeps channel fractional quantities and CSV identity text without drawing conversions',()=>{
 const model=buildChannelModel(freeze({cards:{orders:1.125},daily:[],byChannel:[{name:'Loja',branchName:'Filial',orders:1.125,sales:1,grossRevenueCents:'101',providerFeeCents:'1',financialAdjustmentsCents:'0',netRevenueCents:'100',profitCents:'-1'}],fees:[],payments:[],topProducts:[]}));const panel=model.pages[1].panels[0];if(panel.kind!=='table')throw Error();expect(panel.rows[0].cells[1].text).toBe('1,125');expect(panel.rows[0].csv?.[0]).toBe('LojaFilial');expect(panel.rows[0].csv?.at(-1)).toBe('-R$\u00a00,01');
});
it('does not bridge missing points, invent smoothing peaks or turn multiple selected days into an interval',()=>{
 expect(lineSegments([[0,0],[1,NaN],[2,3],[3,4]])).toEqual([[[0,0]],[[2,3],[3,4]]]);
 const path=smoothPath([[0,0],[1,1],[2,0]]);expect(path).not.toContain('NaN');expect(path).toContain('C');
 expect(toggleSelection(['day-1'],'day-3',true)).toEqual(['day-1','day-3']);
});
