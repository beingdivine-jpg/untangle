import { defineConfig, loadEnv } from 'vite'
import { defineConfig as defineTestConfig } from 'vitest/config'
import react from '@vitejs/plugin-react'
import { agentHandler } from './server/agent.ts'
import { communityHandler } from './server/community.ts'
import { coachHandler } from './server/coach.ts'

export default defineConfig(({ mode }) => {
  const env = loadEnv(mode, process.cwd(), '')
  const config = { enabled: (process.env.COMMUNITY_ENABLED || env.COMMUNITY_ENABLED) === 'true', aiEnabled: (process.env.LIVE_COACH_ENABLED || env.LIVE_COACH_ENABLED) === 'true', supabaseUrl: process.env.SUPABASE_URL || env.SUPABASE_URL, supabaseKey: process.env.SUPABASE_PUBLISHABLE_KEY || env.SUPABASE_PUBLISHABLE_KEY, apiKey: process.env.OPENAI_API_KEY || env.OPENAI_API_KEY, model: process.env.OPENAI_MODEL || env.OPENAI_MODEL }
  return defineTestConfig({
    plugins: [react(), { name: 'untangle-local-agent', configureServer(server) { server.middlewares.use(communityHandler(config)); server.middlewares.use(coachHandler(config)); server.middlewares.use(agentHandler(config)) }, configurePreviewServer(server) { server.middlewares.use(communityHandler(config)); server.middlewares.use(coachHandler(config)); server.middlewares.use(agentHandler(config)) } }],
    server: { host: '127.0.0.1', port: 5173 },
    preview: { host: '127.0.0.1', port: 4173 },
    test: { include: ['tests/**/*.test.ts'] },
  })
})
