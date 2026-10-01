/**
 * Tombol ganda: login Privy (email/Google) → sambungkan embedded wallet ke wagmi.
 * Setelah terkoneksi, alur Buy/Mint di site jalan normal TANPA MetaMask
 * (signing lewat provider Privy — gak ada popup extension → -32002 mustahil).
 */
import { usePrivy, useWallets } from "@privy-io/react-auth";
import { useAccount, useConnect } from "wagmi";
import { injected } from "wagmi/connectors";
import { Button } from "@/components/ui/button";

export default function PrivyConnectButton() {
  const { ready, authenticated, login } = usePrivy();
  const { wallets } = useWallets();
  const { isConnected } = useAccount();
  const { connect, isPending, error } = useConnect();

  const embedded = wallets.find(
    (w) => (w as { walletClientType?: string }).walletClientType === "privy" ||
           (w as { connectorType?: string }).connectorType === "embedded",
  );

  // 1. belum login → tombol login
  if (!authenticated) {
    return (
      <Button
        variant="outline"
        size="sm"
        onClick={() => login()}
        disabled={!ready}
        title="Login email/Google — wallet dibikin otomatis, tanpa MetaMask"
      >
        Email / Google login
      </Button>
    );
  }

  // 2. sudah login, belum konek ke site → sambungkan embedded provider
  if (!isConnected) {
    return (
      <div className="flex flex-col gap-1">
        <Button
          size="sm"
          disabled={isPending || !embedded}
          onClick={async () => {
            if (!embedded) return;
            try {
              const provider = await (embedded as unknown as {
                getEthereumProvider: () => Promise<unknown>;
              }).getEthereumProvider();
              // wagmi versi ini gak ekspor `custom` → bungkus provider EIP-1193
              // sebagai injected target (jalur resmi)
              connect({
                connector: injected({
                  shimDisconnect: true,
                  target: {
                    id: "privy-embedded",
                    name: "Privy Wallet",
                    provider: provider as never,
                  },
                }),
              });
            } catch (e) {
              console.error("privy connect failed", e);
            }
          }}
        >
          {isPending ? "Connecting…" : "Connect Privy wallet"}
        </Button>
        {error && (
          <span className="text-destructive text-[0.6875rem]">
            {error.message.slice(0, 100)}
          </span>
        )}
      </div>
    );
  }

  // 3. sudah konek → biarkan alur normal yang tampil
  return null;
}
