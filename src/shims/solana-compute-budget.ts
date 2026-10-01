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
export const COMPUTE_BUDGET_PROGRAM_ADDRESS = chain;
export const estimateComputeUnitLimitFactory = chain;
export const getSetComputeUnitLimitInstruction = chain;
export const parseSetComputeUnitLimitInstruction = chain;
export const parseSetComputeUnitPriceInstruction = chain;
export const setTransactionMessageComputeUnitPrice = chain;

export default chain;
