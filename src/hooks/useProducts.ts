"use client";

import { useCallback, useEffect, useMemo, useState } from "react";

export interface ProductFilters {
  search?: string;
  category?: string;
  brand?: string;
  alert?: boolean;
  limit?: number;
  offset?: number;
}

export interface Product {
  id: number;
  sku: string;
  name: string;
  description: string | null;
  category: string;
  brand: string;
  unit_price_usd: number | null;
  source: string;
  is_active: boolean;
  stock_qty: number;
  stock_min: number;
  stock_max: number | null;
  stock_alert: boolean;
  lead_time_days: number;
  safety_factor: number;
  supplier_id: number | null;
}

export interface ProductsPagination {
  total: number;
  limit: number;
  offset: number;
  has_more: boolean;
}

export interface ProductsSummary {
  total_products: number;
  alerts_count: number;
  stockout_count: number;
  ok_count: number;
}

interface ProductsResponse {
  data: {
    products: Product[];
    pagination: ProductsPagination;
    summary: ProductsSummary;
  };
}

function errMessage(payload: unknown): string {
  if (payload && typeof payload === "object") {
    const o = payload as Record<string, unknown>;
    const err = o.error;
    if (err && typeof err === "object") {
      const m = (err as { message?: string }).message;
      if (typeof m === "string") return m;
    }
    const m = o.message;
    if (typeof m === "string") return m;
  }
  return "No se pudo cargar el inventario.";
}

export function useProducts(filters: ProductFilters) {
  const [debouncedSearch, setDebouncedSearch] = useState(
    () => filters.search ?? ""
  );

  useEffect(() => {
    const t = setTimeout(() => {
      setDebouncedSearch(filters.search ?? "");
    }, 300);
    return () => clearTimeout(t);
  }, [filters.search]);

  /** No incluir `filters.search` en deps: solo cambia la petición tras debounce. */
  const effectiveFilters = useMemo(
    () => ({
      category: filters.category,
      brand: filters.brand,
      alert: filters.alert,
      limit: filters.limit,
      offset: filters.offset,
      search: debouncedSearch.trim() || undefined,
    }),
    [
      filters.category,
      filters.brand,
      filters.alert,
      filters.limit,
      filters.offset,
      debouncedSearch,
    ]
  );

  const [products, setProducts] = useState<Product[]>([]);
  const [pagination, setPagination] = useState<ProductsPagination>({
    total: 0,
    limit: filters.limit ?? 50,
    offset: filters.offset ?? 0,
    has_more: false,
  });
  const [summary, setSummary] = useState<ProductsSummary>({
    total_products: 0,
    alerts_count: 0,
    stockout_count: 0,
    ok_count: 0,
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
      if (f.category) params.set("category", f.category);
      if (f.brand) params.set("brand", f.brand);
      if (f.alert === true) params.set("alert", "true");
      if (f.limit != null) params.set("limit", String(f.limit));
      if (f.offset != null) params.set("offset", String(f.offset));

      const res = await fetch(`/api/inventario/productos?${params}`, {
        credentials: "include",
        cache: "no-store",
      });
      const raw: unknown = await res.json().catch(() => ({}));

      if (!res.ok) {
        setError(errMessage(raw));
        setProducts([]);
        return;
      }

      const body = raw as Partial<ProductsResponse>;
      const data = body.data;
      if (!data) {
        setError("Respuesta inválida del servidor.");
        setProducts([]);
        return;
      }

      setProducts(Array.isArray(data.products) ? data.products : []);
      if (data.pagination) setPagination(data.pagination);
      if (data.summary) setSummary(data.summary);
    } catch {
      setError("Error de red al cargar productos.");
      setProducts([]);
    } finally {
      setLoading(false);
    }
  }, [effectiveFilters]);

  useEffect(() => {
    void load();
  }, [load]);

  return {
    products,
    pagination,
    summary,
    loading,
    error,
    refetch: load,
  };
}
