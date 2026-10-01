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

export const fetchMint = () => Promise.resolve(null);
export const TOKEN_2022_PROGRAM_ADDRESS = chain;
export const Token2022Instruction = chain;
export const findAssociatedTokenPda = chain;
export const getCreateAssociatedTokenInstruction = chain;
export const getTransferCheckedInstruction = chain;
export const identifyToken2022Instruction = chain;
export const parseCreateAssociatedTokenInstruction = chain;
export const parseTransferCheckedInstruction = chain;

export default chain;
