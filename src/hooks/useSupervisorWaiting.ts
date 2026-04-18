'use client';

import { useCallback, useEffect, useRef, useState } from 'react';
import type { WaitingItem, WaitingReason } from '@/types/supervisor';

const POLL_INTERVAL_MS = 30_000;
const VALID_REASONS: readonly WaitingReason[] = [
  'approval',
  'payment',
  'delivery',
  'rating',
];

interface Result {
  waiting: WaitingItem[];
  loading: boolean;
  error: string | null;
  refetch: () => Promise<void>;
}

function deriveInitials(name: string): string {
  const parts = name.trim().split(/\s+/).filter(Boolean);
  const a = parts[0]?.charAt(0) ?? '?';
  const b = parts[1]?.charAt(0) ?? (parts[0]?.charAt(1) ?? '');
  return (a + b).toUpperCase().slice(0, 2) || '??';
}

function parseWaitingItem(raw: unknown): WaitingItem | null {
  if (!raw || typeof raw !== 'object') return null;
  const o = raw as Record<string, unknown>;

  const rawReason = String(o.stage_reason ?? '');
  if (!VALID_REASONS.includes(rawReason as WaitingReason)) return null;
  const stage_reason = rawReason as WaitingReason;

  const id = Number(o.id);
  if (!Number.isFinite(id)) return null;

  const customer_name =
    typeof o.customer_name === 'string' && o.customer_name.trim()
      ? o.customer_name
      : 'Cliente sin nombre';

  const customer_initials =
    typeof o.customer_initials === 'string' && o.customer_initials.trim()
      ? o.customer_initials.toUpperCase().slice(0, 2)
      : deriveInitials(customer_name);

  return {
    id,
    customer_name,
    customer_initials,
    stage_reason,
    stage_description: String(o.stage_description ?? 'En progreso'),
    bot_log: String(o.bot_log ?? 'Bot esperando acción del comprador'),
    amount_usd: Number(o.amount_usd) || 0,
    since_iso: String(o.since_iso ?? new Date().toISOString()),
    chat_id: o.chat_id == null ? null : Number(o.chat_id),
    order_id: o.order_id == null ? null : Number(o.order_id),
  };
}

function parseWaitingPayload(raw: unknown): WaitingItem[] {
  const list = Array.isArray(raw)
    ? raw
    : Array.isArray((raw as { items?: unknown })?.items)
      ? ((raw as { items: unknown[] }).items)
      : Array.isArray((raw as { data?: unknown })?.data)
        ? ((raw as { data: unknown[] }).data)
        : [];
  const out: WaitingItem[] = [];
  for (const row of list) {
    const item = parseWaitingItem(row);
    if (item) out.push(item);
  }
  return out;
}

export function useSupervisorWaiting(): Result {
  const [waiting, setWaiting] = useState<WaitingItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const cancelledRef = useRef(false);

  const fetchWaiting = useCallback(async () => {
    try {
      const res = await fetch('/api/ventas/supervisor/waiting', {
        credentials: 'include',
        cache: 'no-store',
      });
      if (!res.ok) {
        const text = await res.text().catch(() => '');
        throw new Error(text || `HTTP ${res.status}`);
      }
      const raw: unknown = await res.json();
      const parsed = parseWaitingPayload(raw);
      if (!cancelledRef.current) {
        setWaiting(parsed);
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
    void fetchWaiting();
    const iv = setInterval(() => {
      void fetchWaiting();
    }, POLL_INTERVAL_MS);
    return () => {
      cancelledRef.current = true;
      clearInterval(iv);
    };
  }, [fetchWaiting]);

  return { waiting, loading, error, refetch: fetchWaiting };
}
