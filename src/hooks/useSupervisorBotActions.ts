'use client';

import { useCallback, useEffect, useRef, useState } from 'react';
import type { BotAction } from '@/types/botActions';
import Swal from 'sweetalert2';

const POLL_INTERVAL_MS = 30_000;

/** Invalidación cruzada cuando se completa una revisión (mismo evento que useBotActions). */
const EVT_BOT_REVIEWED = 'solomotor:bot-action-reviewed';

interface UseSupervisorBotActionsOptions {
  cursor?: string | null;
  limit?: number;
}

interface UseSupervisorBotActionsResult {
  data: BotAction[];
  isLoading: boolean;
  error: string | null;
  total: number;
  refetch: () => void;
}

function parseBotActionsPayload(raw: unknown): { items: BotAction[]; total: number } {
  if (Array.isArray(raw)) return { items: raw as BotAction[], total: (raw as BotAction[]).length };
  if (raw && typeof raw === 'object') {
    const r = raw as Record<string, unknown>;
    const items = Array.isArray(r.data) ? (r.data as BotAction[])
      : Array.isArray(r.items) ? (r.items as BotAction[])
      : [];
    const total = typeof r.total === 'number' ? r.total : items.length;
    return { items, total };
  }
  return { items: [], total: 0 };
}

/**
 * Cola de bot_actions sin revisar para el supervisor. Polling 30s.
 * TODO Sprint 3: reemplazar polling por evento SSE cuando backend emita
 * bot_action_created (ver ADR-009 deuda técnica D7).
 */
export function useUnreviewedBotActions({
  cursor,
  limit = 20,
}: UseSupervisorBotActionsOptions = {}): UseSupervisorBotActionsResult {
  const [data, setData] = useState<BotAction[]>([]);
  const [total, setTotal] = useState(0);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const cancelledRef = useRef(false);
  const [tick, setTick] = useState(0);

  const fetchData = useCallback(async () => {
    try {
      const qs = new URLSearchParams({ is_reviewed: 'false' });
      if (cursor) qs.set('cursor', cursor);
      qs.set('limit', String(limit));

      const res = await fetch(
        `/api/sales/supervisor/bot-actions?${qs.toString()}`,
        { credentials: 'include', cache: 'no-store' }
      );

      if (!res.ok) {
        if (res.status === 403) {
          void Swal.fire({ icon: 'error', title: 'Sin permisos', text: 'No tenés permisos para ver la cola de revisión.', timer: 3000, showConfirmButton: false });
        } else if (res.status >= 500) {
          void Swal.fire({ icon: 'error', title: 'Error del servidor', text: 'No se pudo cargar la cola de revisión.', timer: 3000, showConfirmButton: false });
        }
        throw new Error(`HTTP ${res.status}`);
      }

      const raw: unknown = await res.json();
      const { items, total: t } = parseBotActionsPayload(raw);
      if (!cancelledRef.current) {
        setData(items);
        setTotal(t);
        setError(null);
      }
    } catch (err) {
      if (!cancelledRef.current) {
        setError(err instanceof Error ? err.message : String(err));
      }
    } finally {
      if (!cancelledRef.current) setIsLoading(false);
    }
  }, [cursor, limit]);

  useEffect(() => {
    cancelledRef.current = false;
    setIsLoading(true);
    void fetchData();

    // Polling 30s · pausado cuando la pestaña está en segundo plano
    // TODO Sprint 3: reemplazar por evento SSE bot_action_created (ADR-009 D7)
    const iv = setInterval(() => {
      if (document.visibilityState !== 'hidden') void fetchData();
    }, POLL_INTERVAL_MS);

    const onVisibility = () => {
      if (document.visibilityState === 'visible') void fetchData();
    };
    document.addEventListener('visibilitychange', onVisibility);

    return () => {
      cancelledRef.current = true;
      clearInterval(iv);
      document.removeEventListener('visibilitychange', onVisibility);
    };
  }, [fetchData]);

  // Refetch inmediato al recibir evento de revisión completada
  useEffect(() => {
    const handler = () => setTick((t) => t + 1);
    window.addEventListener(EVT_BOT_REVIEWED, handler);
    return () => window.removeEventListener(EVT_BOT_REVIEWED, handler);
  }, []);

  useEffect(() => {
    if (tick > 0) void fetchData();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [tick]);

  const refetch = useCallback(() => setTick((t) => t + 1), []);

  return { data, isLoading, error, total, refetch };
}
