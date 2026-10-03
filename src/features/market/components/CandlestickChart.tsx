import { useEffect, useRef, useState } from "react";
import {
  assetCandles,
  assetActivity,
  explorerActivity,
  activityEthAmount,
  activityTokenAmount,
  type VibesCandle,
  type VibesActivity,
} from "@/lib/vibes";
import { toWei } from "@/lib/format";

/** Derive a synthetic OHLC series from trade events (fallback when the
 * indexer has no candle buckets yet — every BUY/SELL becomes a price point). */
function tradesToCandles(rows: VibesActivity[]): VibesCandle[] {
  const pts = rows
    .map((a) => {
      const eth = activityEthAmount(a);
      const tok = activityTokenAmount(a);
      if (!eth || !tok) return null;
      const ethN = Number(toWei(eth));
      const tokN = Number(toWei(tok));
      if (!Number.isFinite(ethN) || !Number.isFinite(tokN) || ethN <= 0 || tokN <= 0) return null;
      const price = ethN / tokN;
      if (!Number.isFinite(price) || price <= 0) return null;
      const t = Date.parse(a.occurredAt) / 1000;
      if (!Number.isFinite(t)) return null;
      return { t, p: price };
    })
    .filter((x): x is { t: number; p: number } => x !== null)
    .sort((a, b) => a.t - b.t);
  if (pts.length === 0) return [];
  // OHLC per point: open = previous close, high/low = body extremes.
  return pts.map((x, i) => {
    const o = i > 0 ? pts[i - 1].p : x.p;
    const c = x.p;
    return {
      t: x.t,
      o: String(o),
      h: String(Math.max(o, c)),
      l: String(Math.min(o, c)),
      c: String(c),
      v: "0",
    };
  });
}

/** ETH-per-token prices are ~1e-9 — toLocaleString rounds them to 0.00.
 * Use significant digits so the axis shows 0.00000000164, not 0. */
function fmtPriceLabel(p: number): string {
  if (!Number.isFinite(p) || p === 0) return "0";
  if (Math.abs(p) < 1e-4) return p.toPrecision(3).replace(/e-?(\d+)$/, "e-$1");
  return p.toLocaleString(undefined, { maximumFractionDigits: 6 });
}

/**
 * Lightweight candlestick chart — pure canvas, no chart library.
 * Price is ETH per token; green = up candle, red = down candle.
 * Falls back to a trade-event price series when candle buckets are empty.
 */
const INTERVALS = ["15m", "1h", "4h", "1d"] as const;

export default function CandlestickChart({
  tokenAddress,
  height = 260,
}: {
  tokenAddress: string;
  height?: number;
}) {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const wrapRef = useRef<HTMLDivElement | null>(null);
  const [candles, setCandles] = useState<VibesCandle[] | null>(null);
  const [source, setSource] = useState<string>("");
  const [interval, setIntervalSel] = useState<(typeof INTERVALS)[number]>("1h");
  const [hover, setHover] = useState<number | null>(null);

  useEffect(() => {
    let cancelled = false;
    setCandles(null);
    (async () => {
      let list = await assetCandles(tokenAddress, interval);
      let src = "candles";
      // Fewer than 3 buckets = a useless chart (single flat candle) —
      // build a series from the actual trades instead.
      if (list.length < 3) {
        const [trades0, extraTrades] = await Promise.all([
          assetActivity(tokenAddress, { limit: 100 }),
          explorerActivity(tokenAddress),
        ]);
        const seen = new Set<string>();
        const trades = [...trades0, ...extraTrades]
          .filter((t) => t.txHash && !seen.has(t.txHash) && seen.add(t.txHash));
        const fromTrades = tradesToCandles(trades);
        if (fromTrades.length > list.length) {
          list = fromTrades;
          src = "trade history";
        }
      }
      if (!cancelled) {
        setCandles(list);
        setSource(src);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [tokenAddress, interval]);

  useEffect(() => {
    const cv = canvasRef.current;
    if (!cv || !candles || candles.length === 0) return;

    const dpr = window.devicePixelRatio || 1;
    const w = cv.clientWidth;
    const h = height;
    cv.width = w * dpr;
    cv.height = h * dpr;
    const ctx = cv.getContext("2d");
    if (!ctx) return;
    ctx.scale(dpr, dpr);
    ctx.clearRect(0, 0, w, h);

    const padL = 8;
    const padR = 56; // price axis
    const padT = 8;
    const padB = 20; // time axis
    const plotW = w - padL - padR;
    const plotH = h - padT - padB;

    const hi = Math.max(...candles.map((c) => Number(c.h)));
    const lo = Math.min(...candles.map((c) => Number(c.l)));
    if (!Number.isFinite(hi) || !Number.isFinite(lo)) return;
    const span = hi - lo;
    // single flat candle → pad relative to price magnitude, not absolute
    const pad = span > 0 ? span * 0.08 : Math.max(Math.abs(hi) * 0.05, 1e-12);
    const top = hi + pad;
    const bot = lo - pad;

    const y = (price: number) =>
      padT + ((top - price) / (top - bot)) * plotH;

    // grid lines
    const fg = getComputedStyle(document.documentElement)
      .getPropertyValue("--muted-foreground")
      .trim();
    const grid = getComputedStyle(document.documentElement)
      .getPropertyValue("--border")
      .trim();
    ctx.strokeStyle = grid || "#333";
    ctx.fillStyle = fg || "#888";
    ctx.font = "10px ui-monospace, monospace";
    ctx.lineWidth = 1;

    for (let i = 0; i <= 4; i++) {
      const p = bot + ((top - bot) * i) / 4;
      const yy = y(p);
      ctx.beginPath();
      ctx.moveTo(padL, yy);
      ctx.lineTo(padL + plotW, yy);
      ctx.stroke();
      ctx.fillText(fmtPriceLabel(p), padL + plotW + 6, yy + 3);
    }

    const n = candles.length;
    const slot = plotW / n;
    const bw = Math.max(1.5, Math.min(slot * 0.62, 14));

    candles.forEach((c, i) => {
      const cx = padL + slot * i + slot / 2;
      const o = Number(c.o);
      const cl = Number(c.c);
      const up = cl >= o;
      const isHov = hover === i;
      // gold bull / bronze bear — hover candle glows
      ctx.strokeStyle = up ? "#d4a017" : "#8a5a1d";
      ctx.fillStyle = up ? "#e3b93c" : "#a06a24";
      if (isHov) {
        ctx.shadowColor = up ? "rgba(227,185,60,.8)" : "rgba(160,106,36,.8)";
        ctx.shadowBlur = 10;
      } else {
        ctx.shadowBlur = 0;
      }

      // wick
      ctx.beginPath();
      ctx.moveTo(cx, y(Number(c.h)));
      ctx.lineTo(cx, y(Number(c.l)));
      ctx.stroke();

      // body
      const yO = y(o);
      const yC = y(cl);
      ctx.fillRect(cx - bw / 2, Math.min(yO, yC), bw, Math.max(1.5, Math.abs(yC - yO)));
      ctx.shadowBlur = 0;
    });

    // last-price dashed gold line
    const lastC = Number(candles[n - 1].c);
    const yLast = y(lastC);
    ctx.save();
    ctx.setLineDash([5, 4]);
    ctx.strokeStyle = "rgba(212,160,23,.75)";
    ctx.lineWidth = 1;
    ctx.beginPath();
    ctx.moveTo(padL, yLast);
    ctx.lineTo(padL + plotW, yLast);
    ctx.stroke();
    ctx.restore();
    ctx.fillStyle = "#d4a017";
    ctx.font = "bold 10px ui-monospace, monospace";
    ctx.fillText(fmtPriceLabel(lastC), padL + plotW + 6, yLast - 5);

    // hover crosshair
    if (hover !== null && hover >= 0 && hover < n) {
      const c = candles[hover];
      const cx = padL + slot * hover + slot / 2;
      ctx.save();
      ctx.setLineDash([3, 3]);
      ctx.strokeStyle = "rgba(212,160,23,.5)";
      ctx.beginPath();
      ctx.moveTo(cx, padT);
      ctx.lineTo(cx, padT + plotH);
      ctx.stroke();
      ctx.restore();
      // hover price tag
      const hp = Number(c.c);
      const hy = y(hp);
      ctx.fillStyle = "rgba(212,160,23,.92)";
      const lbl = fmtPriceLabel(hp);
      const tw = ctx.measureText(lbl).width + 10;
      ctx.fillRect(padL + plotW + 2, hy - 9, Math.max(tw, padR - 4), 16);
      ctx.fillStyle = "#1a1405";
      ctx.fillText(lbl, padL + plotW + 7, hy + 3);
    }

    // last few time labels
    const labelEvery = Math.max(1, Math.ceil(n / 6));
    ctx.fillStyle = fg || "#888";
    candles.forEach((c, i) => {
      if (i % labelEvery !== 0) return;
      const d = new Date(c.t * 1000);
      const lbl = `${d.getHours().toString().padStart(2, "0")}:${d
        .getMinutes()
        .toString()
        .padStart(2, "0")}`;
      ctx.fillText(lbl, padL + slot * i, h - 6);
    });
  }, [candles, height, hover]);

  if (candles && candles.length === 0) {
    return (
      <div className="flex h-40 items-center justify-center rounded-md border border-border bg-card text-sm text-muted-foreground">
        No price history yet for this token.
      </div>
    );
  }

  return (
    <div>
      <div className="mb-2 flex items-center justify-between gap-2">
        <span className="text-sm font-medium text-muted-foreground">
          {candles
            ? `${candles.length} points · ${source || "candles"} · ETH per token`
            : "Loading chart…"}
        </span>
        <div className="flex gap-1">
          {INTERVALS.map((iv) => (
            <button
              key={iv}
              onClick={() => setIntervalSel(iv)}
              className={`rounded border px-2 py-0.5 text-xs transition-colors ${
                interval === iv
                  ? "border-primary bg-primary text-primary-foreground shadow-[0_2px_12px_-2px_var(--primary)]"
                  : "border-border text-muted-foreground hover:border-primary/50 hover:text-foreground"
              }`}
            >
              {iv}
            </button>
          ))}
        </div>
      </div>
      {candles === null ? (
        <div className="h-[260px] animate-pulse rounded-md border border-border bg-card" />
      ) : (
        <div ref={wrapRef}>
        <canvas
          ref={canvasRef}
          style={{ width: "100%", height }}
          className="rounded-md border border-border bg-card cursor-crosshair"
          onMouseMove={(e) => {
            const cv = canvasRef.current;
            if (!cv || !candles.length) return;
            const rect = cv.getBoundingClientRect();
            const x = e.clientX - rect.left;
            const padL = 8, padR = 56;
            const plotW = rect.width - padL - padR;
            const slot = plotW / candles.length;
            const i = Math.floor((x - padL) / slot);
            setHover(i >= 0 && i < candles.length ? i : null);
          }}
          onMouseLeave={() => setHover(null)}
        />
        </div>
      )}
    </div>
  );
}
