'use client';

import { useCallback, useEffect, useRef, useState } from 'react';
import type { AiResponderLogRow, AiResponderLogAction, AiResponderLogProvider } from '@/types/ai-responder';

export type { AiResponderLogRow, AiResponderLogAction, AiResponderLogProvider };

const POLL_INTERVAL_MS = 30_000;

export type AiLogErrorKind = 'auth' | 'network';

export interface AiLogError {
  kind:    AiLogErrorKind;
  message: string;
}

interface Result {
  data:    AiResponderLogRow[];
  loading: boolean;
  error:   AiLogError | null;
  refresh: () => Promise<void>;
}

const VALID_ACTIONS = new Set<string>([
  'sent', 'error', 'rejected', 'draft_saved',
  'human_replied', 'legacy_archived', 'legacy_archived_block_attempt',
]);

const VALID_PROVIDERS = new Set<string>(['groq', 'human', 'system']);

function parseRow(raw: unknown): AiResponderLogRow | null {
  if (!raw || typeof raw !== 'object') return null;
  const r = raw as Record<string, unknown>;
  const id = Number(r.id);
  if (!Number.isFinite(id)) return null;
  const action = String(r.action_taken ?? '');
  const provider = String(r.provider_used ?? 'system');
  return {
    id,
    message_id:    r.message_id   != null ? Number(r.message_id)   : null,
    customer_id:   r.customer_id  != null ? Number(r.customer_id)  : null,
    action_taken:  (VALID_ACTIONS.has(action)   ? action   : 'sent')   as AiResponderLogAction,
    provider_used: (VALID_PROVIDERS.has(provider) ? provider : 'system') as AiResponderLogProvider,
    reasoning:     typeof r.reasoning === 'string' ? r.reasoning : null,
    created_at:    typeof r.created_at === 'string' ? r.created_at : new Date().toISOString(),
  };
}

function parsePayload(raw: unknown): AiResponderLogRow[] {
  if (!raw || typeof raw !== 'object') return [];
  const o = raw as Record<string, unknown>;
  const rawRows = Array.isArray(o.rows) ? o.rows : [];
  const out: AiResponderLogRow[] = [];
  for (const r of rawRows) {
    const parsed = parseRow(r);
    if (parsed) out.push(parsed);
  }
  return out;
}

export function useAiResponderLog(limit = 50): Result {
  const [data, setData]       = useState<AiResponderLogRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError]     = useState<AiLogError | null>(null);
  const cancelledRef          = useRef(false);

  const fetchLog = useCallback(async () => {
    try {
      const res = await fetch(`/api/ai-responder/log?limit=${limit}`, {
        credentials: 'include',
        cache: 'no-store',
      });

      if (res.status === 401 || res.status === 403) {
        if (!cancelledRef.current) {
          setError({ kind: 'auth', message: 'Sesión expirada · recargá la página' });
        }
        return;
      }

      if (!res.ok) {
        const text = await res.text().catch(() => '');
        throw new Error(text || `HTTP ${res.status}`);
      }

      const raw: unknown = await res.json();
      const parsed = parsePayload(raw);
      if (!cancelledRef.current) {
        setData(parsed);
        setError(null);
      }
    } catch (err) {
      if (!cancelledRef.current) {
        setError({
          kind: 'network',
          message: err instanceof Error ? err.message : String(err),
        });
      }
    } finally {
      if (!cancelledRef.current) setLoading(false);
    }
  }, [limit]);

  useEffect(() => {
    cancelledRef.current = false;
    void fetchLog();
    const iv = setInterval(() => void fetchLog(), POLL_INTERVAL_MS);
    return () => {
      cancelledRef.current = true;
      clearInterval(iv);
    };
  }, [fetchLog]);

  return { data, loading, error, refresh: fetchLog };
}
