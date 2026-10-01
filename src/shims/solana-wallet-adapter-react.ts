/** Shim @solana/wallet-adapter-react — hanya dipakai jalur Farcaster-Solana Privy (tidak aktif di app EVM). */
/* eslint-disable @typescript-eslint/no-explicit-any */
const chain: any = new Proxy(function () {}, {
  get: (_t, prop) => {
    if (prop === Symbol.toPrimitive) return () => "solana-shim";
    if (prop === "then") return undefined;
    return chain;
  },
  apply: () => chain,
});
export const ConnectionProvider = chain;
export const WalletProvider = chain;
export const useConnection = () => ({ connection: chain });
export const useWallet = () => ({ wallet: null, publicKey: null, connect: () => {}, disconnect: () => {} });
export default chain;
