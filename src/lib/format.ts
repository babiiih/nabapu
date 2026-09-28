/** Small formatting helpers shared across market components. */

function isWeiLike(v: unknown): v is string | bigint {
  if (typeof v === "bigint") return true;
  if (typeof v !== "string") return false;
  // "NaN", "Infinity", "" and anything non-numeric must be rejected here —
  // BigInt() throws on those and takes the whole page down.
  return /^\d+$/.test(v.trim());
}

/**
 * Safe BigInt conversion for wei strings coming off the indexer. Returns 0n
 * for anything BigInt() would throw on (the real cause of the 500s on some
 * token pages). Use this instead of BigInt(field) anywhere API data flows.
 */
export function toWei(v: unknown): bigint {
  return isWeiLike(v) ? BigInt(String(v).trim()) : 0n;
}

export function fmtEth(wei: string | bigint | undefined | null, maxFrac = 4): string {
  if (!isWeiLike(wei)) return "0";
  const n = Number(BigInt(String(wei))) / 1e18;
  if (!isFinite(n)) return "0";
  if (n === 0) return "0";
  if (n < 0.0001) return n.toExponential(2);
  return n.toLocaleString(undefined, { maximumFractionDigits: maxFrac });
}

export function fmtTokens(baseUnits: string | bigint | undefined | null, maxFrac = 2): string {
  if (!isWeiLike(baseUnits)) return "0";
  const n = Number(BigInt(String(baseUnits))) / 1e18;
  if (!isFinite(n)) return "0";
  if (n === 0) return "0";
  if (n >= 1e9) return (n / 1e9).toLocaleString(undefined, { maximumFractionDigits: 2 }) + "B";
  if (n >= 1e6) return (n / 1e6).toLocaleString(undefined, { maximumFractionDigits: 2 }) + "M";
  if (n >= 1e3) return (n / 1e3).toLocaleString(undefined, { maximumFractionDigits: 2 }) + "K";
  if (n < 0.0001) return n.toExponential(2);
  return n.toLocaleString(undefined, { maximumFractionDigits: maxFrac });
}

export function fmtUsd(cents: string | number | undefined | null): string {
  if (!cents) return "$0";
  const n = Number(cents) / 100;
  return "$" + n.toLocaleString(undefined, { maximumFractionDigits: 2 });
}

export function fmtPct(bps: number | string | undefined | null): string {
  if (bps === undefined || bps === null) return "0%";
  const n = Number(bps) / 100;
  return (n >= 0 ? "+" : "") + n.toFixed(1) + "%";
}

export function shortAddr(a: unknown): string {
  if (typeof a !== "string") return "";
  if (!a) return "";
  return a.slice(0, 6) + "…" + a.slice(-4);
}

export function timeAgo(iso: unknown): string {
  if (typeof iso !== "string") return "";
  if (!iso) return "";
  const then = Date.parse(iso);
  if (isNaN(then)) return "";
  const s = Math.max(0, Math.round((Date.now() - then) / 1000));
  if (s < 60) return s + "s";
  if (s < 3600) return Math.floor(s / 60) + "m";
  if (s < 86400) return Math.floor(s / 3600) + "h";
  if (s < 86400 * 30) return Math.floor(s / 86400) + "d";
  return Math.floor(s / (86400 * 30)) + "mo";
}

/** Local wallet nickname — set from the profile dropdown / sidebar.
 *  Falls back to the short address when unset. */
export function walletLabel(fallback?: string | null): string {
  try {
    const v = localStorage.getItem("nabapu:label");
    if (v && v.trim()) return v.trim();
  } catch {
    /* ignore */
  }
  return fallback ? shortAddr(fallback) : "Connect wallet";
}
