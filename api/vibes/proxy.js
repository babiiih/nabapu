/**
 * Vibes indexer proxy.
 *
 * The vibes API (testnet.vibevibe.fun) sends `Access-Control-Allow-Origin:
 * https://testnet.vibevibe.fun` only, so browsers on any other origin get
 * CORS-blocked. This route proxies the indexer server-side, where CORS does
 * not apply, and re-sends a permissive header.
 *
 *   GET /api/vibes/launches?limit=24&cursor=...&q=...
 *   GET /api/vibes/launches/:tokenAddress
 *   GET /api/vibes/wallets/:address/activity?limit=25
 *   GET /api/vibes/market/quote-usd-rates
 */
/** The vibes indexer — primary data source for launches, activity, candles. */
const UPSTREAM = "https://testnet.vibevibe.fun/api/v1/chains/46630";

/** Robinhood explorer — fallback source for on-chain tx history. Its TLS cert
 *  is expired and some ISPs block the host, so we fetch server-side. */
const EXPLORER_UPSTREAM = "https://explorer.testnet.chain.robinhood.com/api/v2";

/** Only allow GET — every call we make is a read. */
const ALLOWED_PREFIXES = [
  "/launches",
  "/market/quote-usd-rates",
  "/candles",
  "/config",
];

/** Price candles + 24h trade flow for a single asset. */
const ASSET_STATS_RE = /^\/assets\/0x[a-f0-9]{40}\/(candles|flow24h|activity)$/i;

export default async function handler(req, res) {
  // vercel.json rewrites /api/vibes/(.*) -> /api/vibes/proxy and the captured
  // group arrives as ?path=... (with a leading slash, e.g. "/launches").
  const { path: rawPath } = req.query;
  const parts = (Array.isArray(rawPath) ? rawPath : rawPath ? [rawPath] : [])
    .flatMap((p) => String(p).split("/"))
    .filter(Boolean);
  const joined = "/" + parts.join("/");

  const isWalletActivity = joined.startsWith("/wallets/") && joined.endsWith("/activity");
  const isLaunchDetail = /^\/launches\/0x[a-f0-9]{40}$/i.test(joined);
  const isLaunchStats = /^\/launches\/0x[a-f0-9]{40}\/(candles|flow24h|activity)$/i.test(joined);
  // Explorer tx history: /explorer/addresses/0xabc.../transactions
  const isExplorerTx = /^\/explorer\/addresses\/0x[a-f0-9]{40}\/transactions$/i.test(joined);

  const isAllowed =
    ALLOWED_PREFIXES.some((p) => joined === p || joined.startsWith(p + "/")) ||
    isLaunchDetail ||
    isLaunchStats ||
    isWalletActivity ||
    isExplorerTx ||
    ASSET_STATS_RE.test(joined);

  if (!isAllowed) {
    return res.status(403).json({ error: "FORBIDDEN_PATH", path: joined });
  }

  let body;

  if (isExplorerTx) {
    const upstream = joined.replace(/^\/explorer/, "");
    const params = new URLSearchParams();
    for (const [k, v] of Object.entries(req.query)) {
      if (k === "path") continue;
      params.append(k, String(v));
    }
    const qs = params.toString();
    try {
      const r = await fetch(`${EXPLORER_UPSTREAM}${upstream}${qs ? "?" + qs : ""}`, {
        headers: { accept: "application/json" },
      });
      // The explorer sends `content-encoding: br`; Node's fetch decodes it
      // correctly when reading text(), so prefer that over arrayBuffer().
      const text = await r.text();
      if (!r.ok) {
        return res.status(r.status).json({ error: "EXPLORER_" + r.status, detail: text.slice(0, 200) });
      }
      try {
        body = JSON.parse(text);
      } catch {
        const cleaned = text.replace(/[\u0000-\u001f]/g, "");
        try {
          body = JSON.parse(cleaned);
        } catch {
          return res.status(502).json({
            error: "BAD_EXPLORER_JSON",
            len: text.length,
          });
        }
      }
    } catch (e) {
      return res.status(502).json({ error: "EXPLORER_UNREACHABLE" });
    }
  } else {

  // Rebuild the query string minus our own `path` param — the catch-all
  // route puts the matched URL segments there, which the upstream must never see.
  const params = new URLSearchParams();
  for (const [k, v] of Object.entries(req.query)) {
    if (k === "path") continue;
    if (Array.isArray(v)) v.forEach((x) => params.append(k, String(x)));
    else params.append(k, String(v));
  }
  const qs = params.toString();

  try {
    const r = await fetch(`${UPSTREAM}${joined}${qs ? "?" + qs : ""}`, {
      headers: { accept: "application/json" },
    });
    const text = await r.text();
    if (!r.ok) {
      return res.status(r.status).json({ error: "UPSTREAM_" + r.status, detail: text.slice(0, 200) });
    }
    // Forward the raw JSON (parse to validate, then re-serialize).
    try {
      body = JSON.parse(text);
    } catch {
      return res.status(502).json({ error: "BAD_UPSTREAM_JSON" });
    }
  } catch (e) {
    return res.status(502).json({ error: "UPSTREAM_UNREACHABLE" });
  }
  }

  res.setHeader("Access-Control-Allow-Origin", "*");
  res.setHeader("Cache-Control", "public, s-maxage=15, stale-while-revalidate=30");
  return res.status(200).json(body);
}
