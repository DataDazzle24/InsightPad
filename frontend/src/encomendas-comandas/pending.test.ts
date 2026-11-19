import "fake-indexeddb/auto";
import { afterEach, describe, expect, it, vi } from "vitest";
import { IDBObjectStore } from "fake-indexeddb";
import { acknowledge, pending, preserve } from "./pending";
import type { Command, Owner } from "./types";
afterEach(() => vi.restoreAllMocks());
const owner = (): Owner => ({
  uid: crypto.randomUUID(),
  tenantId: crypto.randomUUID(),
});
const command = (): Command => ({
  operationId: crypto.randomUUID(),
  kind: "ENCOMENDA",
  action: "CREATE_ORDER",
  payload: {
    notes: "Synthetic only",
    branchId: "synthetic-branch",
    customerId: "synthetic-customer",
  },
});
describe("descritor de confirmação incerta", () => {
  it("retoma após reload sem guardar token e sem trocar identidade", async () => {
    const user = owner(),
      c = command();
    await preserve(user, c);
    expect((await pending(user))?.command).toEqual(c);
    expect(await pending({ ...user, uid: "other" })).toBeNull();
    expect(await pending({ ...user, tenantId: "other" })).toBeNull();
    await acknowledge(user, c.operationId);
    expect(await pending(user)).toBeNull();
  });
  it("não permite substituir o payload pendente por outro clique ou outra aba", async () => {
    const user = owner(),
      first = command(),
      second = command();
    const results = await Promise.allSettled([
      preserve(user, first),
      preserve(user, second),
    ]);
    expect(results.filter((r) => r.status === "fulfilled")).toHaveLength(1);
    const saved = (await pending(user))!;
    expect([first.operationId, second.operationId]).toContain(
      saved.command.operationId,
    );
    await acknowledge(user, "unrelated");
    expect(await pending(user)).not.toBeNull();
    await acknowledge(user, saved.command.operationId);
  });
  it("não confirma uma gravação abortada no IndexedDB", async () => {
    const user = owner(),
      c = command(),
      add = IDBObjectStore.prototype.add;
    vi.spyOn(IDBObjectStore.prototype, "add").mockImplementation(function (
      this: IDBObjectStore,
      ...args: Parameters<typeof add>
    ) {
      const request = add.apply(this, args);
      if (this.name === "pending")
        request.addEventListener("success", () => request.transaction?.abort());
      return request;
    });
    await expect(preserve(user, c)).rejects.toThrow();
    expect(await pending(user)).toBeNull();
  });
  it("o registro local contém ciphertext e não o endereço ou payload em claro", async () => {
    const user = owner(),
      c = command();
    c.payload.deliveryAddress = { street: "Synthetic avenue" };
    await preserve(user, c);
    const raw = await new Promise<Record<string, unknown>>(
      (resolve, reject) => {
        const r = indexedDB.open("insightpad-ec-confirmation-v1", 1);
        r.onsuccess = () => {
          const db = r.result,
            tx = db.transaction("pending");
          const get = tx
            .objectStore("pending")
            .get(JSON.stringify([user.tenantId, user.uid]));
          get.onsuccess = () => resolve(get.result);
          tx.oncomplete = () => db.close();
        };
        r.onerror = () => reject(r.error);
      },
    );
    expect(raw.command).toBeUndefined();
    expect(raw.encrypted).toBeInstanceOf(ArrayBuffer);
    expect(JSON.stringify(raw)).not.toContain("Synthetic avenue");
    await acknowledge(user, c.operationId);
  });
});
