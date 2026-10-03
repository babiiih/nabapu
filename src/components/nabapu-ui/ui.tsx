/**
 * Komponen UI bersama untuk halaman nabapu-ui — port dari app.js template.
 */
import { type ReactNode } from 'react';
import type { VibesLaunch } from '@/lib/vibes';
import {
  launchImg, launchPrice, launchChange, launchCurve,
  launchHolders, launchVol, shortHash, launchAge,
} from './data';

export function PageHeading({
  kicker, title, desc, right,
}: { kicker: string; title: string; desc: string; right?: ReactNode }) {
  return (
    <div className="page-heading">
      <div>
        <div className="eyebrow">{kicker}</div>
        <h1>{title}</h1>
        <p>{desc}</p>
      </div>
      {right}
    </div>
  );
}

export function Subnav({ items, active = 0 }: { items: [string, string?][]; active?: number }) {
  return (
    <div className="page-subnav">
      {items.map((x, i) => (
        <button key={x[0]} className={i === active ? 'active' : ''} data-subview={x[0]}>
          <span>{x[0]}</span>
          {x[1] ? <b>{x[1]}</b> : null}
        </button>
      ))}
      <div className="subnav-tools">
        <button title="Layout">▦</button>
        <button title="More options">•••</button>
      </div>
    </div>
  );
}

const SPARK_PATHS = [
  'M1 23 C8 22 10 14 17 16 S28 24 35 13 S47 17 55 8 S66 11 75 4',
  'M1 8 C10 10 14 5 22 12 S34 9 41 18 S54 14 61 21 S69 17 75 23',
  'M1 21 C8 15 14 19 21 11 S34 16 42 8 S55 12 62 5 S70 8 75 3',
  'M1 13 C9 7 17 17 25 10 S38 20 47 12 S58 5 66 11 S72 8 75 6',
];

export function Sparkline({ change, idx = 0 }: { change: number; idx?: number }) {
  return (
    <svg
      className={`mini-chart ${change < 0 ? 'negative' : ''}`}
      viewBox="0 0 76 27"
      preserveAspectRatio="none"
    >
      <path className="spark-grid" d="M1 25H75 M1 13H75" />
      <path className="spark-trace" d={SPARK_PATHS[idx % SPARK_PATHS.length]} pathLength={100} />
      <circle cx="75" cy={change < 0 ? 23 : idx % 2 ? 6 : 3} r="1.8" />
    </svg>
  );
}

export function TokenCard({
  l, market = false,
}: { l: VibesLaunch; market?: boolean }) {
  const change = launchChange(l);
  const img = launchImg(l);
  return (
    <article className={`token-card ${market ? 'market-card' : ''}`} data-token={l.symbol}>
      {market ? <img className="cover" src={img} alt="" /> : null}
      <div className={market ? 'mc-body' : ''}>
        <div className="token-top">
          <img className="token-img" src={img} alt={l.name} />
          <div className="token-name">
            <b>${l.symbol}</b>
            <span>{l.name}</span>
          </div>
          <div className="token-price">
            {!market ? <b>{launchPrice(l).slice(0, 11)} ETH</b> : null}
            <span className={`change ${change < 0 ? 'down' : ''}`}>
              {change > 0 ? '+' : ''}
              {change}%
            </span>
          </div>
        </div>
        {market ? (
          <div className="price-line">
            <strong>{launchPrice(l).slice(0, 12)} ETH</strong>
            <span className={`change ${change < 0 ? 'down' : ''}`}>
              {change > 0 ? '+' : ''}
              {change}%
            </span>
          </div>
        ) : null}
        <div className="token-meta">
          <span>{launchCurve(l) >= 100 ? 'Graduated' : `Curve ${launchCurve(l)}%`}</span>
          <span>{launchHolders(l)} holders</span>
        </div>
        <div className="progress">
          <i style={{ width: `${launchCurve(l)}%` }} />
        </div>
        <div className="token-foot">
          <span>{launchVol(l)} ETH VOL</span>
          <span>{shortHash(l.tokenAddress)}</span>
        </div>
      </div>
    </article>
  );
}

export function FeedCard({ l }: { l: VibesLaunch }) {
  const change = launchChange(l);
  const isNew = (() => {
    try {
      return Date.now() - new Date(l.createdAt).getTime() < 20 * 60000;
    } catch {
      return false;
    }
  })();
  return (
    <div className="feed-card" data-token={l.symbol}>
      <img src={launchImg(l)} alt="" />
      <div className="feed-main">
        <b>${l.symbol} · {l.name}</b>
        {isNew ? <span className="new-badge">NEW</span> : null}
        <p>
          {shortHash(l.tokenAddress)} · {launchAge(l)} ago · curve {launchCurve(l)}%
        </p>
      </div>
      <div className="feed-price">
        <b>{launchPrice(l).slice(0, 12)} ETH</b>
        <span className={change < 0 ? 'down' : ''}>
          {change > 0 ? '+' : ''}
          {change}%
        </span>
      </div>
    </div>
  );
}
