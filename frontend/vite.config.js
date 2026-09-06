import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

// https://vite.dev/config/
export default defineConfig({
    plugins: [react()],
    server: {
        watch: {
            ignored: ['**/.vs/**']
        }
        ,
        // During local development (npm run dev) proxy /api and /uploads to
        // the backend, so the browser only ever talks to its own origin and
        // Vite forwards server-side (this also sidesteps browser tooling
        // that blocks page-initiated cross-origin requests).
        proxy: {
            '/api': {
                target: 'https://localhost:7080',
                changeOrigin: true,
                secure: false,
            },
            '/uploads': {
                target: 'https://localhost:7080',
                changeOrigin: true,
                secure: false,
            }
        }
    }
})