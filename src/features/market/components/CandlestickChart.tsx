import { useEffect, useRef, useState } from "react";
import { assetCandles, type VibesCandle } from "@/lib/vibes";
import { fmtEth } from "@/lib/format";

/**
 * Lightweight candlestick chart — pure canvas, no chart library.
 * Price is ETH per token; green = up candle, red = down candle.
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
  const [candles, setCandles] = useState<VibesCandle[] | null>(null);
  const [interval, setIntervalSel] = useState<(typeof INTERVALS)[number]>("1h");
  const [hover] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;
    setCandles(null);
    (async () => {
      const list = await assetCandles(tokenAddress, interval);
      if (!cancelled) setCandles(list);
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
    const span = hi - lo || 1;
    const pad = span * 0.08;
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
      ctx.fillText(fmtEth(String(Math.round(p * 1e12)), 6), padL + plotW + 6, yy + 3);
    }

    const n = candles.length;
    const slot = plotW / n;
    const bw = Math.max(1.5, Math.min(slot * 0.62, 14));

    candles.forEach((c, i) => {
      const cx = padL + slot * i + slot / 2;
      const o = Number(c.o);
      const cl = Number(c.c);
      const up = cl >= o;
      ctx.strokeStyle = up ? "#22c55e" : "#ef4444";
      ctx.fillStyle = up ? "#22c55e" : "#ef4444";

      // wick
      ctx.beginPath();
      ctx.moveTo(cx, y(Number(c.h)));
      ctx.lineTo(cx, y(Number(c.l)));
      ctx.stroke();

      // body
      const yO = y(o);
      const yC = y(cl);
      ctx.fillRect(cx - bw / 2, Math.min(yO, yC), bw, Math.max(1.5, Math.abs(yC - yO)));
    });

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
          {candles ? `${candles.length} candles · ETH per token` : "Loading chart…"}
        </span>
        <div className="flex gap-1">
          {INTERVALS.map((iv) => (
            <button
              key={iv}
              onClick={() => setIntervalSel(iv)}
              className={`rounded border border-border px-2 py-0.5 text-xs ${
                interval === iv
                  ? "bg-foreground text-background"
                  : "text-muted-foreground hover:text-foreground"
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
        <canvas
          ref={canvasRef}
          style={{ width: "100%", height }}
          className="rounded-md border border-border bg-card"
        />
      )}
    </div>
  );
}
