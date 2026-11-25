import { z } from 'zod'

export type Command = Readonly<{ operationId: string; action: string; payload: Readonly<Record<string, unknown>> }>
export type Owner = Readonly<{ tenantId: string; uid: string }>
const receipt = z.object({
  status: z.enum(['PREPARED', 'COMMITTED', 'REJECTED', 'CANCELLED', 'UNKNOWN']),
  operationId: z.string().uuid(), payloadHash: z.string().regex(/^[a-f0-9]{64}$/).optional(),
  error: z.object({ code: z.string() }).optional(), result: z.unknown().optional(),
  intent: z.object({ operationId: z.string().uuid(), action: z.string(), payload: z.record(z.string(), z.unknown()) }).optional(),
}).passthrough()
export type Receipt = z.infer<typeof receipt>
const descriptor = z.object({ tenantId: z.string().uuid(), uid: z.string().min(1), operationId: z.string().uuid(), payloadHash: z.string().regex(/^[a-f0-9]{64}$/).optional() }).strict()
export type PendingOperation = z.infer<typeof descriptor>
export interface Transport {
  prepare(command: Command): Promise<unknown>
  execute(operationId: string, payloadHash: string, cancel: boolean): Promise<unknown>
  read(input: Record<string, unknown>): Promise<unknown>
}
export class FinancialUncertainError extends Error {
  operationId: string
  constructor(operationId: string) {
    super('O resultado ainda não foi confirmado. Consulte a referência antes de repetir.')
    this.operationId = operationId
  }
}
export function financialClient(transport: Transport, storage: Pick<Storage, 'getItem' | 'setItem' | 'removeItem'>, owner: Owner) {
  const key = `insightpad.financeiro.operation.v1:${JSON.stringify([owner.tenantId, owner.uid])}`
  function pending(): PendingOperation | null {
    const raw = storage.getItem(key)
    if (!raw) return null
    const saved = descriptor.parse(JSON.parse(raw))
    if (saved.uid !== owner.uid || saved.tenantId !== owner.tenantId) throw new Error('OPERATION_OWNER_MISMATCH')
    return saved
  }
  function preserve(operationId: string, payloadHash?: string) {
    // Only recovery identifiers. No bank/customer data, payload, token or money in storage.
    storage.setItem(key, JSON.stringify(descriptor.parse({ ...owner, operationId, ...(payloadHash ? { payloadHash } : {}) })))
  }
  function parse(value: unknown, id: string): Receipt {
    const result = receipt.parse(value)
    if (result.operationId !== id) throw new FinancialUncertainError(id)
    return result
  }
  async function resolve(): Promise<Receipt | null> {
    const saved = pending()
    if (!saved) return null
    try {
      const result = parse(await transport.read({ mode: 'RESULT', operationId: saved.operationId }), saved.operationId)
      if (result.payloadHash) preserve(saved.operationId, result.payloadHash)
      return result
    } catch { throw new FinancialUncertainError(saved.operationId) }
  }
  async function prepare(command: Command): Promise<Receipt> {
    const saved = pending()
    if (saved && saved.operationId !== command.operationId) throw new Error('RESOLVE_PREVIOUS_OPERATION')
    // Freeze a structural copy before the first network call. Caller edits cannot change intent.
    const frozen = JSON.parse(JSON.stringify(command)) as Command
    preserve(frozen.operationId)
    try {
      const prepared = parse(await transport.prepare(frozen), frozen.operationId)
      if (prepared.payloadHash) preserve(frozen.operationId, prepared.payloadHash)
      return prepared
    } catch { throw new FinancialUncertainError(frozen.operationId) }
  }
  async function confirm(cancel = false): Promise<Receipt> {
    const saved = pending()
    if (!saved || !cancel && !saved.payloadHash) throw new Error('CONSULT_OPERATION_FIRST')
    try { return parse(await transport.execute(saved.operationId, saved.payloadHash ?? '', cancel), saved.operationId) }
    catch { throw new FinancialUncertainError(saved.operationId) }
  }
  function acknowledge(result: Receipt) {
    if (!['COMMITTED', 'REJECTED', 'CANCELLED'].includes(result.status)) throw new Error('RESULT_NOT_FINAL')
    if (pending()?.operationId !== result.operationId) throw new Error('OPERATION_OWNER_MISMATCH')
    storage.removeItem(key)
  }
  return { pending, prepare, confirm, resolve, acknowledge }
}
