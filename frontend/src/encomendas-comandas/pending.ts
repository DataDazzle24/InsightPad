import type { Command, Owner, Pending } from "./types";
const DB = "insightpad-ec-confirmation-v1";
const STORE = "pending";
const KEYS = "keys";
const ownerKey = (owner: Owner) => JSON.stringify([owner.tenantId, owner.uid]);
type Stored = {
  id: string;
  operationId: string;
  iv: Uint8Array;
  encrypted: ArrayBuffer;
  owner: Owner;
  createdAt: string;
};
function database(): Promise<IDBDatabase> {
  return new Promise((resolve, reject) => {
    const r = indexedDB.open(DB, 1);
    r.onupgradeneeded = () => {
      r.result.createObjectStore(STORE, { keyPath: "id" });
      r.result.createObjectStore(KEYS);
    };
    r.onsuccess = () => resolve(r.result);
    r.onerror = () => reject(r.error);
    r.onblocked = () =>
      reject(
        new Error("Feche outras abas para acessar a confirmação pendente."),
      );
  });
}
async function transaction<T>(
  store: string,
  mode: IDBTransactionMode,
  run: (object: IDBObjectStore, done: (value: T) => void) => void,
): Promise<T> {
  const db = await database();
  return new Promise((resolve, reject) => {
    let value: T;
    const tx = db.transaction(store, mode);
    tx.oncomplete = () => {
      db.close();
      resolve(value);
    };
    tx.onerror = tx.onabort = () => {
      db.close();
      reject(
        tx.error ?? new Error("Não foi possível preservar a confirmação."),
      );
    };
    try {
      run(tx.objectStore(store), (result) => {
        value = result;
      });
    } catch (error) {
      tx.abort();
      reject(error);
    }
  });
}
async function key(owner: Owner): Promise<CryptoKey> {
  const candidate = await crypto.subtle.generateKey(
    { name: "AES-GCM", length: 256 },
    false,
    ["encrypt", "decrypt"],
  );
  return transaction<CryptoKey>(KEYS, "readwrite", (store, done) => {
    const r = store.get(ownerKey(owner));
    r.onsuccess = () => {
      if (r.result) done(r.result as CryptoKey);
      else {
        store.add(candidate, ownerKey(owner));
        done(candidate);
      }
    };
  });
}
export async function preserve(
  owner: Owner,
  command: Command,
): Promise<Pending> {
  if (!owner.uid || !owner.tenantId) throw new Error("Sessão indisponível.");
  const iv = crypto.getRandomValues(new Uint8Array(12)),
    createdAt = new Date().toISOString();
  const encrypted = await crypto.subtle.encrypt(
    {
      name: "AES-GCM",
      iv,
      additionalData: new TextEncoder().encode(ownerKey(owner)),
    },
    await key(owner),
    new TextEncoder().encode(JSON.stringify(command)),
  );
  await transaction<void>(STORE, "readwrite", (store, done) => {
    const r = store.get(ownerKey(owner));
    r.onsuccess = () => {
      if (r.result) {
        done();
        return;
      }
      store.add({
        id: ownerKey(owner),
        operationId: command.operationId,
        owner,
        iv,
        encrypted,
        createdAt,
      } satisfies Stored);
      done();
    };
  });
  const actual = await pending(owner);
  if (
    actual?.command.operationId !== command.operationId ||
    JSON.stringify(actual.command) !== JSON.stringify(command)
  )
    throw new Error(
      "Existe uma confirmação pendente. Confira seu resultado antes de outra alteração.",
    );
  return actual;
}
export async function pending(owner: Owner): Promise<Pending | null> {
  const row = await transaction<Stored | undefined>(
    STORE,
    "readonly",
    (store, done) => {
      const r = store.get(ownerKey(owner));
      r.onsuccess = () => done(r.result as Stored | undefined);
    },
  );
  if (!row) return null;
  const decoded = await crypto.subtle.decrypt(
    {
      name: "AES-GCM",
      iv: new Uint8Array(row.iv),
      additionalData: new TextEncoder().encode(ownerKey(owner)),
    },
    await key(owner),
    row.encrypted,
  );
  return {
    owner: row.owner,
    createdAt: row.createdAt,
    command: JSON.parse(new TextDecoder().decode(decoded)) as Command,
  };
}
export const acknowledge = (owner: Owner, operationId: string) =>
  transaction<void>(STORE, "readwrite", (store, done) => {
    const r = store.get(ownerKey(owner));
    r.onsuccess = () => {
      if ((r.result as Stored | undefined)?.operationId === operationId)
        store.delete(ownerKey(owner));
      done();
    };
  });
