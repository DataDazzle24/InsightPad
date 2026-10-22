import {act} from 'react'
import {expect,it,vi} from 'vitest'
it('boots the complete application with mock Auth/API and loads all delivery module routes',async()=>{
 Object.assign(globalThis,{IS_REACT_ACT_ENVIRONMENT:true});document.body.innerHTML='<div id="root"></div>';location.hash='#/';
 vi.spyOn(window,'print').mockImplementation(()=>{});
 await act(async()=>{await import('./application');await new Promise(r=>setTimeout(r,50))});
 expect(document.body.textContent).toContain('QA completo');expect(document.body.textContent).toContain('OPERADOR');
 for(const [path,text]of [['/cadastros/categorias','CATEGORIA QA'],['/cadastros/subcategorias','SUBCATEGORIA QA'],['/cadastros/produtos','PRODUTO QA'],['/estoque','PRODUTO QA'],['/dashboards/operacional','Faturamento'],['/vendas/frente-de-caixa','Caixa']]){
  const link=[...document.querySelectorAll('nav[aria-label="Rotas QA"] a')].find(a=>a.getAttribute('href')==='#'+path)!;
  expect(link,path).toBeDefined();await act(async()=>{link.dispatchEvent(new MouseEvent('click',{bubbles:true,button:0}))});
  await act(async()=>{await new Promise(r=>setTimeout(r,100))});
  await vi.waitFor(async()=>{await act(async()=>{await new Promise(r=>setTimeout(r,30))});expect(document.querySelector('.app-error-boundary')).toBeNull();expect(document.body.textContent,path).toMatch(new RegExp(text,'i'))},{timeout:4000,interval:50});
 }
})
