/**
 * Token detail — vibes-style token page.
 *
 * Combines vibes indexer data (launch, curve, holders, image) with the
 * generic bonding-curve trade panel, so every launch on testnet.vibevibe.fun
 * can be bought and sold from this site.
 */
import { useEffect, useState } from "react";
import { useAccount, useBalance, useReadContract, useWriteContract } from "wagmi";
import { parseAbi, parseEther, formatEther } from "viem";
import { getLaunch, type VibesLaunch } from "@/lib/vibes";
import { Link } from "@tanstack/react-router";
import { fmtEth, fmtTokens, shortAddr, timeAgo } from "@/lib/format";
import TokenImage from "./TokenImage";
import { Button } from "@/components/ui/button";
import { CHAIN } from "@/contracts";

const PAIR_ABI = parseAbi([
  "function buy(uint256 minTokensOut, uint256 deadline) payable",
  "function sell(uint256 tokensIn, uint256 minEthOut, uint256 deadline)",
  "function quoteBuy(uint256 ethIn) view returns (uint256)",
  "function quoteSell(uint256 tokensIn) view returns (uint256)",
  "function graduated() view returns (bool)",
]);

const ERC20 = parseAbi([
  "function approve(address spender, uint256 amount) returns (bool)",
  "function balanceOf(address) view returns (uint256)",
  "function allowance(address owner, address spender) view returns (uint256)",
]);

export default function TokenPage({ address }: { address: string }) {
  const token = address as `0x${string}`;
  const [launch, setLaunch] = useState<VibesLaunch | null>(null);
  const [loading, setLoading] = useState(true);
  const [notFound, setNotFound] = useState(false);

  useEffect(() => {
    let stop = false;
    setLoading(true);
    setNotFound(false);
    (async () => {
      const l = await getLaunch(token);
      if (stop) return;
      if (!l) setNotFound(true);
      setLaunch(l);
      setLoading(false);
    })();
    return () => {
      stop = true;
    };
  }, [token]);

  if (loading) {
    return (
      <section className="container py-10">
        <div className="flex gap-6">
          <div className="skeleton" style={{ width: 160, height: 160 }} />
          <div className="flex-1 space-y-3">
            <div className="skeleton" style={{ height: "1.75rem", width: "40%" }} />
            <div className="skeleton" style={{ height: "0.875rem", width: "65%" }} />
            <div className="skeleton" style={{ height: "0.875rem", width: "30%" }} />
          </div>
        </div>
      </section>
    );
  }

  if (notFound || !launch) {
    return (
      <section className="container max-w-2xl py-16 text-center">
        <h1 className="text-2xl font-bold">Token not found</h1>
        <p className="mt-2 text-sm text-muted-foreground">
          {shortAddr(token)} is not indexed as a launch on the vibes platform.
        </p>
        <Link to="/market" className="mt-6 inline-block">
          <Button variant="outline">Back to market</Button>
        </Link>
      </section>
    );
  }

  return (
    <section className="container py-10">
      <Link
        to="/market"
        className="mb-6 inline-flex items-center gap-1 text-sm text-muted-foreground hover:text-foreground"
      >
        ← Market
      </Link>

      <div className="grid gap-8 lg:grid-cols-[auto_1fr]">
        <div className="flex flex-col items-start gap-4">
          <div
            className="relative overflow-hidden border border-border bg-card"
            style={{ width: 160, height: 160 }}
          >
            <TokenImage uri={launch.content.image?.uri} alt={launch.name} className="!static" />
          </div>
          <div className="flex flex-wrap gap-2">
            <a href={`${CHAIN.explorer}/address/${launch.tokenAddress}`} target="_blank" rel="noreferrer noopener">
              <Button variant="outline" size="sm">
                Explorer
              </Button>
            </a>
            <a
              href={`https://testnet.vibevibe.fun/token/${launch.tokenAddress}`}
              target="_blank"
              rel="noreferrer noopener"
            >
              <Button variant="outline" size="sm">
                On vibes
              </Button>
            </a>
          </div>
        </div>

        <div className="min-w-0">
          <div className="flex flex-wrap items-baseline gap-3">
            <h1 className="text-3xl font-bold">${launch.symbol}</h1>
            <span className="text-lg text-muted-foreground">{launch.name}</span>
            {launch.creatorAddress.toLowerCase() === ISSUER.toLowerCase() && (
              <span className="chip is-dev">Dev launch</span>
            )}
          </div>
          <p className="mt-3 max-w-2xl text-sm text-muted-foreground">
            {launch.content.description ||
              `Bonding-curve launch of ${launch.name} ($${launch.symbol}) on Robinhood Chain Testnet.`}
          </p>

          <dl className="mt-6 grid gap-px overflow-hidden border border-border bg-border sm:grid-cols-2 lg:grid-cols-4">
            <Stat label="Last price" value={`${fmtEth(launch.analytics.lastPriceWeiPerToken, 9)} ETH`} />
            <Stat label="24h volume" value={`${fmtEth(launch.analytics.volume24hWei)} ETH`} />
            <Stat label="Holders" value={String(launch.holderCount ?? 0)} />
            <Stat
              label="Curve progress"
              value={`${Math.round(launch.curve.progressBps / 100)}%`}
            />
            <Stat label="Market cap (virtual)" value={`${fmtEth(launch.curve.ethRemainingWei)} ETH`} />
            <Stat
              label="Curve"
              value={launch.curve.lifecycle === "GRADUATED" ? "Graduated" : "Trading"}
            />
            <Stat label="Creator" value={shortAddr(launch.creatorAddress)} mono />
            <Stat label="Created" value={`${timeAgo(launch.createdAt)} ago`} />
          </dl>

          <div className="mt-6">
            <CurveProgress launch={launch} />
          </div>
        </div>
      </div>

      <div className="mt-10 grid gap-6 lg:grid-cols-2">
        <TradeBox launch={launch} />
        <AboutBox launch={launch} />
      </div>
    </section>
  );
}

import { ISSUER } from "@/contracts";

function Stat({
  label,
  value,
  mono,
}: {
  label: string;
  value: string;
  mono?: boolean;
}) {
  return (
    <div className="bg-card p-3">
      <dt className="text-[0.6875rem] uppercase tracking-wide text-muted-foreground">
        {label}
      </dt>
      <dd className={`mt-1 text-sm font-medium ${mono ? "mono" : ""}`}>{value}</dd>
    </div>
  );
}

function CurveProgress({ launch }: { launch: VibesLaunch }) {
  const pct = Math.min(100, Math.round(launch.curve.progressBps / 100));
  const grad = launch.curve.lifecycle === "GRADUATED";
  const raised = Number(BigInt(launch.curve.netRaisedWei)) / 1e18;
  const target = Number(BigInt(launch.curve.netTargetWei)) / 1e18;
  return (
    <div>
      <div className="mb-2 flex items-center justify-between text-xs text-muted-foreground">
        <span>Bonding curve</span>
        <span className={grad ? "text-destructive" : ""}>
          {grad ? "Graduated — open market" : `${raised.toFixed(4)} / ${target.toFixed(2)} ETH`}
        </span>
      </div>
      <div className={`curve-track ${grad ? "is-graduated" : ""}`} style={{ height: 5 }}>
        <span style={{ width: pct + "%" }} />
      </div>
      <div className="mt-2 flex items-center justify-between text-[0.6875rem] text-muted-foreground">
        <span>{fmtTokens(launch.curve.tokensSoldBaseUnits)} sold</span>
        <span>{pct}% to graduation</span>
      </div>
    </div>
  );
}

function AboutBox({ launch }: { launch: VibesLaunch }) {
  const rows: [string, string][] = [
    ["Token", launch.tokenAddress],
    ["Curve pair", launch.curveAddress],
    ["Creator", launch.creatorAddress],
    ["Creator vault", launch.creatorVaultAddress],
    ["Quote asset", launch.quoteAssetAddress],
    ["Launch id", launch.launchId],
    ["Created", new Date(Date.parse(launch.createdAt)).toLocaleString()],
  ];
  return (
    <div className="rounded-md border border-border bg-card p-5">
      <h2 className="mb-3 text-sm font-bold uppercase tracking-wide text-muted-foreground">
        Contract details
      </h2>
      <dl className="space-y-2 text-xs">
        {rows.map(([k, v]) => (
          <div key={k} className="flex justify-between gap-3">
            <dt className="shrink-0 text-muted-foreground">{k}</dt>
            <dd className="mono truncate text-right">{shortAddr(v)}</dd>
          </div>
        ))}
      </dl>
      <p className="mt-4 text-[0.6875rem] leading-relaxed text-muted-foreground">
        Graduated tokens migrate to the v4 pool and trade on the open market
        through the universal router. Curve-phase tokens follow the seedify
        bonding-curve policy (1.25% fee, 75/25 creator/protocol split).
      </p>
    </div>
  );
}

function TradeBox({ launch }: { launch: VibesLaunch }) {
  const { address, isConnected } = useAccount();
  const { writeContractAsync, isPending } = useWriteContract();
  const pair = launch.curveAddress as `0x${string}`;
  const token = launch.tokenAddress as `0x${string}`;

  const [mode, setMode] = useState<"buy" | "sell">("buy");
  const [amount, setAmount] = useState("");
  const [slip, setSlip] = useState(5);
  const [ok, setOk] = useState<string | null>(null);
  const [err, setErr] = useState<string | null>(null);

  const ethBal = useBalance({ address });
  const tokenBal = useReadContract({
    address: token,
    abi: ERC20,
    functionName: "balanceOf",
    args: [address!],
    query: { enabled: !!address },
  });

  const amt = (() => {
    try {
      return parseEther(amount || "0");
    } catch {
      return 0n;
    }
  })();

  const quoteBuy = useReadContract({
    address: pair,
    abi: PAIR_ABI,
    functionName: "quoteBuy",
    args: [amt],
    query: { enabled: mode === "buy" && amt > 0n },
  });
  const quoteSell = useReadContract({
    address: pair,
    abi: PAIR_ABI,
    functionName: "quoteSell",
    args: [amt],
    query: { enabled: mode === "sell" && amt > 0n },
  });
  const graduated = useReadContract({
    address: pair,
    abi: PAIR_ABI,
    functionName: "graduated",
  });

  const out = (mode === "buy" ? quoteBuy.data : quoteSell.data) as bigint | undefined;

  const submit = async () => {
    setErr(null);
    setOk(null);
    try {
      if (amt <= 0n) throw new Error("enter an amount > 0");
      const deadline = BigInt(Math.floor(Date.now() / 1000) + 600);
      const bps = BigInt(slip * 100);

      if (mode === "buy") {
        const q = (quoteBuy.data as bigint) ?? 0n;
        const hash = await writeContractAsync({
          address: pair,
          abi: PAIR_ABI,
          functionName: "buy",
          args: [(q * (10000n - bps)) / 10000n, deadline],
          value: amt,
        });
        setOk(hash);
        setAmount("");
      } else {
        const q = (quoteSell.data as bigint) ?? 0n;
        const allowed = await readAllowance(token, address!, pair);
        if (allowed < amt) {
          const appr = await writeContractAsync({
            address: token,
            abi: ERC20,
            functionName: "approve",
            args: [pair, amt],
          });
          await waitForTx(CHAIN.rpcRead, String(appr));
        }
        const hash = await writeContractAsync({
          address: pair,
          abi: PAIR_ABI,
          functionName: "sell",
          args: [amt, (q * (10000n - bps)) / 10000n, deadline],
        });
        setOk(hash);
        setAmount("");
      }
    } catch (e) {
      setErr((e as Error).message.slice(0, 180));
    }
  };

  if (!isConnected) {
    return (
      <div className="rounded-md border border-border bg-card p-5">
        <h2 className="mb-3 text-sm font-bold uppercase tracking-wide text-muted-foreground">
          Trade ${launch.symbol}
        </h2>
        <p className="text-sm text-muted-foreground">
          Connect your wallet to buy or sell ${launch.symbol} through the
          bonding curve.
        </p>
        <div className="mt-4 flex flex-wrap gap-3 text-xs">
          {out !== undefined && out > 0n && (
            <span className="rounded-md border border-border bg-muted p-2">
              ≈ {fmtTokens(out)} ${launch.symbol} for {amount || "0"} ETH
            </span>
          )}
        </div>
        <p className="mt-3 text-[0.6875rem] text-muted-foreground">
          Quotes are live; executing a trade needs a connected wallet on
          Robinhood Chain Testnet (46630).
        </p>
      </div>
    );
  }

  return (
    <div className="rounded-md border border-border bg-card p-5">
      <div className="mb-4 flex items-center justify-between">
        <h2 className="text-sm font-bold uppercase tracking-wide text-muted-foreground">
          Trade ${launch.symbol}
        </h2>
        <div className="flex gap-2">
          <Button
            size="sm"
            variant={mode === "buy" ? "default" : "outline"}
            onClick={() => setMode("buy")}
          >
            Buy
          </Button>
          <Button
            size="sm"
            variant={mode === "sell" ? "default" : "outline"}
            onClick={() => setMode("sell")}
          >
            Sell
          </Button>
        </div>
      </div>

      <div className="mb-3 grid grid-cols-2 gap-2 text-xs">
        <div className="rounded-md bg-muted p-2">
          <div className="text-[0.6875rem] uppercase text-muted-foreground">ETH</div>
          <div className="mt-0.5 font-medium mono">
            {ethBal.data ? formatEther(ethBal.data.value) : "…"}
          </div>
        </div>
        <div className="rounded-md bg-muted p-2">
          <div className="text-[0.6875rem] uppercase text-muted-foreground">
            ${launch.symbol}
          </div>
          <div className="mt-0.5 font-medium mono">
            {tokenBal.data ? fmtTokens(tokenBal.data as bigint) : "…"}
          </div>
        </div>
      </div>

      <div className="mb-3 flex flex-col gap-2 sm:flex-row">
        <input
          type="number"
          step="any"
          min="0"
          placeholder={mode === "buy" ? "ETH to spend" : `${launch.symbol} to sell`}
          value={amount}
          onChange={(e) => setAmount(e.target.value)}
          className="h-10 flex-1 rounded-md border border-input bg-background px-3 text-sm outline-none focus-visible:ring-2 focus-visible:ring-ring"
        />
        <div className="flex items-center gap-2 text-sm">
          <span className="text-muted-foreground">slip</span>
          <input
            type="number"
            min="0"
            max="50"
            value={slip}
            onChange={(e) => setSlip(Number(e.target.value) || 5)}
            className="h-9 w-16 rounded-md border border-input bg-background px-2 text-sm outline-none focus-visible:ring-2 focus-visible:ring-ring"
          />
          <span className="text-muted-foreground">%</span>
        </div>
      </div>

      {out !== undefined && out > 0n && (
        <div className="mb-3 rounded-md border border-border bg-muted p-2.5 text-sm">
          {mode === "buy"
            ? `≈ ${fmtTokens(out)} $${launch.symbol} for ${amount} ETH`
            : `≈ ${formatEther(out)} ETH for ${fmtTokens(amt)} $${launch.symbol}`}
        </div>
      )}

      <Button onClick={submit} disabled={isPending || !amount} className="w-full">
        {isPending
          ? "Signing…"
          : mode === "buy"
            ? `Buy $${launch.symbol}`
            : `Sell $${launch.symbol}`}
      </Button>

      {graduated.data !== undefined && (
        <div className="mt-3 text-[0.6875rem] text-muted-foreground">
          {graduated.data
            ? "✓ Curve graduated — this token trades on the open market."
            : "Bonding-curve phase. Fee: 1.25% (75% creator / 25% protocol)."}
        </div>
      )}

      {ok && (
        <div className="mt-3 break-all rounded-md border border-foreground/30 bg-foreground/5 p-3 text-xs">
          ✓ tx {ok}
        </div>
      )}
      {err && (
        <div className="mt-3 rounded-md border border-destructive/40 bg-destructive/10 p-3 text-xs text-destructive">
          {err}
        </div>
      )}
    </div>
  );
}

async function readAllowance(
  token: `0x${string}`,
  owner: `0x${string}`,
  spender: `0x${string}`,
): Promise<bigint> {
  const data =
    "0xdd62ed3e" + owner.slice(2).padStart(64, "0") + spender.slice(2).padStart(64, "0");
  const r = await fetch(CHAIN.rpcRead, {
    method: "POST",
    headers: { "content-type": "application/json" },
    body: JSON.stringify({
      jsonrpc: "2.0",
      id: 1,
      method: "eth_call",
      params: [{ to: token, data }, "latest"],
    }),
  }).then((x) => x.json());
  return r.result ? BigInt(String(r.result)) : 0n;
}

async function waitForTx(rpc: string, hash: string): Promise<void> {
  for (let i = 0; i < 40; i++) {
    try {
      const r = await fetch(rpc, {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({
          jsonrpc: "2.0",
          id: 1,
          method: "eth_getTransactionReceipt",
          params: [hash],
        }),
      }).then((x) => x.json());
      if (r && r.result && r.result.blockNumber) return;
    } catch {
      // retry
    }
    await new Promise((r) => setTimeout(r, 2000));
  }
}
