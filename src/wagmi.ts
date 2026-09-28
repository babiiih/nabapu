import { http, createConfig } from "wagmi";
import { defineChain } from "viem";

/**
 * Robinhood Chain Testnet — custom chain definition for wagmi/viem.
 */
export const robinhoodTestnet = defineChain({
  id: 46630,
  name: "Robinhood Chain Testnet",
  nativeCurrency: { name: "Ether", symbol: "ETH", decimals: 18 },
  rpcUrls: {
    default: {
      // Alchemy handles both read + write reliably from the browser.
      // testnet.vibevibe.fun/rpc is read-only and rejects sendTransaction.
      http: ["https://robinhood-testnet.g.alchemy.com/v2/alch__6QV6bqRic9nBcIh_gIzI"],
    },
  },
  blockExplorers: {
    default: {
      name: "Robinhood Testnet Explorer",
      url: "https://explorer.testnet.chain.robinhood.com",
    },
  },
  testnet: true,
});

export const wagmiConfig = createConfig({
  chains: [robinhoodTestnet],
  // EIP-6963 discovery handles injected wallets (MetaMask etc.) automatically.
  multiInjectedProviderDiscovery: true,
  ssr: false,
  transports: {
    [robinhoodTestnet.id]: http(),
  },
});
