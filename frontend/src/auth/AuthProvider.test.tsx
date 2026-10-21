// @vitest-environment jsdom
import { act,useContext,useEffect } from 'react'
import { createRoot,type Root } from 'react-dom/client'
import { afterEach,beforeEach,expect,it,vi } from 'vitest'
const mocks=vi.hoisted(()=>({auth:{currentUser:null as null|{uid:string;getIdToken:()=>Promise<string>}},listener:null as null|((user:unknown)=>void),mutation:vi.fn(),query:vi.fn(),profile:vi.fn(),access:vi.fn(),signOut:vi.fn()}))
vi.mock('../lib/firebase',()=>({auth:mocks.auth,firebaseApp:{}}))
vi.mock('firebase/auth',()=>({browserLocalPersistence:{},setPersistence:vi.fn(),sendPasswordResetEmail:vi.fn(),
 onIdTokenChanged:vi.fn((_auth,listener)=>{mocks.listener=listener;return vi.fn()}),
 signInWithEmailAndPassword:vi.fn(async()=>{mocks.auth.currentUser={uid:'actor',getIdToken:async()=>''};mocks.listener?.(mocks.auth.currentUser)}),signOut:()=>mocks.signOut()}))
vi.mock('firebase/data-connect',()=>({getDataConnect:()=>({}),mutationRef:(_dc:unknown,name:string,variables:unknown)=>({name,variables}),queryRef:(_dc:unknown,name:string,variables:unknown)=>({name,variables}),executeMutation:mocks.mutation,executeQuery:mocks.query}))
vi.mock('@insightpad/dataconnect',()=>({connectorConfig:{},getCurrentUser:mocks.profile,getCurrentUserAccess:mocks.access}))
vi.mock('./access-control',()=>({resolvePermissions:()=>({ESTOQUE:{canAccess:true}})}))
import { AuthProvider } from './AuthProvider'
import { AuthContext,type AuthContextValue } from './auth-context'
let context:AuthContextValue,root:Root,container:HTMLDivElement
const secret='a'.repeat(64),key='insightpad.device.session:actor'
function Probe(){const value=useContext(AuthContext)!;useEffect(()=>{context=value},[value]);return <span>{value.status}</span>}
const flush=async()=>{await act(async()=>{await Promise.resolve();await Promise.resolve()})}
beforeEach(async()=>{
 Object.assign(globalThis,{IS_REACT_ACT_ENVIRONMENT:true});localStorage.clear();vi.clearAllMocks();mocks.auth.currentUser=null
 const user={id:'actor',active:true,tenant:{id:'tenant',active:true},role:{id:'role',active:true}}
 mocks.profile.mockResolvedValue({data:{user}});mocks.access.mockResolvedValue({data:{user}})
 mocks.mutation.mockImplementation(async(ref:{name:string})=>({data:ref.name==='ClaimDeviceSession'?{query:{issued:{token:secret}},_execute:1}:{_execute:1}}))
 mocks.query.mockResolvedValue({data:{_select:[{valid:true}]}})
 mocks.signOut.mockImplementation(async()=>{mocks.auth.currentUser=null;mocks.listener?.(null)})
 container=document.createElement('div');document.body.append(container);root=createRoot(container)
 await act(async()=>root.render(<AuthProvider><Probe/></AuthProvider>))
})
afterEach(async()=>{await act(async()=>root.unmount());container.remove()})
it('claims once on login and heartbeats on focus without reclaiming; logout releases the same secret',async()=>{
 await act(async()=>context.signIn('actor@example.invalid','password'));await flush()
 expect(context.status).toBe('authenticated');expect(localStorage.getItem(key)).toBe(secret)
 const claims=()=>mocks.mutation.mock.calls.filter(c=>c[0].name==='ClaimDeviceSession')
 expect(claims()).toHaveLength(1);expect(claims()[0]![0].variables).not.toHaveProperty('sessionToken')
 await act(async()=>window.dispatchEvent(new Event('focus')));await flush();expect(claims()).toHaveLength(1)
 expect(mocks.mutation).toHaveBeenCalledWith({name:'TouchDeviceSession',variables:{sessionToken:secret}})
 await act(async()=>context.signOut());expect(localStorage.getItem(key)).toBeNull()
 expect(mocks.mutation).toHaveBeenCalledWith({name:'ReleaseDeviceSession',variables:{sessionToken:secret}})
})
it.each([false,true])('restored auth never silently claims a missing/displaced lease (stored=%s)',async(stored)=>{
 if(stored)localStorage.setItem(key,secret);mocks.query.mockResolvedValue({data:{_select:[{valid:false}]}})
 vi.spyOn(console,'error').mockImplementation(()=>{});mocks.auth.currentUser={uid:'actor',getIdToken:async()=>''}
 await act(async()=>mocks.listener?.(mocks.auth.currentUser));await flush()
 expect(mocks.signOut).toHaveBeenCalled();expect(context.status).not.toBe('authenticated')
 expect(mocks.mutation.mock.calls.filter(c=>c[0].name==='ClaimDeviceSession')).toHaveLength(0);vi.restoreAllMocks()
})
it('does not restore profile or secret when a pending claim completes after logout',async()=>{
 let finish!:(value:unknown)=>void;mocks.mutation.mockImplementationOnce(()=>new Promise(resolve=>{finish=resolve}))
 await act(async()=>context.signIn('actor@example.invalid','password'));await flush();expect(finish).toBeTypeOf('function')
 let logout!:Promise<void>;await act(async()=>{logout=context.signOut();await Promise.resolve()});await act(async()=>{finish({data:{query:{issued:{token:secret}},_execute:1}});await logout});await flush()
 expect(context.status).toBe('unauthenticated');expect(localStorage.getItem(key)).toBeNull();expect(context.profile).toBeNull();expect(mocks.mutation).toHaveBeenCalledWith({name:'ReleaseDeviceSession',variables:{sessionToken:secret}});expect(mocks.mutation.mock.invocationCallOrder.at(-1)).toBeLessThan(mocks.signOut.mock.invocationCallOrder[0]!)
})

it.each([false,true])('late logout A preserves a newer same-user login B (release fails=%s)',async(fails)=>{
 await act(async()=>context.signIn('a@example.invalid','password'));await flush();
 let done!:(v:unknown)=>void,fail!:(e:Error)=>void;
 const later='b'.repeat(64);mocks.mutation.mockImplementation((ref:{name:string})=>ref.name==='ReleaseDeviceSession'?new Promise((resolve,reject)=>{done=resolve;fail=reject}):Promise.resolve({data:{query:{issued:{token:later}},_execute:1}}));
 const warning=vi.spyOn(console,'warn').mockImplementation(()=>{});
 let logout!:Promise<void>;await act(async()=>{logout=context.signOut();await Promise.resolve()});
 await act(async()=>context.signIn('a@example.invalid','password'));await flush();
 expect(context.status).toBe('authenticated');expect(localStorage.getItem(key)).toBe(later);
 await act(async()=>{if(fails)fail(new Error('network'));else done({data:{_execute:1}});await logout});await flush();
 expect(mocks.mutation).toHaveBeenCalledWith({name:'ReleaseDeviceSession',variables:{sessionToken:secret}});
 expect(localStorage.getItem(key)).toBe(later);expect(context.status).toBe('authenticated');expect(mocks.auth.currentUser?.uid).toBe('actor');expect(mocks.signOut).not.toHaveBeenCalled();warning.mockRestore();
})
it.each([false,true])('late pending claim A and failed compensation cannot erase B (release fails=%s)',async(fails)=>{
 let finishA!:(v:unknown)=>void;const later='b'.repeat(64),warning=vi.spyOn(console,'warn').mockImplementation(()=>{});
 mocks.mutation.mockImplementationOnce(()=>new Promise(resolve=>{finishA=resolve}));
 await act(async()=>context.signIn('a@example.invalid','password'));await flush();let logout!:Promise<void>;
 await act(async()=>{logout=context.signOut();await Promise.resolve()});
 mocks.mutation.mockImplementation(async(ref:{name:string})=>{if(ref.name==='ReleaseDeviceSession'&&fails)throw Error('network');return {data:{query:{issued:{token:later}},_execute:1}}});
 await act(async()=>context.signIn('a@example.invalid','password'));await flush();expect(localStorage.getItem(key)).toBe(later);
 await act(async()=>{finishA({data:{query:{issued:{token:secret}},_execute:1}});await logout});await flush();
 expect(mocks.mutation).toHaveBeenCalledWith({name:'ReleaseDeviceSession',variables:{sessionToken:secret}});expect(localStorage.getItem(key)).toBe(later);expect(context.status).toBe('authenticated');expect(mocks.signOut).not.toHaveBeenCalled();warning.mockRestore();
})
it('a delayed logout for one UID cannot sign out a different UID or remove its credential',async()=>{
 await act(async()=>context.signIn('a@example.invalid','password'));await flush();let done!:(v:unknown)=>void;
 mocks.mutation.mockImplementationOnce(()=>new Promise(resolve=>{done=resolve}));let logout!:Promise<void>;await act(async()=>{logout=context.signOut();await Promise.resolve()});
 const second={uid:'second',getIdToken:async()=>''};mocks.auth.currentUser=second;localStorage.setItem('insightpad.device.session:second','b'.repeat(64));
 const user={id:'second',active:true,tenant:{id:'tenant',active:true},role:{id:'role',active:true}};mocks.profile.mockResolvedValue({data:{user}});mocks.access.mockResolvedValue({data:{user}});
 await act(async()=>mocks.listener?.(second));await flush();await act(async()=>{done({data:{_execute:1}});await logout});await flush();
 expect(mocks.auth.currentUser).toBe(second);expect(localStorage.getItem('insightpad.device.session:second')).toBe('b'.repeat(64));expect(context.status).toBe('authenticated');expect(mocks.signOut).not.toHaveBeenCalled();
})
