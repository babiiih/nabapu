/**
 * Listen event 'nb:connect' dari NabapuShell → buka connect flow.
 * Prioritas: Privy login (email/Google, embedded wallet), fallback wagmi connectors.
 */
import { useEffect } from 'react';
import { usePrivy, useWallets } from '@privy-io/react-auth';
import { useAccount, useConnect } from 'wagmi';
import { injected } from 'wagmi/connectors';

export function NbConnectListener() {
  const { ready, authenticated, login } = usePrivy();
  const { wallets } = useWallets();
  const { isConnected } = useAccount();
  const { connect, connectors } = useConnect();

  useEffect(() => {
    const onConnect = () => {
      // kalau sudah connected, biarkan
      if (isConnected) return;
      // belum login Privy → login dulu (embedded wallet auto-create)
      if (!authenticated) {
        login();
        return;
      }
      // sudah login tapi wagmi belum connect → connect embedded/injected
      const embedded = wallets.find(
        (w) =>
          (w as { walletClientType?: string }).walletClientType === 'privy' ||
          (w as { connectorType?: string }).connectorType === 'embedded'
      );
      if (embedded) {
        const provider = (embedded as { connector?: { provider?: unknown } }).connector?.provider;
        if (provider) {
          connect({ connector: injected({ target: provider as never }) });
          return;
        }
      }
      // fallback: connector pertama yg available (MetaMask)
      const c = connectors[0];
      if (c) connect({ connector: c });
    };
    window.addEventListener('nb:connect', onConnect);
    return () => window.removeEventListener('nb:connect', onConnect);
  }, [ready, authenticated, login, wallets, isConnected, connect, connectors]);

  return null;
}
