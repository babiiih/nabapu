/**
 * Trenches (port dari template `trenches()`) — live feed launch baru,
 * side panel aktivitas real dari walletActivity.
 */
import { useEffect, useState } from 'react';
import { listLaunches, walletActivity, type VibesLaunch, type VibesActivity } from '@/lib/vibes';
import { PageHeading, Subnav, FeedCard } from '../ui';
import { fmtEth, shortAddr, timeAgo } from '@/lib/format';

export function NbTrenches() {
  const [items, setItems] = useState<VibesLaunch[]>([]);
  const [act, setAct] = useState<VibesActivity[]>([]);
  const [busy, setBusy] = useState(true);

  useEffect(() => {
    let ok = true;
    (async () => {
      try {
        const [r, a] = await Promise.all([
          listLaunches({ limit: 24 }),
          walletActivity('0x35F76E0d2D955beED6e3752F24b4c2570e481B04', 20)
            .then((x) => x.items)
            .catch(() => []),
        ]);
        if (ok) {
          setItems(r.items);
          setAct(a);
        }
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

  return (
    <>
      <PageHeading
        kicker="LIVE FEED · 20S"
        title="Trenches"
        desc="Fresh bonding-curve launches, straight from the indexer — newest first."
        right={<div className="sync">{items.length} IN FEED</div>}
      />
      <Subnav items={[['Live feed', String(items.length)], ['Just launched', '05'], ['High buyers'], ['Near graduation'], ['Muted', '00']]} />
      <div className="trenches-layout">
        <div className="feed">
          {busy
            ? Array.from({ length: 6 }).map((_, i) => (
                <div className="feed-card skeleton" key={i} style={{ height: 68 }} />
              ))
            : items.slice(0, 12).map((l) => <FeedCard key={l.tokenAddress} l={l} />)}
        </div>
        <aside className="side-panel">
          <h3>Live activity</h3>
          {act.length === 0
            ? Array.from({ length: 6 }).map((_, i) => (
                <div className="activity-row" key={i}>
                  <span className="activity-icon">{i % 2 ? '↗' : '↙'}</span>
                  <div>
                    <b>{i % 2 ? 'Bought' : 'New holder'} $—</b>
                    <span>{(i + 1) * 2}m · 0.00 ETH</span>
                  </div>
                </div>
              ))
            : act.slice(0, 8).map((a) => {
                const t = (a.type || '').toUpperCase();
                const buy = t === 'BUY' || (a.side || '').toUpperCase() === 'BUY';
                return (
                  <div className="activity-row" key={a.id}>
                    <span className="activity-icon">{buy ? '↗' : '↙'}</span>
                    <div>
                      <b>
                        {buy ? 'Bought' : 'Sold'} {shortAddr(a.tokenAddress)}
                      </b>
                      <span>
                        {timeAgo(a.occurredAt)} ago ·{' '}
                        {(() => {
                          const eth = a.amountInBaseUnits;
                          try {
                            return fmtEth(BigInt(eth ?? 0) / 10n ** 18n);
                          } catch {
                            return '0.00';
                          }
                        })()}{' '}
                        ETH
                      </span>
                    </div>
                  </div>
                );
              })}
          <button className="btn w-full">Open live stream</button>
        </aside>
      </div>
    </>
  );
}
