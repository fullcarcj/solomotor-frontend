import type { Customer, CustomersMeta } from "@/types/customers";
import CustomerStatusBadge from "./CustomerStatusBadge";
import CustomerTypeBadge from "./CustomerTypeBadge";

/* ── Helpers ─────────────────────────────────────────────────────────────── */

function fmtDate(iso: string | null): { text: string; recent: boolean } {
  if (!iso) return { text: "Sin compras", recent: false };
  const d = new Date(iso);
  if (isNaN(d.getTime())) return { text: iso, recent: false };
  const diffDays = (Date.now() - d.getTime()) / 86_400_000;
  return {
    text: d.toLocaleDateString("es-VE", {
      day: "2-digit",
      month: "2-digit",
      year: "numeric",
    }),
    recent: diffDays < 30,
  };
}

function fmtUsd(v: number | string | null | undefined): string {
  const n = Number(v);
  if (!Number.isFinite(n) || n === 0) return "—";
  return `$${n.toFixed(2)}`;
}

/* ── Skeleton ────────────────────────────────────────────────────────────── */

function SkeletonRow() {
  return (
    <tr>
      {Array.from({ length: 7 }).map((_, i) => (
        <td key={i}>
          <span className="placeholder-glow d-block">
            <span className="placeholder col-8 rounded" />
          </span>
        </td>
      ))}
    </tr>
  );
}

/* ── Props ───────────────────────────────────────────────────────────────── */

interface Props {
  customers:    Customer[];
  meta:         CustomersMeta;
  loading:      boolean;
  error:        string | null;
  onRowClick:   (id: number) => void;
  onPageChange: (offset: number) => void;
  onRetry:      () => void;
}

/* ── Componente ──────────────────────────────────────────────────────────── */

export default function CustomerTable({
  customers,
  meta,
  loading,
  error,
  onRowClick,
  onPageChange,
  onRetry,
}: Props) {
  const totalPages = Math.max(1, Math.ceil(meta.total / meta.limit));
  const currentPage = Math.floor(meta.offset / meta.limit) + 1;

  return (
    <>
      {error && (
        <div
          className="alert alert-danger d-flex align-items-center gap-3 mb-3"
          role="alert"
        >
          <i className="ti ti-alert-circle" />
          <span className="flex-fill">{error}</span>
          <button
            type="button"
            className="btn btn-sm btn-outline-danger"
            onClick={onRetry}
          >
            Reintentar
          </button>
        </div>
      )}

      <div className="card">
        <div className="table-responsive">
          <table className="table table-hover table-sm mb-0">
            <thead className="table-light">
              <tr>
                <th className="ps-3">Nombre</th>
                <th>Teléfono</th>
                <th>Tipo</th>
                <th>Estado</th>
                <th className="text-center">Órdenes</th>
                <th className="text-end">USD Total</th>
                <th className="text-end pe-3">Última Compra</th>
              </tr>
            </thead>
            <tbody>
              {loading &&
                Array.from({ length: 10 }).map((_, i) => (
                  <SkeletonRow key={i} />
                ))}

              {!loading && !error && customers.length === 0 && (
                <tr>
                  <td colSpan={7} className="text-center text-muted py-4">
                    No se encontraron clientes
                  </td>
                </tr>
              )}

              {!loading &&
                customers.map((c) => {
                  const lastOrder = fmtDate(c.last_order_date);
                  return (
                    <tr
                      key={c.id}
                      style={{ cursor: "pointer" }}
                      onClick={() => onRowClick(c.id)}
                    >
                      {/* Nombre */}
                      <td className="ps-3">
                        <span className="fw-semibold">{c.full_name}</span>
                        {c.primary_ml_buyer_id && (
                          <span className="badge bg-warning text-dark ms-1 badge-xs">
                            ML
                          </span>
                        )}
                      </td>

                      {/* Teléfono */}
                      <td className="text-nowrap">
                        {c.phone ?? <span className="text-muted">—</span>}
                      </td>

                      {/* Tipo */}
                      <td>
                        <CustomerTypeBadge type={c.customer_type} />
                      </td>

                      {/* Estado */}
                      <td>
                        <CustomerStatusBadge status={c.crm_status} />
                      </td>

                      {/* Órdenes */}
                      <td className="text-center">
                        <span className="badge bg-light text-dark border">
                          {c.total_orders}
                        </span>
                      </td>

                      {/* USD Total */}
                      <td className="text-end fw-semibold">
                        {fmtUsd(c.total_spent_usd)}
                      </td>

                      {/* Última Compra */}
                      <td
                        className={`text-end pe-3 ${
                          lastOrder.recent
                            ? "text-success fw-semibold"
                            : "text-muted"
                        }`}
                      >
                        {lastOrder.text}
                      </td>
                    </tr>
                  );
                })}
            </tbody>
          </table>
        </div>

        {/* Paginación */}
        {!loading && meta.total > meta.limit && (
          <div className="card-footer d-flex align-items-center justify-content-between py-2">
            <button
              type="button"
              className="btn btn-sm btn-outline-secondary"
              disabled={currentPage <= 1}
              onClick={() =>
                onPageChange(Math.max(0, meta.offset - meta.limit))
              }
            >
              <i className="ti ti-chevron-left me-1" />
              Anterior
            </button>

            <span className="small text-muted">
              Página{" "}
              <strong>{currentPage}</strong> de{" "}
              <strong>{totalPages}</strong>
              {" "}·{" "}{meta.total} clientes
            </span>

            <button
              type="button"
              className="btn btn-sm btn-outline-secondary"
              disabled={currentPage >= totalPages}
              onClick={() =>
                onPageChange(meta.offset + meta.limit)
              }
            >
              Siguiente
              <i className="ti ti-chevron-right ms-1" />
            </button>
          </div>
        )}
      </div>
    </>
  );
}
