import {useEffect} from 'react'

// Complement legacy focus traps without changing their keyboard/Escape behavior.
// Each active modal isolates its siblings along the path to body. Nested modals
// keep their ancestor available and isolate only the ancestor's other content.
export function useModalIsolation(){
 useEffect(()=>{
  const selector='[role="dialog"][aria-modal="true"],[role="alertdialog"][aria-modal="true"]'
  let previous:HTMLElement|null=document.activeElement instanceof HTMLElement?document.activeElement:null
  let stack:HTMLElement[]=[]
  const openers=new Map<HTMLElement,HTMLElement|null>(),changed=new Map<HTMLElement,boolean>()
  const restore=()=>{for(const [node,inert]of changed)node.inert=inert;changed.clear()}
  const synchronize=()=>{
   const next=[...document.querySelectorAll<HTMLElement>(selector)].filter(e=>e.isConnected)
   const removed=stack.filter(e=>!next.includes(e)),top=next.at(-1)
   for(const dialog of next)if(!openers.has(dialog))openers.set(dialog,previous)
   restore()
   if(top)for(let node:HTMLElement|null=top;node?.parentElement;node=node.parentElement){
    for(const sibling of node.parentElement.children)if(sibling instanceof HTMLElement&&sibling!==node&&!['SCRIPT','STYLE','LINK'].includes(sibling.tagName)){
     if(!changed.has(sibling))changed.set(sibling,sibling.inert)
     sibling.inert=true
    }
    if(node.parentElement===document.body)break
   }
   stack=next
   // Legacy effect cleanup can run before background inertness is removed.
   // Restore afterwards, but never move focus outside a remaining nested modal.
   for(const dialog of removed.reverse()){
    const opener=openers.get(dialog);openers.delete(dialog)
    if(opener?.isConnected&&!opener.closest('[inert]')&&(!top||top.contains(opener))){opener.focus();previous=opener;break}
   }
  }
  const focus=(event:FocusEvent)=>{
   const target=event.target;if(!(target instanceof HTMLElement))return
   const dialogs=[...document.querySelectorAll<HTMLElement>(selector)]
   for(const dialog of dialogs)if(!openers.has(dialog))openers.set(dialog,previous)
   previous=target
  }
  document.addEventListener('focusin',focus,true)
  const observer=new MutationObserver(synchronize);observer.observe(document.body,{subtree:true,childList:true})
  synchronize()
  return()=>{observer.disconnect();document.removeEventListener('focusin',focus,true);restore()}
 },[])
}
