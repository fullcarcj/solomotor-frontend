"use client";

import { useEffect, useMemo, useState } from "react";
import {
  firebaseProductImageCandidateUrlsForRow,
  productImageBaseUrl,
} from "@/lib/productImageUrl";

type Props = {
  sku: string;
  /** Nombre del producto en catálogo: si parece basename de Storage (p. ej. `481H…_F0001_CY`), se prueba además del SKU. */
  productName?: string | null;
  fallback: string;
  className?: string;
  alt?: string;
};

/** Prueba Firebase (raíz del bucket + carpeta; .webp primero) y cae al placeholder si falla. */
export function ProductThumb({
  sku,
  productName,
  fallback,
  className,
  alt = "",
}: Props) {
  const base = productImageBaseUrl();
  const candidates = useMemo(() => {
    const urls = firebaseProductImageCandidateUrlsForRow(sku, productName, base);
    return [...urls, fallback];
  }, [sku, productName, base, fallback]);

  const [idx, setIdx] = useState(0);
  useEffect(() => {
    setIdx(0);
  }, [sku, productName, base, fallback]);

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
