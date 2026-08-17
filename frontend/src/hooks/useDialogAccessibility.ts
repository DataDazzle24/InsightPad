import { useEffect,useRef } from 'react'

const selector='button:not([disabled]),a[href],input:not([disabled]),select:not([disabled]),textarea:not([disabled]),[tabindex]:not([tabindex="-1"])'

export function useDialogAccessibility(active:boolean,onClose:()=>void){
 const closeRef=useRef(onClose)
 useEffect(()=>{closeRef.current=onClose},[onClose])

 useEffect(()=>{
  if(!active)return
  const previous=document.activeElement instanceof HTMLElement?document.activeElement:null
  const dialog=document.querySelector<HTMLElement>('[role="alertdialog"]:last-of-type,[role="dialog"]:last-of-type')
  const focusable=()=>Array.from(dialog?.querySelectorAll<HTMLElement>(selector)??[]).filter(element=>element.offsetParent!==null)
  window.setTimeout(()=>focusable()[0]?.focus(),0)
  const keydown=(event:KeyboardEvent)=>{
   if(event.key==='Escape'){event.preventDefault();closeRef.current();return}
   if(event.key!=='Tab')return
   const elements=focusable();if(!elements.length)return
   const first=elements[0],last=elements[elements.length-1]
   if(event.shiftKey&&document.activeElement===first){event.preventDefault();last.focus()}
   else if(!event.shiftKey&&document.activeElement===last){event.preventDefault();first.focus()}
  }
  document.addEventListener('keydown',keydown)
  return()=>{document.removeEventListener('keydown',keydown);previous?.focus()}
 },[active])
}
