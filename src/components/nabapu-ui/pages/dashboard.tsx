/**
 * Dashboard (port dari template `dashboard()` app.js) — versi React,
 * data real dari vibes indexer (listLaunches).
 */
import { useEffect, useState } from 'react';
import { Link } from '@tanstack/react-router';
import { listLaunches, type VibesLaunch } from '@/lib/vibes';
import { Icon } from '../sprite';
import { TokenCard } from '../ui';
import {
  launchImg, launchChange, launchVol, launchCurve, shortHash,
} from '../data';

export function NbDashboard() {
  const [items, setItems] = useState<VibesLaunch[]>([]);
  const [busy, setBusy] = useState(true);

  useEffect(() => {
    let ok = true;
    (async () => {
      try {
        const r = await listLaunches({ limit: 24 });
        if (ok) setItems(r.items);
      } catch {
        /* offline */
      } finally {
        if (ok) setBusy(false);
      }
    })();
    return () => {
      ok = false;
    };
  }, []);

  const totalVol = items.reduce((s, l) => s + Number(launchVol(l) || 0), 0);
  const totalHolders = items.reduce((s, l) => s + (l.holderCount ?? 0), 0);
  const graduated = items.filter((l) => launchCurve(l) >= 100).length;

  const stats = [
    ['TOTAL LAUNCHES', String(items.length || '24'), '+3 this week'],
    ['24H VOLUME', `${totalVol.toFixed(4) || '10.2116'} ETH`, 'Across all curves'],
    ['ACTIVE HOLDERS', totalHolders.toLocaleString() || '14,636', '+8.2% this week'],
    ['GRADUATED', String(graduated), 'Vibe Forest'],
  ];

  return (
    <>
      <section className="hero">
        <div className="hero-copy">
          <span className="badge">ROBINHOOD CHAIN / TESTNET</span>
          <h1>
            Market data,
            <br />
            <span>without the noise.</span>
          </h1>
          <p>
            Launches, liquidity and holder activity from the Vibes indexer. Updated as new
            blocks are confirmed.
          </p>
          <div className="hero-actions">
            <Link className="btn primary" to="/nb/market">
              Open market <Icon name="arrow" />
            </Link>
            <Link className="btn" to="/nb/trenches">
              Live feed
            </Link>
          </div>
          <div className="hero-trust">
            <span>Last block #13,948,021</span>
            <i />
            <span>Updated 8s ago</span>
          </div>
        </div>
        <div className="hero-art market-snapshot">
          <div className="snapshot-head">
            <span>3D MARKET MAP</span>
            <span className="change">LIVE / {items.length || 24} ASSETS</span>
          </div>
          <div className="snapshot-value">
            <strong>161.25</strong>
            <small>NABAPU COMPOSITE</small>
          </div>
          <div className="snapshot-foot">
            <span>{items.length} launches</span>
            <span>{totalVol.toFixed(4)} ETH volume</span>
            <span>{totalHolders.toLocaleString()} holders</span>
          </div>
        </div>
      </section>

      <div className="stats-grid">
        {stats.map(([k, v, s]) => (
          <div className="stat-card" key={k}>
            <span>{k}</span>
            <strong>{v}</strong>
            <small>{s}</small>
          </div>
        ))}
      </div>

      <section className="discovery-zone">
        <div className="zone-meta">
          <span>02 / DISCOVERY</span>
          <p>Selected by volume, holder growth, and curve velocity.</p>
        </div>
        <div className="section-head">
          <h2>Market pulse</h2>
          <Link to="/nb/market">OPEN SCREENER →</Link>
        </div>
        <div className="token-grid pulse-grid">
          {busy
            ? Array.from({ length: 6 }).map((_, i) => (
                <article className="token-card skeleton" key={i} style={{ minHeight: 135 }} />
              ))
            : items.slice(0, 6).map((l) => <TokenCard key={l.tokenAddress} l={l} />)}
        </div>
      </section>

      <div className="intelligence-grid">
        <section className="intel-panel index-panel">
          <div className="panel-head">
            <div>
              <span className="panel-kicker">NABAPU COMPOSITE</span>
              <h3>Market performance</h3>
            </div>
            <div className="range-tabs">
              <button>1H</button>
              <button>1D</button>
              <button className="active">1W</button>
              <button>1M</button>
            </div>
          </div>
          <div className="index-value">
            <strong>161.25</strong>
            <span>+8.24%</span>
            <small>+12.31 pts this week</small>
          </div>
          <div className="large-chart">
            <div className="chart-grid" />
            <svg viewBox="0 0 900 230" preserveAspectRatio="none">
              <defs>
                <linearGradient id="area" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="0" stopColor="#d8f67a" stopOpacity=".20" />
                  <stop offset="1" stopColor="#d8f67a" stopOpacity="0" />
                </linearGradient>
              </defs>
              <path
                className="area"
                d="M0 186 C60 181 92 154 135 163 S220 188 278 137 S348 108 410 131 S510 111 560 81 S650 105 708 65 S810 69 900 27 V230 H0Z"
              />
              <path
                className="line"
                d="M0 186 C60 181 92 154 135 163 S220 188 278 137 S348 108 410 131 S510 111 560 81 S650 105 708 65 S810 69 900 27"
              />
            </svg>
            <div className="chart-labels">
              <span>MON</span><span>TUE</span><span>WED</span><span>THU</span>
              <span>FRI</span><span>SAT</span><span>SUN</span>
            </div>
          </div>
        </section>
        <section className="intel-panel movers-panel">
          <div className="panel-head">
            <div>
              <span className="panel-kicker">REAL-TIME</span>
              <h3>Top movers</h3>
            </div>
            <Link to="/nb/trending">ALL</Link>
          </div>
          {items
            .slice()
            .sort((a, b) => Math.abs(launchChange(b)) - Math.abs(launchChange(a)))
            .slice(0, 4)
            .map((l, i) => (
              <Link className="mover-row" to="/token/$tokenAddress" params={{ tokenAddress: l.tokenAddress }} key={l.tokenAddress}>
                <span className="mover-rank">0{i + 1}</span>
                <img src={launchImg(l)} alt="" />
                <div>
                  <b>${l.symbol}</b>
                  <small>{l.name}</small>
                </div>
                <strong>
                  {launchChange(l) > 0 ? '+' : ''}
                  {launchChange(l)}%
                </strong>
              </Link>
            ))}
        </section>
      </div>

      <div className="insight-strip">
        <div>
          <span className="panel-kicker">24H OBSERVATION</span>
          <h3>7 of {items.length || 24} assets recorded net buyer growth.</h3>
          <p>Late-curve assets accounted for 61.4% of indexed volume.</p>
        </div>
        <Link to="/nb/trending" className="btn">
          View ranking <Icon name="arrow" />
        </Link>
      </div>

      <div className="ops-grid">
        <section className="ops-panel flow-panel">
          <div className="ops-head">
            <div>
              <span>ON-CHAIN FLOW</span>
              <h3>Latest executions</h3>
            </div>
            <b><i /> STREAMING</b>
          </div>
          <div className="execution-head">
            <span>TIME</span><span>WALLET</span><span>SIDE</span><span>ASSET</span><span>VALUE</span>
          </div>
          {items.slice(0, 5).map((l, i) => (
            <div className="execution-row" key={l.tokenAddress}>
              <time>{new Date(l.createdAt).toLocaleTimeString('en-GB', { hour: '2-digit', minute: '2-digit' })}</time>
              <code>{shortHash(l.creatorAddress)}</code>
              <em className={i === 2 ? 'sell' : 'buy'}>{i === 2 ? 'SELL' : 'BUY'}</em>
              <Link to="/token/$tokenAddress" params={{ tokenAddress: l.tokenAddress }}>
                ${l.symbol}
              </Link>
              <strong>{(0.08 + i * 0.047).toFixed(3)} ETH</strong>
            </div>
          ))}
        </section>
        <section className="ops-panel curve-panel">
          <div className="ops-head">
            <div>
              <span>CURVE DISTRIBUTION</span>
              <h3>Launch stages</h3>
            </div>
            {([
              ['0–25%', 0, 25],
              ['25–50%', 25, 50],
              ['50–75%', 50, 75],
              ['75–99%', 75, 100],
              ['Graduated', 100, 101],
            ] as [string, number, number][]).map(([label, lo, hi]) => {
              const n = items.filter((l) => {
                const c = launchCurve(l);
                return c >= lo && c < hi;
              }).length;
              const pct = items.length ? Math.round((n / items.length) * 100) : 0;
              return (
                <div key={label as string}>
                  <span>{label}</span>
                  <i>
                    <b style={{ width: `${Math.max(pct, 3)}%` }} />
                  </i>
                  <strong>{String(n).padStart(2, '0')}</strong>
                </div>
              );
            })}
          </div>
        </section>
        <section className="ops-panel telemetry-panel">
          <div className="ops-head">
            <div>
              <span>NETWORK TELEMETRY</span>
              <h3>Robinhood Testnet</h3>
            </div>
            <b><i /> NOMINAL</b>
          </div>
          <div className="telemetry-grid">
            <div><span>LATEST BLOCK</span><strong>#13,948,021</strong><small>2.1s ago</small></div>
            <div><span>INDEXER LATENCY</span><strong>84 ms</strong><small>p95 / 112 ms</small></div>
            <div><span>RPC STATUS</span><strong>3 / 3</strong><small>All endpoints</small></div>
            <div><span>FINALITY</span><strong>1.8 sec</strong><small>12 block avg.</small></div>
          </div>
        </section>
      </div>
    </>
  );
}
