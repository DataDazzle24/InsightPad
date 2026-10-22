import {defineConfig} from 'vitest/config'
import qa from './vite.qa.config'
export default defineConfig({...qa,test:{environment:'jsdom',include:['qa/application.test.tsx'],testTimeout:15000}})
