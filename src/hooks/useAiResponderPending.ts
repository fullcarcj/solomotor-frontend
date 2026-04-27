'use client';

import { useCallback, useEffect, useRef, useState } from 'react';
import type {
  AiPendingMessage,
  AiPendingMessageContent,
} from '@/types/ai-responder';
import { useAppSelector } from '@/store/hooks';

export type { AiPendingMessage, AiPendingMessageContent };

const POLL_INTERVAL_MS = 30_000;

interface Result {
  rows:    AiPendingMessage[];
  total:   number;
  loading: boolean;
  error:   string | null;
  refetch: () => Promise<void>;
}

function parseContent(raw: unknown): AiPendingMessageContent {
  const c = (raw && typeof raw === 'object' ? raw : {}) as Record<string, unknown>;
  return {
    text:         (c.text ?? null) as string | null,
    caption:      (c.caption ?? null) as string | null,
    mediaUrl:     (c.mediaUrl ?? c.media_url ?? null) as string | null,
    mimeType:     (c.mimeType ?? c.mime_type ?? null) as string | null,
    duration:     typeof c.duration === 'number' ? c.duration : undefined,
    thumbnailUrl: (c.thumbnailUrl ?? c.thumbnail_url ?? null) as string | null,
  };
}

function parseRow(raw: unknown): AiPendingMessage | null {
  if (!raw || typeof raw !== 'object') return null;
  const r = raw as Record<string, unknown>;
  const id = String(r.id ?? '');
  if (!id) return null;
  return {
    id,
    chat_id:              String(r.chat_id ?? ''),
    customer_id:          r.customer_id != null ? String(r.customer_id) : null,
    ai_reply_status:      'needs_human_review',
    ai_reply_text:        (r.ai_reply_text ?? null) as string | null,
    ai_reasoning:         (r.ai_reasoning ?? null) as string | null,
    content:              parseContent(r.content),
    created_at:           String(r.created_at ?? new Date().toISOString()),
    chat_phone:           (r.chat_phone ?? null) as string | null,
    source_type:          (r.source_type ?? null) as string | null,
    channel_id:           r.channel_id != null ? Number(r.channel_id) : null,
    customer_full_name:   (r.customer_full_name ?? null) as string | null,
    customer_segment:     (r.customer_segment ?? null) as string | null,
    message_text_preview: (r.message_text_preview ?? null) as string | null,
  };
}

function parsePayload(raw: unknown): { rows: AiPendingMessage[]; total: number } {
  if (!raw || typeof raw !== 'object') return { rows: [], total: 0 };
  const o = raw as Record<string, unknown>;
  const rawRows = Array.isArray(o.rows) ? o.rows : [];
  const rows: AiPendingMessage[] = [];
  for (const r of rawRows) {
    const parsed = parseRow(r);
    if (parsed) rows.push(parsed);
  }
  return {
    rows,
    total: Number(o.total) || rows.length,
  };
}

export function useAiResponderPending(): Result {
  const [rows, setRows]       = useState<AiPendingMessage[]>([]);
  const [total, setTotal]     = useState(0);
  const [loading, setLoading] = useState(true);
  const [error, setError]     = useState<string | null>(null);
  const cancelledRef          = useRef(false);
  const authToken = useAppSelector((s) => s.auth.token);
  const authRestoring = useAppSelector((s) => s.auth.restoring);

  const fetchPending = useCallback(async () => {
    if (authToken === null || authRestoring) {
      if (!cancelledRef.current) {
        setRows([]);
        setTotal(0);
        setLoading(false);
      }
      return;
    }
    try {
      const res = await fetch('/api/ai-responder/pending?limit=200', {
        credentials: 'include',
        cache: 'no-store',
      });
      if (!res.ok) {
        const text = await res.text().catch(() => '');
        throw new Error(text || `HTTP ${res.status}`);
      }
      const raw: unknown = await res.json();
      const parsed = parsePayload(raw);
      if (!cancelledRef.current) {
        setRows(parsed.rows);
        setTotal(parsed.total);
        setError(null);
      }
    } catch (err) {
      if (!cancelledRef.current) {
        setError(err instanceof Error ? err.message : String(err));
      }
    } finally {
      if (!cancelledRef.current) setLoading(false);
    }
  }, [authToken, authRestoring]);

  useEffect(() => {
    cancelledRef.current = false;
    void fetchPending();
    const iv = setInterval(() => void fetchPending(), POLL_INTERVAL_MS);
    return () => {
      cancelledRef.current = true;
      clearInterval(iv);
    };
  }, [fetchPending]);

  return { rows, total, loading, error, refetch: fetchPending };
}
