"use client";

import { useEffect, useState } from "react";
import {
  firebaseProductImageCandidateUrls,
  productImageBaseUrl,
} from "@/lib/productImageUrl";
import { resolveProductImageBase } from "@/lib/productImageBaseClient";

interface Props {
  sku: string;
  name: string;
  size?: number;
  className?: string;
  /** Índice 0-5 para color del placeholder */
  colorIndex?: number;
}

const PLACEHOLDER_COLORS = [
  "#e8edf2",
  "#ede8f2",
  "#e8f2f0",
  "#f2ede8",
  "#e8f2e8",
  "#eae8f2",
];

export default function ProductThumb({
  sku,
  name,
  size = 54,
  className = "",
  colorIndex = 0,
}: Props) {
  const [src, setSrc] = useState<string | null>(null);
  const [candidates, setCandidates] = useState<string[]>([]);
  const [failed, setFailed] = useState(false);

  useEffect(() => {
    const staticBase = productImageBaseUrl();
    resolveProductImageBase(staticBase).then((base) => {
      if (!base) return;
      const urls = firebaseProductImageCandidateUrls(sku, base);
      setCandidates(urls);
      if (urls.length > 0) setSrc(urls[0]);
    });
  }, [sku]);

  const tryNext = () => {
    if (!src) return;
    const idx = candidates.indexOf(src);
    const next = candidates[idx + 1];
    if (next) {
      setSrc(next);
    } else {
      setFailed(true);
    }
  };

  const bg = PLACEHOLDER_COLORS[colorIndex % PLACEHOLDER_COLORS.length];

  if (failed || !src) {
    return (
      <div
        className={`prod-thumb-ph ${className}`}
        style={{
          width: size,
          height: size,
          background: bg,
          borderRadius: 8,
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          flexShrink: 0,
          fontSize: size * 0.38,
          color: "#adb5bd",
        }}
        aria-label={name}
      >
        <i className="ti ti-package" />
      </div>
    );
  }

  return (
    // eslint-disable-next-line @next/next/no-img-element
    <img
      src={src}
      alt={name}
      width={size}
      height={size}
      className={className}
      style={{ width: size, height: size, objectFit: "contain", borderRadius: 8, flexShrink: 0 }}
      onError={tryNext}
    />
  );
}
