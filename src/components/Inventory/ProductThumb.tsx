"use client";

import type { CSSProperties } from "react";
import { useEffect, useMemo, useRef, useState } from "react";
import { resolveProductImageBase } from "@/lib/productImageBaseClient";
import {
  firebaseProductImageCandidateUrls,
  firebaseProductImageCandidateUrlsForStem,
  normalizeInventoryImageKey,
  productImageBaseUrl,
} from "@/lib/productImageUrl";

type Props = {
  sku: string;
  /** SKU histórico: si las imágenes en Storage usan el nombre anterior, se prueba después del `sku` actual. */
  skuOld?: string | null;
  fallback: string;
  className?: string;
  alt?: string;
};

function rankCandidate(url: string): number {
  let score = 0;
  if (/_1\.webp(?:\?|$)/i.test(url)) score += 100;
  if (/\.webp(?:\?|$)/i.test(url)) score += 40;
  if (/%2F/i.test(url) || /\/(productos|products)\//i.test(url)) score += 15;
  if (/flatroot/i.test(url)) score -= 10;
  return score;
}

/** Resuelve en background la primera URL válida; evita parpadeo y bucles de error. */
export function ProductThumb({
  sku,
  skuOld,
  fallback,
  className,
  alt = "",
}: Props) {
  const staticBase = productImageBaseUrl();
  const [base, setBase] = useState(staticBase);

  useEffect(() => {
    const s = productImageBaseUrl();
    if (s) { setBase(s); return; }
    let cancelled = false;
    void resolveProductImageBase("").then((b) => {
      if (!cancelled && b) setBase(b);
    });
    return () => { cancelled = true; };
  }, [staticBase]);

  const candidates = useMemo(() => {
    if (!base) return [fallback];
    const urls = firebaseProductImageCandidateUrls(sku, base, skuOld);
    const ranked = [...urls].sort((a, b) => rankCandidate(b) - rankCandidate(a));
    return [...ranked, fallback];
  }, [sku, skuOld, base, fallback]);

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
    return () => { cancelled = true; };
  }, [candidates, fallback]);

  return (
    <img
      alt={alt}
      className={className}
      src={src}
      onError={() => { setSrc((prev) => (prev === fallback ? prev : fallback)); }}
    />
  );
}

type SlotProps = {
  /** Stem del objeto en Storage, p. ej. `ABC123_2`. */
  stem: string;
  /** Stem alternativo (p. ej. código previo en `sku_old`) si la foto aún no se renombró en el bucket. */
  stemAlt?: string;
  fallback: string;
  className?: string;
  style?: CSSProperties;
  alt?: string;
  /**
   * Se llama una vez cuando la resolución finaliza.
   * `true` + `resolvedUrl` → la imagen existe en Firebase.
   * `false` → no existe (url no se pasa).
   */
  onResolved?: (hasImage: boolean, resolvedUrl?: string) => void;
};

/**
 * Miniatura de un solo slot de galería.
 * Resuelve la URL real en background y notifica al padre si existe o no.
 */
export function ProductFirebaseSlotImage({
  stem,
  stemAlt,
  fallback,
  className,
  style,
  alt = "",
  onResolved,
}: SlotProps) {
  const staticBase = productImageBaseUrl();
  const [base, setBase] = useState(staticBase);

  useEffect(() => {
    const s = productImageBaseUrl();
    if (s) { setBase(s); return; }
    let cancelled = false;
    void resolveProductImageBase("").then((b) => {
      if (!cancelled && b) setBase(b);
    });
    return () => { cancelled = true; };
  }, [staticBase]);

  const candidates = useMemo(() => {
    if (!base) return [fallback];
    const primary = firebaseProductImageCandidateUrlsForStem(stem, base);
    const a = normalizeInventoryImageKey(stem);
    const b = stemAlt ? normalizeInventoryImageKey(stemAlt) : "";
    const altUrls =
      stemAlt && b && b !== a
        ? firebaseProductImageCandidateUrlsForStem(stemAlt, base)
        : [];
    const merged: string[] = [];
    const seen = new Set<string>();
    const push = (u: string) => {
      if (!seen.has(u)) {
        seen.add(u);
        merged.push(u);
      }
    };
    for (const u of primary) push(u);
    for (const u of altUrls) push(u);
    const ranked = [...merged].sort((a, b) => rankCandidate(b) - rankCandidate(a));
    return [...ranked, fallback];
  }, [stem, stemAlt, base, fallback]);

  const [src, setSrc] = useState(fallback);

  // Ref para no incluir onResolved en deps del effect (evita re-ejecuciones)
  const onResolvedRef = useRef(onResolved);
  onResolvedRef.current = onResolved;

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
      // Sondear SOLO las URLs reales de Firebase (excluir el fallback local al final).
      // Si se incluyera el fallback en las candidatas, siempre cargaría (es un SVG local)
      // y onResolved(true) se dispararía aunque la imagen no exista en el bucket.
      const firebaseCandidates = candidates.filter((u) => u !== fallback);
      const BATCH_SIZE = 8;
      for (let i = 0; i < firebaseCandidates.length; i += BATCH_SIZE) {
        const batch = firebaseCandidates.slice(i, i + BATCH_SIZE);
        const results = await Promise.all(batch.map((u) => probe(u)));
        const okIdx = results.findIndex(Boolean);
        if (okIdx >= 0) {
          if (!cancelled) {
            setSrc(batch[okIdx]);
            onResolvedRef.current?.(true, batch[okIdx]);
          }
          return;
        }
      }
      // Ninguna URL de Firebase respondió → la foto no existe en el bucket
      if (!cancelled) {
        setSrc(fallback);
        onResolvedRef.current?.(false);
      }
    })();
    return () => { cancelled = true; };
  }, [candidates, fallback]);

  return (
    <img
      alt={alt}
      className={className}
      style={style}
      src={src}
      onError={() => { setSrc((prev) => (prev === fallback ? prev : fallback)); }}
    />
  );
}
