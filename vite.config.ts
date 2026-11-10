import react from '@vitejs/plugin-react'
import { defineConfig } from 'vite'

// https://vite.dev/config/
export default defineConfig({
  plugins: [react()],
  server: {
    // Demo mode (`npm run dev:demo`): the browser calls /api on this same origin and Vite forwards it
    // to the local API, so a single public tunnel URL serves both the web app and the API.
    proxy: {
      '/api': 'http://localhost:4000',
    },
    // Allow Cloudflare quick-tunnel hostnames (https://<random>.trycloudflare.com) during demos.
    allowedHosts: ['.trycloudflare.com'],
  },
})
