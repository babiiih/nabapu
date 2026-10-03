import { http, createConfig, injected } from "wagmi";
import { coinbaseWallet, metaMask, walletConnect } from "wagmi/connectors";
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
      // RPC official Robinhood Chain Testnet — gratis, gak butuh key.
      // Write dilakukan lewat injected provider wallet (window.ethereum).
      http: ["https://rpc.testnet.chain.robinhood.com"],
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
  // Explicit connectors so the picker is never empty on browsers without an
  // injected provider. EIP-6963 still surfaces extra injected wallets.
  connectors: [
    injected({ shimDisconnect: true }),
    metaMask(),
    coinbaseWallet({ appName: "Nabapu" }),
    walletConnect({ projectId: "nabapu-rwa-marketplace", showQrModal: true }),
  ],
  multiInjectedProviderDiscovery: true,
  ssr: false,
  transports: {
    [robinhoodTestnet.id]: http(),
  },
});
