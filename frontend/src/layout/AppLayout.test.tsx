// @vitest-environment jsdom
import {act} from 'react';
import {createRoot,type Root} from 'react-dom/client';
import {MemoryRouter} from 'react-router-dom';
import {afterEach,beforeEach,describe,expect,it,vi} from 'vitest';
import type {PermissionMap} from '../auth/access-control';
import {ThemeProvider} from '../theme/ThemeProvider';
import {AppLayout} from './AppLayout';
const auth=vi.hoisted(()=>({
 profile:{name:'PESSOA DE TESTE',tenant:{tradeName:'EMPRESA DE TESTE',legalName:'RAZÃO SOCIAL DE TESTE'},role:{name:'PERFIL DE TESTE',systemRole:true,hierarchyLevel:10}},
 permissions:{} as PermissionMap,canAccess:vi.fn<(key:string)=>boolean>(),signOut:vi.fn<()=>Promise<void>>()
}));
vi.mock('../auth/useAuth',()=>({useAuth:()=>auth}));
vi.mock('../components/ChannelOrderNotifier',()=>({ChannelOrderNotifier:()=>null}));
let root:Root,container:HTMLDivElement;
const button=(name:string)=>{const b=[...container.querySelectorAll<HTMLButtonElement>('button')].find(x=>(x.getAttribute('aria-label')||x.textContent||'').includes(name));if(!b)throw Error(name);return b;};
const click=async(x:HTMLElement)=>act(async()=>x.click());
async function mount(route='/'){container=document.createElement('div');document.body.append(container);root=createRoot(container);await act(async()=>root.render(<MemoryRouter initialEntries={[route]}><ThemeProvider><AppLayout/></ThemeProvider></MemoryRouter>));}
async function open(){const trigger=button('Conta e sistema — abrir');trigger.focus();await click(trigger);return trigger;}
beforeEach(()=>{vi.stubGlobal('IS_REACT_ACT_ENVIRONMENT',true);vi.clearAllMocks();localStorage.clear();auth.canAccess.mockReturnValue(true);auth.signOut.mockResolvedValue(undefined);auth.profile.role.systemRole=true;auth.profile.role.hierarchyLevel=10;auth.permissions={};});
afterEach(async()=>{if(root)await act(async()=>root.unmount());container?.remove();vi.unstubAllGlobals();});
describe('B01–B06 global shell contracts',()=>{
 it('keeps home first, seven permitted modules and native active route links',async()=>{
  await mount('/estoque');const links=[...container.querySelectorAll<HTMLAnchorElement>('.legacy-header__nav a')];expect(links).toHaveLength(7);expect(links[0].getAttribute('aria-label')).toBe('Início');expect(links[2].getAttribute('aria-current')).toBe('page');expect(links[2].classList.contains('active')).toBe(true);expect(links.every(x=>!x.classList.contains('ip-nav-feedback'))).toBe(true);
 });
 it('keeps permission filtering and hides platform/client actions for a member profile',async()=>{
  auth.profile.role.systemRole=false;auth.profile.role.hierarchyLevel=20;auth.canAccess.mockImplementation(key=>key==='CAD_CATEGORIA');await mount();expect([...container.querySelectorAll('.legacy-header__nav a')].map(x=>x.getAttribute('aria-label'))).toEqual(['Início','Cadastros']);await open();expect(container.querySelector('.user-drawer__platform-link')).toBeNull();expect(container.querySelector('.drawer-client-area')).toBeNull();expect(container.querySelector('.user-drawer__pages')?.textContent).toContain('Nenhuma página disponível.');
 });
 it('keeps the administrator link, disabled client area and existing support destination',async()=>{
  await mount();await open();expect(container.querySelector('.user-drawer__platform-link')?.getAttribute('href')).toBe('/modulos/plataforma');expect(button('Área do cliente').disabled).toBe(true);const support=container.querySelector('.drawer-support');expect(support?.getAttribute('href')).toBe('https://wa.me/5521985795316');expect(support?.getAttribute('target')).toBe('_blank');expect(support?.getAttribute('rel')).toBe('noreferrer');
 });
 it('shows only accessible pages and omits the existing restricted access-management page',async()=>{
  const page=(pageKey:string,displayName:string)=>({page:{id:pageKey,pageKey,displayName,module:'QA',route:'/',icon:'apps',displayOrder:1,requiresLogin:true,active:true},canAccess:true,canCreate:false,canUpdate:false,canDelete:false,canExport:false,canManage:false});
  auth.permissions={CAD_CATEGORIA:page('CAD_CATEGORIA','Categoria autorizada'),GESTAO_ACESSOS:page('GESTAO_ACESSOS','Acesso reservado')};await mount();await open();const labels=[...container.querySelectorAll('.user-drawer__pages li')].map(x=>x.textContent);expect(labels).toEqual(['Categoria autorizada']);
 });
 it('moves theme access into the drawer and persists the existing preference',async()=>{
  localStorage.setItem('insightpad.theme','dark');await mount();expect(container.querySelector('.ip-top')?.querySelectorAll('button')).toHaveLength(1);await open();await click(button('Ativar tema claro'));expect(localStorage.getItem('insightpad.theme')).toBe('light');expect(container.querySelector('.app-frame')?.getAttribute('data-theme')).toBe('light');expect(auth.signOut).not.toHaveBeenCalled();await click(button('Fechar painel do usuário'));await open();expect(button('Ativar tema escuro').getAttribute('aria-pressed')).toBe('true');
 });
 it('restores trigger focus after close button, Escape and backdrop; inside click keeps dialog open',async()=>{
  await mount();const trigger=await open();const dialog=container.querySelector<HTMLElement>('[role=dialog]')!;expect(dialog.getAttribute('aria-modal')).toBe('true');await click(dialog);expect(container.querySelector('[role=dialog]')).not.toBeNull();await click(button('Fechar painel do usuário'));expect(document.activeElement).toBe(trigger);await open();await act(async()=>document.dispatchEvent(new KeyboardEvent('keydown',{key:'Escape',bubbles:true,cancelable:true})));expect(container.querySelector('[role=dialog]')).toBeNull();expect(document.activeElement).toBe(trigger);await open();await click(container.querySelector<HTMLElement>('.drawer-backdrop')!);expect(container.querySelector('[role=dialog]')).toBeNull();expect(document.activeElement).toBe(trigger);
 });
 it('keeps logout pending state and prevents repeated submission',async()=>{
  let complete!:()=>void;auth.signOut.mockImplementation(()=>new Promise<void>(r=>{complete=r;}));await mount();await open();await click(button('Sair do sistema'));expect(button('Saindo...').disabled).toBe(true);await click(button('Saindo...'));expect(auth.signOut).toHaveBeenCalledTimes(1);await act(async()=>complete());expect(button('Sair do sistema').disabled).toBe(false);
 });
});
