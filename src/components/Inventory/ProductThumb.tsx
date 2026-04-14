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

function rankCandidate(url: string): number {
  let score = 0;
  // Prioriza la convención real del proyecto: SKU_1.webp
  if (/_1\.webp(?:\?|$)/i.test(url)) score += 100;
  if (/\.webp(?:\?|$)/i.test(url)) score += 40;
  // Prefiere rutas en carpeta (`/productos/` o `/products/`) sobre raíz plana.
  if (/%2F/i.test(url) || /\/(productos|products)\//i.test(url)) score += 15;
  if (/flatroot/i.test(url)) score -= 10;
  return score;
}

/** Resuelve en background la primera URL válida; evita parpadeo y bucles de error. */
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
    const ranked = [...urls].sort((a, b) => rankCandidate(b) - rankCandidate(a));
    return [...ranked, fallback];
  }, [sku, base, fallback]);

  const [src, setSrc] = useState(fallback);
  useEffect(() => {
    let cancelled = false;

    const probe = (url: string) =>
      new Promise<boolean>((resolve) => {
        const img = new window.Image();
        img.onload = () => resolve(true);
        img.onerror = () => resolve(false);
        img.src = url;
      });

    void (async () => {
      // Resolver en lotes paralelos para evitar esperar 1x1 decenas de 404.
      const BATCH_SIZE = 8;
      for (let i = 0; i < candidates.length; i += BATCH_SIZE) {
        const batch = candidates.slice(i, i + BATCH_SIZE);
        const results = await Promise.all(batch.map((u) => probe(u)));
        const okIdx = results.findIndex(Boolean);
        if (okIdx >= 0) {
          if (!cancelled) setSrc(batch[okIdx]);
          return;
        }
      }
      if (!cancelled) setSrc(fallback);
    })();

    return () => {
      cancelled = true;
    };
  }, [candidates, fallback]);

  return (
    <img
      alt={alt}
      className={className}
      src={src}
      onError={() => {
        setSrc((prev) => (prev === fallback ? prev : fallback));
      }}
    />
  );
}
