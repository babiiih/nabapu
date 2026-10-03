/**
 * Nabapu Market Terminal shell — port dari template nabapu-ui.
 * Sidebar (fixed, dark), topbar (search trigger + connect), market tape (live ticker).
 * Semua class CSS dari template, di-scope .nb-app.
 */
import { useEffect, useState } from 'react';
import { Link, useRouterState } from '@tanstack/react-router';
import { useAccount, useDisconnect } from 'wagmi';
import { Icon, SPRITE } from './sprite';
import { shortAddr } from '@/lib/format';

const NAV = [
  {
    group: 'TERMINAL',
    items: [
      { route: 'dashboard', icon: 'grid', label: 'Overview', url: '/nb/dashboard' },
      { route: 'market', icon: 'market', label: 'Market', url: '/nb/market', badge: '24' },
      { route: 'trending', icon: 'flame', label: 'Trending', url: '/nb/trending' },
      { route: 'trenches', icon: 'radar', label: 'Trenches', url: '/nb/trenches', live: true },
    ],
  },
  {
    group: 'PORTFOLIO',
    items: [
      { route: 'wallet', icon: 'wallet', label: 'Wallet', url: '/nb/wallet' },
      { route: 'nft', icon: 'image', label: 'NFT Collection', url: '/nb/nft' },
      { route: 'profile', icon: 'user', label: 'Profile', url: '/nb/profile' },
    ],
  },
];

const TAPE = [
  ['NABAPU INDEX', '161.25', '+8.24%'],
  ['24H VOLUME', '10.2116 ETH', ''],
  ['ETH / USD', '$161.25', '+2.41%'],
  ['ACTIVE HOLDERS', '14,636', ''],
  ['GRADUATED', '01', ''],
  ['AVG. CURVE', '38.4%', ''],
  ['NETWORK', 'RH TESTNET', ''],
];

export function NabapuShell({ children }: { children: React.ReactNode }) {
  const [open, setOpen] = useState(false);
  const { address, isConnected } = useAccount();
  const { disconnect } = useDisconnect();
  const pathname = useRouterState({ select: (s) => s.location.pathname });
  const activeRoute = (pathname.match(/nb\/([a-z]+)/)?.[1]) || 'dashboard';

  // live clock (Asia/Jakarta)
  const [clock, setClock] = useState('');
  useEffect(() => {
    const tick = () =>
      setClock(
        new Date().toLocaleTimeString('en-GB', {
          timeZone: 'Asia/Jakarta',
          hour12: false,
        })
      );
    tick();
    const t = setInterval(tick, 1000);
    return () => clearInterval(t);
  }, []);

  return (
    <div className="nb-app">
      {SPRITE}
      <div className="shell">
        <aside className={`sidebar ${open ? 'open' : ''}`}>
          <div className="brand">
            <span className="brand-mark">N</span>
            <div>
              <strong>
                NABAPU<span className="brand-period">.</span>
              </strong>
              <small>PRIVATE MARKETS</small>
            </div>
          </div>
          <nav>
            {NAV.map((g) => (
              <div key={g.group}>
                <p className="nav-label">{g.group}</p>
                {g.items.map((it) => (
                  <Link
                    key={it.route}
                    to={it.url}
                    className={activeRoute === it.route ? 'active' : ''}
                    onClick={() => setOpen(false)}
                  >
                    <Icon name={it.icon} />
                    <span>{it.label}</span>
                    {it.badge ? <b>{it.badge}</b> : null}
                    {it.live ? <i /> : null}
                  </Link>
                ))}
              </div>
            ))}
          </nav>
          <div className="chain-card">
            <div className="chain-head">
              <span className="rh-mark">R</span>
              <span>
                <b>Robinhood Chain</b>
                <small>Testnet</small>
              </span>
              <em />
            </div>
            <div className="chain-row">
              <span>Network status</span>
              <b>Operational</b>
            </div>
            <div className="chain-row">
              <span>Block</span>
              <code>#13,948,021</code>
            </div>
          </div>
          <div className="sidebar-foot">
            <span>v1.4.2</span>
            <a
              href="https://hermes-agent.nousresearch.com/docs"
              target="_blank"
              rel="noreferrer"
            >
              Docs
            </a>
          </div>
        </aside>
        <div
          className={`mobile-overlay ${open ? 'open' : ''}`}
          onClick={() => setOpen(false)}
        />

        <section className="workspace">
          <header className="topbar">
            <button
              className="icon-btn mobile-menu"
              aria-label="Open menu"
              onClick={() => setOpen(!open)}
            >
              <Icon name="menu" />
            </button>
            <button
              className="search-trigger"
              onClick={() => window.dispatchEvent(new CustomEvent('nb:search'))}
            >
              <Icon name="search" />
              <span>Search tokens, addresses…</span>
              <kbd>⌘ K</kbd>
            </button>
            <div className="top-actions">
              <div className="live-pill">
                <i /> Indexer live
              </div>
              <button className="icon-btn" aria-label="Notifications">
                <Icon name="bell" />
                <b className="notif" />
              </button>
              {isConnected && address ? (
                <button
                  className="connect-btn"
                  style={{ background: '#d2a946' }}
                  onClick={() => disconnect()}
                  title="Disconnect wallet"
                >
                  <span className="wallet-dot" />
                  <span className="connect-text">{shortAddr(address)}</span>
                </button>
              ) : (
                <button
                  className="connect-btn"
                  onClick={() =>
                    window.dispatchEvent(new CustomEvent('nb:connect'))
                  }
                >
                  <span className="wallet-dot" />
                  <span className="connect-text">Connect wallet</span>
                </button>
              )}
            </div>
          </header>
          <div className="market-tape" aria-label="Live market tape">
            <div className="tape-label">
              <i /> LIVE
            </div>
            <div className="tape-track">
              <div className="tape-content">
                {TAPE.map(([k, v, ch]) => (
                  <span key={k}>
                    <b>{k}</b> {v} {ch ? <em>{ch}</em> : null}
                  </span>
                ))}
              </div>
            </div>
            <div className="tape-time">{clock}</div>
          </div>
          <main>{children}</main>
        </section>
      </div>
      <NabapuToast />
    </div>
  );
}

/* ---------- toast (port showToast dari app.js) ---------- */
let toastSetter: ((m: string) => void) | null = null;
export function nbToast(msg: string) {
  toastSetter?.(msg);
}
function NabapuToast() {
  const [msg, setMsg] = useState('');
  const [show, setShow] = useState(false);
  useEffect(() => {
    toastSetter = (m: string) => {
      setMsg(m);
      setShow(true);
    };
    return () => {
      toastSetter = null;
    };
  }, []);
  useEffect(() => {
    if (!show) return;
    const t = setTimeout(() => setShow(false), 2500);
    return () => clearTimeout(t);
  }, [show, msg]);
  return <div className={`toast ${show ? 'show' : ''}`}>{msg}</div>;
}
