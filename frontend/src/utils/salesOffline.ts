const DB = 'insightpad-sales'
// V2 uses a separate store so legacy, unscoped operations are quarantined instead
// of being attributed to whichever user signs in next.
const STORE = 'pending-sales-v2'
const VERSION = 2

export type OfflineOwner = { uid: string; tenantId: string }
export type PendingSale = {
  id: string
  clientOperationId: string
  ownerUid: string
  tenantId: string
  payload: Record<string, unknown>
  createdAt: string
  attempts: number
  lastError?: string
  nextAttemptAt?: string
}

const ownerKey = ({ uid, tenantId }: OfflineOwner) => `${tenantId}:${uid}`
const rowId = (owner: OfflineOwner, operationId: string) => `${ownerKey(owner)}:${operationId}`

function database() {
  return new Promise<IDBDatabase>((resolve, reject) => {
    const request = indexedDB.open(DB, VERSION)
    request.onupgradeneeded = () => {
      const db = request.result
      const tx = request.transaction
      let store: IDBObjectStore
      if (!db.objectStoreNames.contains(STORE)) store = db.createObjectStore(STORE, { keyPath: 'id' })
      else store = tx!.objectStore(STORE)
      if (!store.indexNames.contains('owner')) store.createIndex('owner', ['tenantId', 'ownerUid'])
      if (!store.indexNames.contains('createdAt')) store.createIndex('createdAt', 'createdAt')
    }
    request.onsuccess = () => resolve(request.result)
    request.onerror = () => reject(request.error)
  })
}

async function transaction<T>(mode: IDBTransactionMode, run: (store: IDBObjectStore, done: (value: T) => void) => void) {
  const db = await database()
  return new Promise<T>((resolve, reject) => {
    const tx = db.transaction(STORE, mode)
    run(tx.objectStore(STORE), resolve)
    tx.onerror = () => reject(tx.error)
    tx.onabort = () => reject(tx.error)
    tx.oncomplete = () => db.close()
  })
}

export const queueSale = (payload: Record<string, unknown>, owner: OfflineOwner) => {
  const clientOperationId = String(payload.clientOperationId)
  const row: PendingSale = { id: rowId(owner, clientOperationId), clientOperationId, ownerUid: owner.uid, tenantId: owner.tenantId, payload, createdAt: new Date().toISOString(), attempts: 0 }
  return transaction<void>('readwrite', (store, done) => { const request = store.put(row); request.onsuccess = () => done() })
}

export const pendingSales = (owner: OfflineOwner) => transaction<PendingSale[]>('readonly', (store, done) => {
  const request = store.index('owner').getAll([owner.tenantId, owner.uid])
  request.onsuccess = () => done((request.result as PendingSale[]).sort((a, b) => a.createdAt.localeCompare(b.createdAt)))
})

export const removePendingSale = (operationId: string, owner: OfflineOwner) => transaction<void>('readwrite', (store, done) => {
  const request = store.delete(rowId(owner, operationId)); request.onsuccess = () => done()
})

export const markPendingFailure = (sale: PendingSale, error: string) => transaction<void>('readwrite', (store, done) => {
  const attempts = sale.attempts + 1
  const delaySeconds = Math.min(300, 2 ** Math.min(attempts, 8))
  const request = store.put({ ...sale, attempts, lastError: error.slice(0, 300), nextAttemptAt: new Date(Date.now() + delaySeconds * 1000).toISOString() })
  request.onsuccess = () => done()
})

export const canRetryPendingSale = (sale: PendingSale) => !sale.nextAttemptAt || Date.parse(sale.nextAttemptAt) <= Date.now()
