"use client";

import { useEffect, useMemo, useState } from "react";
import {
  firebaseProductImageUrl,
  productImageBaseUrl,
} from "@/lib/productImageUrl";

type Props = {
  sku: string;
  fallback: string;
  className?: string;
  alt?: string;
};

/** Prueba Firebase (.jpg → .png → .webp) y cae al placeholder local si la URL falla o no hay base. */
export function ProductThumb({ sku, fallback, className, alt = "" }: Props) {
  const base = productImageBaseUrl();
  const candidates = useMemo(() => {
    const list: string[] = [];
    const b = base.trim();
    if (b) {
      for (const ext of ["jpg", "png", "webp"] as const) {
        const u = firebaseProductImageUrl(sku, b, ext);
        if (u && !list.includes(u)) list.push(u);
      }
    }
    list.push(fallback);
    return list;
  }, [sku, base, fallback]);

  const [idx, setIdx] = useState(0);
  useEffect(() => {
    setIdx(0);
  }, [sku, base, fallback]);

  const safeIdx = Math.min(idx, Math.max(0, candidates.length - 1));
  const src = candidates[safeIdx] ?? fallback;

  return (
    <img
      alt={alt}
      className={className}
      src={src}
      onError={() => {
        setIdx((i) => (i + 1 < candidates.length ? i + 1 : i));
      }}
    />
  );
}
