import 'fake-indexeddb/auto'
import { IDBObjectStore } from 'fake-indexeddb'
import { afterEach, describe, expect, it, vi } from 'vitest'
import { canRetryPendingSale, definitiveSaleFailure, markPendingFailure, pendingSales, queueSale, removePendingSale, retryPendingSale } from './salesOffline'
const owner={uid:'operator-test',tenantId:'tenant-test'}
afterEach(async()=>{vi.restoreAllMocks();for(const row of await pendingSales(owner))await removePendingSale(row.clientOperationId,owner)})
describe('fila local do PDV',()=>{
 it('confirma somente depois do commit e rejeita uma transação abortada',async()=>{
  const add=IDBObjectStore.prototype.add
  vi.spyOn(IDBObjectStore.prototype,'add').mockImplementation(function(this:IDBObjectStore,...args:Parameters<typeof add>){const request=add.apply(this,args);request.addEventListener('success',()=>request.transaction?.abort());return request})
  await expect(queueSale({clientOperationId:'abort-test'},owner)).rejects.toThrow()
  expect(await pendingSales(owner)).toHaveLength(0)
 })
 it('separa dono e empresa, mantendo a operação imutável',async()=>{await queueSale({clientOperationId:'same-operation',branchId:'branch-a'},owner);await queueSale({clientOperationId:'same-operation',branchId:'branch-b'},owner);expect(await pendingSales({uid:'other',tenantId:owner.tenantId})).toHaveLength(0);expect(await pendingSales({uid:owner.uid,tenantId:'other'})).toHaveLength(0);expect((await pendingSales(owner))[0]?.payload.branchId).toBe('branch-a')})
 it('não recupera uma operação que outra aba já confirmou',async()=>{await queueSale({clientOperationId:'ack-test'},owner);const row=(await pendingSales(owner))[0]!;await removePendingSale(row.clientOperationId,owner);await markPendingFailure(row,'Conexão indisponível');expect(await pendingSales(owner)).toHaveLength(0)})
 it('aplica espera, limite de tentativas e revisão manual',async()=>{await queueSale({clientOperationId:'retry-test'},owner);for(let attempt=0;attempt<8;attempt++)await markPendingFailure((await pendingSales(owner))[0]!,'Conexão indisponível');const row=(await pendingSales(owner))[0]!;expect(row.blocked).toBe(true);expect(canRetryPendingSale(row,Date.now()+999999)).toBe(false);await retryPendingSale(row,owner);expect(canRetryPendingSale((await pendingSales(owner))[0]!)).toBe(true)})
 it('não repete automaticamente recusas definitivas e identifica falhas de rede',async()=>{expect(definitiveSaleFailure(new Error('POS_REJECTED'))).toBe(true);expect(definitiveSaleFailure({code:'dataconnect/permission-denied'})).toBe(true);expect(definitiveSaleFailure(new Error('Network unavailable'))).toBe(false);await queueSale({clientOperationId:'denied-test'},owner);await markPendingFailure((await pendingSales(owner))[0]!,'POS_REJECTED',true);expect(canRetryPendingSale((await pendingSales(owner))[0]!)).toBe(false)})
 it('preserva a indicação de aprovação gerencial sem expor dados de outra identidade',async()=>{await queueSale({clientOperationId:'approval-test'},owner,true);const row=(await pendingSales(owner))[0]!;expect(row.approvalPending).toBe(true);await expect(retryPendingSale(row,{...owner,uid:'other'})).rejects.toThrow('outra sessão')})
})
