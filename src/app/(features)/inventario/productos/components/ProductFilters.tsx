"use client";

import { useMemo } from "react";
import type { Product, ProductFilters as PF } from "@/hooks/useProducts";

export default function ProductFilters({
  filters,
  onChange,
  products,
  total,
}: {
  filters: PF;
  onChange: (next: PF) => void;
  products: Product[];
  total?: number;
}) {
  const categories = useMemo(() => {
    const s = new Set<string>();
    for (const p of products) {
      const c = p.category?.trim();
      if (c) s.add(c);
    }
    return [...s].sort((a, b) => a.localeCompare(b, "es"));
  }, [products]);

  const brands = useMemo(() => {
    const s = new Set<string>();
    for (const p of products) {
      const b = p.brand?.trim();
      if (b) s.add(b);
    }
    return [...s].sort((a, b) => a.localeCompare(b, "es"));
  }, [products]);

  const hasFilters =
    !!filters.search || !!filters.category || !!filters.brand || !!filters.alert;

  const clear = () =>
    onChange({ limit: filters.limit, offset: 0 });

  const set = (patch: Partial<PF>) =>
    onChange({ ...filters, ...patch, offset: 0 });

  return (
    <div className="pinv-filters">
      {/* Search */}
      <div className="pinv-filters__search">
        <i className="ti ti-search pinv-filters__search-icon" />
        <input
          type="search"
          className="pinv-filters__search-input"
          placeholder="Buscar SKU o nombre…"
          value={filters.search ?? ""}
          onChange={(e) => set({ search: e.target.value || undefined })}
          autoComplete="off"
        />
        {filters.search && (
          <button
            type="button"
            className="pinv-filters__search-clear"
            onClick={() => set({ search: undefined })}
            aria-label="Limpiar búsqueda"
          >
            <i className="ti ti-x" />
          </button>
        )}
      </div>

      <div className="pinv-filters__sep" />

      {/* Category pills */}
      <div className="pinv-filters__pills">
        <button
          type="button"
          className={`pinv-pill ${!filters.category ? "pinv-pill--active" : ""}`}
          onClick={() => set({ category: undefined })}
        >
          Todas las categorías
          {total != null && !filters.category && (
            <span className="pinv-pill__cnt">{total}</span>
          )}
        </button>
        {categories.map((c) => (
          <button
            key={c}
            type="button"
            className={`pinv-pill ${filters.category === c ? "pinv-pill--active" : ""}`}
            onClick={() => set({ category: filters.category === c ? undefined : c })}
          >
            {c}
          </button>
        ))}
      </div>

      <div className="pinv-filters__sep" />

      {/* Brand select */}
      <select
        className="pinv-filters__select"
        value={filters.brand ?? ""}
        onChange={(e) => set({ brand: e.target.value || undefined })}
      >
        <option value="">Todas las marcas</option>
        {brands.map((b) => (
          <option key={b} value={b}>{b}</option>
        ))}
      </select>

      {/* Alert toggle */}
      <button
        type="button"
        className={`pinv-pill pinv-pill--alert ${filters.alert ? "pinv-pill--active" : ""}`}
        onClick={() => set({ alert: filters.alert ? undefined : true })}
      >
        <i className="ti ti-alert-triangle" />
        Alertas
      </button>

      {/* Clear */}
      {hasFilters && (
        <button
          type="button"
          className="pinv-pill pinv-pill--clear"
          onClick={clear}
        >
          <i className="ti ti-x" />
          Limpiar
        </button>
      )}
    </div>
  );
}
