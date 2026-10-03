/**
 * Wallet tracker (port dari template `wallet()`) — track address apapun,
 * activity real dari vibes indexer.
 */
import { useState } from 'react';
import { Link } from '@tanstack/react-router';
import { walletActivity, listLaunches, type VibesActivity, type VibesLaunch } from '@/lib/vibes';
import { PageHeading, Subnav } from '../ui';
import { Icon } from '../sprite';
import { launchImg } from '../data';
import { shortAddr, fmtTokens } from '@/lib/format';

interface Position {
  launch: VibesLaunch;
  balance: string;
}

export function NbWallet() {
  const [input, setInput] = useState('');
  const [addr, setAddr] = useState<string | null>(null);
  const [act, setAct] = useState<VibesActivity[]>([]);
  const [positions, setPositions] = useState<Position[]>([]);
  const [busy, setBusy] = useState(false);

  const track = async () => {
    const v = input.trim();
    if (v.length < 6) return;
    setAddr(v);
    setBusy(true);
    try {
      const [a, launches] = await Promise.all([
        walletActivity(v, 30).then((r) => r.items).catch(() => []),
        listLaunches({ limit: 48 }),
      ]);
      setAct(a);
      // positions: scan balance launch yg dimiliki wallet
      const found: Position[] = [];
      await Promise.all(
        launches.items.slice(0, 24).map(async (l) => {
          try {
            const r = await fetch(import.meta.env.VITE_RPC_READ ?? '/rpc', {
              method: 'POST',
              headers: { 'content-type': 'application/json' },
              body: JSON.stringify({
                jsonrpc: '2.0', id: 1, method: 'eth_call',
                params: [{ to: l.tokenAddress, data: '0x70a08231' + v.slice(2).padStart(64, '0') }, 'latest'],
              }),
            }).then((x) => x.json());
            const bal = r.result ? String(r.result) : '0x0';
            if (BigInt(bal) > 0n) found.push({ launch: l, balance: bal });
          } catch {
            /* skip */
          }
        })
      );
      setPositions(found);
    } finally {
      setBusy(false);
    }
  };

  return (
    <>
      <PageHeading
        kicker="INDEXER SYNCED"
        title="Wallet tracker"
        desc="Track any address on Robinhood Chain Testnet — buys, sells and launches pulled live."
      />
      <Subnav items={[['Overview'], ['Positions'], ['Activity'], ['PnL'], ['Launched tokens']]} />
      <div className="tracker">
        <div className="tracker-form">
          <input
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyDown={(e) => e.key === 'Enter' && track()}
            placeholder="0x… Paste a wallet address"
          />
          <button className="primary-btn" onClick={track} disabled={busy}>
            {busy ? 'Syncing…' : 'Track wallet'}
          </button>
        </div>
        {!addr ? (
          <div className="wallet-empty">
            <div className="empty-icon"><Icon name="wallet" /></div>
            <h3>No wallet selected</h3>
            <p>Enter any public address to inspect its on-chain portfolio and activity.</p>
          </div>
        ) : (
          <div className="wallet-result">
            <div className="balance-head">
              <div>
                <p className="count-chip">TRACKING</p>
                <strong style={{ fontSize: 15 }}>{shortAddr(addr)}</strong>
              </div>
              <span className="count-chip">{positions.length} POSITIONS · {act.length} EVENTS</span>
            </div>
            <div className="section-head">
              <h2>Token positions</h2>
              <span className="count-chip">{positions.length} ASSETS</span>
            </div>
            {positions.length === 0 ? (
              <p style={{ color: 'var(--muted)', fontSize: 12, padding: '20px 0' }}>
                No token positions found for this address.
              </p>
            ) : (
              positions.map((p) => (
                <div className="asset-row" key={p.launch.tokenAddress}>
                  <div className="table-token">
                    <img src={launchImg(p.launch)} alt="" />
                    <div>
                      <b>${p.launch.symbol}</b>
                      <span>{p.launch.name}</span>
                    </div>
                  </div>
                  <span className="mono">{fmtTokens(p.balance)}</span>
                  <Link
                    to="/token/$tokenAddress"
                    params={{ tokenAddress: p.launch.tokenAddress }}
                    className="btn"
                    style={{ height: 28, fontSize: 10 }}
                  >
                    Trade
                  </Link>
                </div>
              ))
            )}
            <div className="section-head">
              <h2>Activity</h2>
              <span className="count-chip">{act.length} EVENTS</span>
            </div>
            {act.length === 0 ? (
              <p style={{ color: 'var(--muted)', fontSize: 12, padding: '20px 0' }}>No activity yet.</p>
            ) : (
              <div className="feed">
                {act.slice(0, 20).map((a) => {
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
                        <b>
                          {buy ? 'Bought' : t === 'LAUNCH' ? 'Launched' : 'Sold'}{' '}
                          {shortAddr(a.tokenAddress)}
                        </b>
                        <p>
                          {shortAddr(a.actorAddress)} · block {Number(a.blockNumber).toLocaleString()}
                        </p>
                      </div>
                      <div className="feed-price">
                        <b>{a.blockNumber}</b>
                        <span>tx</span>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        )}
      </div>
    </>
  );
}
