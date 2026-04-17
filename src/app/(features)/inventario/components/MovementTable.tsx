"use client";
import type { MovementPagination, StockMovement } from "@/types/wms";

const REASON_LABELS: Record<string, { label: string; cls: string }> = {
  PURCHASE_RECEIPT: { label: "Compra",        cls: "bg-success" },
  SALE_DISPATCH:    { label: "Despacho",      cls: "bg-danger" },
  ADJUSTMENT:       { label: "Ajuste",        cls: "bg-warning text-dark" },
  RESERVATION:      { label: "Reserva",       cls: "bg-info text-dark" },
  COMMITMENT:       { label: "Compromiso",    cls: "bg-primary" },
  RELEASE:          { label: "Liberación",    cls: "bg-secondary" },
  TRANSFER:         { label: "Transferencia", cls: "bg-secondary" },
  INVENTORY_COUNT:  { label: "Conteo físico", cls: "bg-secondary" },
  RETURN:           { label: "Devolución",    cls: "bg-warning text-dark" },
};

function fmtDate(s: string): string {
  try {
    const d = new Date(s);
    return d.toLocaleString("es-VE", {
      day: "2-digit", month: "2-digit", year: "numeric",
      hour: "2-digit", minute: "2-digit",
    });
  } catch { return s; }
}

function Delta({ val }: { val: number | string }) {
  const n = Number(val);
  if (n > 0) return <span className="text-success fw-semibold">+{n}</span>;
  if (n < 0) return <span className="text-danger fw-semibold">{n}</span>;
  return <span className="text-muted">0</span>;
}

function ReasonBadge({ reason }: { reason: string }) {
  const meta = REASON_LABELS[reason];
  if (meta) return <span className={`badge ${meta.cls}`}>{meta.label}</span>;
  return <span className="badge bg-secondary">{reason}</span>;
}

function SkeletonRow() {
  return (
    <tr>
      {Array.from({ length: 8 }).map((_, i) => (
        <td key={i}><span className="placeholder col-8 rounded" /></td>
      ))}
    </tr>
  );
}

interface Props {
  movements:    StockMovement[];
  pagination:   MovementPagination;
  loading:      boolean;
  error:        string | null;
  onPageChange: (offset: number) => void;
}

export default function MovementTable({ movements, pagination, loading, error, onPageChange }: Props) {
  const { total, limit, offset } = pagination;
  const totalPages  = Math.ceil(total / limit) || 1;
  const currentPage = Math.floor(offset / limit) + 1;

  if (error) {
    return (
      <div className="alert alert-danger d-flex align-items-center gap-2 mt-2">
        <i className="ti ti-alert-circle fs-5" />
        <span>{error}</span>
      </div>
    );
  }

  return (
    <>
      <div className="table-responsive">
        <table className="table table-hover table-sm align-middle mb-0">
          <thead className="table-light">
            <tr>
              <th>Fecha</th>
              <th>SKU</th>
              <th>Razón</th>
              <th className="text-end">Antes</th>
              <th className="text-end">Después</th>
              <th className="text-end">Delta</th>
              <th>Referencia</th>
              <th>Notas</th>
            </tr>
          </thead>
          <tbody>
            {loading
              ? Array.from({ length: 10 }).map((_, i) => <SkeletonRow key={i} />)
              : movements.length === 0
              ? (
                <tr>
                  <td colSpan={8} className="text-center text-muted py-5">
                    <i className="ti ti-inbox fs-2 d-block mb-2" />
                    No hay movimientos registrados
                  </td>
                </tr>
              )
              : movements.map((m, idx) => (
                <tr key={`${String(m.id)}-${idx}`}>
                  <td className="text-nowrap small">{fmtDate(m.created_at)}</td>
                  <td><code className="text-body">{m.product_sku}</code></td>
                  <td><ReasonBadge reason={m.reason} /></td>
                  <td className="text-end">{Number(m.old_qty_available)}</td>
                  <td className="text-end">{Number(m.new_qty_available)}</td>
                  <td className="text-end"><Delta val={m.delta_available} /></td>
                  <td className="small text-muted">
                    {m.reference_id
                      ? <span title={m.reference_id}>{String(m.reference_id).slice(0, 12)}{String(m.reference_id).length > 12 ? "…" : ""}</span>
                      : "—"}
                  </td>
                  <td className="small text-muted">{m.notes ?? "—"}</td>
                </tr>
              ))}
          </tbody>
        </table>
      </div>

      {!loading && total > limit && (
        <div className="d-flex justify-content-between align-items-center mt-3 px-1">
          <small className="text-muted">
            Mostrando {offset + 1}–{Math.min(offset + limit, total)} de {total}
          </small>
          <div className="d-flex gap-1">
            <button className="btn btn-sm btn-outline-secondary" disabled={currentPage === 1} onClick={() => onPageChange(Math.max(0, offset - limit))}>
              ‹ Anterior
            </button>
            <span className="btn btn-sm btn-light pe-none">
              Página {currentPage} / {totalPages}
            </span>
            <button className="btn btn-sm btn-outline-secondary" disabled={currentPage >= totalPages} onClick={() => onPageChange(offset + limit)}>
              Siguiente ›
            </button>
          </div>
        </div>
      )}
    </>
  );
}
