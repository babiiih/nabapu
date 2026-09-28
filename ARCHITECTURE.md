# Architecture Overview

Living documentation for **Nabapu** — an RWA token launchpad / marketplace on
Robinhood Chain Testnet. Update this document as the codebase evolves.

---

## 1. Project Structure

Nabapu is a **single-repo Vite SPA** plus a small **serverless API layer**.
There is no separate `backend/` service — server-side logic lives in
`api/` and runs as Vercel Edge/Node functions.

```text
web2/
├── api/                        # Serverless API layer (Vercel functions)
│   └── vibes/
│       └── proxy.js            # The one and only API route:
│                               #   /api/vibes/*  → vibes indexer
│                               #   /api/vibes/explorer/* → Robinhood explorer
├── public/                     # Static assets (favicon, images, logo)
├── src/
│   ├── main.tsx                # App entry — stacks all providers
│   ├── routes/                 # TanStack Router file-based routes
│   │   ├── __root.tsx
│   │   └── _authenticated/     # Route group under the shell layout
│   │       ├── index.tsx               # /        Dashboard
│   │       ├── market/index.tsx        # /market  Token grid
│   │       ├── profile/index.tsx       # /profile Wallet + activity
│   │       ├── token/$tokenAddress.tsx # /token/:addr  Token detail
│   │       └── route.tsx               # Layout route (sidebar + footer)
│   ├── features/               # Feature-sliced components
│   │   ├── dashboard/          # Stats + recent launches + chart
│   │   ├── market/             # MarketPage, TokenPage, TradeBox,
│   │   │                       # CandlestickChart, TradeLog, TokenImage
│   │   └── errors/             # 404 / 500 / maintenance pages
│   ├── components/             # App-level reusable components
│   │   ├── layout/             # Sidebar, header, footer, nav-user,
│   │   │                       # profile-dropdown, top-nav
│   │   └── ui/                 # shadcn/ui primitives (Radix + Tailwind)
│   ├── context/                # Theme / font / direction / layout /
│   │                           # search providers
│   ├── hooks/                  # use-mobile, use-dialog-state,
│   │                           # use-table-url-state
│   ├── lib/                    # Cross-cutting helpers
│   │   ├── vibes.ts            # ★ vibes indexer client (launches,
│   │   │                       #   activity, candles, wallet feed)
│   │   ├── format.ts           # ★ toWei() / fmtEth / fmtTokens /
│   │   │                       #   shortAddr / timeAgo — all crash-safe
│   │   ├── cookies.ts          # sidebar_state etc.
│   │   └── handle-server-error.ts
│   ├── contracts.ts            # Chain + contract addresses (TOKEN, CHAIN, ISSUER)
│   ├── wagmi.ts                # wagmi config (chains + wallet connectors)
│   ├── supabase.ts             # RWA provenance ledger client (anon key)
│   └── routeTree.gen.ts        # ⛔ generated — never edit by hand
├── vercel.json                 # Build config + rewrites + function timeouts
├── index.html                  # App shell, meta tags, fonts
└── package.json                # nabapu@1.0.0 (private)
```

---

## 2. High-Level System Diagram

```text
                      Browser (user)
                            │
                            ▼
        ┌────────────────────────────────────────┐
        │  Nabapu SPA  (Vercel — static dist)    │
        │                                        │
        │  TanStack Router · wagmi/viem ·        │
        │  React Query · shadcn/ui               │
        └───────────────┬──────────────┬─────────┘
                        │              │
        read (REST)     │              │  write (RPC)
                        ▼              ▼
        ┌──────────────────────┐   ┌──────────────────────┐
        │  /api/vibes/proxy    │   │  Robinhood Testnet   │
        │  (Vercel function)   │   │  RPC (testnet.vibe   │
        │                      │   │  vibe.fun/rpc)       │
        │  • CORS bypass       │   │  chainId 46630       │
        │  • path whitelist    │   └──────────────────────┘
        │  • 15s edge cache    │
        └──────┬───────────────┘
               │
   ┌───────────┴──────────────────────────┐
   ▼                                      ▼
 vibes indexer                    Robinhood explorer
 (testnet.vibevibe.fun            (explorer.testnet.chain
  /api/v1/chains/46630)            .robinhood.com/api/v2)
 launches · activity ·             raw on-chain tx history
 candles · wallets                 (fallback / ground truth)

               (read, client-side)
                        │
                        ▼
                 Supabase (ap-southeast-2)
                 RWA provenance ledger
```

**Key flows**

- **Read:** SPA → `/api/vibes/proxy` → vibes indexer (all market data) or
  Robinhood explorer (raw tx history). The proxy exists because the indexer
  sends `Access-Control-Allow-Origin: https://testnet.vibevibe.fun` only.
- **Write:** SPA → RPC directly (wagmi/viem) — buy, sell, approve.
- **Browsing:** SPA → Supabase anon key for RWA provenance metadata.

---

## 3. Core Components

### 3.1. Frontend — Nabapu Web App

**Description:** The whole product. Token market grid, token detail page with
a candlestick chart + live trade feed, wallet profile with activity history,
and an admin-style shell (collapsible sidebar, theme/font switchers, command
palette).

**Technologies:** React 19, TypeScript, TanStack Router (file-based, code-split),
TanStack React Query, Tailwind CSS v4 (oklch), shadcn/ui (Radix), wagmi 3 +
viem, zustand, recharts, vite 8.

**Deployment:** Vercel — static `dist/` served from the edge, with the
catch-all rewrite `/((?!api/).*) → /index.html` for client-side routing.

### 3.2. API Layer — `/api/vibes/proxy`

**Description:** One serverless function, one purpose: read-only proxy that
strips CORS for the browser. It accepts a catch-all `path` param, validates it
against a **strict regex whitelist**, forwards the request, and returns JSON
with permissive CORS headers and a 15s edge cache.

Two upstreams:

1. **vibes indexer** — `/launches`, `/launches/:addr`, `/wallets/:addr/activity`,
   `/market/quote-usd-rates`, `:addr/(candles|flow24h|activity)`
2. **Robinhood explorer** — `/explorer/addresses/:addr/transactions`
   (server-side only: the host's TLS cert is expired and it is ISP-blocked
   in some regions)

**Technologies:** Node/Edge function, plain `fetch`. `maxDuration: 30s`.

**Security posture:** GET only, path-validated, no request body forwarded,
no secrets in the client.

### 3.3. Wallet Layer — wagmi/viem

**Description:** Connects user wallets (injected/MetaMask/Coinbase/WalletConnect),
exposes chain state to the app. All on-chain writes go through this.

**Technologies:** wagmi 3, viem 2, EIP-6963 discovery + explicit connectors.

---

## 4. Data Stores

### 4.1. Vibes Indexer (external, primary)

**Type:** REST API (`testnet.vibevibe.fun/api/v1/chains/46630`)

**Purpose:** Source of truth for market data: launches, bonding-curve state,
analytics (price/volume/buyers), activity feed, wallet history.

**Key resources:** `/launches`, `/launches/:addr`, `/launches/:addr/activity`,
`/candles`, `/wallets/:addr/activity`, `/market/quote-usd-rates`.

**Quirk:** rejects `limit > 100` with a 400 — `assetActivity()` clamps it.

### 4.2. Robinhood Explorer (external, fallback)

**Type:** REST API (`explorer.testnet.chain.robinhood.com/api/v2`)

**Purpose:** Raw on-chain transaction history — the ground truth. Merged into
the trade feed and chart, deduped by tx hash.

**Quirk:** sends `content-encoding: br`; `raw_input` selectors decode to
SEEDIFY curve ops (`buy` 0xd6febde8 / `sell` 0xd3c9727c).

### 4.3. Supabase — RWA provenance ledger

**Type:** Postgres (SaaS, `ap-southeast-2`, project `nthzbjrvfohdpmrhkfrn`)

**Purpose:** Off-chain index of on-chain `ValuationUpdated` events + issuer
attestations for RWA tokens.

**Access:** anon/publishable key only (safe to ship). The `service_role` key
never touches the client.

### 4.4. LocalStorage (browser)

**Purpose:** UI state only — sidebar collapse state, theme, and the
`nabapu:label` wallet nickname.

---

## 5. External Integrations / APIs

| Service | Purpose | Method |
|---|---|---|
| Vibes indexer | All market/activity data | REST via `/api/vibes/proxy` |
| Robinhood Explorer | Raw tx history (fallback) | REST via `/api/vibes/proxy` |
| Robinhood Testnet RPC | Buy/sell/approve + quotes | viem/wagmi RPC, direct from browser |
| IPFS (via Pinata gateway) | Token images | plain `https://` URL |
| Supabase | RWA provenance metadata | REST + anon key |
| Vercel | Hosting + serverless functions | git push auto-deploy |

---

## 6. Deployment & Infrastructure

**Cloud Provider:** Vercel.

**Key Services Used:** Static hosting (edge), Serverless Functions,
Edge cache (`s-maxage=15, stale-while-revalidate=30`).

**CI/CD:** GitHub `babiiih/nabapu`, branch `main`. **Every push to `main`
auto-deploys to production** (`nabapu-app.vercel.app`). Ad-hoc deploys use
`vercel deploy --prod --yes`.

**Monitoring:** None wired up yet — bugs are found via manual Playwright
audits and browser console checks. See §7 for the crash class these audits
have already caught.

---

## 7. Security Considerations

**Authentication:** None. This is a testnet app; "identity" is wallet
ownership. Clerk is a dependency of the template but **is not used** —
auth-style routes were stripped.

**Authorization:** N/A — all reads are public; writes require a wallet
signature via wagmi.

**Data Encryption:** TLS everywhere. The explorer's expired TLS cert is
tolerated for read-only fetches from the serverless proxy.

**Key Security Practices:**

- The proxy has a **strict path whitelist** — arbitrary upstream paths are
  rejected with 403 (`FORBIDDEN_PATH`), which prevents SSRF.
- Only GET is handled; no request body is forwarded upstream.
- Supabase: anon key only; `service_role` stays server-side.
- **No private keys or secrets are stored in the client bundle.** Wallet
  signing happens in the user's wallet extension.

**⚠ Known runtime hazard class (see §9):** unvalidated wei strings reaching
`BigInt()` crashed entire pages. All conversions now go through `toWei()`.

---

## 8. Development & Testing Environment

**Local Setup:**

```bash
npm install --legacy-peer-deps
npm run dev          # vite, http://localhost:5173
npm run build        # tsc -b && vite build
npm run lint         # eslint
npm run preview      # serve the production build
```

`--legacy-peer-deps` is required — wagmi vs React 19 peer conflicts.

**Testing Frameworks:** Vitest + `@vitest/browser-playwright`. Unit tests
live next to their source: `lib/*.test.ts`, `components/**/*.test.tsx`.

**Code Quality Tools:** ESLint (typescript-eslint), Prettier (with
tailwindcss + import sorting plugins), TypeScript strict (`tsc -b` gates the
build), `knip` for dead-code detection.

**Manual audit pattern (Playwright, uncommitted):** a throwaway `.cjs` script
launched headless Chrome, clicked UI, and asserted on DOM + console errors.
This is how the 500 crash and the blank chart were found and fixed.

---

## 9. Future Considerations / Roadmap

**Architectural debt / known issues:**

- **`BigInt()` on API data is a page-killer.** Already mitigated via
  `toWei()` in `lib/format.ts`, but any new code touching wei must use it —
  raw `BigInt(field)` is banned. Root cause was the indexer occasionally
  returning non-decimal strings, which throws `SyntaxError` and blanks the
  whole route.
- **Candle buckets from the indexer are empty for every token.**
  `CandlestickChart` falls back to deriving OHLC from trade events
  ("trade history + on-chain"), but for low-volume tokens the chart is
  genuinely sparse. Fix when the indexer ships OHLC.
- **Clerk is still a dependency but unused** — safe to remove.
- **No error monitoring** in production. Consider Sentry/Logflare.
- **TanStack Router devtools** throws a harmless `path.endsWith is not a
  function` in dev — devtools-only, not an app bug.

**Roadmap:**

- Replace demo dashboard stats with real RWA-specific analytics.
- Add issuer attestation flows backed by the Supabase ledger.
- Real-time trade feed (websocket or polling) instead of on-load fetch.
- Remove the unused Clerk dependency.

---

## 10. Project Identification

| | |
|---|---|
| **Project Name** | Nabapu — RWA marketplace |
| **Repository URL** | https://github.com/babiiih/nabapu |
| **Live URL** | https://nabapu-app.vercel.app |
| **Chain** | Robinhood Chain Testnet (chainId 46630) |
| **Primary Contact** | @nabapu13 (X) · nabapu (Discord) · naufalbaliputraa@gmail.com |
| **Date of Last Update** | 2026-09-28 |

---

## 11. Glossary / Acronyms

- **RWA** — Real-World Asset. Each launch represents a tokenized asset.
- **NRWA / TRWA** — the two showcase tokens. NRWA is the vibes launch
  ($NRWA, `0x67e8…46be0`); TRWA is the RWA provenance contract
  ($TRWA, `0x149e…c33aDD`).
- **Bonding curve / SEEDIFY curve** — the price curve contract pairs use.
  Trade selectors: `buy` 0xd6febde8, `sell` 0xd3c9727c, `quoteBuy` 0x4beb394c,
  `quoteSell` 0xa64190c4, `graduated` 0xe7c2b772. Fee 125bps (75/25).
- **Vibes indexer** — the off-chain API that aggregates Robinhood Testnet
  launch/pool data. Not the chain itself.
- **toWei()** — the safe BigInt converter. Use it, always.
- **shadcn-admin** — the template this app was built from. Fully rebranded;
  no template identity remains.
- **SPA** — Single-Page Application. The server returns `index.html` for
  every non-API route; routing happens in the browser.
- **wagmi / viem** — React hooks and low-level EVM library for wallet +
  RPC interaction.
- **EIP-6963** — wallet discovery standard; lets MetaMask etc. announce
  themselves to the dApp.
