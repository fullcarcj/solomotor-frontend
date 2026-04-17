"use client";

import { useCallback, useEffect, useState } from "react";
import type { DispatchRecord, DispatchPagination } from "@/types/dispatch";

const DEFAULT_PAGINATION: DispatchPagination = { total: 0, limit: 50, offset: 0, has_more: false };

function errMsg(json: unknown): string {
  if (json && typeof json === "object") {
    const o = json as Record<string, unknown>;
    const e = o.error; if (typeof e === "string") return e;
    if (e && typeof e === "object") { const m = (e as { message?: string }).message; if (typeof m === "string") return m; }
    const m = o.message; if (typeof m === "string") return m;
  }
  return "No se pudieron cargar los despachos.";
}

function parseResponse(json: unknown): { records: DispatchRecord[]; pagination: DispatchPagination } {
  if (!json || typeof json !== "object") return { records: [], pagination: DEFAULT_PAGINATION };
  const o = json as Record<string, unknown>;
  const root = (o.data as Record<string, unknown>) ?? o;
  const records: DispatchRecord[] = Array.isArray(root.items) ? (root.items as DispatchRecord[])
    : Array.isArray(root.records) ? (root.records as DispatchRecord[])
    : Array.isArray(root) ? (root as DispatchRecord[]) : [];
  const rawP = (root.pagination ?? o.pagination) as Record<string, unknown> | undefined;
  const pagination: DispatchPagination = {
    total:    Number(rawP?.total    ?? records.length),
    limit:    Number(rawP?.limit    ?? 50),
    offset:   Number(rawP?.offset   ?? 0),
    has_more: Boolean(rawP?.has_more ?? false),
  };
  return { records, pagination };
}

export interface DispatchFilters {
  channel: string;
  from:    string;
  to:      string;
  limit:   number;
  offset:  number;
}

export function useDispatchPending(autoRefreshMs = 30_000) {
  const [filters, setFilters] = useState<DispatchFilters>({ channel: "", from: "", to: "", limit: 50, offset: 0 });
  const [records, setRecords]     = useState<DispatchRecord[]>([]);
  const [pagination, setPagination] = useState(DEFAULT_PAGINATION);
  const [loading, setLoading]     = useState(true);
  const [error, setError]         = useState<string | null>(null);

  const load = useCallback(async (f: DispatchFilters) => {
    setError(null);
    try {
      const p = new URLSearchParams();
      if (f.channel) p.set("channel", f.channel);
      p.set("limit", String(f.limit));
      p.set("offset", String(f.offset));
      const res = await fetch(`/api/logistica/pending?${p}`, { credentials: "include", cache: "no-store" });
      const json: unknown = await res.json().catch(() => ({}));
      if (!res.ok) { setError(errMsg(json)); return; }
      const parsed = parseResponse(json);
      setRecords(parsed.records);
      setPagination(parsed.pagination);
    } catch { setError("Error de red al cargar despachos."); }
    finally { setLoading(false); }
  }, []);

  useEffect(() => {
    void load(filters);
    if (autoRefreshMs > 0) {
      const t = setInterval(() => void load(filters), autoRefreshMs);
      return () => clearInterval(t);
    }
  }, [load, filters, autoRefreshMs]);

  const refetch = useCallback(() => void load(filters), [load, filters]);
  return { records, pagination, loading, error, filters, setFilters, refetch };
}

export function useDispatchHistory() {
  const [filters, setFilters] = useState<DispatchFilters>({ channel: "", from: "", to: "", limit: 50, offset: 0 });
  const [records, setRecords]     = useState<DispatchRecord[]>([]);
  const [pagination, setPagination] = useState(DEFAULT_PAGINATION);
  const [loading, setLoading]     = useState(true);
  const [error, setError]         = useState<string | null>(null);

  const load = useCallback(async (f: DispatchFilters) => {
    setLoading(true); setError(null);
    try {
      const p = new URLSearchParams();
      if (f.channel) p.set("channel", f.channel);
      if (f.from)    p.set("from", f.from);
      if (f.to)      p.set("to", f.to);
      p.set("limit", String(f.limit));
      p.set("offset", String(f.offset));
      const res = await fetch(`/api/logistica/history?${p}`, { credentials: "include", cache: "no-store" });
      const json: unknown = await res.json().catch(() => ({}));
      if (!res.ok) { setError(errMsg(json)); return; }
      const parsed = parseResponse(json);
      setRecords(parsed.records);
      setPagination(parsed.pagination);
    } catch { setError("Error de red al cargar historial."); }
    finally { setLoading(false); }
  }, []);

  useEffect(() => { void load(filters); }, [load, filters]);

  const refetch = useCallback(() => void load(filters), [load, filters]);
  return { records, pagination, loading, error, filters, setFilters, refetch };
}
