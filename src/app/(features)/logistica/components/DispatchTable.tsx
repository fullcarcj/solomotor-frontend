import type { DispatchRecord, DispatchPagination } from "@/types/dispatch";
import DispatchStatusBadge from "./DispatchStatusBadge";
import DispatchChannelBadge from "./DispatchChannelBadge";

function fmtDT(iso: string | null): string {
  if (!iso) return "—";
  const d = new Date(iso);
  if (isNaN(d.getTime())) return iso;
  return d.toLocaleString("es-VE", { day: "2-digit", month: "2-digit", year: "numeric", hour: "2-digit", minute: "2-digit" });
}

function SkeletonRow({ cols }: { cols: number }) {
  return (
    <tr>
      {Array.from({ length: cols }).map((_, i) => (
        <td key={i}>
          <span className="placeholder-glow d-block">
            <span className="placeholder col-8 rounded" />
          </span>
        </td>
      ))}
    </tr>
  );
}

interface Props {
  records:      DispatchRecord[];
  pagination:   DispatchPagination;
  loading:      boolean;
  error:        string | null;
  actionLabel:  string;
  onAction:     (record: DispatchRecord) => void;
  onPageChange: (offset: number) => void;
  onRetry?:     () => void;
  emptyMessage?: string;
  showAction?:  boolean;
}

export default function DispatchTable({
  records,
  pagination,
  loading,
  error,
  actionLabel,
  onAction,
  onPageChange,
  onRetry,
  emptyMessage = "No hay despachos en esta vista",
  showAction = true,
}: Props) {
  const cols = showAction ? 8 : 7;
  const totalPages  = Math.max(1, Math.ceil(pagination.total / pagination.limit));
  const currentPage = Math.floor(pagination.offset / pagination.limit) + 1;
  const canPrev = pagination.offset > 0;
  const canNext = pagination.has_more || currentPage < totalPages;

  return (
    <>
      {error && (
        <div className="alert alert-danger d-flex align-items-center gap-3" role="alert">
          <i className="ti ti-alert-circle" />
          <span className="flex-fill">{error}</span>
          {onRetry && (
            <button type="button" className="btn btn-sm btn-outline-danger" onClick={onRetry}>
              Reintentar
            </button>
          )}
        </div>
      )}

      <div className="card">
        <div className="table-responsive">
          <table className="table table-hover table-sm mb-0 align-middle">
            <thead className="table-light">
              <tr>
                <th className="ps-3">#</th>
                <th>Canal</th>
                <th>Referencia</th>
                <th>Cliente ID</th>
                <th>Solicitado por</th>
                <th>Fecha</th>
                <th>Estado</th>
                {showAction && <th className="pe-3">Acción</th>}
              </tr>
            </thead>
            <tbody>
              {loading && Array.from({ length: 8 }).map((_, i) => <SkeletonRow key={i} cols={cols} />)}

              {!loading && records.length === 0 && (
                <tr>
                  <td colSpan={cols} className="text-center text-muted py-5">
                    <i className="ti ti-package-off d-block fs-30 mb-2 opacity-50" />
                    {emptyMessage}
                  </td>
                </tr>
              )}

              {!loading && records.map((r) => (
                <tr key={r.dispatch_id}>
                  <td className="ps-3 font-monospace small">#{r.dispatch_id}</td>
                  <td><DispatchChannelBadge channel={r.channel} /></td>
                  <td>
                    <code className="small user-select-all">
                      {r.order_reference ?? `Sale #${r.sale_id}`}
                    </code>
                  </td>
                  <td className="small text-muted">
                    {r.customer_id != null ? `#${r.customer_id}` : "—"}
                  </td>
                  <td className="small">{r.requested_by ?? "—"}</td>
                  <td className="small text-nowrap">
                    {fmtDT(r.requested_at ?? r.sale_date)}
                  </td>
                  <td><DispatchStatusBadge status={r.status} /></td>
                  {showAction && (
                    <td className="pe-3">
                      <button
                        type="button"
                        className="btn btn-sm btn-outline-primary"
                        onClick={() => onAction(r)}
                      >
                        {actionLabel}
                      </button>
                    </td>
                  )}
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {!loading && pagination.total > pagination.limit && (
          <div className="card-footer d-flex align-items-center justify-content-between py-2">
            <button type="button" className="btn btn-sm btn-outline-secondary" disabled={!canPrev}
              onClick={() => onPageChange(Math.max(0, pagination.offset - pagination.limit))}>
              <i className="ti ti-chevron-left me-1" />Anterior
            </button>
            <span className="small text-muted">
              Página <strong>{currentPage}</strong> de <strong>{totalPages}</strong>
              {" · "}{pagination.total} registros
            </span>
            <button type="button" className="btn btn-sm btn-outline-secondary" disabled={!canNext}
              onClick={() => onPageChange(pagination.offset + pagination.limit)}>
              Siguiente<i className="ti ti-chevron-right ms-1" />
            </button>
          </div>
        )}
      </div>
    </>
  );
}
