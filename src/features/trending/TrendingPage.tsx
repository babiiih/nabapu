/**
 * Trending — token paling panas di vibes, dihitung dari data indexer live
 * (24h volume, holders, price change, unique buyers 1h). Skor = kombinasi
 * normalisasi, refresh manual + auto tiap 60s.
 */
import { useCallback, useEffect, useRef, useState } from "react";
import { useNavigate } from "@tanstack/react-router";
import { listLaunches, type VibesLaunch } from "@/lib/vibes";
import { fmtEth, fmtPct, timeAgo, shortAddr, toWei } from "@/lib/format";
import TokenImage from "@/features/market/components/TokenImage";

type Tab = "volume" | "movers" | "new";

/** Composite heat score: volume dominates, buyers/holders break ties. */
function heat(l: VibesLaunch): number {
  const vol = Number(toWei(l.analytics.volume24hWei));
  const holders = l.holderCount ?? 0;
  const buyers = l.analytics.uniqueBuyers1h ?? 0;
  const change = Math.abs(Number(l.analytics.priceChange24hBps || 0));
  return vol * 1000 + holders * 50 + buyers * 200 + change;
}

export default function TrendingPage() {
  const navigate = useNavigate();
  const [items, setItems] = useState<VibesLaunch[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [tab, setTab] = useState<Tab>("volume");
  const [syncedAt, setSyncedAt] = useState<string>("");
  const reqId = useRef(0);

  const load = useCallback(async () => {
    const id = ++reqId.current;
    setLoading(true);
    setError(null);
    try {
      // two pages = up to 200 launches so the ranking isn't biased to newest
      const first = await listLaunches({ limit: 100 });
      let all = first.items;
      if (first.page.hasMore && first.page.nextCursor) {
        try {
          const second = await listLaunches({ limit: 100, cursor: first.page.nextCursor });
          all = [...all, ...second.items];
        } catch {
          /* one page is enough */
        }
      }
      if (id !== reqId.current) return;
      const seen = new Set<string>();
      setItems(all.filter((l) => !seen.has(l.tokenAddress) && seen.add(l.tokenAddress)));
      setSyncedAt(new Date().toLocaleTimeString());
    } catch (e) {
      if (id !== reqId.current) return;
      setError((e as Error).message.slice(0, 140));
    } finally {
      if (id === reqId.current) setLoading(false);
    }
  }, []);

  useEffect(() => {
    void load();
    const t = setInterval(() => void load(), 60_000);
    return () => {
      clearInterval(t);
      reqId.current++;
    };
  }, [load]);

  const ranked = (() => {
    const out = items.slice();
    if (tab === "volume") {
      out.sort((a, b) => heat(b) - heat(a));
    } else if (tab === "movers") {
      out.sort(
        (a, b) =>
          Number(b.analytics.priceChange24hBps || 0) -
          Number(a.analytics.priceChange24hBps || 0),
      );
    } else {
      out.sort((a, b) => b.createdAt.localeCompare(a.createdAt));
    }
    return out.slice(0, 50);
  })();

  return (
    <section className="container py-10">
      <div className="flex flex-wrap items-baseline justify-between gap-3">
        <div>
          <span className="chip is-live mb-2">
            <span
              className="inline-block h-1.5 w-1.5 rounded-full bg-current"
              style={{ animation: "skeleton-pulse 1.6s ease-in-out infinite" }}
            />
            Live heat index
          </span>
          <h1 className="text-3xl font-bold tracking-tight">Trending</h1>
          <p className="mt-1 max-w-[70ch] text-sm text-muted-foreground">
            Ranked from the vibes indexer — 24h volume, holders, unique buyers
            and momentum. Auto-refreshes every 60s.
            {syncedAt && <span className="ml-1 tabular-nums">· synced {syncedAt}</span>}
          </p>
        </div>
        <div className="border-border bg-card flex items-center gap-2 rounded-lg border px-3 py-1.5">
          <span className="text-foreground num text-sm font-bold">{items.length}</span>
          <span className="text-muted-foreground text-xs">launches scored</span>
        </div>
      </div>

      <div className="mt-5 flex gap-2">
        {(
          [
            ["volume", "🔥 Heat"],
            ["movers", "📈 Movers"],
            ["new", "✨ New"],
          ] as [Tab, string][]
        ).map(([k, label]) => (
          <button
            key={k}
            type="button"
            onClick={() => setTab(k)}
            className={`h-9 rounded-md border border-input px-3 text-sm transition-colors ${
              tab === k
                ? "bg-primary text-primary-foreground border-primary font-medium"
                : "bg-background hover:bg-accent text-muted-foreground"
            }`}
          >
            {label}
          </button>
        ))}
        <div className="flex-1" />
        <button
          type="button"
          onClick={() => void load()}
          disabled={loading}
          className="h-9 rounded-md border border-input bg-background px-3 text-sm hover:bg-accent disabled:opacity-50"
        >
          {loading ? <><span className="gold-spinner" aria-hidden />Syncing…</> : "Refresh"}
        </button>
      </div>

      {error && (
        <div className="mt-6 rounded-md border border-red-500/40 bg-red-500/10 p-3 text-sm text-red-500">
          Indexer unavailable: {error}
        </div>
      )}

      <div className="mt-6 overflow-x-auto rounded-lg border border-border bg-card">
        <table className="w-full min-w-[720px] text-sm">
          <thead>
            <tr className="border-border text-muted-foreground border-b text-xs uppercase tracking-wide">
              <th className="px-3 py-2.5 text-left font-medium">#</th>
              <th className="px-3 py-2.5 text-left font-medium">Token</th>
              <th className="px-3 py-2.5 text-right font-medium">Price</th>
              <th className="px-3 py-2.5 text-right font-medium">24h</th>
              <th className="px-3 py-2.5 text-right font-medium">Volume</th>
              <th className="px-3 py-2.5 text-right font-medium">Holders</th>
              <th className="px-3 py-2.5 text-right font-medium">Buyers 1h</th>
              <th className="px-3 py-2.5 text-right font-medium">Curve</th>
              <th className="px-3 py-2.5 text-right font-medium">Age</th>
            </tr>
          </thead>
          <tbody>
            {loading && items.length === 0
              ? Array.from({ length: 8 }).map((_, i) => (
                  <tr key={"sk" + i} className="border-border border-b">
                    <td className="px-3 py-3" colSpan={9}>
                      <div className="skeleton" style={{ height: "1.25rem" }} />
                    </td>
                  </tr>
                ))
              : ranked.map((l, i) => {
                  const change = Number(l.analytics.priceChange24hBps || 0);
                  const pct = Math.min(100, Math.round(l.curve.progressBps / 100));
                  const grad = l.curve.lifecycle === "GRADUATED";
                  return (
                    <tr
                      key={l.tokenAddress}
                      onClick={() =>
                        void navigate({
                          to: "/token/$tokenAddress",
                          params: { tokenAddress: l.tokenAddress },
                        })
                      }
                      className="border-border hover:bg-muted/50 cursor-pointer border-b transition-colors last:border-b-0"
                    >
                      <td className="px-3 py-2.5">
                        <span
                          className={`num block text-right text-sm font-bold ${
                            i < 3 ? "text-primary" : "text-muted-foreground"
                          }`}
                        >
                          {i + 1}
                        </span>
                      </td>
                      <td className="px-3 py-2.5">
                        <span className="flex items-center gap-3">
                          <span className="border-border bg-muted flex size-8 shrink-0 items-center justify-center overflow-hidden rounded-full border">
                            <TokenImage
                              uri={l.content.image?.uri}
                              alt={l.symbol}
                              className="!static !size-full"
                            />
                          </span>
                          <span className="min-w-0">
                            <span className="block truncate text-sm font-bold">${l.symbol}</span>
                            <span className="text-muted-foreground block truncate text-xs">
                              {l.name} · <span className="mono">{shortAddr(l.tokenAddress)}</span>
                            </span>
                          </span>
                        </span>
                      </td>
                      <td className="num px-3 py-2.5 text-right text-xs">
                        {fmtEth(l.analytics.lastPriceWeiPerToken, 9)} ETH
                      </td>
                      <td
                        className={`num px-3 py-2.5 text-right text-xs font-medium ${
                          change === 0
                            ? "text-muted-foreground"
                            : change > 0
                              ? "text-primary"
                              : "text-destructive"
                        }`}
                      >
                        {fmtPct(l.analytics.priceChange24hBps)}
                      </td>
                      <td className="num px-3 py-2.5 text-right text-xs">
                        {fmtEth(l.analytics.volume24hWei)} ETH
                      </td>
                      <td className="num px-3 py-2.5 text-right text-xs">
                        {l.holderCount ?? 0}
                      </td>
                      <td className="num px-3 py-2.5 text-right text-xs">
                        {l.analytics.uniqueBuyers1h ?? 0}
                      </td>
                      <td className="px-3 py-2.5 text-right text-xs">
                        <span className={grad ? "text-destructive font-medium" : ""}>
                          {grad ? "Grad" : `${pct}%`}
                        </span>
                      </td>
                      <td className="text-muted-foreground px-3 py-2.5 text-right text-xs">
                        {timeAgo(l.createdAt)}
                      </td>
                    </tr>
                  );
                })}
          </tbody>
        </table>
        {!loading && ranked.length === 0 && !error && (
          <div className="p-10 text-center text-sm text-muted-foreground">
            No launches indexed yet.
          </div>
        )}
      </div>
    </section>
  );
}
