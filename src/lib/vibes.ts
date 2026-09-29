/**
 * Vibes indexer client — reads launch/market data from the vibes platform API.
 *
 * The vibes API is CORS-locked to its own origin, so every call goes through
 * our /api/vibes proxy (see api/vibes/proxy.js). In dev, vite proxies the same
 * path (see vite.config.ts) so preview behaves like production.
 */

export const VIBES_BASE = import.meta.env.VITE_VIBES_API || "/api/vibes";

/** Pinata IPFS gateway — verified reachable and returns image/webp. */
export function ipfsUrl(uri: string | undefined | null): string | undefined {
  if (!uri) return undefined;
  const raw = String(uri).trim();
  if (raw.startsWith("http")) return raw;
  if (raw.startsWith("ipfs://")) {
    const cid = raw.slice("ipfs://".length);
    return `https://gateway.pinata.cloud/ipfs/${cid}`;
  }
  if (/^(bafy|bafk|Qm)/.test(raw)) return `https://gateway.pinata.cloud/ipfs/${raw}`;
  return raw;
}

export interface VibesImage {
  uri: string;
  bytes?: number;
  width?: number;
  height?: number;
  mimeType?: string;
}

export interface VibesCurve {
  lifecycle: string;
  tokensSoldBaseUnits: string;
  tokensRemainingBaseUnits: string;
  netRaisedWei: string;
  netTargetWei: string;
  ethRemainingWei: string;
  progressBps: number;
  completedAt: string | null;
  graduatedAt: string | null;
}

export interface VibesAnalytics {
  status: string;
  lastPriceWeiPerToken: string;
  volume24hWei: string;
  volume1hWei: string;
  volume5mWei: string;
  priceChange24hBps: string;
  uniqueBuyers1h: number;
  buyCount1h: number;
  sellCount1h: number;
}

export interface VibesLaunch {
  launchId: string;
  tokenAddress: string;
  curveAddress: string;
  creatorAddress: string;
  creatorVaultAddress: string;
  quoteAssetAddress: string;
  name: string;
  symbol: string;
  decimals: number;
  createdAt: string;
  holderCount: number;
  content: {
    description?: string;
    image?: VibesImage;
    socials?: Record<string, string>;
  };
  curve: VibesCurve;
  analytics: VibesAnalytics;
  moderation: { visibility: string };
}

export interface VibesPage {
  limit: number;
  nextCursor?: string;
  hasMore: boolean;
}

export interface VibesActivity {
  id: string;
  type: string; // LAUNCH | BUY | SELL | ...
  side?: string;
  route?: string;
  tokenAddress: string;
  actorAddress: string;
  amountInBaseUnits?: string;
  amountOutBaseUnits?: string;
  txHash: string;
  blockNumber: string;
  occurredAt: string;
}

/**
 * The token-side amount of a wallet activity event.
 *
 * The indexer stores both legs of the trade: for a BUY, amountIn is the ETH
 * spent and amountOut the tokens received; for a SELL it is the reverse. So
 * the token quantity is amountOut when buying and amountIn when selling.
 * Returns null when the event has no amounts (LAUNCH).
 */
export function activityTokenAmount(a: VibesActivity): string | null {
  const t = (a.type || "").toUpperCase();
  const buy = t === "BUY" || (a.side || "").toUpperCase() === "BUY";
  if (buy) return a.amountOutBaseUnits ?? null;
  const sell = t === "SELL" || (a.side || "").toUpperCase() === "SELL";
  if (sell) return a.amountInBaseUnits ?? null;
  return null;
}

/** The ETH-side amount of a wallet activity event (null for LAUNCH). */
export function activityEthAmount(a: VibesActivity): string | null {
  const t = (a.type || "").toUpperCase();
  const buy = t === "BUY" || (a.side || "").toUpperCase() === "BUY";
  if (buy) return a.amountInBaseUnits ?? null;
  const sell = t === "SELL" || (a.side || "").toUpperCase() === "SELL";
  if (sell) return a.amountOutBaseUnits ?? null;
  return null;
}

async function getJson(pathAndQuery: string): Promise<any> {
  const url = pathAndQuery.startsWith("http")
    ? pathAndQuery
    : `${VIBES_BASE}${pathAndQuery}`;
  const r = await fetch(url, { headers: { accept: "application/json" } });
  if (!r.ok) throw new Error(`VIBES_HTTP_${r.status}`);
  const j = await r.json();
  if (j && j.error) throw new Error(j.error.message || "VIBES_ERROR");
  return j;
}

/**
 * List launches (token marketplace). Newest first by default.
 * Pass cursor from page.nextCursor to paginate.
 */
export async function listLaunches(opts: {
  limit?: number;
  cursor?: string;
  q?: string;
} = {}): Promise<{ items: VibesLaunch[]; page: VibesPage }> {
  const p = new URLSearchParams();
  p.set("limit", String(opts.limit ?? 24));
  if (opts.cursor) p.set("cursor", opts.cursor);
  if (opts.q) p.set("q", opts.q);
  const j = await getJson(`/launches?${p.toString()}`);
  return { items: j.data.items as VibesLaunch[], page: j.data.page as VibesPage };
}

/** One launch by token address. */
export async function getLaunch(tokenAddress: string): Promise<VibesLaunch | null> {
  try {
    const j = await getJson(`/launches/${tokenAddress}`);
    return (j.data as VibesLaunch) ?? null;
  } catch {
    return null;
  }
}

/** Wallet activity — buys, sells, launches. Core of the profile feed + live notifs. */
export async function walletActivity(
  address: string,
  limit = 25,
  cursor?: string,
): Promise<{ items: VibesActivity[]; page: VibesPage }> {
  const p = new URLSearchParams();
  p.set("limit", String(limit));
  if (cursor) p.set("cursor", cursor);
  const j = await getJson(`/wallets/${address}/activity?${p.toString()}`);
  return { items: j.data.items as VibesActivity[], page: j.data.page as VibesPage };
}

export interface QuoteRate {
  quoteAddress: string;
  usdPerQuoteCents: string;
  source: string;
  observedAt: string;
}

export interface VibesCandle {
  t: number;
  o: string;
  h: string;
  l: string;
  c: string;
  v: string;
}

/** USD rate for the quote asset (SPCX) — used to show fiat equivalents. */
export async function quoteUsdRates(): Promise<QuoteRate[]> {
  try {
    const j = await getJson(`/market/quote-usd-rates`);
    return (j.data.items as QuoteRate[]) ?? [];
  } catch {
    return [];
  }
}

/** Price candles for a single asset — feeds the token page chart. */
export async function assetCandles(
  tokenAddress: string,
  interval = "1h",
  from?: number,
  to?: number,
): Promise<VibesCandle[]> {
  try {
    const p = new URLSearchParams({ interval });
    if (from) p.set("from", String(from));
    if (to) p.set("to", String(to));
    const j = await getJson(`/launches/${tokenAddress}/candles?${p.toString()}`);
    const d = j.data ?? {};
    const raw = (d.candles ?? d.items ?? []) as any[];
    // The indexer returns bucket shape ({bucketStart, openPriceWeiPerToken…})
    // while the chart expects {t,o,h,l,c,v}. Map + drop anything non-numeric,
    // otherwise Number(undefined) = NaN takes the whole canvas down.
    return raw
      .map((k): VibesCandle | null => {
        const t = Date.parse(k.bucketStart ?? k.t ?? "") / 1000;
        const o = String(k.o ?? k.openPriceWeiPerToken ?? "");
        const h = String(k.h ?? k.highPriceWeiPerToken ?? "");
        const l = String(k.l ?? k.lowPriceWeiPerToken ?? "");
        const c = String(k.c ?? k.closePriceWeiPerToken ?? "");
        const v = String(k.v ?? k.volumeWei ?? "0");
        const num = (s: string) => /^\d+$/.test(s) && Number.isFinite(Number(s));
        if (!Number.isFinite(t) || !num(o) || !num(h) || !num(l) || !num(c)) return null;
        return { t, o, h, l, c, v };
      })
      .filter((x): x is VibesCandle => x !== null);
  } catch {
    return [];
  }
}

/**
 * On-chain tx history straight from the Robinhood explorer — the ground truth.
 * Used as a fallback/complement to the indexer feed on the token page.
 * The explorer only supports the token address itself, not the bonding curve.
 */
export async function explorerActivity(
  address: string,
): Promise<VibesActivity[]> {
  try {
    const j = await getJson(`/explorer/addresses/${address}/transactions`);
    const items = (j.items ?? []) as any[];
    return items.map((t) => {
      const sel = (t.raw_input ?? "").slice(0, 10).toLowerCase();
      // SEEDIFY curve selectors: buy 0xd6febde8, sell 0xd3c9727c
      const isBuy = sel === "0xd6febde8";
      const isSell = sel === "0xd3c9727c";
      return {
        id: t.hash,
        type: isBuy ? "BUY" : isSell ? "SELL" : (t.transaction_types?.[0] ?? "TRADE"),
        tokenAddress: address,
        actorAddress: t.from_hash ?? t.from ?? "",
        txHash: t.hash,
        blockNumber: String(t.block_number ?? 0),
        occurredAt: t.timestamp ?? "",
      } as VibesActivity;
    });
  } catch {
    return [];
  }
}

/** 24h trade flow (buys vs sells) for a single asset. */
export async function assetFlow24h(tokenAddress: string): Promise<any> {
  try {
    const j = await getJson(`/assets/${tokenAddress}/flow24h`);
    return j.data ?? null;
  } catch {
    return null;
  }
}

/** Recent trades for a single asset — the token page trade log. */
export async function assetActivity(
  tokenAddress: string,
  { limit = 40 }: { limit?: number } = {},
): Promise<VibesActivity[]> {
  try {
    // The indexer rejects limit > 100 with a 400, so clamp here as well.
    const capped = Math.min(limit, 100);
    const j = await getJson(
      `/launches/${tokenAddress}/activity?limit=${capped}`,
    );
    return (j.data.items as VibesActivity[]) ?? [];
  } catch {
    return [];
  }
}

export const VIBES_SITE = "https://testnet.vibevibe.fun";
