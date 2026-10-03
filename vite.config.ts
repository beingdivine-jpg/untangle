import { defineConfig, loadEnv } from 'vite'
import { defineConfig as defineTestConfig } from 'vitest/config'
import react from '@vitejs/plugin-react'
import { agentHandler } from './server/agent.ts'

export default defineConfig(({ mode }) => {
  const env = loadEnv(mode, process.cwd(), '')
  const config = { apiKey: process.env.OPENAI_API_KEY || env.OPENAI_API_KEY, model: process.env.OPENAI_MODEL || env.OPENAI_MODEL }
  return defineTestConfig({
    plugins: [react(), { name: 'untangle-local-agent', configureServer(server) { server.middlewares.use(agentHandler(config)) }, configurePreviewServer(server) { server.middlewares.use(agentHandler(config)) } }],
    server: { host: '127.0.0.1', port: 5173 },
    preview: { host: '127.0.0.1', port: 4173 },
    test: { include: ['tests/**/*.test.ts'] },
  })
})
