"use client";

import { useCallback, useEffect, useState } from "react";
import type {
  CustomerHistory,
  CustomerHistoryFilters,
  CustomerOrder,
} from "@/types/customers";

const DEFAULT_PAGINATION: CustomerHistory["pagination"] = {
  total:    0,
  limit:    20,
  offset:   0,
  has_more: false,
};

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
  return "No se pudo cargar el historial del cliente.";
}

function parseHistory(json: unknown): CustomerHistory {
  if (!json || typeof json !== "object")
    return { orders: [], pagination: DEFAULT_PAGINATION };

  const o = json as Record<string, unknown>;
  const root = (o.data as Record<string, unknown>) ?? o;

  const orders: CustomerOrder[] = Array.isArray(root.orders)
    ? (root.orders as CustomerOrder[])
    : Array.isArray(root)
      ? (root as CustomerOrder[])
      : [];

  const rawPag = root.pagination as Record<string, unknown> | undefined;
  const pagination: CustomerHistory["pagination"] = {
    total:    Number(rawPag?.total    ?? orders.length),
    limit:    Number(rawPag?.limit    ?? 20),
    offset:   Number(rawPag?.offset   ?? 0),
    has_more: Boolean(rawPag?.has_more ?? false),
  };

  return { orders, pagination };
}

export function useCustomerHistory(customerId: number | null) {
  const [filters, setFiltersState] = useState<CustomerHistoryFilters>({
    source: "",
    from:   "",
    to:     "",
    limit:  20,
    offset: 0,
  });

  const [orders, setOrders]           = useState<CustomerOrder[]>([]);
  const [pagination, setPagination]   = useState(DEFAULT_PAGINATION);
  const [loading, setLoading]         = useState(false);
  const [error, setError]             = useState<string | null>(null);

  /* Wrapper que resetea offset cuando cambian los filtros de búsqueda */
  const setFilters = useCallback(
    (updater: Partial<CustomerHistoryFilters> | ((prev: CustomerHistoryFilters) => CustomerHistoryFilters)) => {
      setFiltersState((prev) => {
        const next =
          typeof updater === "function"
            ? updater(prev)
            : { ...prev, ...updater };

        /* Si cambia source/from/to → resetear página */
        if (
          next.source !== prev.source ||
          next.from   !== prev.from   ||
          next.to     !== prev.to
        ) {
          next.offset = 0;
        }
        return next;
      });
    },
    []
  );

  const load = useCallback(
    async (id: number, f: CustomerHistoryFilters) => {
      setLoading(true);
      setError(null);
      try {
        const params = new URLSearchParams();
        if (f.source) params.set("source", f.source);
        if (f.from)   params.set("from",   f.from);
        if (f.to)     params.set("to",     f.to);
        params.set("limit",  String(f.limit));
        params.set("offset", String(f.offset));

        const res = await fetch(
          `/api/clientes/historial/${id}?${params}`,
          { credentials: "include", cache: "no-store" }
        );
        const json: unknown = await res.json().catch(() => ({}));

        if (!res.ok) { setError(errMsg(json)); return; }

        const parsed = parseHistory(json);
        setOrders(parsed.orders);
        setPagination(parsed.pagination);
      } catch {
        setError("Error de red al cargar el historial.");
      } finally {
        setLoading(false);
      }
    },
    []
  );

  useEffect(() => {
    if (customerId === null) {
      setOrders([]);
      setPagination(DEFAULT_PAGINATION);
      return;
    }
    void load(customerId, filters);
  }, [load, customerId, filters]);

  const refetch = useCallback(() => {
    if (customerId !== null) void load(customerId, filters);
  }, [load, customerId, filters]);

  return { orders, pagination, loading, error, filters, setFilters, refetch };
}
