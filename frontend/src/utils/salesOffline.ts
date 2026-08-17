const DB='insightpad-sales',STORE='pending-sales',VERSION=1
export type PendingSale={clientOperationId:string;payload:Record<string,unknown>;createdAt:string;attempts:number;lastError?:string}
function database(){return new Promise<IDBDatabase>((resolve,reject)=>{const request=indexedDB.open(DB,VERSION);request.onupgradeneeded=()=>{if(!request.result.objectStoreNames.contains(STORE))request.result.createObjectStore(STORE,{keyPath:'clientOperationId'})};request.onsuccess=()=>resolve(request.result);request.onerror=()=>reject(request.error)})}
async function transaction<T>(mode:IDBTransactionMode,run:(store:IDBObjectStore,done:(value:T)=>void)=>void){const db=await database();return new Promise<T>((resolve,reject)=>{const tx=db.transaction(STORE,mode);run(tx.objectStore(STORE),resolve);tx.onerror=()=>reject(tx.error);tx.oncomplete=()=>db.close()})}
export const queueSale=(payload:Record<string,unknown>)=>transaction<void>('readwrite',(store,done)=>{store.put({clientOperationId:String(payload.clientOperationId),payload,createdAt:new Date().toISOString(),attempts:0} satisfies PendingSale);done()})
export const pendingSales=()=>transaction<PendingSale[]>('readonly',(store,done)=>{const request=store.getAll();request.onsuccess=()=>done(request.result as PendingSale[])})
export const removePendingSale=(id:string)=>transaction<void>('readwrite',(store,done)=>{store.delete(id);done()})
export const markPendingFailure=(sale:PendingSale,error:string)=>transaction<void>('readwrite',(store,done)=>{store.put({...sale,attempts:sale.attempts+1,lastError:error.slice(0,300)});done()})
