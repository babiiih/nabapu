/**
 * Profile — connected wallet view: holdings, vibes activity feed, dev badge.
 *
 * Holdings come from on-chain balanceOf calls against every launch the wallet
 * owns; the activity feed is the vibes indexer wallet activity stream (same
 * source as /traders on testnet.vibevibe.fun).
 */
import { useCallback, useEffect, useState } from "react";
import { useAccount, useDisconnect, useChainId, useBalance, useConnect } from "wagmi";
import { formatEther } from "viem";
import {
  listLaunches,
  walletActivity,
  activityTokenAmount,
  activityEthAmount,
  type VibesActivity,
  type VibesLaunch,
} from "@/lib/vibes";
import { fmtEth, fmtTokens, shortAddr, timeAgo } from "@/lib/format";
import { robinhoodTestnet } from "@/wagmi";
import { ISSUER, CHAIN } from "@/contracts";
import { Link } from "@tanstack/react-router";
import { Button } from "@/components/ui/button";
import TokenImage from "./TokenImage";

export default function ProfilePage() {
  const { address, isConnected } = useAccount();
  const { disconnect } = useDisconnect();
  const { connectors, connect, isPending, error } = useConnect();
  // /profile#connect opens the wallet picker directly (legacy deep link).
  const [pickWallet, setPickWallet] = useState(
    typeof window !== "undefined" && window.location.hash === "#connect",
  );
  const chainId = useChainId();
  const onRightChain = chainId === robinhoodTestnet.id;

  const [activity, setActivity] = useState<VibesActivity[]>([]);
  const [holdings, setHoldings] = useState<Holding[]>([]);
  const [busy, setBusy] = useState(false);

  const ethBal = useBalance({ address });
  const isDev =
    !!address && address.toLowerCase() === ISSUER.toLowerCase();

  const refresh = useCallback(async () => {
    if (!address) return;
    setBusy(true);
    try {
      const [act, owned] = await Promise.all([
        walletActivity(address, 40).then((r) => r.items).catch(() => []),
        scanHoldings(address),
      ]);
      setActivity(act);
      setHoldings(owned);
    } finally {
      setBusy(false);
    }
  }, [address]);

  useEffect(() => {
    void refresh();
  }, [refresh]);

  if (!isConnected || !address) {
    return (
      <section className="container max-w-2xl py-16 text-center">
        <h1 className="text-2xl font-bold">Profile</h1>
        <p className="mt-2 text-sm text-muted-foreground">
          Connect a wallet on Robinhood Chain Testnet to see your holdings,
          activity, and collected items.
        </p>

        {!pickWallet ? (
          <div className="mt-6 flex justify-center">
            <Button onClick={() => setPickWallet(true)}>Connect wallet</Button>
          </div>
        ) : (
          <div className="mx-auto mt-6 w-full max-w-sm space-y-2 rounded-md border border-border bg-card p-4 text-left">
            <p className="text-sm font-medium">Choose a wallet</p>
            {connectors.map((c) => (
              <button
                key={c.uid}
                disabled={isPending}
                onClick={() => connect({ connector: c })}
                className="flex w-full items-center justify-between rounded-md border border-border px-3 py-2 text-sm transition-colors hover:bg-muted disabled:opacity-50"
              >
                {c.name}
                {c.icon && (
                  <img src={c.icon} alt="" className="h-5 w-5 rounded" />
                )}
              </button>
            ))}
            {isPending && (
              <p className="text-xs text-muted-foreground">Opening wallet…</p>
            )}
            {error && (
              <p className="text-xs text-destructive">
                {"shortMessage" in error
                  ? (error as { shortMessage: string }).shortMessage
                  : error.message}
              </p>
            )}
            <button
              onClick={() => setPickWallet(false)}
              className="w-full pt-1 text-xs text-muted-foreground hover:text-foreground"
            >
              Cancel
            </button>
          </div>
        )}
      </section>
    );
  }

  return (
    <section className="container py-10">
      <div className="mb-8 flex flex-col gap-5 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <div className="flex items-center gap-3">
            <h1 className="text-2xl font-bold">Profile</h1>
            {isDev && <span className="chip is-dev">Dev · Issuer</span>}
          </div>
          <p className="mt-1 break-all text-sm text-muted-foreground mono">
            {address}
          </p>
        </div>
        <div className="flex items-center gap-2">
          <Button variant="outline" size="sm" onClick={() => void refresh()} disabled={busy}>
            {busy ? "Syncing…" : "Refresh"}
          </Button>
          <Button variant="outline" size="sm" onClick={() => disconnect()}>
            Disconnect
          </Button>
        </div>
      </div>

      {!onRightChain && (
        <div className="mb-6 rounded-md border border-amber-500/40 bg-amber-500/10 p-3 text-sm text-amber-500">
          Wrong network — switch to Robinhood Chain Testnet (46630) in your wallet.
        </div>
      )}

      <div className="grid gap-px overflow-hidden border border-border bg-border sm:grid-cols-3">
        <div className="bg-card p-4">
          <div className="text-[0.6875rem] uppercase tracking-wide text-muted-foreground">
            ETH balance
          </div>
          <div className="mt-1 text-xl font-bold mono">
            {ethBal.data ? formatEther(ethBal.data.value) : "…"}
          </div>
        </div>
        <div className="bg-card p-4">
          <div className="text-[0.6875rem] uppercase tracking-wide text-muted-foreground">
            Tokens held
          </div>
          <div className="mt-1 text-xl font-bold">{holdings.length}</div>
        </div>
        <div className="bg-card p-4">
          <div className="text-[0.6875rem] uppercase tracking-wide text-muted-foreground">
            Activity events
          </div>
          <div className="mt-1 text-xl font-bold">{activity.length}</div>
        </div>
      </div>

      <div className="mt-10 grid gap-8 lg:grid-cols-2">
        <div>
          <h2 className="mb-3 text-sm font-bold uppercase tracking-wide text-muted-foreground">
            Holdings
          </h2>
          {holdings.length === 0 ? (
            <div className="rounded-md border border-border bg-card p-6 text-center text-sm text-muted-foreground">
              You don't hold any launch tokens yet.
          <Link to="/market" className="mt-3 block text-foreground underline underline-offset-2">
            Browse the market →
          </Link>
            </div>
          ) : (
            <div className="space-y-2">
              {holdings.map((h) => (
                <HoldingRow key={h.token} holding={h} />
              ))}
            </div>
          )}
        </div>

        <div>
          <h2 className="mb-3 text-sm font-bold uppercase tracking-wide text-muted-foreground">
            Activity
          </h2>
          {activity.length === 0 ? (
            <div className="rounded-md border border-border bg-card p-6 text-center text-sm text-muted-foreground">
              No activity yet — buys and sells on the vibes platform will show
              up here.
            </div>
          ) : (
            <div className="feed">
              {activity.map((a) => (
                <ActivityRow key={a.id} act={a} />
              ))}
            </div>
          )}
        </div>
      </div>

      <div className="mt-10">
        <h2 className="mb-3 text-sm font-bold uppercase tracking-wide text-muted-foreground">
          Collected
        </h2>
        {holdings.length === 0 ? (
          <div className="rounded-md border border-border bg-card p-6 text-center text-sm text-muted-foreground">
            No collected items yet — every token you buy on the curve becomes a
            collectible here.
          </div>
        ) : (
          <div className="market-grid">
            {holdings.map((h) => (
              <Link
                to="/token/$tokenAddress"
                params={{ tokenAddress: h.launch.tokenAddress }}
                className="token-card"
              >
                <div className="thumb">
                  <TokenImage
                    uri={h.launch.content.image?.uri}
                    alt={h.launch.name}
                    className="!static"
                  />
                </div>
                <div className="flex items-start justify-between gap-2">
                  <div className="min-w-0">
                    <div className="truncate text-sm font-bold">
                      ${h.launch.symbol}
                    </div>
                    <div className="truncate text-xs text-muted-foreground">
                      {h.launch.name}
                    </div>
                  </div>
                  {h.launch.creatorAddress.toLowerCase() ===
                    ISSUER.toLowerCase() && <span className="chip is-dev">Dev</span>}
                </div>
                <div className="flex items-center justify-between text-xs text-muted-foreground">
                  <span className="mono">{fmtTokens(h.balance)}</span>
                  <span>{h.launch.holderCount ?? 0} holders</span>
                </div>
              </Link>
            ))}
          </div>
        )}
      </div>
    </section>
  );
}

interface Holding {
  token: string;
  balance: string;
  launch: VibesLaunch;
}

/** Scan the most recent launches and keep the ones with a non-zero balance. */
async function scanHoldings(wallet: string): Promise<Holding[]> {
  const out: Holding[] = [];
  let cursor: string | undefined;
  let scanned = 0;

  while (scanned < 240) {
    const res = await listLaunches({ limit: 48, cursor });
    if (!res.items.length) break;
    for (const l of res.items) {
      try {
        const data: string = await fetch(CHAIN.rpcRead, {
          method: "POST",
          headers: { "content-type": "application/json" },
          body: JSON.stringify({
            jsonrpc: "2.0",
            id: 1,
            method: "eth_call",
            params: [
              {
                to: l.tokenAddress,
                data:
                  "0x70a08231" + wallet.slice(2).padStart(64, "0"),
              },
              "latest",
            ],
          }),
        })
          .then((r) => r.json())
          .then((j) => (j.result ? String(j.result) : "0x0"));
        if (BigInt(data) > 0n)
          out.push({ token: l.tokenAddress, balance: data, launch: l });
      } catch {
        // skip this token
      }
      scanned++;
    }
    cursor = res.page.nextCursor;
    if (!res.page.hasMore) break;
  }

  return out;
}

function HoldingRow({ holding }: { holding: Holding }) {
  const { launch } = holding;
  const isDev = launch.creatorAddress.toLowerCase() === ISSUER.toLowerCase();
  return (
    <a
      href={`#/token/${launch.tokenAddress}`}
      className="flex items-center gap-3 rounded-md border border-border bg-card p-3 hover:border-foreground/40"
    >
      <div className="h-11 w-11 shrink-0 overflow-hidden border border-border">
        <TokenImage uri={launch.content.image?.uri} alt={launch.name} className="!static" />
      </div>
      <div className="min-w-0 flex-1">
        <div className="flex items-center gap-2 text-sm font-bold">
          ${launch.symbol}
          {isDev && <span className="chip is-dev">Dev</span>}
        </div>
        <div className="truncate text-xs text-muted-foreground">{launch.name}</div>
      </div>
      <div className="text-right">
        <div className="text-sm font-medium mono">{fmtTokens(holding.balance)}</div>
        <div className="text-[0.6875rem] text-muted-foreground">
          {shortAddr(launch.tokenAddress)}
        </div>
      </div>
    </a>
  );
}

function ActivityRow({ act }: { act: VibesActivity }) {
  const t = (act.type || "").toUpperCase();
  const buy = t === "BUY" || act.side === "BUY";
  const sell = t === "SELL" || act.side === "SELL";
  const label = buy ? "Bought" : sell ? "Sold" : t === "LAUNCH" ? "Launched" : t;
  return (
    <a
      href={act.txHash ? `${CHAIN.explorer}/tx/${act.txHash}` : "#"}
      target="_blank"
      rel="noreferrer noopener"
      className="feed-row hover:bg-muted/40"
    >
      <span className={`feed-dot ${buy ? "is-buy" : sell ? "is-sell" : ""}`} />
      <div className="min-w-0">
        <div className="truncate font-medium">
          {label}{" "}
          <span className="text-muted-foreground">
            {(() => {
              const tok = activityTokenAmount(act);
              if (!tok) return "";
              return fmtTokens(tok);
            })()}
          </span>
          {(() => {
            const eth = activityEthAmount(act);
            if (!eth) return null;
            return (
              <span className="text-muted-foreground/70">
                {" "}· {fmtEth(eth)} ETH
              </span>
            );
          })()}
        </div>
        <div className="truncate text-[0.6875rem] text-muted-foreground">
          {shortAddr(act.tokenAddress)} · {act.route || act.type}
        </div>
      </div>
      <div className="shrink-0 text-right text-[0.6875rem] text-muted-foreground">
        <div>{timeAgo(act.occurredAt)} ago</div>
        <div className="mono">{act.blockNumber}</div>
      </div>
    </a>
  );
}
