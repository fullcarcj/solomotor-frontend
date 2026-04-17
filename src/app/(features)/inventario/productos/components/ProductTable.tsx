"use client";

import type {
  Product,
  ProductsPagination,
} from "@/hooks/useProducts";
import StockBadge from "./StockBadge";

function formatUsd(n: number | null): string {
  if (n == null || Number.isNaN(Number(n))) return "—";
  return `$${Number(n).toFixed(2)}`;
}

async function copySku(sku: string): Promise<void> {
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
    } catch {
      /* noop */
    }
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
  const limit = Math.max(1, pagination.limit || 50);
  const total = pagination.total;
  const offset = pagination.offset;
  const totalPages = Math.max(1, Math.ceil(total / limit));
  const currentPage = Math.min(totalPages, Math.floor(offset / limit) + 1);

  const canPrev = offset > 0;
  const canNext = pagination.has_more;

  if (error) {
    return (
      <div className="alert alert-danger" role="alert">
        {error}
      </div>
    );
  }

  return (
    <div className="card">
      <div className="card-body p-0">
        <div className="table-responsive">
          <table className="table table-hover table-sm mb-0 align-middle">
            <thead className="table-light">
              <tr>
                <th scope="col">SKU</th>
                <th scope="col">Nombre</th>
                <th scope="col">Categoría</th>
                <th scope="col">Marca</th>
                <th scope="col">Stock</th>
                <th scope="col">Mín</th>
                <th scope="col">Precio USD</th>
                <th scope="col">Estado</th>
              </tr>
            </thead>
            <tbody>
              {loading ? (
                Array.from({ length: 10 }).map((_, i) => (
                  <tr key={`sk-${i}`}>
                    {Array.from({ length: 8 }).map((__, j) => (
                      <td key={j} className="py-3">
                        <p className="placeholder-glow mb-0">
                          <span className="placeholder col-12 rounded" />
                        </p>
                      </td>
                    ))}
                  </tr>
                ))
              ) : products.length === 0 ? (
                <tr>
                  <td colSpan={8} className="text-center py-5 text-muted">
                    <p className="mb-2">No se encontraron productos</p>
                    <button
                      type="button"
                      className="btn btn-sm btn-outline-primary"
                      onClick={onClearFilters}
                    >
                      Limpiar filtros
                    </button>
                  </td>
                </tr>
              ) : (
                products.map((p) => (
                  <tr
                    key={p.id}
                    className={
                      p.stock_alert ? "bg-warning bg-opacity-10" : undefined
                    }
                    style={{ cursor: "pointer" }}
                    onClick={() => {
                      console.log(p);
                    }}
                  >
                    <td
                      className="font-monospace small"
                      onClick={(e) => {
                        e.stopPropagation();
                        void copySku(p.sku);
                      }}
                      title="Clic para copiar SKU"
                    >
                      {p.sku}
                    </td>
                    <td>{p.name}</td>
                    <td>{p.category}</td>
                    <td>{p.brand}</td>
                    <td>
                      <StockBadge
                        qty={Number(p.stock_qty) || 0}
                        min={Number(p.stock_min) || 0}
                        alert={p.stock_alert}
                      />
                    </td>
                    <td>{p.stock_min}</td>
                    <td>{formatUsd(p.unit_price_usd)}</td>
                    <td>
                      {p.is_active ? (
                        <span className="badge bg-success">Activo</span>
                      ) : (
                        <span className="badge bg-secondary">Inactivo</span>
                      )}
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>
      {!loading && products.length > 0 && (
        <div className="card-footer d-flex flex-wrap align-items-center justify-content-between gap-2 py-3">
          <button
            type="button"
            className="btn btn-sm btn-outline-secondary"
            disabled={!canPrev}
            onClick={() => onPageChange(Math.max(0, offset - limit))}
          >
            ← Anterior
          </button>
          <span className="small text-muted">
            Página {currentPage} de {totalPages}
          </span>
          <button
            type="button"
            className="btn btn-sm btn-outline-secondary"
            disabled={!canNext}
            onClick={() => onPageChange(offset + limit)}
          >
            Siguiente →
          </button>
        </div>
      )}
    </div>
  );
}
