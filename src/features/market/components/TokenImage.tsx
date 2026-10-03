import { useState } from 'react'

interface Props {
  uri?: string | null;
  alt: string;
  className?: string;
}

/**
 * Token artwork — tries multiple IPFS gateways in order, then falls back to
 * a generated monogram. Pinata alone was a single point of failure.
 */
const GATEWAYS = [
  (cid: string) => `https://gateway.pinata.cloud/ipfs/${cid}`,
  (cid: string) => `https://ipfs.io/ipfs/${cid}`,
  (cid: string) => `https://cloudflare-ipfs.com/ipfs/${cid}`,
]

function toCid(uri?: string | null): string | undefined {
  if (!uri) return undefined
  const raw = String(uri).trim()
  if (raw.startsWith('http')) return undefined // direct URL, use as-is
  if (raw.startsWith('ipfs://')) return raw.slice('ipfs://'.length)
  if (/^(bafy|bafk|Qm)/.test(raw)) return raw
  return undefined
}

export default function TokenImage({ uri, alt, className }: Props) {
  const direct = uri && String(uri).trim().startsWith('http') ? String(uri).trim() : undefined
  const cid = toCid(uri)
  const [gw, setGw] = useState(0)
  const [fallback, setFallback] = useState(false)

  const src = direct ?? (cid ? GATEWAYS[Math.min(gw, GATEWAYS.length - 1)](cid) : undefined)

  const onError = () => {
    if (!direct && cid && gw < GATEWAYS.length - 1) setGw((g) => g + 1)
    else setFallback(true)
  }

  if (!src || fallback) {
    // Skill: semantic tokens + gradient monogram instead of flat grey block
    const initials = alt.replace(/[^a-zA-Z0-9]/g, '').slice(0, 2).toUpperCase() || '??';
    return (
      <div
        className={`flex items-center justify-center bg-linear-to-br from-primary/35 via-primary/15 to-transparent text-primary text-lg font-bold ${className ?? ''}`}
        aria-label={alt}
        data-fallback='1'
      >
        {initials}
      </div>
    );
  }

  return (
    <img
      src={src}
      alt={alt}
      className={className}
      loading="lazy"
      onError={onError}
    />
  );
}
