/**
 * Shim package Solana untuk Privy/x402 (peer opsional yang TIDAK di-install).
 * App ini murni EVM Robinhood Chain Testnet — path Solana tidak pernah jalan.
 * Semua export = Proxy yang tidak pernah melempar error saat module init.
 */
/* eslint-disable @typescript-eslint/no-explicit-any */
const chain: any = new Proxy(function () {}, {
  get: (_t, prop) => {
    if (prop === Symbol.toPrimitive) return () => "solana-shim";
    if (prop === "then") return undefined;
    return chain;
  },
  apply: () => chain,
});

export const fetchMaybeToken = () => Promise.resolve(null);
export const findAssociatedTokenPda = chain;
export const getApproveInstruction = chain;
export const getCreateAssociatedTokenIdempotentInstruction = chain;
export const getTransferInstruction = chain;
export const TOKEN_PROGRAM_ADDRESS = chain;
export const TokenInstruction = chain;
export const identifyTokenInstruction = chain;
export const parseTransferCheckedInstruction = chain;

export default chain;
