/** Shim @solana-program/memo — path Privy Solana tidak aktif di app EVM ini. */
/* eslint-disable @typescript-eslint/no-explicit-any */
const chain: any = new Proxy(function () {}, {
  get: (_t, prop) => {
    if (prop === Symbol.toPrimitive) return () => "solana-shim";
    if (prop === "then") return undefined;
    return chain;
  },
  apply: () => chain,
});
export const getAddMemoInstruction = chain;
export default chain;
