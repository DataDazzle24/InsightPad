// @vitest-environment jsdom
import { beforeEach,expect,it,vi } from 'vitest'
const state=vi.hoisted(()=>({auth:{currentUser:null as null|{uid:string}},query:vi.fn(),mutation:vi.fn()}))
vi.mock('../lib/firebase',()=>({auth:state.auth}))
vi.mock('@firebase/data-connect',()=>({queryRef:state.query,mutationRef:state.mutation}))
import { currentSessionToken,mutationRef,queryRef,sessionKey } from './session-data-connect'
beforeEach(()=>{localStorage.clear();vi.clearAllMocks();state.auth.currentUser={uid:'actor'}})
it('attaches identity-scoped leases without mutating caller variables',()=>{
 localStorage.setItem(sessionKey('actor'),'server-secret');const vars={payload:{item:1}},dc={} as Parameters<typeof mutationRef>[0]
 mutationRef(dc,'SaveStockBatch',vars);expect(state.mutation).toHaveBeenCalledWith(dc,'SaveStockBatch',{...vars,sessionToken:'server-secret'});expect(vars).not.toHaveProperty('sessionToken')
 queryRef(dc,'StockWorkspace',{requestKey:'r'});expect(state.query).toHaveBeenCalledWith(dc,'StockWorkspace',{requestKey:'r',sessionToken:'server-secret'})
})
it('never reuses a previous identity lease and preserves bootstrap/explicit validation variables',()=>{
 localStorage.setItem(sessionKey('actor'),'old-secret');state.auth.currentUser={uid:'other'};expect(currentSessionToken()).toBe('')
 const dc={} as Parameters<typeof queryRef>[0];queryRef(dc,'GetCurrentUser');expect(state.query).toHaveBeenCalledWith(dc,'GetCurrentUser',{})
 mutationRef(dc,'ClaimDeviceSession',{deviceId:'d',deviceName:'n'});expect(state.mutation).toHaveBeenCalledWith(dc,'ClaimDeviceSession',{deviceId:'d',deviceName:'n'})
 queryRef(dc,'ValidateDeviceSession',{sessionToken:'explicit',requestKey:'r'});expect(state.query).toHaveBeenCalledWith(dc,'ValidateDeviceSession',{sessionToken:'explicit',requestKey:'r'})
 state.auth.currentUser=null;expect(currentSessionToken()).toBe('')
})
