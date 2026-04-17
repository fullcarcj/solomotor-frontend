"use client";

import { useMemo } from "react";
import type { Product, ProductFilters as PF } from "@/hooks/useProducts";

export default function ProductFilters({
  filters,
  onChange,
  products,
}: {
  filters: PF;
  onChange: (next: PF) => void;
  products: Product[];
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

  const limit = filters.limit ?? 50;

  const clear = () => {
    onChange({
      limit,
      offset: 0,
      search: undefined,
      category: undefined,
      brand: undefined,
      alert: undefined,
    });
  };

  return (
    <div className="card mb-4">
      <div className="card-body py-3">
        <div className="row g-2 align-items-end flex-wrap">
          <div className="col-12 col-lg-4">
            <label className="form-label small text-muted mb-1">
              Buscar por SKU o nombre
            </label>
            <div className="input-group input-group-sm">
              <span className="input-group-text" aria-hidden>
                🔍
              </span>
              <input
                type="search"
                className="form-control"
                placeholder="SKU o nombre…"
                value={filters.search ?? ""}
                onChange={(e) =>
                  onChange({
                    ...filters,
                    search: e.target.value || undefined,
                    offset: 0,
                  })
                }
                autoComplete="off"
              />
            </div>
          </div>
          <div className="col-12 col-md-6 col-lg-2">
            <label className="form-label small text-muted mb-1">Categoría</label>
            <select
              className="form-select form-select-sm"
              value={filters.category ?? ""}
              onChange={(e) =>
                onChange({
                  ...filters,
                  category: e.target.value || undefined,
                  offset: 0,
                })
              }
            >
              <option value="">Todas</option>
              {categories.map((c) => (
                <option key={c} value={c}>
                  {c}
              </option>
              ))}
            </select>
          </div>
          <div className="col-12 col-md-6 col-lg-2">
            <label className="form-label small text-muted mb-1">Marca</label>
            <select
              className="form-select form-select-sm"
              value={filters.brand ?? ""}
              onChange={(e) =>
                onChange({
                  ...filters,
                  brand: e.target.value || undefined,
                  offset: 0,
                })
              }
            >
              <option value="">Todas</option>
              {brands.map((b) => (
                <option key={b} value={b}>
                  {b}
                </option>
              ))}
            </select>
          </div>
          <div className="col-12 col-md-6 col-lg-2">
            <div className="form-check mt-3 mt-lg-4">
              <input
                id="inv-alert-only"
                type="checkbox"
                className="form-check-input"
                checked={filters.alert === true}
                onChange={(e) =>
                  onChange({
                    ...filters,
                    alert: e.target.checked ? true : undefined,
                    offset: 0,
                  })
                }
              />
              <label className="form-check-label small" htmlFor="inv-alert-only">
                ⚠ Solo alertas
              </label>
            </div>
          </div>
          <div className="col-12 col-lg-2 text-lg-end">
            <button
              type="button"
              className="btn btn-outline-secondary btn-sm"
              onClick={clear}
            >
              Limpiar filtros
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
