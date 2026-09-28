/**
 * Market — browses every launch on the vibes platform (testnet.vibevibe.fun),
 * same data source as /pulse, /traders and /token over there.
 *
 * Data: GET https://testnet.vibevibe.fun/api/v1/chains/46630/launches
 */
import { useCallback, useEffect, useRef, useState } from "react";
import { Link } from "@tanstack/react-router";
import {
  listLaunches,
  type VibesLaunch,
  type VibesPage,
} from "@/lib/vibes";
import { fmtEth, fmtPct, timeAgo, shortAddr, toWei } from "@/lib/format";
import TokenImage from "./TokenImage";

type Sort = "new" | "volume" | "holders" | "progress";

export default function MarketPage() {
  const [items, setItems] = useState<VibesLaunch[]>([]);
  const [page, setPage] = useState<VibesPage | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [q, setQ] = useState("");
  const [sort, setSort] = useState<Sort>("new");
  const cursorRef = useRef<string | undefined>(undefined);
  const [showDevOnly, setShowDevOnly] = useState(false);
  const reqId = useRef(0);

  const load = useCallback(
    async (reset = false) => {
      const id = ++reqId.current;
      setLoading(true);
      setError(null);
      try {
        const res = await listLaunches({
          limit: 24,
          cursor: reset ? undefined : cursorRef.current,
          q: q.trim() || undefined,
        });
        if (id !== reqId.current) return; // a newer load already started
        cursorRef.current = res.page.nextCursor;
        setPage(res.page);
        setItems((prev) => (reset ? res.items : [...prev, ...res.items]));
      } catch (e) {
        if (id !== reqId.current) return;
        setError((e as Error).message.slice(0, 140));
      } finally {
        if (id === reqId.current) setLoading(false);
      }
    },
    [q],
  );

  // initial load + reload on search (debounced so typing doesn't spam the indexer)
  useEffect(() => {
    cursorRef.current = undefined;
    const t = setTimeout(() => void load(true), 350);
    return () => clearTimeout(t);
  }, [load]);

  // cancel any in-flight request when leaving the page
  useEffect(() => {
    return () => {
      reqId.current++;
    };
  }, []);

  const visible = (() => {
    let out = items.slice();
    if (showDevOnly) {
      out = out.filter((i) => i.creatorAddress.toLowerCase() === DEV.toLowerCase());
    }
    const cmp: Record<Sort, (a: VibesLaunch, b: VibesLaunch) => number> = {
      // vibes returns newest first already; keep insertion order so pagination
      // stays stable instead of re-shuffling after every "load more".
      new: () => 0,
      volume: (a, b) =>
        Number(toWei(b.analytics.volume24hWei)) - Number(toWei(a.analytics.volume24hWei)),
      holders: (a, b) => (b.holderCount ?? 0) - (a.holderCount ?? 0),
      progress: (a, b) => b.curve.progressBps - a.curve.progressBps,
    };
    return out.sort(cmp[sort]);
  })();

  return (
    <section className="container py-10">
      <div className="mb-6 flex flex-col gap-4">
        <div className="flex flex-wrap items-baseline justify-between gap-3">
          <div>
            <h1 className="text-3xl font-bold">Market</h1>
            <p className="mt-1 text-sm text-muted-foreground">
              Live launches on{" "}
              <a
                href="https://testnet.vibevibe.fun"
                target="_blank"
                rel="noreferrer noopener"
                className="underline underline-offset-2 hover:text-foreground"
              >
                testnet.vibevibe.fun
              </a>{" "}
              — bonding-curve tokens on Robinhood Chain Testnet. Synced from the
              vibes indexer.
            </p>
          </div>
          {page && (
            <span className="text-xs text-muted-foreground mono">
              {items.length} of {page.hasMore ? "many" : items.length} launches
            </span>
          )}
        </div>

        <div className="flex flex-wrap items-center gap-2">
          <input
            type="search"
            placeholder="Search token or symbol…"
            value={q}
            onChange={(e) => setQ(e.target.value)}
            className="h-9 w-full flex-1 rounded-md border border-input bg-background px-3 text-sm outline-none placeholder:text-muted-foreground focus-visible:ring-2 focus-visible:ring-ring sm:w-auto sm:min-w-[14rem]"
          />

          <select
            value={sort}
            onChange={(e) => setSort(e.target.value as Sort)}
            className="h-9 rounded-md border border-input bg-background px-2 text-sm outline-none focus-visible:ring-2 focus-visible:ring-ring"
          >
            <option value="new">Newest</option>
            <option value="volume">24h volume</option>
            <option value="holders">Holders</option>
            <option value="progress">Curve progress</option>
          </select>

          <button
            type="button"
            onClick={() => setShowDevOnly((v) => !v)}
            className={`chip ${showDevOnly ? "is-dev" : ""}`}
            style={{ height: "2.25rem", padding: "0 0.625rem", cursor: "pointer" }}
          >
            Dev launches
          </button>

          <button
            type="button"
            onClick={() => {
              cursorRef.current = undefined;
              void load(true);
            }}
            disabled={loading}
            className="h-9 rounded-md border border-input bg-background px-3 text-sm hover:bg-accent disabled:opacity-50"
          >
            {loading ? "Syncing…" : "Refresh"}
          </button>
        </div>
      </div>

      {error && (
        <div className="mb-6 rounded-md border border-red-500/40 bg-red-500/10 p-3 text-sm text-red-500">
          Indexer unavailable: {error}. The market is read from the vibes API —
          try again in a moment.
        </div>
      )}

      {visible.length === 0 && !loading ? (
        <div className="rounded-md border border-border bg-card p-10 text-center text-sm text-muted-foreground">
          No launches found{q ? ` for “${q}”` : ""}.
        </div>
      ) : (
        <div className="market-grid">
          {visible.map((l) => (
            <TokenCard key={l.launchId + l.tokenAddress} launch={l} />
          ))}
          {loading &&
            Array.from({ length: 6 }).map((_, i) => (
              <div key={"sk" + i} className="token-card" aria-hidden>
                <div className="skeleton" style={{ aspectRatio: "1 / 1" }} />
                <div className="skeleton" style={{ height: "0.875rem", width: "60%" }} />
                <div className="skeleton" style={{ height: "0.75rem", width: "40%" }} />
              </div>
            ))}
        </div>
      )}

      {page?.hasMore && !loading && (
        <div className="mt-8 flex justify-center">
          <button
            type="button"
            onClick={() => void load(false)}
            className="rounded-md border border-input bg-background px-5 py-2 text-sm hover:bg-accent"
          >
            Load more
          </button>
        </div>
      )}
    </section>
  );
}

import { ISSUER as DEV } from "@/contracts";

function TokenCard({ launch }: { launch: VibesLaunch }) {
  const grad = launch.curve.lifecycle === "GRADUATED";
  const pct = Math.min(100, Math.round(launch.curve.progressBps / 100));
  const isDev = launch.creatorAddress.toLowerCase() === DEV.toLowerCase();
  const change = Number(launch.analytics.priceChange24hBps || 0);
  const up = change >= 0;

  return (
    <Link
      to="/token/$tokenAddress"
      params={{ tokenAddress: launch.tokenAddress }}
      className="token-card"
    >
      <div className="thumb">
        <TokenImage uri={launch.content.image?.uri} alt={launch.name} className="!static" />
      </div>

      <div className="flex items-start justify-between gap-2">
        <div className="min-w-0">
          <div className="truncate text-sm font-bold">${launch.symbol}</div>
          <div className="truncate text-xs text-muted-foreground">{launch.name}</div>
        </div>
        {isDev && <span className="chip is-dev">Dev</span>}
      </div>

      <div className="curve-track" title={`Curve progress ${pct}%`}>
        <span style={{ width: pct + "%" }} />
      </div>

      <div className="flex items-center justify-between text-xs text-muted-foreground">
        <span className={grad ? "text-destructive" : ""}>
          {grad ? "Graduated" : `${pct}%`}
        </span>
        <span>{launch.holderCount ?? 0} holders</span>
      </div>

      <div className="flex items-center justify-between gap-2 border-t border-border pt-2 text-xs">
        <span className="text-muted-foreground">
          {fmtEth(launch.analytics.volume24hWei)} ETH 24h
        </span>
        <span className={up ? "text-foreground" : "text-destructive"}>
          {fmtPct(launch.analytics.priceChange24hBps)}
        </span>
      </div>

      <div className="flex items-center justify-between text-[0.6875rem] text-muted-foreground">
        <span className="mono">{shortAddr(launch.tokenAddress)}</span>
        <span>{timeAgo(launch.createdAt)} ago</span>
      </div>
    </Link>
  );
}
