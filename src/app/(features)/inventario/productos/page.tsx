"use client";

import { useSearchParams } from "next/navigation";
import { useCallback, useEffect, useState } from "react";
import CommonFooter from "@/core/common/footer/commonFooter";
import {
  useProducts,
  type ProductFilters as PF,
} from "@/hooks/useProducts";
import ProductFilters from "./components/ProductFilters";
import ProductTable from "./components/ProductTable";
import SummaryCards from "./components/SummaryCards";

export default function InventarioProductosPage() {
  const searchParams = useSearchParams();
  const [filters, setFilters] = useState<PF>({ limit: 50, offset: 0 });
  const { products, pagination, summary, loading, error } =
    useProducts(filters);

  useEffect(() => {
    const q = searchParams.get("search")?.trim();
    if (!q) return;
    setFilters((f) => (f.search === q ? f : { ...f, search: q, offset: 0 }));
  }, [searchParams]);

  const onPageChange = useCallback((offset: number) => {
    setFilters((f) => ({ ...f, offset }));
  }, []);

  const onClearFilters = useCallback(() => {
    setFilters({ limit: 50, offset: 0 });
  }, []);

  return (
    <div className="page-wrapper">
      <div className="content">
        <div className="page-header">
          <div className="page-title">
            <h4 className="mb-1">Inventario — Productos y Stock</h4>
            <p className="text-muted mb-0 small">
              {loading
                ? "Cargando…"
                : `${summary.total_products} productos en catálogo`}
            </p>
          </div>
        </div>

        <SummaryCards summary={summary} />

        <ProductFilters
          filters={filters}
          onChange={setFilters}
          products={products}
        />

        <ProductTable
          products={products}
          pagination={pagination}
          loading={loading}
          error={error}
          onPageChange={onPageChange}
          onClearFilters={onClearFilters}
        />

        <CommonFooter />
      </div>
    </div>
  );
}
