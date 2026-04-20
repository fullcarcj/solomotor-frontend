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

function StockBar({ qty, min, max }: { qty: number; min: number; max: number | null }) {
  const cap = (max ?? Math.max(qty, min) * 2) || 1;
  const pct = Math.min(100, Math.round((qty / cap) * 100));
  const status = qty === 0 ? "out" : qty <= min ? "low" : "ok";
  return (
    <div className="pinv-bar-wrap">
      <div className={`pinv-bar pinv-bar--${status}`} style={{ width: `${pct}%` }} />
    </div>
  );
}

function SkeletonRow() {
  return (
    <tr className="placeholder-glow">
      {Array.from({ length: 7 }).map((_, i) => (
        <td key={i} style={{ padding: "14px 12px" }}>
          <span className="placeholder col-10 rounded" style={{ height: 12 }} />
        </td>
      ))}
    </tr>
  );
}

async function copySku(sku: string) {
  try {
    await navigator.clipboard.writeText(sku);
  } catch {
    try {
      const ta = document.createElement("textarea");
      ta.value = sku;
      ta.style.position = "fixed";
      ta.style.left = "-9999px";
      document.body.appendChild(ta);
      ta.select();
      document.execCommand("copy");
      document.body.removeChild(ta);
    } catch { /* noop */ }
  }
}

export default function ProductTable({
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
  const limit       = Math.max(1, pagination.limit || 50);
  const total       = pagination.total;
  const offset      = pagination.offset;
  const totalPages  = Math.max(1, Math.ceil(total / limit));
  const currentPage = Math.min(totalPages, Math.floor(offset / limit) + 1);

  if (error) {
    return <div className="alert alert-danger rounded-3">{error}</div>;
  }

  return (
    <div className="pinv-table-wrap">
      <table className="pinv-table">
        <thead>
          <tr>
            <th className="pinv-th pinv-th--product">Producto</th>
            <th className="pinv-th">Categoría</th>
            <th className="pinv-th">Marca</th>
            <th className="pinv-th pinv-th--num">Stock</th>
            <th className="pinv-th pinv-th--num">Precio USD</th>
            <th className="pinv-th pinv-th--center">Estado</th>
            <th className="pinv-th pinv-th--actions" />
          </tr>
        </thead>
        <tbody>
          {loading ? (
            Array.from({ length: 12 }).map((_, i) => <SkeletonRow key={i} />)
          ) : products.length === 0 ? (
            <tr>
              <td colSpan={7} className="pinv-empty-cell">
                <div className="pinv-empty">
                  <i className="ti ti-package-off pinv-empty__icon" />
                  <p className="pinv-empty__msg">No se encontraron productos</p>
                  <button
                    type="button"
                    className="btn btn-sm btn-outline-secondary"
                    onClick={onClearFilters}
                  >
                    Limpiar filtros
                  </button>
                </div>
              </td>
            </tr>
          ) : (
            products.map((p, i) => {
              const status = stockStatus(p);
              const qty    = Number(p.stock_qty) || 0;
              const min    = Number(p.stock_min) || 0;

              return (
                <tr key={p.id} className={`pinv-row pinv-row--${status}`}>
                  {/* Product: thumb + category + name + SKU */}
                  <td className="pinv-td pinv-td--product">
                    <div className="pinv-product">
                      <div className="pinv-product__thumb">
                        <ProductThumb sku={p.sku} name={p.name} size={54} colorIndex={i % 6} />
                        {i < 99 && qty === 0 && (
                          <span className="pinv-product__img-badge pinv-product__img-badge--out">!</span>
                        )}
                      </div>
                      <div className="pinv-product__info">
                        <div className="pinv-product__cat">{p.category}</div>
                        <div className="pinv-product__name" title={p.name}>{p.name}</div>
                        <div className="pinv-product__sku">
                          <span className="pinv-product__sku-lb">SKU</span>
                          <span
                            className="pinv-product__sku-val"
                            title="Clic para copiar"
                            onClick={(e) => { e.stopPropagation(); void copySku(p.sku); }}
                          >
                            {p.sku}
                          </span>
                        </div>
                      </div>
                    </div>
                  </td>

                  {/* Categoría */}
                  <td className="pinv-td">
                    <span className="pinv-cat">{p.category || "—"}</span>
                  </td>

                  {/* Marca */}
                  <td className="pinv-td">
                    <span className="pinv-brand">{p.brand || "—"}</span>
                  </td>

                  {/* Stock */}
                  <td className="pinv-td pinv-td--num">
                    <div className="pinv-stock">
                      <span className={`pinv-stock__qty pinv-stock__qty--${status}`}>{qty}</span>
                      <div className="pinv-stock__range">
                        mín {min}{p.stock_max != null ? ` · máx ${p.stock_max}` : ""}
                      </div>
                      <StockBar qty={qty} min={min} max={p.stock_max ?? null} />
                    </div>
                  </td>

                  {/* Precio */}
                  <td className="pinv-td pinv-td--num">
                    <span className="pinv-price">{fmtUsd(p.unit_price_usd)}</span>
                  </td>

                  {/* Estado */}
                  <td className="pinv-td pinv-td--center">
                    {p.is_active
                      ? <span className="pinv-badge pinv-badge--ok">Activo</span>
                      : <span className="pinv-badge pinv-badge--muted">Inactivo</span>}
                  </td>

                  {/* Acciones */}
                  <td className="pinv-td pinv-td--actions">
                    <button className="pinv-kebab" type="button" aria-label="Acciones">
                      <i className="ti ti-dots-vertical" />
                    </button>
                  </td>
                </tr>
              );
            })
          )}
        </tbody>
      </table>

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
    </div>
  );
}
