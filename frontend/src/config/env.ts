import { firebaseEnvSchema } from './firebaseEnvSchema'

const parsedEnv = firebaseEnvSchema.safeParse(import.meta.env)

if (!parsedEnv.success) {
  console.error('Configuração Firebase inválida:', parsedEnv.error.flatten().fieldErrors)
  throw new Error('As variáveis de ambiente do Firebase não foram configuradas corretamente.')
}

export const env = parsedEnv.data
