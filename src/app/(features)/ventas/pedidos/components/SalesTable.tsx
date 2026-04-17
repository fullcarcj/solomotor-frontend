"use client";

import type { Sale, SalesMeta } from "@/types/sales";
import SaleSourceBadge from "./SaleSourceBadge";
import SaleStatusBadge from "./SaleStatusBadge";

function fmtDate(iso: string): string {
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return "—";
  return d.toLocaleString("es-VE", {
    day: "2-digit",
    month: "2-digit",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });
}

function fmtUsd(v: number | string): string {
  const n = Number(v);
  if (Number.isNaN(n)) return "—";
  return `$${n.toFixed(2)}`;
}

export default function SalesTable({
  sales,
  meta,
  loading,
  error,
  onRowClick,
  onPageChange,
  onRequestDispatch,
}: {
  sales: Sale[];
  meta: SalesMeta;
  loading: boolean;
  error: string | null;
  onRowClick: (id: string | number) => void;
  onPageChange: (offset: number) => void;
  onRequestDispatch?: (sale: Sale) => void;
}) {
  const limit = Math.max(1, meta.limit || 50);
  const total = meta.total;
  const offset = meta.offset;
  const totalPages = Math.max(1, Math.ceil(total / limit));
  const currentPage = Math.min(totalPages, Math.floor(offset / limit) + 1);
  const canPrev = offset > 0;
  const canNext = offset + limit < total;

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
                <th>ID</th>
                <th>Canal</th>
                <th>Cliente</th>
                <th>Total USD</th>
                <th>Estado</th>
                <th>Vendedor</th>
                <th>Fecha</th>
                {onRequestDispatch && <th>Despacho</th>}
              </tr>
            </thead>
            <tbody>
              {loading ? (
                Array.from({ length: 10 }).map((_, i) => (
                  <tr key={`sk-${i}`}>
                    {Array.from({ length: onRequestDispatch ? 8 : 7 }).map((__, j) => (
                      <td key={j} className="py-3">
                        <p className="placeholder-glow mb-0">
                          <span className="placeholder col-12 rounded" />
                        </p>
                      </td>
                    ))}
                  </tr>
                ))
              ) : sales.length === 0 ? (
                <tr>
                  <td colSpan={onRequestDispatch ? 8 : 7} className="text-center py-5 text-muted">
                    No hay ventas con estos filtros
                  </td>
                </tr>
              ) : (
                sales.map((s) => (
                  <tr
                    key={s.id}
                    style={{ cursor: "pointer" }}
                    onClick={() => onRowClick(s.id)}
                  >
                    <td className="font-monospace small">#{s.id}</td>
                    <td>
                      <SaleSourceBadge source={s.source} />
                    </td>
                    <td className="small">
                      {s.customer_id != null
                        ? `#${s.customer_id}`
                        : "Consumidor final"}
                    </td>
                    <td>{fmtUsd(s.total_usd)}</td>
                    <td>
                      <SaleStatusBadge status={s.status} />
                    </td>
                    <td className="small">{s.sold_by?.trim() || "—"}</td>
                    <td className="small">{fmtDate(s.created_at)}</td>
                    {onRequestDispatch && (
                      <td onClick={(e) => e.stopPropagation()}>
                        {s.status === "paid" ? (
                          <button
                            type="button"
                            className="btn btn-sm btn-outline-primary"
                            onClick={() => onRequestDispatch(s)}
                          >
                            Solicitar
                          </button>
                        ) : s.status === "ready_to_ship" ? (
                          <span className="badge bg-info text-dark">En cola</span>
                        ) : s.status === "shipped" || s.status === "dispatched" ? (
                          <span className="badge bg-success">Despachado</span>
                        ) : null}
                      </td>
                    )}
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>
      {!loading && sales.length > 0 && (
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
