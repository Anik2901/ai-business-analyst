import { defineConfig, loadEnv } from 'vite'
import react from '@vitejs/plugin-react'
import path from 'path'

export default defineConfig(({ mode }) => {
  const env = loadEnv(mode, process.cwd(), '')
  return {
    plugins: [react()],
    build: {
      cssMinify: false,
    },
    resolve: {
      alias: {
        '@': path.resolve(__dirname, './src'),
      },
    },
    server: {
      proxy: {
        '/api/llm': {
          target: env.LLM_BASE_URL || 'https://api.anthropic.com',
          changeOrigin: true,
          rewrite: (path) => path.replace(/^\/api\/llm/, ''),
          configure: (proxy) => {
            proxy.on('proxyReq', (proxyReq) => {
              const key = env.LLM_API_KEY || ''
              // Set both auth schemes so either protocol works with zero per-provider tweaking:
              // Anthropic uses `x-api-key`; OpenAI-compatible uses `Authorization: Bearer`.
              proxyReq.setHeader('x-api-key', key)
              proxyReq.setHeader('authorization', `Bearer ${key}`)
              proxyReq.setHeader('anthropic-version', '2023-06-01')
            })
          },
        },
      },
    },
  }
})
