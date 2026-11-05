import type { ReactNode } from 'react';
export type View = 'sales'|'channels'|'stock'|'customers'|'categories';
export type Art = 'finance'|'receipt'|'inventory'|'customers'|'store'|'shipping';
export type Value = string|number|null|undefined;
export interface Kpi { id:string; label:string; value:ReactNode; detail?:ReactNode; art:Art; tone?:'positive'|'negative' }
export interface Cell { text:ReactNode; raw?:Value; heat?:boolean }
export interface Row { id:string; cells:Cell[]; csv?:unknown[]; abc?:string }
export interface Column { label:string; numeric?:boolean; sortable?:boolean }
export interface TablePanel { kind:'table'; id:string; title:string; subtitle?:string; columns:Column[]; rows:Row[]; totals?:ReactNode[]; abc?:boolean; empty?:string; initialSort?:number; selectProduct?:boolean; sorting?:{column:number;onChange:(column:number)=>void} }
export interface LinePoint { id:string; label:string; values:Record<string,number>; formatted?:Record<string,string> }
export interface LineSeries { key:string; label:string; unit:'money'|'quantity'; format:(value:number)=>string }
export interface LinesPanel { kind:'lines'; id:string; title:string; points:LinePoint[]; series:LineSeries[]; periodSelectable?:boolean; controls?:ReactNode; visibility?:{keys:string[];onToggle:(key:string)=>void} }
export interface BarsPanel { kind:'bars'; id:string; title:string; rows:{id:string;label:string;revenue:number;profit:number;quantity:number;revenueRaw?:Value;profitRaw?:Value;revenueText?:string;profitText?:string}[] }
export interface DonutPanel { kind:'donut'; id:string; title:string; unitLabel:string; rows:{id:string;label:string;value:number;formatted:string}[]; total:string }
export interface ComparisonPanel { kind:'comparison'; id:string; title:string; value:string; detail:string; growth:number; bars:{id:string;label:string;value:number;formatted:string;highlight?:boolean}[]; note?:string }
export type Panel = TablePanel|LinesPanel|BarsPanel|DonutPanel|ComparisonPanel;
export interface Page { id:string; label:string; kpiIds?:string[]; panels:Panel[] }
export interface DashboardModel { title:string; kpis:Kpi[]; pages:Page[] }
export interface Interaction { additive:boolean }
export interface DashboardActions {
 onViewChange:(view:View)=>void; onBack:()=>void; onFilters:()=>void; onClear:()=>void; onDetails:()=>void;
 onPrint:()=>void; onRefresh?:()=>void;
 /** Controller must check its CURRENT permission/data/busy state again. */
 onExportTable?:(tableId:string,visibleOrderedRowIds:string[])=>void;
 onSelectProduct?:(id:string,interaction:Interaction)=>void;
 /** Only a contiguous interval supported by the current endpoint. */
 onSelectPeriod?:(id:string)=>void;
}
