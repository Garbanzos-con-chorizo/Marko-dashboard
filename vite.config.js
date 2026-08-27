import { defineConfig, loadEnv } from 'vite'
import react from '@vitejs/plugin-react'

// https://vite.dev/config/
export default defineConfig(({ mode }) => {
  const env = loadEnv(mode, process.cwd(), '')

  // In local dev with no VITE_API_BASE_URL set, proxy /api to the local
  // gateway so the browser never makes a cross-origin request.
  // When VITE_API_BASE_URL IS set (Render build or pointing at a remote
  // backend), the absolute URL is used by the fetch calls directly and no
  // proxy is needed — so we skip it.
  const proxy = !env.VITE_API_BASE_URL
    ? {
        '/api': {
          target: 'http://localhost:8000',
          changeOrigin: true,
          secure: false,
        },
      }
    : undefined

  return {
    plugins: [react()],
    base: '/',
    server: { proxy },
  }
})
