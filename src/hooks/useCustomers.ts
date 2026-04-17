"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import type {
  Customer,
  CustomerFilters,
  CustomersMeta,
} from "@/types/customers";

const DEFAULT_META: CustomersMeta = { total: 0, limit: 20, offset: 0 };

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
  return "No se pudieron cargar los clientes.";
}

function parseCustomers(json: unknown): {
  customers: Customer[];
  meta: CustomersMeta;
} {
  if (!json || typeof json !== "object") return { customers: [], meta: DEFAULT_META };
  const o = json as Record<string, unknown>;

  const rawData = o.data ?? o;
  const customers: Customer[] = Array.isArray(rawData)
    ? (rawData as Customer[])
    : Array.isArray((rawData as Record<string, unknown>)?.customers)
      ? ((rawData as Record<string, unknown>).customers as Customer[])
      : [];

  const rawMeta = o.meta as Record<string, unknown> | undefined;
  const meta: CustomersMeta = {
    total:  Number(rawMeta?.total ?? customers.length),
    limit:  Number(rawMeta?.limit ?? 20),
    offset: Number(rawMeta?.offset ?? 0),
  };

  return { customers, meta };
}

export function useCustomers() {
  const [filters, setFilters] = useState<CustomerFilters>({
    search: "",
    status: "",
    limit:  20,
    offset: 0,
  });

  const [debouncedSearch, setDebouncedSearch] = useState("");
  const [customers, setCustomers] = useState<Customer[]>([]);
  const [meta, setMeta] = useState<CustomersMeta>(DEFAULT_META);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  /* Debounce de search 300 ms */
  useEffect(() => {
    const t = setTimeout(() => setDebouncedSearch(filters.search.trim()), 300);
    return () => clearTimeout(t);
  }, [filters.search]);

  const effectiveFilters = useMemo(
    () => ({
      search: debouncedSearch || undefined,
      status: filters.status || undefined,
      limit:  filters.limit,
      offset: filters.offset,
    }),
    [debouncedSearch, filters.status, filters.limit, filters.offset]
  );

  const load = useCallback(
    async (f: typeof effectiveFilters) => {
      setLoading(true);
      setError(null);
      try {
        const params = new URLSearchParams();
        if (f.search)  params.set("search", f.search);
        if (f.status)  params.set("status", f.status);
        params.set("limit",  String(f.limit));
        params.set("offset", String(f.offset));

        const res = await fetch(
          `/api/clientes/directorio?${params}`,
          { credentials: "include", cache: "no-store" }
        );
        const json: unknown = await res.json().catch(() => ({}));

        if (!res.ok) { setError(errMsg(json)); return; }

        const parsed = parseCustomers(json);
        setCustomers(parsed.customers);
        setMeta(parsed.meta);
      } catch {
        setError("Error de red al cargar los clientes.");
      } finally {
        setLoading(false);
      }
    },
    []
  );

  useEffect(() => {
    void load(effectiveFilters);
  }, [load, effectiveFilters]);

  const refetch = useCallback(
    () => void load(effectiveFilters),
    [load, effectiveFilters]
  );

  return { customers, meta, loading, error, filters, setFilters, refetch };
}
