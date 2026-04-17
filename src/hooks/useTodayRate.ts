"use client";

import { useCallback, useEffect, useState } from "react";
import type { TodayRate } from "@/types/pos";

function parseRate(json: unknown): TodayRate | null {
  if (!json || typeof json !== "object") return null;
  const o = json as Record<string, unknown>;
  const data = (o.data as Record<string, unknown>) ?? o;
  const rate_date = String(data.rate_date ?? data.rateDate ?? "");
  const active_rate_type = String(
    data.active_rate_type ?? data.activeRateType ?? ""
  );
  const active_rate =
    data.active_rate ?? data.activeRate ?? data.bcv_rate ?? "";
  if (!rate_date && active_rate === "") return null;
  return {
    rate_date,
    active_rate_type,
    active_rate: active_rate as number | string,
    bcv_rate: data.bcv_rate ?? data.bcvRate ?? "",
    binance_rate: data.binance_rate ?? data.binanceRate ?? "",
  };
}

export function useTodayRate() {
  const [rate, setRate] = useState<TodayRate | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const load = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await fetch("/api/currency/today", {
        credentials: "include",
        cache: "no-store",
      });
      const raw: unknown = await res.json().catch(() => ({}));
      if (!res.ok) {
        setRate(null);
        setError("No se pudo obtener la tasa.");
        return;
      }
      const parsed = parseRate(raw);
      setRate(parsed);
      if (!parsed) setError("Formato de tasa inválido.");
    } catch {
      setRate(null);
      setError("Error de red.");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    void load();
  }, [load]);

  return { rate, loading, error, refetch: load };
}
