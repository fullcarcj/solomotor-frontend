'use client';

import { useEffect, useRef, useState } from 'react';

const POLL_INTERVAL_MS = 30_000;

interface ExceptionsCountResult {
  openCount: number;
  isLoading: boolean;
}

/**
 * Contador de excepciones OPEN para badges en sidebar y encabezados.
 * Polling 30s · pausado en segundo plano.
 * TODO Sprint 3: reemplazar polling por evento SSE exception_created / exception_resolved (ADR-009 D7).
 */
export function useExceptionsCount(): ExceptionsCountResult {
  const [openCount, setOpenCount] = useState(0);
  const [isLoading, setIsLoading] = useState(true);
  const cancelledRef = useRef(false);

  const fetchCount = async () => {
    try {
      const res = await fetch('/api/sales/exceptions?status=OPEN&limit=1', {
        credentials: 'include',
        cache: 'no-store',
      });
      if (!res.ok) return;
      const raw: unknown = await res.json();
      let count = 0;
      if (raw && typeof raw === 'object') {
        const r = raw as Record<string, unknown>;
        if (typeof r.total === 'number') count = r.total;
        else if (Array.isArray(r.data)) count = (r.data as unknown[]).length;
        else if (Array.isArray(r.items)) count = (r.items as unknown[]).length;
        else if (Array.isArray(raw)) count = (raw as unknown[]).length;
      }
      if (!cancelledRef.current) setOpenCount(count);
    } catch {
      /* silent: contador no es crítico */
    } finally {
      if (!cancelledRef.current) setIsLoading(false);
    }
  };

  useEffect(() => {
    cancelledRef.current = false;
    void fetchCount();

    const iv = setInterval(() => {
      if (document.visibilityState !== 'hidden') void fetchCount();
    }, POLL_INTERVAL_MS);

    const onVisibility = () => {
      if (document.visibilityState === 'visible') void fetchCount();
    };
    document.addEventListener('visibilitychange', onVisibility);

    return () => {
      cancelledRef.current = true;
      clearInterval(iv);
      document.removeEventListener('visibilitychange', onVisibility);
    };
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  return { openCount, isLoading };
}
