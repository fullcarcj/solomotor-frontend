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
    return [...urls, fallback];
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
      for (const url of candidates) {
        const ok = await probe(url);
        if (!cancelled && ok) {
          setSrc(url);
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
