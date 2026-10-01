/**
 * Privy provider — login email/Google + embedded wallet di Robinhood Chain Testnet.
 * Dibungkus DI LUAR seluruh app; site tetap pakai wagmi config sendiri
 * (connector chooser MetaMask dsb gak berubah — Privy cuma opsi tambahan).
 *
 * App ID public; App secret TIDAK dipakai di frontend (hanya server) —
 * disimpan di vault: E:/hermes/.vault/credentials/privy-app-secret.txt
 */
import type { ReactNode } from "react";
import { PrivyProvider } from "@privy-io/react-auth";
import { robinhoodTestnet } from "@/wagmi";

export const PRIVY_APP_ID = "cmunk1av5005h0cl5xichbrz5";

export default function AppPrivyProvider({ children }: { children: ReactNode }) {
  return (
    <PrivyProvider
      appId={PRIVY_APP_ID}
      config={{
        // chain khusus kita — external wallet pun otomatis disuruh pindah
        // ke defaultChain kalau gak di supportedChains (per dokumen Privy v3)
        supportedChains: [robinhoodTestnet],
        defaultChain: robinhoodTestnet,
        // wallet embedded dibikin otomatis buat user yang belum punya wallet
        embeddedWallets: {
          ethereum: { createOnLogin: "users-without-wallets" },
        },
        appearance: {
          theme: "light",
          accentColor: "#10b981",
        },
      }}
    >
      {children}
    </PrivyProvider>
  );
}
