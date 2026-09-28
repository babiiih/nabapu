/// <reference types="vitest/config" />
import path from 'path'
import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import tailwindcss from '@tailwindcss/vite'
import { tanstackRouter } from '@tanstack/router-plugin/vite'

// https://vite.dev/config
export default defineConfig({
  plugins: [
    tanstackRouter({
      target: 'react',
      autoCodeSplitting: true,
    }),
    react(),
    tailwindcss(),
  ],
  resolve: {
    alias: {
      '@': path.resolve(__dirname, './src'),
    },
  },
  server: {
    port: 4180,
    proxy: {
      // local dev: same shape as the Vercel rewrite in vercel.json
      '/api/vibes': {
        target: 'https://testnet.vibevibe.fun/api/v1/chains/46630',
        changeOrigin: true,
        rewrite: (p) => p.replace(/^\/api\/vibes/, ''),
      },
    },
  },
})
