"use client";

import { useEffect, useMemo, useState } from "react";
import { resolveProductImageBase } from "@/lib/productImageBaseClient";
import {
  firebaseProductImageCandidateUrls,
  productImageBaseUrl,
} from "@/lib/productImageUrl";

type Props = {
  sku: string;
  fallback: string;
  className?: string;
  alt?: string;
};

/** Convención Storage: `productos/{SKU}.webp`. Prueba .webp / .jpg / .png y cae al placeholder si falla. */
export function ProductThumb({
  sku,
  fallback,
  className,
  alt = "",
}: Props) {
  const staticBase = productImageBaseUrl();
  const [base, setBase] = useState(staticBase);

  useEffect(() => {
    const s = productImageBaseUrl();
    if (s) {
      setBase(s);
      return;
    }
    let cancelled = false;
    void resolveProductImageBase("").then((b) => {
      if (!cancelled && b) setBase(b);
    });
    return () => {
      cancelled = true;
    };
  }, [staticBase]);

  const candidates = useMemo(() => {
    if (!base) return [fallback];
    const urls = firebaseProductImageCandidateUrls(sku, base);
    return [...urls, fallback];
  }, [sku, base, fallback]);

  const [idx, setIdx] = useState(0);
  useEffect(() => {
    setIdx(0);
  }, [sku, base, fallback]);

  const safeIdx = Math.min(idx, Math.max(0, candidates.length - 1));
  const src = candidates[safeIdx] ?? fallback;

  return (
    <img
      key={`${sku}:${idx}:${candidates[0] ?? ""}`}
      alt={alt}
      className={className}
      src={src}
      onError={() => {
        setIdx((i) => (i + 1 < candidates.length ? i + 1 : i));
      }}
    />
  );
}
