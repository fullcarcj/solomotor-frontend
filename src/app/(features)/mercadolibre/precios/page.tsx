"use client";
import { useCallback, useEffect, useRef, useState } from "react";
import type { MlListing } from "@/types/mercadolibre";
import MlListingsFilters, { type ListingsFiltersState } from "../components/MlListingsFilters";
import MlListingsTable from "../components/MlListingsTable";

const DEFAULT_FILTERS: ListingsFiltersState = { q: "", status: "", zero_stock: false, limit: 50, offset: 0 };

function parseListings(raw: unknown): { rows: MlListing[]; total: number } {
  if (!raw || typeof raw !== "object") return { rows: [], total: 0 };
  const r = raw as Record<string, unknown>;
  const inner = (r.data as Record<string, unknown>) ?? r;
  const rows: MlListing[] = Array.isArray(inner.rows) ? (inner.rows as MlListing[])
    : Array.isArray(inner.listings) ? (inner.listings as MlListing[])
    : Array.isArray(raw) ? (raw as MlListing[]) : [];
  return { rows, total: typeof inner.total === "number" ? inner.total : rows.length };
}

export default function PreciosPage() {
  const [filters, setFiltersState] = useState<ListingsFiltersState>(DEFAULT_FILTERS);
  const [listings, setListings]   = useState<MlListing[]>([]);
  const [total,    setTotal]      = useState(0);
  const [loading,  setLoading]    = useState(true);
  const [error,    setError]      = useState<string | null>(null);
  const debRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const load = useCallback(async (f: ListingsFiltersState) => {
    setLoading(true); setError(null);
    try {
      const p = new URLSearchParams({ limit: String(f.limit), offset: String(f.offset) });
      if (f.q)          p.set("q",          f.q);
      if (f.status)     p.set("status",     f.status);
      if (f.zero_stock) p.set("zero_stock", "true");
      const r = await fetch(`/api/mercadolibre/listings?${p}`, { credentials: "include" });
      const d: unknown = await r.json().catch(() => ({}));
      if (!r.ok) { throw new Error(((d as Record<string,unknown>).error as string) ?? `HTTP ${r.status}`); }
      const { rows, total: t } = parseListings(d);
      setListings(rows); setTotal(t);
    } catch (e) { setError(e instanceof Error ? e.message : "Error."); }
    finally { setLoading(false); }
  }, []);

  const setFilters = useCallback((partial: Partial<ListingsFiltersState>) => {
    setFiltersState(prev => {
      const next = { ...prev, ...partial };
      if (partial.q !== undefined && partial.q !== prev.q) {
        if (debRef.current) clearTimeout(debRef.current);
        debRef.current = setTimeout(() => void load(next), 300);
        return next;
      }
      void load(next);
      return next;
    });
  }, [load]);

  useEffect(() => { void load(DEFAULT_FILTERS); }, []); // eslint-disable-line react-hooks/exhaustive-deps

  return (
    <div className="page-wrapper">
      <div className="content">
        <div className="page-header">
          <div>
            <h4 className="page-title">Precios ML</h4>
            <p className="text-muted mb-0">{total > 0 ? `${total.toLocaleString()} publicaciones` : "Cargando…"}</p>
          </div>
        </div>

        <MlListingsFilters filters={filters} onChange={setFilters} />

        <div className="card">
          <div className="card-body">
            <MlListingsTable
              listings={listings} loading={loading} error={error}
              total={total} limit={filters.limit} offset={filters.offset}
              onPageChange={(o) => setFilters({ offset: o })}
            />
          </div>
        </div>
      </div>
    </div>
  );
}
