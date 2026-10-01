/** Shim @solana/web3.js — hanya dipakai jalur Farcaster-Solana Privy (tidak aktif di app EVM). */
/* eslint-disable @typescript-eslint/no-explicit-any */
const chain: any = new Proxy(function () {}, {
  get: (_t, prop) => {
    if (prop === Symbol.toPrimitive) return () => "solana-shim";
    if (prop === "then") return undefined;
    return chain;
  },
  apply: () => chain,
});
export const Connection = chain;
export const Transaction = chain;
export const VersionedMessage = chain;
export const VersionedTransaction = chain;
export const PublicKey = chain;
export const Keypair = chain;
export const LAMPORTS_PER_SOL = 1000000000;
export default chain;
