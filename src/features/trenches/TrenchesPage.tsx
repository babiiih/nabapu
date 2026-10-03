/**
 * Trenches — live feed launch terbaru (ala GMGN "new pairs") + search CA.
 * Semua data dari vibes indexer; auto-refresh tiap 20s supaya launch baru
 * langsung nongol. Search CA: tempel alamat token → jump ke halaman token.
 */
import { useCallback, useEffect, useRef, useState } from "react";
import { Link, useNavigate } from "@tanstack/react-router";
import {
  getLaunch,
  listLaunches,
  type VibesLaunch,
  type VibesPage,
} from "@/lib/vibes";
import { fmtEth, fmtPct, timeAgo, shortAddr } from "@/lib/format";
import TokenImage from "@/features/market/components/TokenImage";
import { ISSUER } from "@/contracts";

const CA_RE = /^0x[a-f0-9]{40}$/i;

export default function TrenchesPage() {
  const navigate = useNavigate();
  const [items, setItems] = useState<VibesLaunch[]>([]);
  const [page, setPage] = useState<VibesPage | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [ca, setCa] = useState("");
  const [caState, setCaState] = useState<{ kind: "idle" | "checking" | "nf" }>({ kind: "idle" });
  const cursorRef = useRef<string | undefined>(undefined);
  const [seenIds, setSeenIds] = useState<Set<string>>(new Set());
  const reqId = useRef(0);

  const load = useCallback(async (reset = false) => {
    const id = ++reqId.current;
    if (reset) setLoading(true);
    setError(null);
    try {
      const res = await listLaunches({
        limit: 24,
        cursor: reset ? undefined : cursorRef.current,
      });
      if (id !== reqId.current) return;
      cursorRef.current = res.page.nextCursor;
      setPage(res.page);
      setItems((prev) => {
        const next = reset ? res.items : [...prev, ...res.items];
        if (reset) setSeenIds(new Set<string>());
        return next;
      });
    } catch (e) {
      if (id !== reqId.current) return;
      setError((e as Error).message.slice(0, 140));
    } finally {
      if (id === reqId.current) setLoading(false);
    }
  }, []);

  useEffect(() => {
    void load(true);
    // live trench: poll tiap 20s biar launch baru langsung kelihatan
    const t = setInterval(() => void load(true), 20_000);
    return () => {
      clearInterval(t);
      reqId.current++;
    };
  }, [load]);

  // tandai item yang belum pernah muncul (buat highlight "NEW")
  useEffect(() => {
    setSeenIds((prev) => {
      if (prev.size === 0 && items.length > 0) {
        // first paint: mark all as seen except the 5 newest
        const s = new Set(items.map((i) => i.launchId));
        items.slice(0, 5).forEach((i) => s.delete(i.launchId));
        return s;
      }
      return prev;
    });
  }, [items]);

  const lookupCa = async () => {
    const q = ca.trim();
    if (!CA_RE.test(q)) return;
    setCaState({ kind: "checking" });
    try {
      const l = await getLaunch(q);
      if (l) {
        setCaState({ kind: "idle" });
        setCa("");
        void navigate({ to: "/token/$tokenAddress", params: { tokenAddress: q } });
      } else {
        setCaState({ kind: "nf" });
      }
    } catch {
      setCaState({ kind: "nf" });
    }
  };

  return (
    <section className="container py-10">
      <div className="flex flex-wrap items-baseline justify-between gap-3">
        <div>
          <span className="chip is-live mb-2">
            <span
              className="inline-block h-1.5 w-1.5 rounded-full bg-current"
              style={{ animation: "skeleton-pulse 1.6s ease-in-out infinite" }}
            />
            Live feed · 20s
          </span>
          <h1 className="text-3xl font-bold tracking-tight">Trenches</h1>
          <p className="mt-1 max-w-[70ch] text-sm text-muted-foreground">
            Fresh launches on the bonding curve, straight from the vibes
            indexer — newest first, refreshed every 20 seconds.
          </p>
        </div>
        <div className="border-border bg-card flex items-center gap-2 rounded-lg border px-3 py-1.5">
          <span className="text-foreground num text-sm font-bold">{items.length}</span>
          <span className="text-muted-foreground text-xs">
            {page?.hasMore ? "in feed" : "total"}
          </span>
        </div>
      </div>

      {/* CA search — tempel alamat contract, langsung ke token page */}
      <div className="mt-5">
        <div className="flex max-w-xl gap-2">
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
              value={ca}
              onChange={(e) => {
                setCa(e.target.value);
                setCaState({ kind: "idle" });
              }}
              onKeyDown={(e) => {
                if (e.key === "Enter") void lookupCa();
              }}
              placeholder="Search contract address (0x…)"
              spellCheck={false}
              className="h-9 w-full rounded-md border border-input bg-background pr-3 pl-9 font-mono text-sm outline-none placeholder:font-sans placeholder:text-muted-foreground focus-visible:ring-2 focus-visible:ring-ring"
            />
          </div>
          <button
            type="button"
            onClick={() => void lookupCa()}
            disabled={!CA_RE.test(ca.trim()) || caState.kind === "checking"}
            className="bg-primary text-primary-foreground h-9 rounded-md px-4 text-sm font-medium transition-opacity hover:opacity-90 disabled:opacity-40"
          >
            {caState.kind === "checking" ? <><span className="gold-spinner" aria-hidden />Checking…</> : "Open"}
          </button>
        </div>
        {caState.kind === "nf" && (
          <p className="text-destructive mt-2 text-xs">
            Not indexed as a vibes launch — CA tidak ditemukan di indexer.
          </p>
        )}
        {ca.trim().length > 2 && caState.kind === "idle" && !CA_RE.test(ca.trim()) && (
          <p className="text-muted-foreground mt-2 text-xs">
            Format: 0x + 40 karakter hex.
          </p>
        )}
      </div>

      {error && (
        <div className="mt-6 rounded-md border border-red-500/40 bg-red-500/10 p-3 text-sm text-red-500">
          Indexer unavailable: {error}
        </div>
      )}

      <div className="mt-6 grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
        {loading && items.length === 0
          ? Array.from({ length: 6 }).map((_, i) => (
              <div key={"sk" + i} className="token-card" aria-hidden>
                <div className="skeleton" style={{ height: "1rem", width: "50%" }} />
                <div className="skeleton" style={{ height: "2.5rem" }} />
                <div className="skeleton" style={{ height: "0.75rem", width: "70%" }} />
              </div>
            ))
          : items.map((l) => <TrenchRow key={l.launchId} launch={l} isNew={!seenIds.has(l.launchId)} />)}
      </div>

      {!loading && items.length === 0 && !error && (
        <div className="mt-6 rounded-md border border-border bg-card p-10 text-center text-sm text-muted-foreground">
          Belum ada launch di feed.
        </div>
      )}

      {page?.hasMore && !loading && (
        <div className="mt-8 flex justify-center">
          <button
            type="button"
            onClick={() => void load(false)}
            className="rounded-md border border-input bg-background px-5 py-2 text-sm hover:bg-accent"
          >
            Load older
          </button>
        </div>
      )}
    </section>
  );
}

function TrenchRow({ launch, isNew }: { launch: VibesLaunch; isNew: boolean }) {
  const pct = Math.min(100, Math.round(launch.curve.progressBps / 100));
  const grad = launch.curve.lifecycle === "GRADUATED";
  const isDev = launch.creatorAddress.toLowerCase() === ISSUER.toLowerCase();
  const change = Number(launch.analytics.priceChange24hBps || 0);
  const age = Date.now() - Date.parse(launch.createdAt);
  const fresh = age < 10 * 60_000; // < 10 menit = badge "fresh"

  return (
    <Link
      to="/token/$tokenAddress"
      params={{ tokenAddress: launch.tokenAddress }}
      className="token-card relative"
    >
      {(isNew || fresh) && (
        <span className="chip is-live absolute top-2 right-2 z-10">
          {isNew ? "New" : "Fresh"}
        </span>
      )}
      <div className="flex items-center gap-3">
        <span className="border-border bg-muted flex size-10 shrink-0 items-center justify-center overflow-hidden rounded-full border">
          <TokenImage
            uri={launch.content.image?.uri}
            alt={launch.symbol}
            className="!static !size-full"
          />
        </span>
        <div className="min-w-0">
          <div className="flex items-center gap-1.5">
            <span className="truncate text-sm font-bold">${launch.symbol}</span>
            {isDev && <span className="chip is-dev">Dev</span>}
          </div>
          <div className="text-muted-foreground truncate text-xs">{launch.name}</div>
        </div>
        <div className="ml-auto text-right">
          <div className="num text-xs font-medium">
            {fmtEth(launch.analytics.lastPriceWeiPerToken, 9)} ETH
          </div>
          <div
            className={`num text-xs ${
              change === 0
                ? "text-muted-foreground"
                : change > 0
                  ? "text-primary"
                  : "text-destructive"
            }`}
          >
            {fmtPct(launch.analytics.priceChange24hBps)}
          </div>
        </div>
      </div>

      <div className="curve-track" title={`Curve ${pct}%`}>
        <span style={{ width: pct + "%" }} />
      </div>

      <div className="flex items-center justify-between text-xs text-muted-foreground">
        <span className={grad ? "text-destructive font-medium" : ""}>
          {grad ? "Graduated" : `curve ${pct}%`}
        </span>
        <span className="num tabular-nums">
          {fmtEth(launch.analytics.volume24hWei)} ETH vol
        </span>
      </div>

      <div className="flex items-center justify-between border-t border-border pt-2 text-[0.6875rem] text-muted-foreground">
        <span className="mono">{shortAddr(launch.tokenAddress)}</span>
        <span title={new Date(launch.createdAt).toLocaleString()}>
          {timeAgo(launch.createdAt)} ago
        </span>
      </div>
    </Link>
  );
}
