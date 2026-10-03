/**
 * Helper data untuk halaman nabapu-ui — mapping VibesLaunch ke bentuk
 * yang dipakai class CSS template (card, screener row, feed card).
 */
import { formatEther } from 'viem';
import type { VibesLaunch } from '@/lib/vibes';

export const NB_ASSET = (i: number) => `/images/nabapu-ui/asset_${i % 12}.jpg`;

/** gambar launch: IPFS kalau ada, fallback ke asset template */
export function launchImg(l: VibesLaunch): string {
  const uri = l.content?.image?.uri;
  if (uri) {
    const u = uri.startsWith('http') ? uri : `https://ipfs.io/ipfs/${uri.replace('ipfs://', '')}`;
    return u;
  }
  return NB_ASSET(hashToIdx(l.tokenAddress));
}

function hashToIdx(s: string): number {
  let h = 0;
  for (let i = 0; i < s.length; i++) h = (h * 31 + s.charCodeAt(i)) | 0;
  return Math.abs(h);
}

export function shortHash(addr: string): string {
  return `${addr.slice(0, 6)}…${addr.slice(-4)}`;
}

export function launchPrice(l: VibesLaunch): string {
  try {
    const wei = BigInt(l.analytics?.lastPriceWeiPerToken ?? 0);
    if (wei === 0n) return '0.00000000000';
    const s = formatEther(wei);
    // ~11 digit seperti template
    return s.length > 12 ? s.slice(0, 12) : s;
  } catch {
    return '0.00000000000';
  }
}

export function launchVol(l: VibesLaunch): string {
  try {
    const wei = BigInt(l.analytics?.volume24hWei ?? 0);
    const s = formatEther(wei);
    return s.length > 6 ? s.slice(0, 6) : s;
  } catch {
    return '0.0000';
  }
}

export function launchChange(l: VibesLaunch): number {
  try {
    const bps = Number(l.analytics?.priceChange24hBps ?? 0);
    return bps / 100;
  } catch {
    return 0;
  }
}

export function launchCurve(l: VibesLaunch): number {
  try {
    return Number(l.curve?.progressBps ?? 0) / 100;
  } catch {
    return 0;
  }
}

export function launchHolders(l: VibesLaunch): string {
  const n = l.holderCount ?? 0;
  return n.toLocaleString('en-US');
}

export function launchAge(l: VibesLaunch): string {
  try {
    const ms = Date.now() - new Date(l.createdAt).getTime();
    const m = Math.floor(ms / 60000);
    if (m < 60) return `${m}m`;
    const h = Math.floor(m / 60);
    if (h < 24) return `${h}h`;
    return `${Math.floor(h / 24)}d`;
  } catch {
    return '3d';
  }
}
