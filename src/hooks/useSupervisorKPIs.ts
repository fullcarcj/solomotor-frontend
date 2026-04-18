'use client';

import { useCallback, useEffect, useRef, useState } from 'react';
import type { SupervisorKPIs } from '@/types/supervisor';

const POLL_INTERVAL_MS = 30_000;

interface Result {
  kpis: SupervisorKPIs | null;
  loading: boolean;
  error: string | null;
  refetch: () => Promise<void>;
}

function parseKpisPayload(raw: unknown): SupervisorKPIs | null {
  if (!raw || typeof raw !== 'object') return null;
  const o = raw as Record<string, unknown>;

  const bot = (o.bot_resolved as Record<string, unknown>) ?? {};
  const wait = (o.waiting_buyer as Record<string, unknown>) ?? {};
  const waitStage = (wait.by_stage as Record<string, unknown>) ?? {};
  const exc = (o.exceptions as Record<string, unknown>) ?? {};
  const closed = (o.closed_today as Record<string, unknown>) ?? {};

  return {
    bot_resolved: {
      percentage: Number(bot.percentage) || 0,
      count_today: Number(bot.count_today) || 0,
      count_total_today: Number(bot.count_total_today) || 0,
    },
    waiting_buyer: {
      count: Number(wait.count) || 0,
      by_stage: {
        approval: Number(waitStage.approval) || 0,
        payment: Number(waitStage.payment) || 0,
        delivery: Number(waitStage.delivery) || 0,
        rating: Number(waitStage.rating) || 0,
      },
    },
    exceptions: { count: Number(exc.count) || 0 },
    closed_today: {
      count: Number(closed.count) || 0,
      amount_usd: Number(closed.amount_usd) || 0,
    },
  };
}

export function useSupervisorKPIs(): Result {
  const [kpis, setKpis] = useState<SupervisorKPIs | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const cancelledRef = useRef(false);

  const fetchKpis = useCallback(async () => {
    try {
      const res = await fetch('/api/ventas/supervisor/kpis', {
        credentials: 'include',
        cache: 'no-store',
      });
      if (!res.ok) {
        const text = await res.text().catch(() => '');
        throw new Error(text || `HTTP ${res.status}`);
      }
      const raw: unknown = await res.json();
      const parsed = parseKpisPayload(raw);
      if (!cancelledRef.current) {
        setKpis(parsed);
        setError(parsed ? null : 'Respuesta de KPIs inválida');
      }
    } catch (err) {
      if (!cancelledRef.current) {
        setError(err instanceof Error ? err.message : String(err));
      }
    } finally {
      if (!cancelledRef.current) setLoading(false);
    }
  }, []);

  useEffect(() => {
    cancelledRef.current = false;
    void fetchKpis();
    const iv = setInterval(() => {
      void fetchKpis();
    }, POLL_INTERVAL_MS);
    return () => {
      cancelledRef.current = true;
      clearInterval(iv);
    };
  }, [fetchKpis]);

  return { kpis, loading, error, refetch: fetchKpis };
}
