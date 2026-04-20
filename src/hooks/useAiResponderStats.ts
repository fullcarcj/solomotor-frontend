'use client';

import { useCallback, useEffect, useRef, useState } from 'react';

const POLL_INTERVAL_MS = 30_000;

export interface AiResponderLogEntry {
  action_taken: string;
  n: number;
}

export interface AiResponderStats {
  today_log_by_action: AiResponderLogEntry[];
  today_by_status: {
    ai_replied: number;
    needs_human_review: number;
    skipped: number;
    processing: number;
    pending: number;
  };
  pending_count: number;
  needs_review_count: number;
  /** Total de mensajes en cola de revisión humana (todos los días). Badge del AiReviewDrawer. */
  total_pending_count: number;
  /** Total de mensajes archivados como legacy (para referencia). */
  legacy_archived_count: number;
  force_send: boolean;
  human_review_gate: boolean;
}

interface Result {
  stats: AiResponderStats | null;
  loading: boolean;
  error: string | null;
  refetch: () => Promise<void>;
}

function parseStatusCounts(raw: unknown): AiResponderStats['today_by_status'] {
  const o = (raw && typeof raw === 'object' ? raw : {}) as Record<string, unknown>;
  return {
    ai_replied: Number(o.ai_replied) || 0,
    needs_human_review: Number(o.needs_human_review) || 0,
    skipped: Number(o.skipped) || 0,
    processing: Number(o.processing) || 0,
    pending: Number(o.pending) || 0,
  };
}

function parseLogByAction(raw: unknown): AiResponderLogEntry[] {
  if (!Array.isArray(raw)) return [];
  const out: AiResponderLogEntry[] = [];
  for (const row of raw) {
    if (!row || typeof row !== 'object') continue;
    const r = row as Record<string, unknown>;
    const action_taken =
      typeof r.action_taken === 'string' && r.action_taken.trim()
        ? r.action_taken
        : null;
    const n = Number(r.n);
    if (!action_taken || !Number.isFinite(n)) continue;
    out.push({ action_taken, n });
  }
  return out;
}

function parseStatsPayload(raw: unknown): AiResponderStats | null {
  if (!raw || typeof raw !== 'object') return null;
  const o = raw as Record<string, unknown>;
  return {
    today_log_by_action: parseLogByAction(o.today_log_by_action),
    today_by_status: parseStatusCounts(o.today_by_status),
    pending_count: Number(o.pending_count) || 0,
    needs_review_count: Number(o.needs_review_count) || 0,
    // total_pending_count: alias de needs_review_count (cuenta global de revisión pendiente).
    // Si el backend envía total_pending_count explícito, se usa ese; sino cae en needs_review_count.
    total_pending_count: Number(o.total_pending_count ?? o.needs_review_count) || 0,
    legacy_archived_count: Number(o.legacy_archived_count) || 0,
    force_send: Boolean(o.force_send),
    human_review_gate: Boolean(o.human_review_gate),
  };
}

export function useAiResponderStats(): Result {
  const [stats, setStats] = useState<AiResponderStats | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const cancelledRef = useRef(false);

  const fetchStats = useCallback(async () => {
    try {
      const res = await fetch('/api/ai-responder/stats', {
        credentials: 'include',
        cache: 'no-store',
      });
      if (!res.ok) {
        const text = await res.text().catch(() => '');
        throw new Error(text || `HTTP ${res.status}`);
      }
      const raw: unknown = await res.json();
      const parsed = parseStatsPayload(raw);
      if (!cancelledRef.current) {
        setStats(parsed);
        setError(parsed ? null : 'Respuesta de ai-responder/stats inválida');
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
    void fetchStats();
    const iv = setInterval(() => {
      void fetchStats();
    }, POLL_INTERVAL_MS);
    return () => {
      cancelledRef.current = true;
      clearInterval(iv);
    };
  }, [fetchStats]);

  return { stats, loading, error, refetch: fetchStats };
}
