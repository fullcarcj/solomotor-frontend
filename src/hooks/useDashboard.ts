"use client";

import { useCallback, useEffect, useState } from "react";
import type { OverviewData, RealtimeData } from "@/types/stats";

const REFRESH_INTERVAL_MS = 60_000;

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
  return "No se pudo cargar el dashboard.";
}

function parseOverview(json: unknown): OverviewData | null {
  if (!json || typeof json !== "object") return null;
  const o = json as Record<string, unknown>;
  const data = (o.data as Record<string, unknown>) ?? o;
  if (!data.today) return null;
  return data as unknown as OverviewData;
}

function parseRealtime(json: unknown): RealtimeData | null {
  if (!json || typeof json !== "object") return null;
  const o = json as Record<string, unknown>;
  const data = (o.data as Record<string, unknown>) ?? o;
  if (!data.last_60min) return null;
  return data as unknown as RealtimeData;
}

export function useDashboard() {
  const [overview, setOverview] = useState<OverviewData | null>(null);
  const [realtime, setRealtime] = useState<RealtimeData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [lastUpdated, setLastUpdated] = useState<Date | null>(null);

  const load = useCallback(async () => {
    setError(null);
    try {
      const [resOv, resRt] = await Promise.all([
        fetch("/api/stats/overview", { credentials: "include", cache: "no-store" }),
        fetch("/api/stats/realtime", { credentials: "include", cache: "no-store" }),
      ]);

      const [jsonOv, jsonRt] = await Promise.all([
        resOv.json().catch(() => ({})) as Promise<unknown>,
        resRt.json().catch(() => ({})) as Promise<unknown>,
      ]);

      if (!resOv.ok) {
        setError(errMsg(jsonOv));
        return;
      }

      const ov = parseOverview(jsonOv);
      const rt = parseRealtime(jsonRt);
      setOverview(ov);
      setRealtime(rt);
      setLastUpdated(new Date());
    } catch {
      setError("Error de red al cargar el dashboard.");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    void load();
    const interval = setInterval(() => void load(), REFRESH_INTERVAL_MS);
    return () => clearInterval(interval);
  }, [load]);

  return { overview, realtime, loading, error, lastUpdated, refetch: load };
}
