/**
 * Profile (port dari template `profile()`) — identity card + portfolio.
 * Holdings scan paralel (fix load lambat), activity dari indexer.
 */
import { useCallback, useEffect, useState } from 'react';
import { useAccount, useBalance } from 'wagmi';
import { formatEther } from 'viem';
import { listLaunches, walletActivity, type VibesLaunch, type VibesActivity } from '@/lib/vibes';
import { PageHeading } from '../ui';
import { ISSUER, CHAIN } from '@/contracts';
import { launchImg } from '../data';
import { fmtTokens, shortAddr, timeAgo } from '@/lib/format';

interface Holding {
  token: string;
  balance: string;
  launch: VibesLaunch;
}

export function NbProfile() {
  const { address, isConnected } = useAccount();
  const [activity, setActivity] = useState<VibesActivity[]>([]);
  const [holdings, setHoldings] = useState<Holding[]>([]);
  const [busy, setBusy] = useState(false);
  const ethBal = useBalance({ address });
  const isDev = !!address && address.toLowerCase() === ISSUER.toLowerCase();

  const refresh = useCallback(async () => {
    if (!address) return;
    setBusy(true);
    try {
      const [act, owned] = await Promise.all([
        walletActivity(address, 40).then((r) => r.items).catch(() => []),
        scanHoldings(address),
      ]);
      setActivity(act);
      setHoldings(owned);
    } finally {
      setBusy(false);
    }
  }, [address]);

  useEffect(() => {
    void refresh();
  }, [refresh]);

  if (!isConnected || !address) {
    return (
      <>
        <PageHeading
          kicker="YOUR NABAPU ID"
          title="Profile"
          desc="Manage your identity, preferences and every asset linked to your wallet."
        />
        <div className="profile-wrap">
          <div className="profile-card">
            <div className="profile-avatar">NB</div>
            <span className="profile-tier">NABAPU MEMBER</span>
            <h2>Your profile begins on-chain</h2>
            <p>
              Connect a wallet on Robinhood Chain Testnet to see your holdings, activity,
              and collected items.
            </p>
            <button className="primary-btn" data-connect>Connect wallet</button>
          </div>
        </div>
      </>
    );
  }

  return (
    <>
      <PageHeading
        kicker="YOUR NABAPU ID"
        title="Profile"
        desc="Manage your identity, preferences and every asset linked to your wallet."
        right={
          <button className="btn" onClick={() => void refresh()} disabled={busy}>
            {busy ? 'Syncing…' : 'Refresh'}
          </button>
        }
      />
      <div className="profile-wrap">
        <div className="profile-card">
          <div className="profile-avatar">NB</div>
          <span className="profile-tier">{isDev ? 'DEV · ISSUER' : 'NABAPU MEMBER'}</span>
          <h2 className="mono" style={{ fontSize: 14 }}>{address}</h2>
          <p>Wallet connected. Your activity, collectibles and token positions are now visible.</p>
        </div>
        <div className="profile-preview">
          <div>
            <span>PORTFOLIO VALUE</span>
            <b>{ethBal.data ? `${formatEther(ethBal.data.value).slice(0, 8)} ETH` : '—'}</b>
            <small>ETH balance</small>
          </div>
          <div>
            <span>ASSETS HELD</span>
            <b>{String(holdings.length).padStart(2, '0')}</b>
            <small>Token positions</small>
          </div>
          <div>
            <span>EVENTS</span>
            <b>{String(activity.length).padStart(2, '0')}</b>
            <small>Trades + launches</small>
          </div>
        </div>

        <div className="settings-panel">
          <div>
            <h3>Holdings</h3>
            <p>Your launch token positions on the curve.</p>
          </div>
          {busy && holdings.length === 0 ? (
            <p style={{ color: 'var(--muted)', fontSize: 12, padding: '16px 0' }}>
              Scanning on-chain balances…
            </p>
          ) : holdings.length === 0 ? (
            <p style={{ color: 'var(--muted)', fontSize: 12, padding: '16px 0' }}>
              No launch tokens held yet.
            </p>
          ) : (
            holdings.map((h) => (
              <div className="asset-row" key={h.token}>
                <div className="table-token">
                  <img src={launchImg(h.launch)} alt="" />
                  <div>
                    <b>${h.launch.symbol}</b>
                    <span>{h.launch.name}</span>
                  </div>
                </div>
                <span className="mono">{fmtTokens(h.balance)}</span>
                <a
                  href={`${CHAIN.explorer}/token/${h.token}`}
                  target="_blank"
                  rel="noreferrer"
                  className="mono"
                  style={{ fontSize: 10 }}
                >
                  {shortAddr(h.token)}
                </a>
              </div>
            ))
          )}
        </div>

        <div className="settings-panel">
          <div>
            <h3>Activity</h3>
            <p>Latest on-chain events from this wallet.</p>
          </div>
          {activity.length === 0 ? (
            <p style={{ color: 'var(--muted)', fontSize: 12, padding: '16px 0' }}>No activity yet.</p>
          ) : (
            <div className="feed" style={{ paddingLeft: 20 }}>
              {activity.slice(0, 20).map((a) => {
                const t = (a.type || '').toUpperCase();
                const buy = t === 'BUY' || (a.side || '').toUpperCase() === 'BUY';
                return (
                  <div className="feed-card" key={a.id} style={{ cursor: 'default' }}>
                    <span
                      className="activity-icon"
                      style={{ background: buy ? '#143126' : '#3a1420', color: buy ? '#3ef0ad' : '#ff6577' }}
                    >
                      {buy ? '↗' : '↙'}
                    </span>
                    <div className="feed-main">
                      <b>{buy ? 'Bought' : t === 'LAUNCH' ? 'Launched' : 'Sold'} {shortAddr(a.tokenAddress)}</b>
                      <p>{shortAddr(a.actorAddress)} · {timeAgo(a.occurredAt)} ago</p>
                    </div>
                    <div className="feed-price">
                      <b>#{Number(a.blockNumber).toLocaleString()}</b>
                      <span>block</span>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      </div>
    </>
  );
}

/** Scan launch holdings — batch paralel 24 (sama dgn fix profile lama). */
async function scanHoldings(wallet: string): Promise<Holding[]> {
  const out: Holding[] = [];
  let cursor: string | undefined;
  let scanned = 0;
  while (scanned < 240) {
    const res = await listLaunches({ limit: 48, cursor });
    if (!res.items.length) break;
    const batch: VibesLaunch[] = [];
    for (const l of res.items) {
      batch.push(l);
      scanned++;
    }
    const found = await scanBatch(wallet, batch);
    out.push(...found);
    cursor = res.page.nextCursor;
    if (!res.page.hasMore) break;
  }
  return out;
}

async function scanBatch(wallet: string, launches: VibesLaunch[]): Promise<Holding[]> {
  const results = await Promise.all(
    launches.map(async (l) => {
      try {
        const data: string = await fetch(CHAIN.rpcRead, {
          method: 'POST',
          headers: { 'content-type': 'application/json' },
          body: JSON.stringify({
            jsonrpc: '2.0', id: 1, method: 'eth_call',
            params: [{ to: l.tokenAddress, data: '0x70a08231' + wallet.slice(2).padStart(64, '0') }, 'latest'],
          }),
        })
          .then((r) => r.json())
          .then((j) => (j.result ? String(j.result) : '0x0'));
        return BigInt(data) > 0n ? { token: l.tokenAddress, balance: data, launch: l } : null;
      } catch {
        return null;
      }
    })
  );
  return results.filter((x): x is Holding => x !== null);
}
