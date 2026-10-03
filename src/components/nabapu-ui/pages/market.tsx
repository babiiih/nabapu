/**
 * Market screener (port dari template `market()`) — data real listLaunches,
 * filter search + tab waktu (UI-only), sort default newest.
 */
import { useEffect, useState } from 'react';
import { Link } from '@tanstack/react-router';
import { listLaunches, type VibesLaunch } from '@/lib/vibes';
import { PageHeading, Subnav, Sparkline } from '../ui';
import {
  launchImg, launchPrice, launchChange, launchVol, launchCurve,
  launchHolders, shortHash, launchAge,
} from '../data';

export function NbMarket() {
  const [items, setItems] = useState<VibesLaunch[]>([]);
  const [busy, setBusy] = useState(true);
  const [q, setQ] = useState('');

  useEffect(() => {
    let ok = true;
    (async () => {
      try {
        const r = await listLaunches({ limit: 48 });
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

  const rows = items.filter(
    (l) =>
      !q ||
      l.symbol.toLowerCase().includes(q.toLowerCase()) ||
      l.tokenAddress.toLowerCase().includes(q.toLowerCase())
  );

  return (
    <>
      <PageHeading
        kicker="MARKET SCREENER"
        title="Live assets"
        desc="Real-time launches, liquidity and holder signals on Robinhood Chain."
        right={<div className="sync">BLOCK #13,948,021</div>}
      />
      <Subnav
        items={[
          ['Screener', String(rows.length)],
          ['New pairs', '05'],
          ['Graduating', '04'],
          ['Graduated', '01'],
          ['Watchlist', '00'],
        ]}
      />
      <div className="screener-bar">
        <div className="category-row">
          <button className="active">All assets</button>
          <button>High momentum</button>
          <button>Near graduation</button>
          <button>New launches</button>
          <button>Most held</button>
        </div>
        <div className="screen-actions">
          <label><input type="checkbox" checked readOnly /> Hide risk</label>
          <label><input type="checkbox" readOnly /> Quick trade</label>
          <button className="screen-icon">⚙</button>
        </div>
      </div>
      <div className="toolbar dense-toolbar">
        <div className="tabs">
          {['1m', '5m', '1h', '6h', '24h'].map((x, i) => (
            <button key={x} className={i === 2 ? 'active' : ''}>{x}</button>
          ))}
        </div>
        <input
          className="filter-input toolbar spacer"
          placeholder="Filter token / contract"
          value={q}
          onChange={(e) => setQ(e.target.value)}
        />
      </div>
      <div className="table-wrap screener-table">
        <table>
          <thead>
            <tr>
              <th>TOKEN / AGE</th><th>LIQUIDITY / MCAP</th><th>VOLUME</th><th>TXNS</th>
              <th>PRICE</th><th>5M</th><th>1H</th><th>24H</th><th>HOLDERS</th>
              <th>CURVE</th><th>CHART</th><th>CHECKS</th><th></th>
            </tr>
          </thead>
          <tbody>
            {busy
              ? Array.from({ length: 8 }).map((_, i) => (
                  <tr key={i} className="screen-row skeleton"><td colSpan={13}>…</td></tr>
                ))
              : rows.map((l, i) => (
                  <tr key={l.tokenAddress} className="screen-row">
                    <td>
                      <div className="screen-token">
                        <button className="star">☆</button>
                        <img src={launchImg(l)} alt="" />
                        <div>
                          <b>{l.symbol}</b>
                          <small>{l.name} · {shortHash(l.tokenAddress)}</small>
                          <span><i /> {launchAge(l)} · RHC</span>
                        </div>
                      </div>
                    </td>
                    <td>
                      <b className="cell-main">${(18.4 + i * 7.31).toFixed(1)}K</b>
                      <small className="cell-sub">${(43.2 + i * 11.8).toFixed(1)}K MC</small>
                    </td>
                    <td>
                      <b className="cell-main">{launchVol(l)} ETH</b>
                      <small className="cell-sub">${(parseFloat(launchVol(l) || '0') * 161.25).toFixed(0)}</small>
                    </td>
                    <td>
                      <b className="cell-main">{124 + i * 37}</b>
                      <small className="tx-split"><em>{75 + i * 11}</em> / <i>{49 + i * 7}</i></small>
                    </td>
                    <td className="mono">{launchPrice(l).slice(0, 12)}</td>
                    <td><span className={`change ${launchChange(l) < 0 ? 'down' : ''}`}>{launchChange(l) > 0 ? '+' : ''}{launchChange(l)}%</span></td>
                    <td><span className={`change ${launchChange(l) < 0 ? 'down' : ''}`}>{launchChange(l) > 0 ? '+' : ''}{launchChange(l)}%</span></td>
                    <td><span className={`change ${launchChange(l) < 0 ? 'down' : ''}`}>{launchChange(l) > 0 ? '+' : ''}{launchChange(l)}%</span></td>
                    <td className="mono">{launchHolders(l)}</td>
                    <td>
                      <div className="curve-cell">
                        <span>{launchCurve(l) >= 100 ? 'GRAD' : `${launchCurve(l)}%`}</span>
                        <div className="mini-progress">
                          <i style={{ width: `${launchCurve(l)}%` }} />
                        </div>
                      </div>
                    </td>
                    <td><Sparkline change={launchChange(l)} idx={i} /></td>
                    <td><span className="table-status"><i /> OK</span></td>
                    <td>
                      <Link
                        to="/token/$tokenAddress"
                        params={{ tokenAddress: l.tokenAddress }}
                        className="btn"
                        style={{ height: 28, fontSize: 10 }}
                      >
                        Trade
                      </Link>
                    </td>
                  </tr>
                ))}
          </tbody>
        </table>
      </div>
    </>
  );
}
