"use client";

import "./productos-inv.scss";

import { useSearchParams } from "next/navigation";
import { useCallback, useEffect, useState } from "react";
import {
  useProducts,
  type ProductFilters as PF,
} from "@/hooks/useProducts";
import ProductFilters from "./components/ProductFilters";
import ProductGrid    from "./components/ProductGrid";
import ProductTable   from "./components/ProductTable";
import SummaryCards   from "./components/SummaryCards";

type ViewMode = "grid" | "table";

export default function InventarioProductosPage() {
  const searchParams = useSearchParams();
  const [filters, setFilters] = useState<PF>({ limit: 48, offset: 0 });
  const [view, setView] = useState<ViewMode>("table");

  const { products, pagination, summary, loading, error } = useProducts(filters);

  useEffect(() => {
    const q = searchParams.get("search")?.trim();
    if (!q) return;
    setFilters((f) => (f.search === q ? f : { ...f, search: q, offset: 0 }));
  }, [searchParams]);

  const onPageChange   = useCallback((offset: number) => setFilters((f) => ({ ...f, offset })), []);
  const onClearFilters = useCallback(() => setFilters({ limit: 48, offset: 0 }), []);

  const sharedProps = { products, pagination, loading, error, onPageChange, onClearFilters };

  return (
    <div className="page-wrapper">
      <div className="content">

        {/* Header */}
        <div className="pinv-page-header">
          <div className="pinv-page-title">
            <h4>Productos y Stock</h4>
            <p>
              {loading
                ? "Cargando catálogo…"
                : `${summary.total_products.toLocaleString("es-VE")} productos en catálogo`}
            </p>
          </div>

          {/* View toggle */}
          <div className="d-flex align-items-center gap-3">
            <div className="pinv-view-toggle">
              <button
                type="button"
                title="Vista lista"
                className={`pinv-view-btn ${view === "table" ? "pinv-view-btn--active" : ""}`}
                onClick={() => setView("table")}
              >
                <i className="ti ti-layout-list" />
              </button>
              <button
                type="button"
                title="Vista catálogo"
                className={`pinv-view-btn ${view === "grid" ? "pinv-view-btn--active" : ""}`}
                onClick={() => setView("grid")}
              >
                <i className="ti ti-layout-grid" />
              </button>
            </div>
          </div>
        </div>

        {/* KPI Ribbon */}
        <SummaryCards summary={summary} loading={loading} />

        {/* Filters */}
        <ProductFilters
          filters={filters}
          onChange={setFilters}
          products={products}
          total={pagination.total}
        />

        {/* Content */}
        {view === "grid"
          ? <ProductGrid  {...sharedProps} />
          : <ProductTable {...sharedProps} />}

      </div>
    </div>
  );
}
