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
    alias: [
      { find: '@', replacement: path.resolve(__dirname, './src') },
      // Privy react-auth impor peer opsional Solana yang tidak kita pakai
      // (chain EVM Robinhood only) → arahkan ke shim lokal agar build lolos
      {
        find: /^__vite-optional-peer-dep:@solana\/kit:/,
        replacement: path.resolve(__dirname, './src/shims/solana-kit.ts'),
      },
      {
        find: /^__vite-optional-peer-dep:@solana-program\/system:/,
        replacement: path.resolve(__dirname, './src/shims/solana-system.ts'),
      },
      { find: /^@solana\/kit$/, replacement: path.resolve(__dirname, './src/shims/solana-kit.ts') },
      {
        find: /^@solana-program\/system$/,
        replacement: path.resolve(__dirname, './src/shims/solana-system.ts'),
      },
      {
        find: /^__vite-optional-peer-dep:@solana-program\/token:/,
        replacement: path.resolve(__dirname, './src/shims/solana-token.ts'),
      },
      {
        find: /^__vite-optional-peer-dep:@solana-program\/memo:/,
        replacement: path.resolve(__dirname, './src/shims/solana-memo.ts'),
      },
      {
        find: /^@solana-program\/token$/,
        replacement: path.resolve(__dirname, './src/shims/solana-token.ts'),
      },
      {
        find: /^@solana-program\/memo$/,
        replacement: path.resolve(__dirname, './src/shims/solana-memo.ts'),
      },
      {
        find: /^__vite-optional-peer-dep:@solana-program\/compute-budget:/,
        replacement: path.resolve(__dirname, './src/shims/solana-compute-budget.ts'),
      },
      {
        find: /^@solana-program\/compute-budget$/,
        replacement: path.resolve(__dirname, './src/shims/solana-compute-budget.ts'),
      },
      {
        find: /^__vite-optional-peer-dep:@solana-program\/token-2022:/,
        replacement: path.resolve(__dirname, './src/shims/solana-token-2022.ts'),
      },
      {
        find: /^@solana-program\/token-2022$/,
        replacement: path.resolve(__dirname, './src/shims/solana-token-2022.ts'),
      },
      {
        find: /^__vite-optional-peer-dep:@solana\/transaction-confirmation:/,
        replacement: path.resolve(__dirname, './src/shims/solana-tx-confirmation.ts'),
      },
      {
        find: /^@solana\/transaction-confirmation$/,
        replacement: path.resolve(__dirname, './src/shims/solana-tx-confirmation.ts'),
      },
      {
        find: /^@solana\/wallet-adapter-react$/,
        replacement: path.resolve(__dirname, './src/shims/solana-wallet-adapter-react.ts'),
      },
      {
        find: /^__vite-optional-peer-dep:@solana\/wallet-adapter-react:/,
        replacement: path.resolve(__dirname, './src/shims/solana-wallet-adapter-react.ts'),
      },
      {
        find: /^@solana\/web3\.js$/,
        replacement: path.resolve(__dirname, './src/shims/solana-web3.ts'),
      },
      {
        find: /^__vite-optional-peer-dep:@solana\/web3\.js:/,
        replacement: path.resolve(__dirname, './src/shims/solana-web3.ts'),
      },
    ],
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
