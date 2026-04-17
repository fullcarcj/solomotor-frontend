"use client";
import { useCallback, useEffect, useState } from "react";
import type { ComprasPagination, Purchase, PurchaseFilters } from "@/types/compras";

const DEFAULT_FILTERS: PurchaseFilters = { from: "", to: "", status: "", limit: 50, offset: 0 };

function errMsg(e: unknown): string {
  if (e instanceof Error) return e.message;
  return "Error desconocido.";
}

function parsePurchases(raw: unknown): { rows: Purchase[]; pagination: ComprasPagination } {
  const def: ComprasPagination = { total: 0, limit: 50, offset: 0 };
  if (!raw || typeof raw !== "object") return { rows: [], pagination: def };
  const r = raw as Record<string, unknown>;
  const rows: Purchase[] = Array.isArray(r.data) ? (r.data as Purchase[])
    : Array.isArray(r.purchases) ? (r.purchases as Purchase[])
    : Array.isArray(raw) ? (raw as Purchase[])
    : [];
  const pagination: ComprasPagination = {
    total:  typeof r.total  === "number" ? r.total  : rows.length,
    limit:  typeof r.limit  === "number" ? r.limit  : 50,
    offset: typeof r.offset === "number" ? r.offset : 0,
  };
  return { rows, pagination };
}

export function usePurchases() {
  const [filters, setFiltersState] = useState<PurchaseFilters>(DEFAULT_FILTERS);
  const [purchases, setPurchases] = useState<Purchase[]>([]);
  const [pagination, setPagination] = useState<ComprasPagination>({ total: 0, limit: 50, offset: 0 });
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const load = useCallback(async (f: PurchaseFilters) => {
    setLoading(true);
    setError(null);
    try {
      const p = new URLSearchParams();
      if (f.from)   p.set("from",   f.from);
      if (f.to)     p.set("to",     f.to);
      if (f.status) p.set("status", f.status);
      p.set("limit",  String(f.limit));
      p.set("offset", String(f.offset));
      const res = await fetch(`/api/compras/ordenes?${p}`, { credentials: "include" });
      if (!res.ok) {
        const data = await res.json().catch(() => ({})) as Record<string, unknown>;
        throw new Error((data.error as string) ?? `HTTP ${res.status}`);
      }
      const data: unknown = await res.json();
      const { rows, pagination: pg } = parsePurchases(data);
      setPurchases(rows);
      setPagination(pg);
    } catch (e) {
      setError(errMsg(e));
    } finally {
      setLoading(false);
    }
  }, []);

  const setFilters = useCallback((updater: Partial<PurchaseFilters> | ((prev: PurchaseFilters) => PurchaseFilters)) => {
    setFiltersState((prev) => {
      const next = typeof updater === "function" ? updater(prev) : { ...prev, ...updater };
      if (next.from !== prev.from || next.to !== prev.to || next.status !== prev.status) next.offset = 0;
      void load(next);
      return next;
    });
  }, [load]);

  useEffect(() => { void load(filters); }, []);  // eslint-disable-line react-hooks/exhaustive-deps

  const refetch = useCallback(() => { void load(filters); }, [load, filters]);

  return { purchases, pagination, loading, error, filters, setFilters, refetch };
}
