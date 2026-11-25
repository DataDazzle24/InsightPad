import { getDataConnect } from 'firebase/data-connect'
import { connectorConfig, financialPrepare, financialExecute, financialRead } from '@insightpad/dataconnect'
import { z } from 'zod'
import { auth, firebaseApp } from '../lib/firebase'
import { currentSessionToken } from '../auth/session-data-connect'
import { financialClient, type Owner, type Transport } from './protocol'

const dc = getDataConnect(firebaseApp, connectorConfig)
const envelope = z.object({ result: z.unknown() })
async function deadline<T>(work: PromiseLike<T>): Promise<T> {
  let timer: ReturnType<typeof setTimeout> | undefined
  try { return await Promise.race([Promise.resolve(work), new Promise<never>((_, reject) => { timer = setTimeout(() => reject(new Error('RESPONSE_TIMEOUT')), 20000) })]) }
  finally { clearTimeout(timer) }
}
function session(owner: Owner) {
  if (auth.currentUser?.uid !== owner.uid || !currentSessionToken()) throw new Error('SESSION_REQUIRED')
  return currentSessionToken()
}
export function financialService(owner: Owner) {
  const transport: Transport = {
    async prepare(command) {
      const response = await deadline(financialPrepare(dc, { command, sessionToken: session(owner) }))
      return envelope.parse(response.data.query?.response).result
    },
    async execute(operationId, payloadHash, cancel) {
      const response = await deadline(financialExecute(dc, { operationId, payloadHash, cancel, sessionToken: session(owner) }))
      return envelope.parse(response.data.query?.response).result
    },
    async read(input) {
      const response = await deadline(financialRead(dc, { input, sessionToken: session(owner) }))
      return envelope.parse(response.data.response).result
    },
  }
  return { ...financialClient(transport, localStorage, owner), read: transport.read }
}
