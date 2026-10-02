/**
 * Nabapu 1000 v2 — halaman free-mint ERC-721 (RARITY RANDOM).
 *
 * Kontrak: 0xcA58B078…469D (Robinhood Chain Testnet, deploy oleh dev wallet).
 * mint() tanpa pembayaran (gas only), pool 1000 ID — ID diacak on-chain
 * (lazy Fisher-Yates) jadi rarity yang didapat murni keberuntungan.
 * Galeri + rarity filter dari public/nft/manifest.json.
 */
import { useEffect, useMemo, useState } from "react";
import {
  useAccount,
  useConnect,
  useReadContract,
  useWriteContract,
} from "wagmi";
import { parseAbi } from "viem";
import { NFT_COLLECTION, CHAIN } from "@/contracts";
import { Button } from "@/components/ui/button";
import { shortAddr } from "@/lib/format";
import PrivyConnectButton from "@/features/privy/PrivyConnectButton";

const NFT_ABI = parseAbi([
  "function mint()",
  "function totalSupply() view returns (uint256)",
  "function MAX_SUPPLY() view returns (uint256)",
  "function balanceOf(address owner) view returns (uint256)",
  "function name() view returns (string)",
  "function symbol() view returns (string)",
]);

type Rarity = "Common" | "Uncommon" | "Rare" | "Epic" | "Legendary";
type Entry = { id: number; file: string; rarity: Rarity };

const RARITIES: Rarity[] = ["Common", "Uncommon", "Rare", "Epic", "Legendary"];
const RARITY_CLASS: Record<Rarity, string> = {
  Common: "text-muted-foreground border-border",
  Uncommon: "text-primary border-primary/50",
  Rare: "text-blue-500 border-blue-500/50",
  Epic: "text-purple-500 border-purple-500/50",
  Legendary: "text-amber-500 border-amber-500/50",
};

export default function NftPage() {
  const { address, isConnected } = useAccount();
  const { connectors, connect } = useConnect();
  const { writeContractAsync, isPending } = useWriteContract();

  const [manifest, setManifest] = useState<Entry[] | null>(null);
  const [filter, setFilter] = useState<Rarity | "All">("All");
  const [visible, setVisible] = useState(36);
  const [ok, setOk] = useState<string | null>(null);
  const [err, setErr] = useState<string | null>(null);

  useEffect(() => {
    fetch("/nft/manifest.json")
      .then((r) => (r.ok ? r.json() : Promise.reject(new Error(String(r.status)))))
      .then((j) => setManifest(Array.isArray(j) ? j : []))
      .catch(() => setManifest([]));
  }, []);

  const supply = useReadContract({
    address: NFT_COLLECTION,
    abi: NFT_ABI,
    functionName: "totalSupply",
    query: { refetchInterval: 15_000 },
  });
  const maxSupply = useReadContract({
    address: NFT_COLLECTION,
    abi: NFT_ABI,
    functionName: "MAX_SUPPLY",
  });
  const myBalance = useReadContract({
    address: NFT_COLLECTION,
    abi: NFT_ABI,
    functionName: "balanceOf",
    args: address ? [address] : undefined,
    query: { enabled: !!address },
  });

  const minted = (supply.data as bigint | undefined) ?? 0n;
  const max = (maxSupply.data as bigint | undefined) ?? 1000n;
  const soldOut = minted >= max && maxSupply.data !== undefined;
  const mine = (myBalance.data as bigint | undefined) ?? 0n;

  const counts = useMemo(() => {
    const c: Record<string, number> = {};
    for (const e of manifest ?? []) c[e.rarity] = (c[e.rarity] ?? 0) + 1;
    return c;
  }, [manifest]);

  const shown = useMemo(() => {
    const list = (manifest ?? []).filter((e) => filter === "All" || e.rarity === filter);
    return list.slice(0, visible);
  }, [manifest, filter, visible]);

  const doMint = async () => {
    setErr(null);
    setOk(null);
    try {
      const hash = await writeContractAsync({
        address: NFT_COLLECTION,
        abi: NFT_ABI,
        functionName: "mint",
        // kunci ke Robinhood Chain Testnet — wallet auto-switch kalau di chain lain
        chainId: CHAIN.id,
      });
      setOk(hash);
      // refresh supply + balance setelah konfirmasi
      setTimeout(() => {
        void supply.refetch();
        void myBalance.refetch();
      }, 6000);
    } catch (e) {
      const err = e as { code?: number; shortMessage?: string; message?: string };
      const msg = err.shortMessage || err.message || "mint failed";
      // -32002 = MetaMask sudah punya request tertunda (popup kebuka/nyangkut)
      setErr(
        err.code === -32002 || msg.includes("Requested resource not available")
          ? "⚠️ MetaMask masih punya permintaan tertunda. Buka popup MetaMask-nya (cek ikon extension) — approve atau batal dulu — lalu coba lagi."
          : msg.slice(0, 160),
      );
    }
  };

  const pct = max > 0n ? Number((minted * 10000n) / max) / 100 : 0;

  return (
    <section className="container py-10">
      {/* Header */}
      <div className="flex flex-wrap items-start justify-between gap-4">
        <div>
          <span className="chip is-live mb-2">
            <span
              className="inline-block h-1.5 w-1.5 rounded-full bg-current"
              style={{ animation: "skeleton-pulse 1.6s ease-in-out infinite" }}
            />
            Free mint · gas only
          </span>
          <h1 className="text-3xl font-bold tracking-tight">Nabapu 1000</h1>
          <p className="text-muted-foreground mt-1 max-w-[70ch] text-sm">
            1,000 collectibles on Robinhood Chain Testnet — Common to Legendary.
            {" "}
            <span className="text-foreground font-medium">
              Rarity is random per mint
            </span>{" "}
            (pulled from the pool on-chain) — first come first served.
          </p>
        </div>
        <div className="border-border bg-card rounded-lg border px-4 py-3 text-right">
          <div className="num text-2xl font-bold">
            {minted.toString()}
            <span className="text-muted-foreground text-base font-medium">
              {" "}/ {max.toString()}
            </span>
          </div>
          <div className="text-muted-foreground text-xs">minted</div>
        </div>
      </div>

      {/* Progress + mint panel */}
      <div className="border-border bg-card mt-6 rounded-lg border p-5">
        <div className="curve-track">
          <span style={{ width: `${pct}%` }} />
        </div>
        <div className="mt-4 flex flex-wrap items-center justify-between gap-3">
          <div className="text-sm">
            {isConnected ? (
              <span className="text-muted-foreground">
                Connected <span className="mono text-foreground">{shortAddr(address)}</span> · you own{" "}
                <span className="num text-foreground font-semibold">{mine.toString()}</span>
              </span>
            ) : (
              <span className="text-muted-foreground">
                Connect a wallet on Robinhood Chain Testnet (needs test ETH for gas).
              </span>
            )}
          </div>
          <div className="flex items-center gap-2">
            <PrivyConnectButton />
            {!isConnected ? (
              <Button
                onClick={() => connect({ connector: connectors[0] })}
                disabled={!connectors.length}
              >
                Connect wallet
              </Button>
            ) : (
              <Button
                onClick={() => void doMint()}
                disabled={isPending || soldOut}
                className="min-w-40"
              >
                {soldOut
                  ? "Sold out"
                  : isPending
                    ? "Confirming…"
                    : "Mint free"}
              </Button>
            )}
          </div>
        </div>

        {ok && (
          <div className="mt-3 rounded-md border border-emerald-500/40 bg-emerald-500/10 p-3 text-sm">
            🎉 Minted!{" "}
            <a
              href={`${CHAIN.explorer}/tx/${ok}`}
              target="_blank"
              rel="noreferrer noopener"
              className="text-primary underline underline-offset-2"
            >
              view tx ↗
            </a>
          </div>
        )}
        {err && (
          <div className="mt-3 rounded-md border border-red-500/40 bg-red-500/10 p-3 text-sm text-red-500">
            {err}
          </div>
        )}
      </div>

      {/* Rarity legend */}
      <div className="mt-6 flex flex-wrap items-center gap-2">
        <button
          type="button"
          onClick={() => {
            setFilter("All");
            setVisible(36);
          }}
          className={`h-8 rounded-md border px-3 text-xs transition-colors ${
            filter === "All"
              ? "bg-primary text-primary-foreground border-primary"
              : "border-input bg-background hover:bg-accent text-muted-foreground"
          }`}
        >
          All {manifest?.length ?? ""}
        </button>
        {RARITIES.map((r) => (
          <button
            key={r}
            type="button"
            onClick={() => {
              setFilter(r);
              setVisible(36);
            }}
            className={`h-8 rounded-md border px-3 text-xs transition-colors ${RARITY_CLASS[r]} ${
              filter === r ? "bg-muted font-medium" : "bg-background hover:bg-accent"
            }`}
          >
            {r} {counts[r] ?? 0}
          </button>
        ))}
      </div>

      {/* Gallery */}
      {manifest === null ? (
        <div className="mt-6 grid grid-cols-3 gap-3 sm:grid-cols-4 lg:grid-cols-6">
          {Array.from({ length: 12 }).map((_, i) => (
            <div key={i} className="skeleton" style={{ aspectRatio: "1/1", borderRadius: "0.5rem" }} />
          ))}
        </div>
      ) : manifest.length === 0 ? (
        <div className="text-muted-foreground mt-6 rounded-md border border-border bg-card p-8 text-center text-sm">
          Gallery manifest unavailable.
        </div>
      ) : (
        <>
          <div className="mt-6 grid grid-cols-3 gap-3 sm:grid-cols-4 lg:grid-cols-6">
            {shown.map((e) => (
              <a
                key={e.id}
                href={`/nft/${e.file}`}
                target="_blank"
                rel="noreferrer noopener"
                className="group relative block overflow-hidden rounded-lg border border-border"
                title={`#${e.id} · ${e.rarity}`}
              >
                <img
                  src={`/nft/${e.file}`}
                  alt={`Nabapu 1000 #${e.id}`}
                  loading="lazy"
                  className="aspect-square w-full object-cover transition-transform group-hover:scale-105"
                />
                <span
                  className={`absolute top-1.5 left-1.5 rounded border bg-background/85 px-1.5 py-0.5 text-[0.625rem] font-medium backdrop-blur ${RARITY_CLASS[e.rarity]}`}
                >
                  #{e.id} {e.rarity}
                </span>
              </a>
            ))}
          </div>
          {shown.length < (manifest.filter((e) => filter === "All" || e.rarity === filter).length) && (
            <div className="mt-6 flex justify-center">
              <Button
                variant="outline"
                onClick={() => setVisible((v) => v + 48)}
              >
                Load more ({shown.length} /{" "}
                {manifest.filter((e) => filter === "All" || e.rarity === filter).length})
              </Button>
            </div>
          )}
        </>
      )}
    </section>
  );
}
