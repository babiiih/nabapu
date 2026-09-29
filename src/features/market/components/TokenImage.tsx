import { useState } from "react";
import { ipfsUrl } from "@/lib/vibes";

interface Props {
  uri?: string | null;
  alt: string;
  className?: string;
}

/**
 * Token artwork. Falls back to a generated monogram when the launch has no
 * IPFS image (some launches skip it).
 */
export default function TokenImage({ uri, alt, className }: Props) {
  const src = ipfsUrl(uri);
  const [fallback, setFallback] = useState(false);

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
      onError={() => setFallback(true)}
    />
  );
}
