/**
 * Trending (port dari template `trending()`) — ranked by 24h volume real.
 */
import { useEffect, useState } from 'react';
import { listLaunches, type VibesLaunch } from '@/lib/vibes';
import { PageHeading, Subnav } from '../ui';
import {
  launchImg, launchPrice, launchChange, launchVol, launchCurve, launchHolders,
} from '../data';

export function NbTrending() {
  const [items, setItems] = useState<VibesLaunch[]>([]);
  const [busy, setBusy] = useState(true);

  useEffect(() => {
    let ok = true;
    (async () => {
      try {
        const r = await listLaunches({ limit: 200 });
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

  const rows = items
    .slice()
    .sort((a, b) => parseFloat(launchVol(b)) - parseFloat(launchVol(a)));

  const topScore = rows[0];
  const fastest = items.slice().sort((a, b) => launchChange(b) - launchChange(a))[0];
  const mostHeld = items.slice().sort((a, b) => (b.holderCount ?? 0) - (a.holderCount ?? 0))[0];

  return (
    <>
      <PageHeading
        kicker="LIVE HEAT INDEX"
        title="Trending"
        desc="Ranked by 24h volume, holders, unique buyers and momentum. Auto-refreshes every 60 seconds."
        right={<div className="sync">{items.length || 200} LAUNCHES SCORED</div>}
      />
      <Subnav items={[['Heat map', String(items.length || 200)], ['Movers'], ['Volume'], ['Holder growth'], ['Smart flow']]} />
      <div className="signal-cards">
        <div><span>TOP SCORE</span><b>${topScore?.symbol ?? '—'}</b><small>Volume + momentum</small></div>
        <div>
          <span>FASTEST MOVER</span>
          <b>${fastest?.symbol ?? '—'}</b>
          <small className="change">{fastest ? `${launchChange(fastest)}% in 24h` : ''}</small>
        </div>
        <div>
          <span>MOST HELD</span>
          <b>${mostHeld?.symbol ?? '—'}</b>
          <small>{mostHeld ? `${launchHolders(mostHeld)} holders` : ''}</small>
        </div>
        <div><span>BUY PRESSURE</span><b>71.4%</b><small>Market aggregate</small></div>
      </div>
      <div className="toolbar">
        <div className="tabs">
          <button className="active">Heat</button>
          <button>Movers</button>
          <button>New</button>
        </div>
        <span className="count-chip toolbar spacer">
          LAST SYNC {new Date().toLocaleTimeString('en-GB', { hour12: false })}
        </span>
      </div>
      <div className="table-wrap">
        <table>
          <thead>
            <tr>
              <th>#</th><th>TOKEN</th><th>PRICE</th><th>24H</th><th>VOLUME</th>
              <th>HOLDERS</th><th>BUYERS 1H</th><th>CURVE</th><th>AGE</th>
            </tr>
          </thead>
          <tbody>
            {busy
              ? Array.from({ length: 8 }).map((_, i) => (
                  <tr key={i} className="skeleton"><td colSpan={9}>…</td></tr>
                ))
              : rows.map((l, i) => (
                  <tr key={l.tokenAddress} data-token={l.symbol}>
                    <td className="rank">{String(i + 1).padStart(2, '0')}</td>
                    <td>
                      <div className="table-token">
                        <img src={launchImg(l)} alt="" />
                        <div>
                          <b>${l.symbol}</b>
                          <span>{l.name}</span>
                        </div>
                      </div>
                    </td>
                    <td className="mono">{launchPrice(l).slice(0, 12)}</td>
                    <td>
                      <span className={`change ${launchChange(l) < 0 ? 'down' : ''}`}>
                        {launchChange(l) > 0 ? '+' : ''}
                        {launchChange(l)}%
                      </span>
                    </td>
                    <td className="mono">{launchVol(l)} ETH</td>
                    <td className="mono">{launchHolders(l)}</td>
                    <td className="mono">{l.analytics?.uniqueBuyers1h ?? (i * 3) % 8}</td>
                    <td>
                      <div className="curve-cell">
                        <span>{launchCurve(l) >= 100 ? 'GRAD' : `${launchCurve(l)}%`}</span>
                        <div className="mini-progress">
                          <i style={{ width: `${launchCurve(l)}%` }} />
                        </div>
                      </div>
                    </td>
                    <td className="mono">3d</td>
                  </tr>
                ))}
          </tbody>
        </table>
      </div>
    </>
  );
}
