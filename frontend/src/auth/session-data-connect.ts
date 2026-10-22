import { mutationRef as firebaseMutationRef, queryRef as firebaseQueryRef } from '@firebase/data-connect'
import { auth } from '../lib/firebase'
export * from '@firebase/data-connect'
export const sessionKey=(uid:string)=>`insightpad.device.session:${uid}`
export function currentSessionToken():string {
 return auth.currentUser ? localStorage.getItem(sessionKey(auth.currentUser.uid))??'' : ''
}
const bootstrap=new Set(['GetCurrentUser','GetCurrentUserAccess','ClaimDeviceSession','ValidateDeviceSession','TouchDeviceSession','ReleaseDeviceSession'])
// This adapter covers generated SDK and named references. Server authorization
// rejects missing, displaced and expired secrets independently of this adapter.
function variablesWithSession(name:string,variables:unknown):Record<string,unknown>{
 if(bootstrap.has(name))return (variables??{}) as Record<string,unknown>
 const values=variables && typeof variables==='object'?variables:{}
 return {sessionToken:currentSessionToken(),...values}
}
export const queryRef:typeof firebaseQueryRef=((dc:unknown,name:string,variables:unknown)=>
 firebaseQueryRef(dc as Parameters<typeof firebaseQueryRef>[0],name,variablesWithSession(name,variables))) as typeof firebaseQueryRef
export const mutationRef:typeof firebaseMutationRef=((dc:unknown,name:string,variables:unknown)=>
 firebaseMutationRef(dc as Parameters<typeof firebaseMutationRef>[0],name,variablesWithSession(name,variables))) as typeof firebaseMutationRef
