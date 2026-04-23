'use client';

import { useCallback, useEffect, useState } from 'react';
import type { AiResponderOpsLogsResponse } from '@/types/ai-responder';

export function useAiResponderOpsLogs(opts: {
  days?: number;
  nameLimit?: number;
  receiptLimit?: number;
  visionLimit?: number;
}) {
  const {
    days = 7,
    nameLimit = 200,
    receiptLimit = 200,
    visionLimit = 200,
  } = opts;

  const [data, setData] = useState<AiResponderOpsLogsResponse | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const load = useCallback(async () => {
    setLoading(true);
    setError(null);
    const q = new URLSearchParams({
      days: String(days),
      name_limit: String(nameLimit),
      receipt_limit: String(receiptLimit),
      vision_limit: String(visionLimit),
    });
    try {
      const res = await fetch(`/api/ai-responder/ops-logs?${q}`, { credentials: 'include' });
      const j = (await res.json().catch(() => ({}))) as AiResponderOpsLogsResponse & { error?: string };
      if (!res.ok) {
        setError(j.error || `HTTP ${res.status}`);
        setData(null);
        return;
      }
      if (!j.ok) {
        setError(j.error || 'Respuesta inválida');
        setData(null);
        return;
      }
      setData(j);
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Error de red');
      setData(null);
    } finally {
      setLoading(false);
    }
  }, [days, nameLimit, receiptLimit, visionLimit]);

  useEffect(() => {
    void load();
  }, [load]);

  return { data, loading, error, refresh: load };
}
