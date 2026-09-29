import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

// https://vite.dev/config/
export default defineConfig({
  plugins: [react()],
  server: {
    port: 5174,
    strictPort: true,
    proxy: {
      '/api': {
        target: 'http://localhost:9000',
        changeOrigin: true,
        rewrite: (path) => path.replace(/^\/api/, '')
      },
      '/sso': {
        target: 'http://localhost:9000',
        changeOrigin: true
      },
      '/.well-known': {
        target: 'http://localhost:9000',
        changeOrigin: true
      }
    }
  }
})
