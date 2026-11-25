import { describe, expect, it, vi } from 'vitest'
import { financialClient, type Transport } from './protocol'

const owner = { tenantId: '10000000-0000-4000-8000-000000000001', uid: 'synthetic' }
const operationId = '20000000-0000-4000-8000-000000000001'
const payloadHash = 'a'.repeat(64)
const command = { operationId, action: 'C08', payload: { amountCents: '10000', privateReference: 'Synthetic private bank data' } }
function setup() {
  const memory = new Map<string, string>()
  const storage = { getItem: (key: string) => memory.get(key) ?? null, setItem: (key: string, value: string) => { memory.set(key, value) }, removeItem: (key: string) => { memory.delete(key) } }
  const transport: Transport = {
    prepare: vi.fn(async () => ({ status: 'PREPARED', operationId, payloadHash })),
    execute: vi.fn(async () => ({ status: 'COMMITTED', operationId, payloadHash })),
    read: vi.fn(async () => ({ status: 'COMMITTED', operationId, payloadHash })),
  }
  return { memory, storage, transport, client: financialClient(transport, storage, owner) }
}
describe('recibos financeiros e ACK incerto', () => {
  it('não persiste payload ou dinheiro e preserva a intenção congelada', async () => {
    const { memory, client, transport } = setup()
    await client.prepare(command)
    expect([...memory.values()].join('')).not.toContain('amountCents')
    expect([...memory.values()].join('')).not.toContain('privateReference')
    expect(vi.mocked(transport.prepare).mock.calls[0][0]).not.toBe(command)
  })
  it('erro SDK other após commit consulta recibo, sem criar nova operação', async () => {
    const { client, transport } = setup()
    await client.prepare(command)
    vi.mocked(transport.execute).mockRejectedValueOnce({ code: 'other', message: 'ACK lost after COMMIT' })
    await expect(client.confirm()).rejects.toThrow('resultado ainda não foi confirmado')
    const result = await client.resolve()
    expect(result?.status).toBe('COMMITTED')
    expect(transport.execute).toHaveBeenCalledTimes(1)
    expect(transport.prepare).toHaveBeenCalledTimes(1)
    client.acknowledge(result!)
    expect(client.pending()).toBeNull()
  })
  it('reload usa só a referência e erro de refresh não repete comando', async () => {
    const { client, storage, transport } = setup()
    await client.prepare(command)
    await client.confirm()
    const restored = financialClient(transport, storage, owner)
    const result = await restored.resolve()
    expect(result?.status).toBe('COMMITTED')
    vi.mocked(transport.read).mockRejectedValueOnce(new Error('Refresh failure'))
    await expect(transport.read({ mode: 'TITLES' })).rejects.toThrow('Refresh failure')
    expect(transport.execute).toHaveBeenCalledTimes(1)
  })
  it('não trata zero ou resposta sem recibo como sucesso nem limpa referência', async () => {
    const { client, transport } = setup()
    await client.prepare(command)
    vi.mocked(transport.execute).mockResolvedValueOnce(0)
    await expect(client.confirm()).rejects.toThrow()
    expect(client.pending()?.operationId).toBe(operationId)
  })
  it('não permite novo ID ou confirmar resultado desconhecido', async () => {
    const { client } = setup()
    await client.prepare(command)
    await expect(client.prepare({ ...command, operationId: '30000000-0000-4000-8000-000000000001' })).rejects.toThrow('RESOLVE_PREVIOUS_OPERATION')
    expect(() => client.acknowledge({ status: 'UNKNOWN', operationId })).toThrow('RESULT_NOT_FINAL')
  })
})
