'use client';

import { useCallback, useEffect, useRef, useState } from 'react';
import type {
  SupervisorException,
  ExceptionKind,
} from '@/types/supervisor';

const POLL_INTERVAL_MS = 30_000;
const VALID_KINDS: readonly ExceptionKind[] = [
  'payment_no_match',
  'stock_zero_no_supplier',
  'unhappy_customer',
  'ambiguity_unresolved',
  'high_amount_policy',
];

interface Result {
  exceptions: SupervisorException[];
  loading: boolean;
  error: string | null;
  refetch: () => Promise<void>;
}

type ActionKind = 'primary' | 'secondary';

function parseAction(raw: unknown): { label: string; kind: ActionKind } | null {
  if (!raw || typeof raw !== 'object') return null;
  const o = raw as Record<string, unknown>;
  const label = typeof o.label === 'string' && o.label.trim() ? o.label : '';
  const kind: ActionKind = o.kind === 'secondary' ? 'secondary' : 'primary';
  if (!label) return null;
  return { label, kind };
}

function parseException(raw: unknown): SupervisorException | null {
  if (!raw || typeof raw !== 'object') return null;
  const o = raw as Record<string, unknown>;

  const id = Number(o.id);
  if (!Number.isFinite(id)) return null;

  const rawKind = String(o.kind ?? '');
  const kind: ExceptionKind = VALID_KINDS.includes(rawKind as ExceptionKind)
    ? (rawKind as ExceptionKind)
    : 'payment_no_match';

  const primary_action = parseAction(o.primary_action);
  if (!primary_action) return null;
  const secondary_action = parseAction(o.secondary_action);

  return {
    id,
    kind,
    title: typeof o.title === 'string' && o.title.trim() ? o.title : `#${id}`,
    detail:
      typeof o.detail === 'string' && o.detail.trim()
        ? o.detail
        : 'Excepción detectada por el bot',
    primary_action,
    ...(secondary_action ? { secondary_action } : {}),
    chat_id: o.chat_id == null ? null : Number(o.chat_id),
    order_id: o.order_id == null ? null : Number(o.order_id),
    created_at:
      typeof o.created_at === 'string' ? o.created_at : new Date().toISOString(),
  };
}

function parseExceptionsPayload(raw: unknown): SupervisorException[] {
  const list = Array.isArray(raw)
    ? raw
    : Array.isArray((raw as { items?: unknown })?.items)
      ? ((raw as { items: unknown[] }).items)
      : Array.isArray((raw as { data?: unknown })?.data)
        ? ((raw as { data: unknown[] }).data)
        : [];
  const out: SupervisorException[] = [];
  for (const row of list) {
    const item = parseException(row);
    if (item) out.push(item);
  }
  return out;
}

export function useSupervisorExceptions(): Result {
  const [exceptions, setExceptions] = useState<SupervisorException[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const cancelledRef = useRef(false);

  const fetchExceptions = useCallback(async () => {
    try {
      const res = await fetch('/api/ventas/supervisor/exceptions', {
        credentials: 'include',
        cache: 'no-store',
      });
      if (!res.ok) {
        const text = await res.text().catch(() => '');
        throw new Error(text || `HTTP ${res.status}`);
      }
      const raw: unknown = await res.json();
      const parsed = parseExceptionsPayload(raw);
      if (!cancelledRef.current) {
        setExceptions(parsed);
        setError(null);
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
    void fetchExceptions();
    const iv = setInterval(() => {
      void fetchExceptions();
    }, POLL_INTERVAL_MS);
    return () => {
      cancelledRef.current = true;
      clearInterval(iv);
    };
  }, [fetchExceptions]);

  return { exceptions, loading, error, refetch: fetchExceptions };
}
