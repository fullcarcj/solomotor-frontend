"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import type { Quotation, QuotationPagination } from "@/types/quotations";

export interface QuotationFilters {
  status?: string;
  search?: string;
  fecha_desde?: string;
  fecha_hasta?: string;
  limit?: number;
  offset?: number;
}

function friendlyCode(code: string): string | null {
  const c = code.toLowerCase();
  if (c === "not_found") {
    return (
      "El servidor respondió «not_found»: no existe GET para el listado de cotizaciones en esa ruta. " +
      "En el webhook-receiver confirma la URL (p. ej. define QUOTATIONS_UPSTREAM_PATH en el frontend si el path real es otro)."
    );
  }
  return null;
}

function errMessage(payload: unknown): string {
  if (payload && typeof payload === "object") {
    const o = payload as Record<string, unknown>;
    const err = o.error;
    if (typeof err === "string") {
      return friendlyCode(err) ?? err;
    }
    if (err && typeof err === "object") {
      const e = err as { message?: string; code?: string };
      if (typeof e.message === "string") return e.message;
      if (typeof e.code === "string") {
        const hint = friendlyCode(e.code);
        if (hint) return hint;
        if (e.code === "CONFIG") {
          return (
            "Configuración del servidor: define WEBHOOK_RECEIVER_BASE_URL y " +
            "WEBHOOK_ADMIN_SECRET (o BACKEND_URL con auth por cookie)."
          );
        }
        return `Error: ${e.code}`;
      }
    }
    if (typeof o.code === "string") {
      const hint = friendlyCode(o.code);
      if (hint) return hint;
    }
    const m = o.message;
    if (typeof m === "string") return m;
    const detail = o.detail;
    if (typeof detail === "string") return detail;
  }
  return "No se pudo cargar las cotizaciones.";
}

function normalizeQuotation(raw: Record<string, unknown>): Quotation {
  return {
    id: Number(raw.id) || 0,
    reference: String(raw.reference ?? ""),
    status: String(raw.status ?? ""),
    total: (raw.total as number | string) ?? 0,
    fecha_vencimiento:
      raw.fecha_vencimiento == null
        ? null
        : String(raw.fecha_vencimiento),
    fecha_creacion: String(raw.fecha_creacion ?? ""),
    channel_id:
      raw.channel_id == null ? null : Number(raw.channel_id),
    chat_id: raw.chat_id == null ? null : Number(raw.chat_id),
    cliente_id: Number(raw.cliente_id) || 0,
    cliente_nombre:
      raw.cliente_nombre == null ? null : String(raw.cliente_nombre),
    created_by:
      raw.created_by == null ? null : Number(raw.created_by),
    items_count: (raw.items_count as number | string) ?? 0,
  };
}

function parseList(json: unknown): {
  items: Quotation[];
  pagination: QuotationPagination;
} {
  const o = json as Record<string, unknown>;
  const data = (o.data as Record<string, unknown>) ?? o;
  const rawList =
    data.items ??
    data.quotations ??
    o.items ??
    o.quotations;
  const arr = Array.isArray(rawList) ? rawList : [];
  const items = arr.map((x) =>
    normalizeQuotation(x as Record<string, unknown>)
  );

  const p = (data.pagination ?? o.pagination) as
    | Record<string, unknown>
    | undefined;
  const pagination: QuotationPagination = {
    total: Number(p?.total) || 0,
    limit: Number(p?.limit) || 50,
    offset: Number(p?.offset) || 0,
    has_more: Boolean(p?.has_more),
  };
  if (!p?.has_more && pagination.total > 0) {
    pagination.has_more =
      pagination.offset + pagination.limit < pagination.total;
  }
  return { items, pagination };
}

export function useQuotations() {
  const [filters, setFilters] = useState<QuotationFilters>({
    limit: 50,
    offset: 0,
  });

  const [debouncedSearch, setDebouncedSearch] = useState(
    () => filters.search ?? ""
  );

  useEffect(() => {
    const t = setTimeout(() => setDebouncedSearch(filters.search ?? ""), 300);
    return () => clearTimeout(t);
  }, [filters.search]);

  const effectiveFilters = useMemo(
    () => ({
      status: filters.status,
      fecha_desde: filters.fecha_desde,
      fecha_hasta: filters.fecha_hasta,
      limit: filters.limit,
      offset: filters.offset,
      search: debouncedSearch.trim() || undefined,
    }),
    [
      filters.status,
      filters.fecha_desde,
      filters.fecha_hasta,
      filters.limit,
      filters.offset,
      debouncedSearch,
    ]
  );

  const [items, setItems] = useState<Quotation[]>([]);
  const [pagination, setPagination] = useState<QuotationPagination>({
    total: 0,
    limit: 50,
    offset: 0,
    has_more: false,
  });
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const load = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const params = new URLSearchParams();
      const f = effectiveFilters;
      if (f.search) params.set("search", f.search);
      if (f.status) params.set("status", f.status);
      if (f.fecha_desde) params.set("fecha_desde", f.fecha_desde);
      if (f.fecha_hasta) params.set("fecha_hasta", f.fecha_hasta);
      if (f.limit != null) params.set("limit", String(f.limit));
      if (f.offset != null) params.set("offset", String(f.offset));

      const res = await fetch(`/api/ventas/cotizaciones?${params}`, {
        credentials: "include",
        cache: "no-store",
      });
      const raw: unknown = await res.json().catch(() => ({}));

      if (!res.ok) {
        setError(errMessage(raw));
        setItems([]);
        return;
      }

      const { items: list, pagination: p } = parseList(raw);
      setItems(list);
      setPagination(p);
    } catch {
      setError("Error de red al cargar cotizaciones.");
      setItems([]);
    } finally {
      setLoading(false);
    }
  }, [effectiveFilters]);

  useEffect(() => {
    void load();
  }, [load]);

  return {
    items,
    pagination,
    loading,
    error,
    filters,
    setFilters,
    refetch: load,
  };
}
