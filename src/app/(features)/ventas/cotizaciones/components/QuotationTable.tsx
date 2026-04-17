"use client";

import type { Quotation, QuotationPagination } from "@/types/quotations";
import QuotationStatusBadge from "./QuotationStatusBadge";

function ReferenceBadges({ reference }: { reference: string }) {
  const r = reference.trim();
  const u = r.toUpperCase();
  let badgeClass = "bg-secondary";
  let short = "COT";
  if (u.startsWith("COT-WA")) {
    badgeClass = "bg-success";
    short = "COT-WA";
  } else if (u.startsWith("COT-ML")) {
    badgeClass = "bg-warning text-dark";
    short = "COT-ML";
  } else if (u.startsWith("COT-")) {
    badgeClass = "bg-secondary";
    short = "COT";
  }
  return (
    <div className="d-flex align-items-center gap-1 flex-wrap">
      <span className={`badge ${badgeClass}`}>{short}</span>
      <span className="font-monospace small">{r}</span>
    </div>
  );
}

function fmtCreacion(iso: string): string {
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

function fmtVencimiento(iso: string | null): { text: string; expired: boolean } {
  if (!iso) return { text: "—", expired: false };
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return { text: "—", expired: false };
  const day = d.toLocaleDateString("es-VE", {
    day: "2-digit",
    month: "2-digit",
    year: "numeric",
  });
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const cmp = new Date(d);
  cmp.setHours(0, 0, 0, 0);
  return { text: day, expired: cmp < today };
}

function fmtTotal(total: number | string | null | undefined): string {
  if (total == null || total === "") return "—";
  const n = Number(total);
  if (Number.isNaN(n)) return "—";
  return `$${n.toFixed(2)}`;
}

export default function QuotationTable({
  items,
  pagination,
  loading,
  error,
  onPageChange,
  onClearFilters,
}: {
  items: Quotation[];
  pagination: QuotationPagination;
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
                <th scope="col">Referencia</th>
                <th scope="col">Cliente</th>
                <th scope="col">Ítems</th>
                <th scope="col">Total USD</th>
                <th scope="col">Estado</th>
                <th scope="col">Vencimiento</th>
                <th scope="col">Fecha</th>
              </tr>
            </thead>
            <tbody>
              {loading ? (
                Array.from({ length: 8 }).map((_, i) => (
                  <tr key={`sk-${i}`}>
                    {Array.from({ length: 7 }).map((__, j) => (
                      <td key={j} className="py-3">
                        <p className="placeholder-glow mb-0">
                          <span className="placeholder col-12 rounded" />
                        </p>
                      </td>
                    ))}
                  </tr>
                ))
              ) : items.length === 0 ? (
                <tr>
                  <td colSpan={7} className="text-center py-5 text-muted">
                    <p className="mb-2">No hay cotizaciones</p>
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
                items.map((q) => {
                  const v = fmtVencimiento(q.fecha_vencimiento);
                  return (
                    <tr
                      key={q.id}
                      style={{ cursor: "pointer" }}
                      onClick={() => {
                        console.log(q);
                      }}
                    >
                      <td>
                        <ReferenceBadges reference={q.reference} />
                      </td>
                      <td>{q.cliente_nombre?.trim() || "Sin cliente"}</td>
                      <td>
                        <span className="badge bg-light text-dark">
                          {Number(q.items_count) || 0}
                        </span>
                      </td>
                      <td>{fmtTotal(q.total)}</td>
                      <td>
                        <QuotationStatusBadge status={q.status} />
                      </td>
                      <td className={v.expired ? "text-danger" : undefined}>
                        {v.text}
                      </td>
                      <td className="small">{fmtCreacion(q.fecha_creacion)}</td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </div>
      {!loading && items.length > 0 && (
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
