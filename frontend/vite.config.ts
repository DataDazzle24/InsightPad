import { defineConfig, loadEnv } from 'vite'
import react from '@vitejs/plugin-react'
import { fileURLToPath } from 'node:url'
import { firebaseEnvSchema } from './src/config/firebaseEnvSchema.ts'

// https://vite.dev/config/
export default defineConfig(({ command, mode }) => {
  if (command === 'build') {
    const config = firebaseEnvSchema.safeParse({ ...loadEnv(mode, process.cwd(), 'VITE_'), ...process.env })
    if (!config.success) {
      const fields = [...new Set(config.error.issues.map(issue => issue.path.join('.')))]
      throw new Error(`Build bloqueado: configuração Firebase ausente ou inválida (${fields.join(', ')}).`)
    }
    const expectedProject = mode === 'development' ? 'insightpad-dd-dev' : mode === 'production' ? 'insightpad-dd' : undefined
    if (expectedProject && config.data.VITE_FIREBASE_PROJECT_ID !== expectedProject) {
      throw new Error(`Build bloqueado: o modo ${mode} exige o projeto ${expectedProject}.`)
    }
  }
  return {
    test:{exclude:['**/node_modules/**','**/.git/**','qa/application.test.tsx']},
    plugins: [react()],
    resolve: { alias: [{ find: /^firebase\/data-connect$/, replacement: fileURLToPath(new URL('./src/auth/session-data-connect.ts', import.meta.url)) }] },
    build: {
      rolldownOptions: {
        output: {
          codeSplitting: {
            groups: [
              {
                name: 'firebase',
                test: /[\\/]node_modules[\\/](?:firebase|@firebase)[\\/]/,
              },
              {
                name: 'react',
                test: /[\\/]node_modules[\\/](?:react|react-dom|react-router|react-router-dom)[\\/]/,
              },
            ],
          },
        },
      },
    },
  }
})
