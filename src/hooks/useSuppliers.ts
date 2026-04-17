"use client";
import { useCallback, useEffect, useRef, useState } from "react";
import type { ComprasPagination, Supplier, SupplierFilters } from "@/types/compras";

const DEFAULT_FILTERS: SupplierFilters = { search: "", is_active: "", limit: 50, offset: 0 };

function errMsg(e: unknown): string {
  if (e instanceof Error) return e.message;
  return "Error desconocido.";
}

function parseSuppliers(raw: unknown): { rows: Supplier[]; pagination: ComprasPagination } {
  const def: ComprasPagination = { total: 0, limit: 50, offset: 0 };
  if (!raw || typeof raw !== "object") return { rows: [], pagination: def };
  const r = raw as Record<string, unknown>;
  const rows: Supplier[] = Array.isArray(r.data) ? (r.data as Supplier[])
    : Array.isArray(r.suppliers) ? (r.suppliers as Supplier[])
    : Array.isArray(raw) ? (raw as Supplier[])
    : [];
  const pagination: ComprasPagination = {
    total:  typeof r.total  === "number" ? r.total  : rows.length,
    limit:  typeof r.limit  === "number" ? r.limit  : 50,
    offset: typeof r.offset === "number" ? r.offset : 0,
  };
  return { rows, pagination };
}

export function useSuppliers() {
  const [filters, setFiltersState] = useState<SupplierFilters>(DEFAULT_FILTERS);
  const [suppliers, setSuppliers] = useState<Supplier[]>([]);
  const [pagination, setPagination] = useState<ComprasPagination>({ total: 0, limit: 50, offset: 0 });
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const searchRef = useRef("");

  const load = useCallback(async (f: SupplierFilters) => {
    setLoading(true);
    setError(null);
    try {
      const p = new URLSearchParams();
      if (f.search)    p.set("search", f.search);
      if (f.is_active) p.set("is_active", f.is_active);
      p.set("limit",  String(f.limit));
      p.set("offset", String(f.offset));
      const res = await fetch(`/api/compras/proveedores?${p}`, { credentials: "include" });
      if (!res.ok) {
        const data = await res.json().catch(() => ({})) as Record<string, unknown>;
        throw new Error((data.error as string) ?? `HTTP ${res.status}`);
      }
      const data: unknown = await res.json();
      const { rows, pagination: pg } = parseSuppliers(data);
      setSuppliers(rows);
      setPagination(pg);
    } catch (e) {
      setError(errMsg(e));
    } finally {
      setLoading(false);
    }
  }, []);

  const setFilters = useCallback((updater: Partial<SupplierFilters> | ((prev: SupplierFilters) => SupplierFilters)) => {
    setFiltersState((prev) => {
      const next = typeof updater === "function" ? updater(prev) : { ...prev, ...updater };
      if (next.search !== prev.search) {
        next.offset = 0;
        if (debounceRef.current) clearTimeout(debounceRef.current);
        if (next.search !== searchRef.current) {
          searchRef.current = next.search;
          debounceRef.current = setTimeout(() => { void load(next); }, 300);
          return next;
        }
      }
      if (next.is_active !== prev.is_active) next.offset = 0;
      void load(next);
      return next;
    });
  }, [load]);

  useEffect(() => { void load(filters); }, []);  // eslint-disable-line react-hooks/exhaustive-deps

  const refetch = useCallback(() => { void load(filters); }, [load, filters]);

  return { suppliers, pagination, loading, error, filters, setFilters, refetch };
}
