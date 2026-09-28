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
    return (
      <div
        className={`flex items-center justify-center bg-secondary text-lg font-bold text-secondary-foreground ${className ?? ""}`}
        aria-label={alt}
        data-fallback="1"
      >
        {alt.slice(0, 2).toUpperCase()}
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
