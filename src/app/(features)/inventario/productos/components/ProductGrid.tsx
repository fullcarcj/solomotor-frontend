"use client";

import type { Product, ProductsPagination } from "@/hooks/useProducts";
import ProductThumb from "./ProductThumb";

function fmtUsd(n: number | null | undefined): string {
  if (n == null || Number.isNaN(Number(n))) return "—";
  return `$${Number(n).toLocaleString("es-VE", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
}

function stockStatus(p: Product): "ok" | "low" | "out" {
  const qty = Number(p.stock_qty) || 0;
  const min = Number(p.stock_min) || 0;
  if (qty === 0) return "out";
  if (p.stock_alert || qty <= min) return "low";
  return "ok";
}

const STOCK_LABELS = { ok: "En stock", low: "Stock bajo", out: "Sin stock" };
const STOCK_ICONS  = { ok: "circle-check", low: "alert-triangle", out: "circle-x" };

function SkeletonCard() {
  return (
    <div className="pinv-card pinv-card--skeleton">
      <div className="pinv-card__img-wrap placeholder-glow">
        <span className="placeholder w-100 h-100 d-block" style={{ borderRadius: 0 }} />
      </div>
      <div className="pinv-card__body placeholder-glow d-flex flex-column gap-2 p-3">
        <span className="placeholder col-4 rounded" style={{ height: 10 }} />
        <span className="placeholder col-10 rounded" style={{ height: 14 }} />
        <span className="placeholder col-6 rounded" style={{ height: 10 }} />
        <div className="d-flex justify-content-between mt-1">
          <span className="placeholder col-4 rounded" style={{ height: 20 }} />
          <span className="placeholder col-3 rounded" style={{ height: 20 }} />
        </div>
      </div>
    </div>
  );
}

export default function ProductGrid({
  products,
  pagination,
  loading,
  error,
  onPageChange,
  onClearFilters,
}: {
  products: Product[];
  pagination: ProductsPagination;
  loading: boolean;
  error: string | null;
  onPageChange: (offset: number) => void;
  onClearFilters: () => void;
}) {
  const limit  = Math.max(1, pagination.limit || 50);
  const total  = pagination.total;
  const offset = pagination.offset;
  const totalPages  = Math.max(1, Math.ceil(total / limit));
  const currentPage = Math.min(totalPages, Math.floor(offset / limit) + 1);

  if (error) {
    return (
      <div className="alert alert-danger rounded-3">{error}</div>
    );
  }

  if (!loading && products.length === 0) {
    return (
      <div className="pinv-empty">
        <i className="ti ti-package-off pinv-empty__icon" />
        <p className="pinv-empty__msg">No se encontraron productos</p>
        <button type="button" className="btn btn-sm btn-outline-secondary" onClick={onClearFilters}>
          Limpiar filtros
        </button>
      </div>
    );
  }

  return (
    <>
      <div className="pinv-grid">
        {loading
          ? Array.from({ length: 12 }).map((_, i) => <SkeletonCard key={i} />)
          : products.map((p, i) => {
              const status = stockStatus(p);
              return (
                <div key={p.id} className={`pinv-card pinv-card--${status}`}>
                  {/* Image */}
                  <div className="pinv-card__img-wrap">
                    <ProductThumb sku={p.sku} name={p.name} size={180} colorIndex={i % 6} className="pinv-card__img" />
                    {/* Source badge */}
                    {p.source && (
                      <span className={`pinv-source pinv-source--${p.source}`}>
                        {p.source === "oem" ? "OEM" : p.source === "migrated" ? "MIG" : "ERP"}
                      </span>
                    )}
                    {/* Stock out overlay */}
                    {status !== "ok" && (
                      <span className={`pinv-stock-overlay pinv-stock-overlay--${status}`}>
                        <i className={`ti ti-${STOCK_ICONS[status]}`} />
                        {status === "out" ? "Sin stock" : `${Number(p.stock_qty) || 0} uds`}
                      </span>
                    )}
                  </div>

                  {/* Body */}
                  <div className="pinv-card__body">
                    <div className="pinv-card__cat">{p.category}</div>
                    <div className="pinv-card__name" title={p.name}>{p.name}</div>
                    <div className="pinv-card__sku">
                      <span className="pinv-card__sku-lb">SKU</span>{p.sku}
                    </div>

                    <div className="pinv-card__divider" />

                    <div className="pinv-card__stock-row">
                      <span className={`pinv-stag pinv-stag--${status}`}>
                        <span className="pinv-stag__dot" />
                        {STOCK_LABELS[status]}
                      </span>
                      <span className="pinv-card__qty">
                        {Number(p.stock_qty) || 0}
                        <span className="pinv-card__qty-unit"> uds</span>
                      </span>
                    </div>

                    <div className="pinv-card__price-row">
                      <div className="pinv-card__price">
                        <span className="pinv-card__price-usd">{fmtUsd(p.unit_price_usd)}</span>
                        <span className="pinv-card__price-label">USD</span>
                      </div>
                      {p.stock_min > 0 && (
                        <span className="pinv-card__min">mín {p.stock_min}</span>
                      )}
                    </div>
                  </div>

                  {/* Footer */}
                  <div className="pinv-card__footer">
                    <span className="pinv-card__brand">
                      <span className="pinv-card__brand-lb">Marca </span>{p.brand || "—"}
                    </span>
                    <span className="pinv-spacer" />
                    {!p.is_active && (
                      <span className="badge bg-secondary" style={{ fontSize: 9 }}>Inactivo</span>
                    )}
                  </div>
                </div>
              );
            })}
      </div>

      {/* Pagination */}
      {!loading && products.length > 0 && (
        <div className="pinv-pagination">
          <button
            type="button"
            className="btn btn-sm btn-outline-secondary"
            disabled={offset === 0}
            onClick={() => onPageChange(Math.max(0, offset - limit))}
          >
            <i className="ti ti-chevron-left me-1" />Anterior
          </button>
          <span className="pinv-pagination__label">
            Pág. {currentPage} / {totalPages}
            <span className="pinv-pagination__total"> · {total} productos</span>
          </span>
          <button
            type="button"
            className="btn btn-sm btn-outline-secondary"
            disabled={!pagination.has_more}
            onClick={() => onPageChange(offset + limit)}
          >
            Siguiente<i className="ti ti-chevron-right ms-1" />
          </button>
        </div>
      )}
    </>
  );
}
