import { useEffect, useState } from "react";
import {
  assetActivity,
  activityTokenAmount,
  activityEthAmount,
  type VibesActivity,
} from "@/lib/vibes";
import { fmtEth, fmtTokens, shortAddr, timeAgo } from "@/lib/format";
import { CHAIN } from "@/contracts";

/**
 * Recent trades for one token — buys, sells, and the launch event.
 * Mirrors the profile activity feed styling (.feed / .feed-row).
 */
export default function TradeLog({ tokenAddress }: { tokenAddress: string }) {
  const [rows, setRows] = useState<VibesActivity[] | null>(null);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      const list = await assetActivity(tokenAddress, { limit: 40 });
      if (!cancelled) setRows(list);
    })();
    return () => {
      cancelled = true;
    };
  }, [tokenAddress]);

  if (rows === null) {
    return (
      <div className="h-40 animate-pulse rounded-md border border-border bg-card" />
    );
  }
  if (rows.length === 0) {
    return (
      <div className="flex h-40 items-center justify-center rounded-md border border-border bg-card text-sm text-muted-foreground">
        No trades yet for this token.
      </div>
    );
  }

  return (
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
            <span
              className={`feed-dot ${
                buy ? "is-buy" : sell ? "is-sell" : ""
              }`}
            />
            <div className="min-w-0">
              <span className="font-medium">
                {launch ? "Launched" : buy ? "Buy" : sell ? "Sell" : a.type}
              </span>
              <span className="ml-2 text-muted-foreground mono">
                {shortAddr(a.actorAddress)}
              </span>
            </div>
            <div className="text-right text-xs">
              {tok && (
                <div className="font-medium">{fmtTokens(tok)}</div>
              )}
              {eth && (
                <div className="text-muted-foreground">
                  {fmtEth(eth)} ETH
                </div>
              )}
              <div className="text-muted-foreground">
                {timeAgo(a.occurredAt)} ago
              </div>
            </div>
          </a>
        );
      })}
    </div>
  );
}
