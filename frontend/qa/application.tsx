import {createRoot} from 'react-dom/client'
import {HashRouter,Link} from 'react-router-dom'
import {useMemo,useState} from 'react'
import type {User} from 'firebase/auth'
import App from '../src/App'
import {AuthContext,type AuthContextValue,type UserProfile} from '../src/auth/auth-context'
import {ThemeProvider} from '../src/theme/ThemeProvider'
import {appRoutes} from '../src/config/pages'
import {qaState,resetFixtures,uuid} from './api'
import '../src/index.css'
import '../src/dev-adjustments.css'
import './review.css'
const profile:UserProfile={id:'qa-user',name:'OPERADOR FICTÍCIO QA',email:'qa@example.invalid',active:true,onboardingPending:false,tenant:{id:uuid(10),legalName:'EMPRESA FICTÍCIA QA',tradeName:'QA',active:true,timezone:'America/Sao_Paulo',currencyCode:'BRL'},role:{id:uuid(11),name:'Administrador QA',systemRole:true,hierarchyLevel:10,active:true}}
export function ApplicationQa(){
 const [mode,setMode]=useState('full'),[version,setVersion]=useState(0),[signed,setSigned]=useState(true)
 const permissions=useMemo(()=>Object.fromEntries(appRoutes.map((r,i)=>[r.pageKey,{page:{id:uuid(10000+i),pageKey:r.pageKey,displayName:r.pageKey,module:'QA',route:r.route,icon:'apps',displayOrder:i,requiresLogin:true,active:true},canAccess:mode!=='denied',canCreate:!['read','denied'].includes(mode),canUpdate:!['read','denied'].includes(mode),canDelete:!['read','denied'].includes(mode),canManage:!['read','denied'].includes(mode),canExport:mode==='full'}])),[mode])
 const context:AuthContextValue={firebaseUser:signed?{uid:'qa-user'} as User:null,profile:signed?profile:null,permissions,status:signed?'authenticated':'unauthenticated',error:null,canAccess:key=>permissions[key]?.canAccess===true,signIn:async()=>setSigned(true),signOut:async()=>setSigned(false),resetPassword:async()=>{}}
 return <><details className="qa-controls"><summary>QA completo · dados fictícios · sem backend</summary><p>SHA: <code>{import.meta.env.VITE_QA_SOURCE_SHA}</code></p><p>Auth/API mockados. Não usar dados ou credenciais reais. Este ambiente não comprova autorização ou integração implantada.</p>
 <label>Permissões <select aria-label="Permissões" value={mode} onChange={e=>{qaState.permissions=e.target.value;setMode(e.target.value)}}><option value="full">Completo</option><option value="noexport">Sem exportação</option><option value="read">Somente consulta</option><option value="denied">Sem acesso</option></select></label>
 <label><input type="checkbox" onChange={e=>{qaState.fail=e.target.checked;setVersion(x=>x+1)}}/>Falha sintética de API</label>
 <label><input type="checkbox" onChange={e=>{qaState.empty=e.target.checked;setVersion(x=>x+1)}}/>Dados vazios</label>
 <label><input type="checkbox" onChange={e=>qaState.ackLoss=e.target.checked}/>Perder primeira confirmação do estoque</label>
 <label><input type="checkbox" onChange={e=>qaState.delay=e.target.checked?1500:0}/>Resposta lenta</label>
 <button onClick={()=>{resetFixtures();setVersion(x=>x+1)}}>Restaurar fixtures</button><button onClick={()=>setSigned(x=>!x)}>{signed?'Exibir login mockado':'Entrar como usuário fictício'}</button>
 <p>Fixtures:151 categorias,151 subcategorias,501 movimentos,201 transferências,51 aniversariantes e1201 clientes semcomprar. Escritas somente em memória.</p><nav aria-label="Rotas QA">{appRoutes.filter(r=>['CAIXA','ESTOQUE','CAD_CATEGORIA','CAD_SUBCATEGORIA','CAD_PRODUTO','RELATORIOS_OPERACIONAIS'].includes(r.pageKey)).map(r=><Link key={r.pageKey} to={r.route}>{r.pageKey} </Link>)}</nav><p>Últimas chamadas:{qaState.logs.slice(-8).join(', ')}</p></details>
 <AuthContext.Provider value={context}><App key={version}/></AuthContext.Provider></>
}
Object.assign(window,{__insightpadQa:{state:qaState,reset:resetFixtures}})
// Navigation to unrelated services is disabled in this isolated fixture entry.
document.addEventListener('click',e=>{const a=(e.target as Element).closest?.('a');if(a&&a.href&&!a.href.startsWith(location.origin)&&!a.href.startsWith('blob:'))e.preventDefault()},true)
createRoot(document.getElementById('root')!).render(<HashRouter><ThemeProvider><ApplicationQa/></ThemeProvider></HashRouter>)
