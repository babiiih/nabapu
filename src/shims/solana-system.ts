/** Shim @solana-program/system — hanya dipakai path Solana Privy (tidak aktif di app EVM ini). */
/* eslint-disable @typescript-eslint/no-explicit-any */
const chain: any = new Proxy(function () {}, {
  get: (_t, prop) => {
    if (prop === Symbol.toPrimitive) return () => "solana-shim";
    return chain;
  },
  apply: () => chain,
});

export const getTransferSolInstruction = () => chain;
export const transferSol = () => chain;
export default chain;
