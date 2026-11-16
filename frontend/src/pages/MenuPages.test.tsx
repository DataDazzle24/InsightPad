// @vitest-environment jsdom
import {act,type ReactNode} from 'react'
import {createRoot,type Root} from 'react-dom/client'
import {MemoryRouter} from 'react-router-dom'
import {afterEach,beforeEach,expect,it,vi} from 'vitest'
import {DashboardPage} from './DashboardPage'
import {ModuleMenuPage} from './ModuleMenuPage'
import {PlatformAdminMenuPage} from './PlatformAdminMenuPage'
const auth=vi.hoisted(()=>({profile:{name:'PESSOA QA'},canAccess:vi.fn<(key:string)=>boolean>()}))
vi.mock('../auth/useAuth',()=>({useAuth:()=>auth}))
let root:Root,container:HTMLDivElement
async function mount(child:ReactNode){container=document.createElement('div');document.body.append(container);root=createRoot(container);await act(async()=>root.render(<MemoryRouter>{child}</MemoryRouter>))}
const hrefs=()=>[...container.querySelectorAll('a')].map(a=>a.getAttribute('href'))
beforeEach(()=>{vi.stubGlobal('IS_REACT_ACT_ENVIRONMENT',true);auth.canAccess.mockReturnValue(true)})
afterEach(async()=>{if(root)await act(async()=>root.unmount());container?.remove();vi.unstubAllGlobals()})
it('preserves Home order, direct stock destination and brand composition',async()=>{await mount(<DashboardPage/>);expect(hrefs()).toEqual(['/modulos/vendas','/estoque','/modulos/financeiro','/modulos/cadastros','/modulos/dashboards','/modulos/canais']);expect(container.querySelector('.home-menu__welcome')?.textContent).toBe('Bem-vindo,PESSOA');expect(container.querySelector('img')?.getAttribute('src')).toBe('/brand/insight-pad-interface.png');expect(container.querySelector('.ip-slogan')?.textContent).toBe('DADOS PARA O PRESENTE.INSIGHTS PARA O FUTURO.')})
it('filters Home cards by existing page permissions',async()=>{auth.canAccess.mockImplementation(key=>key==='CAD_CATEGORIA');await mount(<DashboardPage/>);expect(hrefs()).toEqual(['/modulos/cadastros'])})
it('keeps a one-item submenu without fillers',async()=>{auth.canAccess.mockImplementation(key=>key==='CAD_CATEGORIA');await mount(<ModuleMenuPage moduleKey="cadastros"/>);expect(hrefs()).toEqual(['/cadastros/categorias']);expect(container.querySelectorAll('.legacy-module__grid > *')).toHaveLength(1)})
for(const [moduleKey,expected]of[
 ['vendas',['/vendas/frente-de-caixa','/vendas/registros']],['financeiro',['/financeiro/contas-a-pagar','/financeiro/contas-a-receber']],['cadastros',['/cadastros/categorias','/cadastros/subcategorias','/cadastros/produtos','/cadastros/clientes','/cadastros/fornecedores','/cadastros/filiais']],['dashboards',['/dashboards/operacional']],['canais',['/integracoes/canais/pedidos','/integracoes/canais/conexoes']],
] as const)it(`preserves ${moduleKey} destinations and order`,async()=>{await mount(<ModuleMenuPage moduleKey={moduleKey}/>);expect(hrefs()).toEqual(expected)})
it('preserves the three platform destinations',async()=>{await mount(<PlatformAdminMenuPage/>);expect(hrefs()).toEqual(['/plataforma/empresas-ambientes','/plataforma/cobrancas-baixas','/plataforma/gestao-usuarios/usuarios'])})
