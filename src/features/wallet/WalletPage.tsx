/**
 * Wallet tracker — tempel alamat wallet, lihat aktivitas on-chain di vibes
 * (buys/sells/launches) dari indexer. Alamat terakhir disimpan di localStorage.
 */
import { useCallback, useEffect, useRef, useState } from "react";
import { Link } from "@tanstack/react-router";
import {
  walletActivity,
  activityEthAmount,
  activityTokenAmount,
  type VibesActivity,
} from "@/lib/vibes";
import { fmtEth, fmtTokens, shortAddr, timeAgo } from "@/lib/format";
import { CHAIN, ISSUER } from "@/contracts";

const CA_RE = /^0x[a-f0-9]{40}$/i;
const LS_KEY = "nabapu:watched";

function loadWatched(): string[] {
  try {
    const v = JSON.parse(localStorage.getItem(LS_KEY) || "[]");
    if (Array.isArray(v)) return v.filter((x) => typeof x === "string" && CA_RE.test(x));
  } catch {
    /* ignore */
  }
  return [];
}

export default function WalletPage() {
  const [input, setInput] = useState("");
  const [watched, setWatched] = useState<string | null>(null);
  const [rows, setRows] = useState<VibesActivity[] | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [tried, setTried] = useState(false);
  const [recent, setRecent] = useState<string[]>([]);
  const reqId = useRef(0);

  useEffect(() => {
    setRecent(loadWatched());
    const last = loadWatched()[0];
    if (last) {
      setInput(last);
      setWatched(last);
    }
  }, []);

  const track = useCallback(async (addr: string) => {
    const id = ++reqId.current;
    setTried(true);
    setRows(null);
    setError(null);
    setWatched(addr);
    try {
      const res = await walletActivity(addr, 50);
      if (id !== reqId.current) return;
      setRows(res.items);
      // simpan ke recent list (max 8, terbaru di depan)
      setRecent((prev) => {
        const next = [addr, ...prev.filter((x) => x !== addr)].slice(0, 8);
        try {
          localStorage.setItem(LS_KEY, JSON.stringify(next));
        } catch {
          /* ignore */
        }
        return next;
      });
    } catch (e) {
      if (id !== reqId.current) return;
      setError((e as Error).message.slice(0, 140));
      setRows([]);
    }
  }, []);

  // auto-track alamat terakhir pas buka halaman
  useEffect(() => {
    const last = loadWatched()[0];
    if (last) void track(last);
    return () => {
      reqId.current++;
    };
  }, [track]);

  const stats = (() => {
    if (!rows) return null;
    let buys = 0,
      sells = 0,
      launches = 0,
      volEth = 0;
    for (const a of rows) {
      const t = (a.type || "").toUpperCase();
      if (t === "BUY" || a.side === "BUY") buys++;
      else if (t === "SELL" || a.side === "SELL") sells++;
      else if (t === "LAUNCH") launches++;
      const eth = activityEthAmount(a);
      if (eth) volEth += Number(tryEth(eth));
    }
    return { buys, sells, launches, volEth };
  })();

  const submit = () => {
    const q = input.trim();
    if (CA_RE.test(q)) void track(q);
  };

  return (
    <section className="container max-w-4xl py-10">
      <div>
        <span className="chip is-live mb-2">
          <span
            className="inline-block h-1.5 w-1.5 rounded-full bg-current"
            style={{ animation: "skeleton-pulse 1.6s ease-in-out infinite" }}
          />
          Indexer synced
        </span>
        <h1 className="text-3xl font-bold tracking-tight">Wallet</h1>
        <p className="mt-1 max-w-[70ch] text-sm text-muted-foreground">
          Track any address on Robinhood Chain Testnet — buys, sells and
          launches pulled live from the vibes indexer.
        </p>
      </div>

      <div className="mt-5 flex max-w-xl gap-2">
        <div className="relative flex-1">
          <svg
            className="text-muted-foreground absolute top-1/2 left-2.5 size-4 -translate-y-1/2"
            fill="none"
            viewBox="0 0 24 24"
            stroke="currentColor"
            strokeWidth={2}
          >
            <circle cx="11" cy="11" r="7" />
            <path d="m20 20-3.5-3.5" />
          </svg>
          <input
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === "Enter") submit();
            }}
            placeholder="Paste wallet address (0x…)"
            spellCheck={false}
            className="h-9 w-full rounded-md border border-input bg-background pr-3 pl-9 font-mono text-sm outline-none placeholder:font-sans placeholder:text-muted-foreground focus-visible:ring-2 focus-visible:ring-ring"
          />
        </div>
        <button
          type="button"
          onClick={submit}
          disabled={!CA_RE.test(input.trim())}
          className="bg-primary text-primary-foreground h-9 rounded-md px-4 text-sm font-medium transition-opacity hover:opacity-90 disabled:opacity-40"
        >
          Track
        </button>
      </div>

      {recent.length > 1 && (
        <div className="mt-3 flex flex-wrap items-center gap-2 text-xs">
          <span className="text-muted-foreground">Recent:</span>
          {recent.map((a) => (
            <button
              key={a}
              type="button"
              onClick={() => {
                setInput(a);
                void track(a);
              }}
              className={`rounded border px-2 py-1 font-mono transition-colors ${
                a === watched
                  ? "border-primary text-primary"
                  : "border-border text-muted-foreground hover:bg-accent"
              }`}
            >
              {shortAddr(a)}
              {a.toLowerCase() === ISSUER.toLowerCase() && " (dev)"}
            </button>
          ))}
        </div>
      )}

      {error && (
        <div className="mt-6 rounded-md border border-red-500/40 bg-red-500/10 p-3 text-sm text-red-500">
          Indexer unavailable: {error}
        </div>
      )}

      {watched && (
        <div className="mt-6">
          <div className="mb-3 flex flex-wrap items-center justify-between gap-2">
            <div className="flex items-center gap-2 text-sm">
              <span className="text-muted-foreground">Tracking</span>
              <span className="mono font-medium">{shortAddr(watched)}</span>
              {watched.toLowerCase() === ISSUER.toLowerCase() && (
                <span className="chip is-dev">Dev</span>
              )}
              <a
                href={`${CHAIN.explorer}/address/${watched}`}
                target="_blank"
                rel="noreferrer noopener"
                className="text-primary text-xs underline underline-offset-2"
              >
                explorer ↗
              </a>
            </div>
            {stats && (
              <div className="text-muted-foreground text-xs tabular-nums">
                {stats.buys} buys · {stats.sells} sells · {stats.launches} launches ·{" "}
                <span className="text-foreground font-medium">
                  {stats.volEth.toFixed(4)} ETH
                </span>{" "}
                volume
              </div>
            )}
          </div>

          {rows === null ? (
            <div className="space-y-2">
              {Array.from({ length: 5 }).map((_, i) => (
                <div key={i} className="skeleton" style={{ height: "3rem" }} />
              ))}
            </div>
          ) : rows.length === 0 ? (
            <div className="rounded-md border border-border bg-card p-10 text-center text-sm text-muted-foreground">
              {tried ? "No activity indexed for this address." : "Paste an address to start."}
            </div>
          ) : (
            <div className="feed">
              {rows.map((a) => {
                const buy = a.type === "BUY" || a.side === "BUY";
                const sell = a.type === "SELL" || a.side === "SELL";
                const launch = a.type === "LAUNCH";
                const tok = activityTokenAmount(a);
                const eth = activityEthAmount(a);
                return (
                  <a
                    key={a.id}
                    href={`${CHAIN.explorer}/tx/${a.txHash}`}
                    target="_blank"
                    rel="noreferrer noopener"
                    className="feed-row hover:bg-muted/40"
                  >
                    <span className={`feed-dot ${buy ? "is-buy" : sell ? "is-sell" : ""}`} />
                    <div className="min-w-0">
                      <span className="font-medium">
                        {launch ? "Launched" : buy ? "Buy" : sell ? "Sell" : a.type}
                      </span>
                      <span className="text-muted-foreground mono ml-2 text-xs">
                        {shortAddr(a.tokenAddress)}
                      </span>
                      <Link
                        to="/token/$tokenAddress"
                        params={{ tokenAddress: a.tokenAddress }}
                        onClick={(e) => e.stopPropagation()}
                        className="text-primary ml-2 text-xs underline underline-offset-2"
                      >
                        view
                      </Link>
                    </div>
                    <div className="text-right text-xs">
                      {tok && <div className="font-medium">{fmtTokens(tok)}</div>}
                      {eth && <div className="text-muted-foreground">{fmtEth(eth)} ETH</div>}
                      <div className="text-muted-foreground">{timeAgo(a.occurredAt)} ago</div>
                    </div>
                  </a>
                );
              })}
            </div>
          )}
        </div>
      )}
    </section>
  );
}

/** wei-string → ETH number (aman untuk nilai gila dari indexer). */
function tryEth(wei: string): number {
  try {
    return Number(BigInt(wei.trim())) / 1e18;
  } catch {
    return 0;
  }
}
