// @vitest-environment jsdom
import { act,useContext,useEffect } from 'react'
import { createRoot,type Root } from 'react-dom/client'
import { afterEach,beforeEach,expect,it,vi } from 'vitest'
const mocks=vi.hoisted(()=>({auth:{currentUser:null as null|{uid:string;getIdToken:()=>Promise<string>}},listener:null as null|((user:unknown)=>void),mutation:vi.fn(),query:vi.fn(),profile:vi.fn(),access:vi.fn(),signOut:vi.fn(),signIn:vi.fn()}))
vi.mock('../lib/firebase',()=>({auth:mocks.auth,firebaseApp:{}}))
vi.mock('firebase/auth',()=>({browserLocalPersistence:{},setPersistence:vi.fn(),sendPasswordResetEmail:vi.fn(),
 onIdTokenChanged:vi.fn((_auth,listener)=>{mocks.listener=listener;return vi.fn()}),
 signInWithEmailAndPassword:(...args:unknown[])=>mocks.signIn(...args),signOut:()=>mocks.signOut()}))
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
 mocks.signIn.mockImplementation(async()=>{mocks.auth.currentUser={uid:'actor',getIdToken:async()=>''};mocks.listener?.(mocks.auth.currentUser)});
 mocks.signOut.mockImplementation(async()=>{mocks.auth.currentUser=null;mocks.listener?.(null)})
 vi.spyOn(window,'setInterval');container=document.createElement('div');document.body.append(container);root=createRoot(container)
 await act(async()=>root.render(<AuthProvider><Probe/></AuthProvider>))
})
afterEach(async()=>{await act(async()=>root.unmount());container.remove();vi.restoreAllMocks()})
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

it.each(['focus','visibilitychange','heartbeat'])('waits for a pending claim before signing out despite %s revalidation',async(event)=>{
 let finish!:(value:unknown)=>void;mocks.mutation.mockImplementationOnce(()=>new Promise(resolve=>{finish=resolve}));
 await act(async()=>context.signIn('actor@example.invalid','password'));await flush();
 let logout!:Promise<void>;await act(async()=>{logout=context.signOut();await Promise.resolve()});
 if(event==='heartbeat')await act(async()=>{const callback=vi.mocked(window.setInterval).mock.calls[0]![0] as ()=>void;callback()})
 else await act(async()=>{if(event==='focus')window.dispatchEvent(new Event('focus'));else document.dispatchEvent(new Event('visibilitychange'))});
 await flush();expect(mocks.signOut).not.toHaveBeenCalled();
 await act(async()=>{finish({data:{query:{issued:{token:secret}},_execute:1}});await logout});await flush();
 expect(mocks.mutation).toHaveBeenCalledWith({name:'ReleaseDeviceSession',variables:{sessionToken:secret}});
 expect(context.status).toBe('unauthenticated');expect(localStorage.getItem(key)).toBeNull();
});

it.each(['zero','error'])('logout drains an unsuccessful claim (%s) without inventing a credential',async(outcome)=>{
 let finish!:(v:unknown)=>void,fail!:(e:Error)=>void;mocks.mutation.mockImplementationOnce(()=>new Promise((resolve,reject)=>{finish=resolve;fail=reject}));
 const warning=vi.spyOn(console,'warn').mockImplementation(()=>{});
 await act(async()=>context.signIn('a@example.invalid','password'));await flush();let logout!:Promise<void>;
 await act(async()=>{logout=context.signOut();window.dispatchEvent(new Event('focus'))});await flush();expect(mocks.signOut).not.toHaveBeenCalled();
 await act(async()=>{if(outcome==='error')fail(Error('network'));else finish({data:{_execute:0}});await logout});await flush();
 expect(mocks.mutation.mock.calls.filter(c=>c[0].name==='ReleaseDeviceSession')).toHaveLength(0);expect(warning).toHaveBeenCalled();expect(context.status).toBe('unauthenticated');expect(localStorage.getItem(key)).toBeNull();
});
it.each(['valid','zero','error'])('a late validation %s cannot touch the old lease or end a new login',async(outcome)=>{
 await act(async()=>context.signIn('a@example.invalid','password'));await flush();let finish!:(v:unknown)=>void,fail!:(e:Error)=>void;
 mocks.query.mockImplementationOnce(()=>new Promise((resolve,reject)=>{finish=resolve;fail=reject}));
 await act(async()=>window.dispatchEvent(new Event('focus')));await flush();
 let logout!:Promise<void>;await act(async()=>{logout=context.signOut();await Promise.resolve()});
 mocks.mutation.mockImplementation(async()=>({data:{query:{issued:{token:'b'.repeat(64)}},_execute:1}}));
 await act(async()=>context.signIn('a@example.invalid','password'));await flush();
 const warning=vi.spyOn(console,'warn').mockImplementation(()=>{});
 await act(async()=>{if(outcome==='error')fail(Error('network'));else finish({data:{_select:outcome==='valid'?[{valid:true}]:[]}});await logout});await flush();
 expect(localStorage.getItem(key)).toBe('b'.repeat(64));expect(context.status).toBe('authenticated');expect(mocks.signOut).not.toHaveBeenCalled();
 expect(mocks.mutation.mock.calls.filter(c=>c[0].name==='TouchDeviceSession')).toHaveLength(0);warning.mockRestore();
});
it.each(['success','zero','error'])('late release %s preserves B and only reports proven remote completion',async(outcome)=>{
 await act(async()=>context.signIn('a@example.invalid','password'));await flush();let finish!:(v:unknown)=>void,fail!:(e:Error)=>void;
 const warning=vi.spyOn(console,'warn').mockImplementation(()=>{});
 mocks.mutation.mockImplementationOnce(()=>new Promise((resolve,reject)=>{finish=resolve;fail=reject}));let logout!:Promise<void>;
 await act(async()=>{logout=context.signOut();await Promise.resolve()});mocks.mutation.mockResolvedValue({data:{query:{issued:{token:'b'.repeat(64)}},_execute:1}});
 await act(async()=>context.signIn('b@example.invalid','password'));await flush();
 await act(async()=>{if(outcome==='error')fail(Error('network'));else finish({data:{_execute:outcome==='zero'?0:1}});await logout});await flush();
 expect(context.status).toBe('authenticated');expect(localStorage.getItem(key)).toBe('b'.repeat(64));expect(mocks.signOut).not.toHaveBeenCalled();expect(warning.mock.calls.length>0).toBe(outcome!=='success');
});
it('waits for an already-started Firebase exit before starting the next login',async()=>{
 await act(async()=>context.signIn('a@example.invalid','password'));await flush();let finish!:()=>void;
 mocks.signOut.mockImplementationOnce(()=>new Promise<void>(resolve=>{finish=()=>{mocks.auth.currentUser=null;mocks.listener?.(null);resolve()}}));
 let logout!:Promise<void>;await act(async()=>{logout=context.signOut();await Promise.resolve()});await flush();expect(finish).toBeTypeOf('function');
 mocks.mutation.mockResolvedValue({data:{query:{issued:{token:'b'.repeat(64)}},_execute:1}});let login!:Promise<void>;
 await act(async()=>{login=context.signIn('b@example.invalid','password');await Promise.resolve()});expect(localStorage.getItem(key)).toBeNull();
 await act(async()=>{finish();await logout;await login});await flush();expect(context.status).toBe('authenticated');expect(localStorage.getItem(key)).toBe('b'.repeat(64));
});
it.each(['profile','token','touch'].flatMap(stage=>['success','zero','error'].map(outcome=>[stage,outcome])))('discards late %s/%s after a new login without ending B',async(stage,outcome)=>{
 await act(async()=>context.signIn('a@example.invalid','password'));await flush();let finish!:(v:unknown)=>void,fail!:(e:Error)=>void;
 const pending=new Promise((resolve,reject)=>{finish=resolve;fail=reject});
 if(stage==='profile')mocks.profile.mockImplementationOnce(()=>pending);
 if(stage==='token')mocks.auth.currentUser!.getIdToken=(()=>pending) as ()=>Promise<string>;
 if(stage==='touch')mocks.mutation.mockImplementationOnce(()=>pending);
 const warning=vi.spyOn(console,'warn').mockImplementation(()=>{});
 await act(async()=>window.dispatchEvent(new Event('focus')));await flush();let logout!:Promise<void>;await act(async()=>{logout=context.signOut();await Promise.resolve()});
 mocks.mutation.mockResolvedValue({data:{query:{issued:{token:'b'.repeat(64)}},_execute:1}});
 await act(async()=>context.signIn('b@example.invalid','password'));await flush();
 const before=mocks.signOut.mock.calls.length;
 await act(async()=>{if(outcome==='error')fail(Error('network'));else finish(stage==='token'?'':{data:stage==='profile'?{user:outcome==='zero'?null:{id:'actor',active:true,tenant:{active:true},role:{active:true}}}:{_execute:outcome==='zero'?0:1}});await logout});await flush();
 expect(context.status).toBe('authenticated');expect(localStorage.getItem(key)).toBe('b'.repeat(64));expect(mocks.signOut).toHaveBeenCalledTimes(before);warning.mockRestore();
});
it('compensates the issued credential after focus during a draining logout',async()=>{
 let finish!:(value:unknown)=>void;mocks.mutation.mockImplementationOnce(()=>new Promise(resolve=>{finish=resolve}));
 const error=vi.spyOn(console,'error').mockImplementation(()=>{});await act(async()=>context.signIn('a@example.invalid','password'));await flush();let logout!:Promise<void>;
 await act(async()=>{logout=context.signOut();await Promise.resolve()});await act(async()=>window.dispatchEvent(new Event('focus')));await flush();
 await act(async()=>{finish({data:{query:{issued:{token:secret}},_execute:1}});await logout});await flush();
 expect(mocks.mutation.mock.calls.filter(c=>c[0].name==='ReleaseDeviceSession')).toHaveLength(1);expect(localStorage.getItem(key)).toBeNull();expect(context.status).toBe('unauthenticated');error.mockRestore();
});

it('focus cannot claim for the old identity while a new Firebase login is pending',async()=>{
 await act(async()=>context.signIn('a@example.invalid','password'));await flush();let finish!:()=>void;
 mocks.signIn.mockImplementationOnce(()=>new Promise<void>(resolve=>{finish=()=>{mocks.auth.currentUser={uid:'actor',getIdToken:async()=>''};mocks.listener?.(mocks.auth.currentUser);resolve()}}));
 let login!:Promise<void>;await act(async()=>{login=context.signIn('b@example.invalid','password');await Promise.resolve()});await act(async()=>window.dispatchEvent(new Event('focus')));await flush();
 expect(mocks.mutation.mock.calls.filter(c=>c[0].name==='ClaimDeviceSession')).toHaveLength(1);
 await act(async()=>{finish();await login});await flush();expect(context.status).toBe('authenticated');expect(mocks.mutation.mock.calls.filter(c=>c[0].name==='ClaimDeviceSession')).toHaveLength(2);
});
it('logout cancels authentication whose Firebase response is still pending',async()=>{
 let finish!:()=>void;mocks.signIn.mockImplementationOnce(()=>new Promise<void>(resolve=>{finish=()=>{mocks.auth.currentUser={uid:'actor',getIdToken:async()=>''};mocks.listener?.(mocks.auth.currentUser);resolve()}}));
 let login!:Promise<void>;await act(async()=>{login=context.signIn('a@example.invalid','password');await Promise.resolve()});let logout!:Promise<void>;await act(async()=>{logout=context.signOut();await Promise.resolve()});
 await act(async()=>{finish();await login;await logout});await flush();expect(mocks.auth.currentUser).toBeNull();expect(context.status).toBe('unauthenticated');expect(localStorage.getItem(key)).toBeNull();expect(mocks.mutation.mock.calls.filter(c=>c[0].name==='ClaimDeviceSession')).toHaveLength(0);
});
it('serializes concurrent Firebase logins and discards the earlier auth callback',async()=>{
 let finish!:()=>void;mocks.signIn.mockImplementationOnce(()=>new Promise<void>(resolve=>{finish=()=>{mocks.auth.currentUser={uid:'actor',getIdToken:async()=>''};mocks.listener?.(mocks.auth.currentUser);resolve()}}));
 mocks.mutation.mockResolvedValue({data:{query:{issued:{token:'b'.repeat(64)}},_execute:1}});let loginA!:Promise<void>,loginB!:Promise<void>;
 await act(async()=>{loginA=context.signIn('a@example.invalid','password');await Promise.resolve()});await act(async()=>{loginB=context.signIn('b@example.invalid','password');await Promise.resolve()});expect(mocks.signIn).toHaveBeenCalledTimes(1);
 await act(async()=>{finish();await loginA;await loginB});await flush();expect(context.status).toBe('authenticated');expect(localStorage.getItem(key)).toBe('b'.repeat(64));expect(mocks.mutation.mock.calls.filter(c=>c[0].name==='ClaimDeviceSession')).toHaveLength(1);expect(mocks.signOut).not.toHaveBeenCalled();
});
it('ignores a queued null auth event when the current Firebase actor is already B',async()=>{
 await act(async()=>context.signIn('b@example.invalid','password'));await flush();const user=mocks.auth.currentUser;
 await act(async()=>mocks.listener?.(null));await flush();expect(mocks.auth.currentUser).toBe(user);expect(context.status).toBe('authenticated');expect(context.profile?.id).toBe('actor');expect(localStorage.getItem(key)).toBe(secret);expect(mocks.signOut).not.toHaveBeenCalled();
});
it.each(['actor','former'])('ignores a queued old auth actor (%s) after B is active',async(uid)=>{
 await act(async()=>context.signIn('b@example.invalid','password'));await flush();const user=mocks.auth.currentUser;
 await act(async()=>mocks.listener?.({uid,getIdToken:async()=>''}));await flush();expect(mocks.auth.currentUser).toBe(user);expect(context.status).toBe('authenticated');expect(context.profile?.id).toBe('actor');expect(localStorage.getItem(key)).toBe(secret);expect(mocks.signOut).not.toHaveBeenCalled();
});
