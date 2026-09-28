/**
 * Live toasts — OpenSea-style purchase notifications.
 *
 * Polls the wallet activity stream for the connected wallet and surfaces new
 * buy/sell events as toasts. Toasts also fire for any launch created by the
 * dev wallet.
 */
import { useEffect, useRef, useState } from "react";
import { useAccount } from "wagmi";
import { walletActivity, getLaunch, activityTokenAmount } from "@/lib/vibes";
import { fmtTokens, timeAgo } from "@/lib/format";
import { ISSUER } from "@/contracts";
import TokenImage from "./TokenImage";

interface Toast {
  id: string;
  title: string;
  sub: string;
  img?: string;
  sell?: boolean;
}

export default function Toaster() {
  const { address } = useAccount();
  const [toasts, setToasts] = useState<Toast[]>([]);
  const seen = useRef<Set<string>>(new Set());
  const first = useRef(true);

  useEffect(() => {
    if (!address) return;
    let stop = false;

    const poll = async () => {
      try {
        const res = await walletActivity(address, 12);
        if (stop) return;
        const fresh = res.items.filter((a) => !seen.current.has(a.id));
        for (const a of fresh) seen.current.add(a.id);
        if (first.current) {
          first.current = false;
          return; // don't toast the backlog on load
        }
        for (const a of fresh) {
          const t = (a.type || "").toUpperCase();
          const sell = t === "SELL" || a.side === "SELL";
          const buy = t === "BUY" || a.side === "BUY";
          if (!buy && !sell && t !== "LAUNCH") continue;
          const launch = await getLaunch(a.tokenAddress).catch(() => null);
          const tok = activityTokenAmount(a);
          setToasts((prev) => [
            ...prev,
            {
              id: a.id,
              title:
                t === "LAUNCH"
                  ? "New launch"
                  : sell
                    ? "Sold"
                    : "Bought",
              sub:
                t === "LAUNCH"
                  ? `${launch?.name ?? "token"} is live on the curve`
                  : `${tok ? fmtTokens(tok) : ""} ${
                      launch?.symbol ?? ""
                    } · ${timeAgo(a.occurredAt)} ago`,
              img: launch?.content.image?.uri,
              sell,
            },
          ]);
          // auto-dismiss
          const id = a.id;
          setTimeout(() => {
            setToasts((prev) => prev.filter((x) => x.id !== id));
          }, 6000);
        }
      } catch {
        // indexer hiccup — retry next tick
      }
    };

    void poll();
    const iv = setInterval(() => void poll(), 20000);
    return () => {
      stop = true;
      clearInterval(iv);
    };
  }, [address]);

  if (!toasts.length) return null;

  return (
    <div className="toast-stack" role="status" aria-live="polite">
      {toasts.slice(-4).map((t) => (
        <div key={t.id} className={`toast ${t.sell ? "is-sell" : ""}`}>
          {t.img ? (
            <TokenImage uri={t.img} alt="" className="!static" />
          ) : (
            <div
              className="flex shrink-0 items-center justify-center bg-secondary text-sm font-bold text-secondary-foreground"
              style={{ width: 34, height: 34 }}
              aria-hidden
            >
              N
            </div>
          )}
          <div className="min-w-0">
            <div className="text-sm font-bold">{t.title}</div>
            <div className="truncate text-xs text-muted-foreground">{t.sub}</div>
          </div>
        </div>
      ))}
    </div>
  );
}

/**
 * Global market toasts — fires for activity on the dev wallet's launches even
 * when the user hasn't connected (uses the dev wallet's public feed).
 */
export function DevFeedToaster() {
  const [toasts, setToasts] = useState<Toast[]>([]);
  const seen = useRef<Set<string>>(new Set());
  const first = useRef(true);

  useEffect(() => {
    let stop = false;
    const poll = async () => {
      try {
        const res = await walletActivity(ISSUER, 12);
        if (stop) return;
        const fresh = res.items.filter((a) => !seen.current.has(a.id));
        for (const a of fresh) seen.current.add(a.id);
        if (first.current) {
          first.current = false;
          return;
        }
        for (const a of fresh) {
          const t = (a.type || "").toUpperCase();
          if (t !== "BUY" && t !== "SELL") continue;
          const launch = await getLaunch(a.tokenAddress).catch(() => null);
          const tok = activityTokenAmount(a);
          setToasts((prev) => [
            ...prev,
            {
              id: a.id,
              title: t === "SELL" ? "Someone sold" : "Someone bought",
              sub: `${tok ? fmtTokens(tok) : ""} ${
                launch?.symbol ?? ""
              } · ${timeAgo(a.occurredAt)} ago`,
              img: launch?.content.image?.uri,
              sell: t === "SELL",
            },
          ]);
          const id = a.id;
          setTimeout(() => {
            setToasts((prev) => prev.filter((x) => x.id !== id));
          }, 6000);
        }
      } catch {
        // ignore
      }
    };
    void poll();
    const iv = setInterval(() => void poll(), 25000);
    return () => {
      stop = true;
      clearInterval(iv);
    };
  }, []);

  if (!toasts.length) return null;
  return (
    <div className="toast-stack" role="status" aria-live="polite">
      {toasts.slice(-3).map((t) => (
        <div key={t.id} className={`toast ${t.sell ? "is-sell" : ""}`}>
          {t.img ? (
            <TokenImage uri={t.img} alt="" className="!static" />
          ) : (
            <div
              className="flex shrink-0 items-center justify-center bg-secondary text-sm font-bold text-secondary-foreground"
              style={{ width: 34, height: 34 }}
              aria-hidden
            >
              N
            </div>
          )}
          <div className="min-w-0">
            <div className="text-sm font-bold">{t.title}</div>
            <div className="truncate text-xs text-muted-foreground">{t.sub}</div>
          </div>
        </div>
      ))}
    </div>
  );
}
