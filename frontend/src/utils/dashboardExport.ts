import { isValidElement,type CSSProperties,type ReactNode } from 'react'
import { csvSafe } from './registration'
export function cellText(value:unknown):string{
 if(value==null||typeof value==='boolean')return ''
 if(Array.isArray(value))return value.map(cellText).join('')
 if(isValidElement<{children?:ReactNode}>(value))return cellText(value.props.children)
 return typeof value==='object'?'':String(value)
}
export function dashboardCsv(headers:string[],rows:unknown[][]){return '\uFEFF'+[headers,...rows].map(row=>row.map(value=>'"'+csvSafe(cellText(value)).replaceAll('"','""')+'"').join(';')).join('\n')}
export function downloadDashboardCsv(title:string,headers:string[],rows:unknown[][]){const a=document.createElement('a');a.href=URL.createObjectURL(new Blob([dashboardCsv(headers,rows)],{type:'text/csv;charset=utf-8'}));a.download=title+'.csv';a.click();URL.revokeObjectURL(a.href)}
export function heatmapStyle(value:number,values:number[]):CSSProperties{
 if(!Number.isFinite(value)||value===0)return {}
 const distinct=[...new Set(values.filter(Number.isFinite).map(Math.abs).filter(v=>v>0))].sort((a,b)=>a-b)
 const rank=Math.max(0,distinct.indexOf(Math.abs(value))),alpha=.08+.16*(distinct.length<=1?0:rank/(distinct.length-1))
 return {backgroundColor:`rgba(${value<0?'230, 136, 30':'36, 148, 132'}, ${alpha})`}
}
