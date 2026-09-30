const DB = 'insightpad-sales'
// Legacy records remain quarantined. Never assign them to the next login.
const STORE = 'pending-sales-v2'
const VERSION = 2
export const MAX_OFFLINE_ATTEMPTS = 8
export type OfflineOwner = { uid: string; tenantId: string }
export type PendingSale = {
  id: string; clientOperationId: string; ownerUid: string; tenantId: string
  payload: Record<string, unknown>; createdAt: string; attempts: number
  lastError?: string; nextAttemptAt?: string; blocked?: boolean; approvalPending?: boolean
}
const rowId = (owner: OfflineOwner, operationId: string) => `${owner.tenantId}:${owner.uid}:${operationId}`
function database() {
  return new Promise<IDBDatabase>((resolve, reject) => {
    const request = indexedDB.open(DB, VERSION)
    request.onupgradeneeded = () => {
      const db = request.result
      const store = db.objectStoreNames.contains(STORE) ? request.transaction!.objectStore(STORE) : db.createObjectStore(STORE, { keyPath: 'id' })
      if (!store.indexNames.contains('owner')) store.createIndex('owner', ['tenantId', 'ownerUid'])
      if (!store.indexNames.contains('createdAt')) store.createIndex('createdAt', 'createdAt')
    }
    request.onsuccess = () => resolve(request.result)
    request.onerror = () => reject(request.error)
    request.onblocked = () => reject(new Error('Feche as outras abas do caixa para atualizar a fila local.'))
  })
}
async function transaction<T>(mode: IDBTransactionMode, run: (store: IDBObjectStore, done: (value: T) => void) => void) {
  const db = await database()
  return new Promise<T>((resolve, reject) => {
    let value: T
    const tx = db.transaction(STORE, mode)
    const close = () => db.close()
    tx.oncomplete = () => { close(); resolve(value) }
    tx.onerror = tx.onabort = () => { close(); reject(tx.error ?? new Error('A fila local não foi gravada.')) }
    try { run(tx.objectStore(STORE), result => { value = result }) }
    catch (error) { tx.abort(); close(); reject(error) }
  })
}
export const queueSale = (payload: Record<string, unknown>, owner: OfflineOwner, approvalPending = false) => {
  if (!owner.uid || !owner.tenantId || !payload.clientOperationId) return Promise.reject(new Error('Sessão indisponível para guardar a venda.'))
  const clientOperationId = String(payload.clientOperationId)
  const row: PendingSale = { id: rowId(owner, clientOperationId), clientOperationId, ownerUid: owner.uid, tenantId: owner.tenantId, payload, createdAt: new Date().toISOString(), attempts: 0, approvalPending }
  return transaction<void>('readwrite', (store, done) => {
    const existing = store.get(row.id)
    existing.onsuccess = () => {
      if (existing.result) { done(); return }
      store.add(row).onsuccess = () => done()
    }
  })
}
export const pendingSales = (owner: OfflineOwner) => transaction<PendingSale[]>('readonly', (store, done) => {
  const request = store.index('owner').getAll([owner.tenantId, owner.uid])
  request.onsuccess = () => done((request.result as PendingSale[]).sort((a, b) => a.createdAt.localeCompare(b.createdAt)))
})
export const removePendingSale = (operationId: string, owner: OfflineOwner) => transaction<void>('readwrite', (store, done) => {
  store.delete(rowId(owner, operationId)).onsuccess = () => done()
})
export function definitiveSaleFailure(error: unknown) {
  const message = error instanceof Error ? error.message : String(error)
  const code = String((error as { code?: string } | null)?.code ?? '')
  return /POS_REJECTED|POS_BRANCH_DENIED|POS_APPROVAL_DENIED|permission.denied|invalid.argument|unauthenticated|failed.precondition/i.test(`${code} ${message}`)
}
export const markPendingFailure = (sale: PendingSale, error: string, definitive = false) => transaction<void>('readwrite', (store, done) => {
  // Read the current row: another tab may already have acknowledged and removed it.
  const request = store.get(sale.id)
  request.onsuccess = () => {
    const current = request.result as PendingSale | undefined
    if (!current) { done(); return }
    const attempts = current.attempts + 1
    const delaySeconds = Math.min(300, 2 ** Math.min(attempts, 8))
    store.put({ ...current, attempts, blocked: definitive || attempts >= MAX_OFFLINE_ATTEMPTS, lastError: error.slice(0, 300), nextAttemptAt: new Date(Date.now() + delaySeconds * 1000).toISOString() }).onsuccess = () => done()
  }
})
export const retryPendingSale = (sale: PendingSale, owner: OfflineOwner) => transaction<void>('readwrite', (store, done) => {
  if (sale.ownerUid !== owner.uid || sale.tenantId !== owner.tenantId) throw new Error('Esta venda pertence a outra sessão.')
  const request = store.get(sale.id)
  request.onsuccess = () => {
    if (!request.result) { done(); return }
    store.put({ ...request.result, attempts: 0, blocked: false, nextAttemptAt: undefined }).onsuccess = () => done()
  }
})
export const canRetryPendingSale = (sale: PendingSale, now = Date.now()) => !sale.blocked && sale.attempts < MAX_OFFLINE_ATTEMPTS && (!sale.nextAttemptAt || Date.parse(sale.nextAttemptAt) <= now)
