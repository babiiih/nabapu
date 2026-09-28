/** Small formatting helpers shared across market components. */

export function fmtEth(wei: string | bigint | undefined | null, maxFrac = 4): string {
  if (!wei) return "0";
  const n = Number(BigInt(String(wei))) / 1e18;
  if (!isFinite(n)) return "0";
  if (n === 0) return "0";
  if (n < 0.0001) return n.toExponential(2);
  return n.toLocaleString(undefined, { maximumFractionDigits: maxFrac });
}

export function fmtTokens(baseUnits: string | bigint | undefined | null, maxFrac = 2): string {
  if (!baseUnits) return "0";
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

export function shortAddr(a: string | undefined | null): string {
  if (!a) return "";
  return a.slice(0, 6) + "…" + a.slice(-4);
}

export function timeAgo(iso: string | undefined | null): string {
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
