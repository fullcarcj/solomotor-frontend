"use client";

import { useEffect, useState } from "react";

export type TodayRates = {
  bcvRate: number | null;
  binanceRate: number | null;
  rateDate: string | null;
};

/**
 * Tasas del día (BCV / Binance) — mismo origen que el KPI ribbon de Pedidos.
 */
export function useTodayCurrencyRates(): TodayRates {
  const [bcvRate, setBcvRate] = useState<number | null>(null);
  const [binanceRate, setBinanceRate] = useState<number | null>(null);
  const [rateDate, setRateDate] = useState<string | null>(null);

  useEffect(() => {
    let alive = true;
    void (async () => {
      try {
        const res = await fetch("/api/currency/today", {
          cache: "no-store",
          credentials: "include",
        });
        if (!res.ok) return;
        const j = (await res.json()) as Record<string, unknown>;
        const data = (j.data ?? j) as Record<string, unknown> | null;
        if (!data || !alive) return;
        const bcv = data.bcv_rate;
        const bin = data.binance_rate;
        const dateVal = data.rate_date ?? data.date;
        if (bcv != null && Number.isFinite(Number(bcv)) && Number(bcv) > 0) {
          setBcvRate(Number(bcv));
        }
        if (bin != null && Number.isFinite(Number(bin)) && Number(bin) > 0) {
          setBinanceRate(Number(bin));
        }
        if (dateVal != null) setRateDate(String(dateVal));
      } catch {
        /* silencioso */
      }
    })();
    return () => {
      alive = false;
    };
  }, []);

  return { bcvRate, binanceRate, rateDate };
}
