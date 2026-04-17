"use client";

import { useCallback, useEffect, useState } from "react";
import type { PnlData, SalesStats } from "@/types/pnl";

export type PnlPeriod = "today" | "week" | "month" | "year";

function errMsg(json: unknown): string {
  if (json && typeof json === "object") {
    const o = json as Record<string, unknown>;
    const e = o.error;
    if (typeof e === "string") return e;
    if (e && typeof e === "object") {
      const m = (e as { message?: string }).message;
      if (typeof m === "string") return m;
    }
    const m = o.message;
    if (typeof m === "string") return m;
  }
  return "No se pudieron cargar los datos de utilidad.";
}

function parsePnl(json: unknown): PnlData | null {
  if (!json || typeof json !== "object") return null;
  const o = json as Record<string, unknown>;
  const data = (o.data as Record<string, unknown>) ?? o;
  if (!data.revenue) return null;
  return data as unknown as PnlData;
}

function parseSales(json: unknown): SalesStats | null {
  if (!json || typeof json !== "object") return null;
  const o = json as Record<string, unknown>;
  const data = (o.data as Record<string, unknown>) ?? o;
  if (data.total_orders === undefined && data.total_bs === undefined) return null;
  return data as unknown as SalesStats;
}

export function usePnl() {
  const [period, setPeriod] = useState<PnlPeriod>("month");
  const [pnl, setPnl] = useState<PnlData | null>(null);
  const [sales, setSales] = useState<SalesStats | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const load = useCallback(async (p: PnlPeriod) => {
    setLoading(true);
    setError(null);
    try {
      const [resPnl, resSales] = await Promise.all([
        fetch(`/api/finanzas/pnl?period=${p}`, {
          credentials: "include",
          cache: "no-store",
        }),
        fetch(`/api/finanzas/sales-stats?period=${p}`, {
          credentials: "include",
          cache: "no-store",
        }),
      ]);

      const [jsonPnl, jsonSales] = await Promise.all([
        resPnl.json().catch(() => ({})) as Promise<unknown>,
        resSales.json().catch(() => ({})) as Promise<unknown>,
      ]);

      if (!resPnl.ok) {
        setError(errMsg(jsonPnl));
        return;
      }

      setPnl(parsePnl(jsonPnl));
      setSales(resSales.ok ? parseSales(jsonSales) : null);
    } catch {
      setError("Error de red al cargar los datos de utilidad.");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    void load(period);
  }, [load, period]);

  const refetch = useCallback(() => void load(period), [load, period]);

  return { pnl, sales, loading, error, period, setPeriod, refetch };
}
