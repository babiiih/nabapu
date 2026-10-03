/**
 * SVG sprite untuk icon-icon nabapu-ui (dari template index.html).
 * Dipakai via <Icon name="grid" /> → <svg><use href="#i-grid" /></svg>
 */
import { type SVGProps } from 'react';

export const SPRITE = (
  <svg className="svg-sprite" aria-hidden="true" style={{ position: 'absolute', width: 0, height: 0 }}>
    <symbol id="i-grid" viewBox="0 0 24 24"><rect x="3" y="3" width="7" height="7" rx="2" /><rect x="14" y="3" width="7" height="7" rx="2" /><rect x="3" y="14" width="7" height="7" rx="2" /><rect x="14" y="14" width="7" height="7" rx="2" /></symbol>
    <symbol id="i-market" viewBox="0 0 24 24"><path d="M4 19V10M10 19V5M16 19v-7M22 19H2" /><path d="m3 7 6-4 6 5 6-5" /></symbol>
    <symbol id="i-flame" viewBox="0 0 24 24"><path d="M12 22c4.4 0 8-3.3 8-7.6 0-3.4-2.2-6.8-5.6-9.8.1 2.9-1.6 4.4-3 5.2.2-3.4-1.7-5.8-3-7.8-.3 4-4.4 6.6-4.4 12.4C4 18.7 7.6 22 12 22Z" /><path d="M9.5 17.2c0-1.8 1.2-3 2.5-4.5 1.3 1.5 2.5 2.7 2.5 4.5a2.5 2.5 0 0 1-5 0Z" /></symbol>
    <symbol id="i-radar" viewBox="0 0 24 24"><circle cx="12" cy="12" r="9" /><circle cx="12" cy="12" r="5" /><path d="M12 12 18.5 5.5" /><circle cx="12" cy="12" r="1" /></symbol>
    <symbol id="i-wallet" viewBox="0 0 24 24"><path d="M3 7a3 3 0 0 1 3-3h13v16H6a3 3 0 0 1-3-3V7Z" /><path d="M3 8h16M15 12h6v5h-6a2.5 2.5 0 0 1 0-5Z" /></symbol>
    <symbol id="i-image" viewBox="0 0 24 24"><rect x="3" y="3" width="18" height="18" rx="4" /><circle cx="9" cy="9" r="2" /><path d="m4 17 5-5 4 4 2-2 5 5" /></symbol>
    <symbol id="i-user" viewBox="0 0 24 24"><circle cx="12" cy="8" r="4" /><path d="M4 21a8 8 0 0 1 16 0" /></symbol>
    <symbol id="i-search" viewBox="0 0 24 24"><circle cx="11" cy="11" r="7" /><path d="m20 20-4-4" /></symbol>
    <symbol id="i-bell" viewBox="0 0 24 24"><path d="M18 9a6 6 0 0 0-12 0c0 7-3 7-3 9h18c0-2-3-2-3-9ZM10 21h4" /></symbol>
    <symbol id="i-arrow" viewBox="0 0 24 24"><path d="M5 12h14m-5-5 5 5-5 5" /></symbol>
    <symbol id="i-refresh" viewBox="0 0 24 24"><path d="M20 7v5h-5M4 17v-5h5" /><path d="M18 9a7 7 0 0 0-12-2L4 12m16 0-2 5a7 7 0 0 1-12 0" /></symbol>
    <symbol id="i-external" viewBox="0 0 24 24"><path d="M14 4h6v6M20 4l-9 9" /><path d="M18 13v6H5V6h6" /></symbol>
    <symbol id="i-menu" viewBox="0 0 24 24"><path d="M4 7h16M4 12h16M4 17h16" /></symbol>
    <symbol id="i-close" viewBox="0 0 24 24"><path d="m6 6 12 12M18 6 6 18" /></symbol>
    <symbol id="i-copy" viewBox="0 0 24 24"><rect x="8" y="8" width="11" height="11" rx="2" /><path d="M16 8V5H5v11h3" /></symbol>
    <symbol id="i-up" viewBox="0 0 24 24"><path d="m6 15 6-6 6 6" /></symbol>
  </svg>
);

export function Icon({ name, ...props }: { name: string } & SVGProps<SVGSVGElement>) {
  return (
    <svg {...props}>
      <use href={`#i-${name}`} />
    </svg>
  );
}
