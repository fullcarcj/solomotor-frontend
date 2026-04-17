"use client";
import type { Purchase } from "@/types/compras";

interface Props {
  purchases: Purchase[];
  loading:   boolean;
  error:     string | null;
  total:     number;
  limit:     number;
  offset:    number;
  onPageChange: (offset: number) => void;
  onDetail:  (p: Purchase) => void;
}

function fmtDate(s: string): string {
  try {
    const d = new Date(s);
    return d.toLocaleDateString("es-VE", { day: "2-digit", month: "2-digit", year: "numeric" });
  } catch { return s; }
}

function fmtUSD(v: number | string | null | undefined): string {
  if (v === null || v === undefined) return "—";
  return `$${Number(v).toFixed(2)}`;
}

function fmtBs(v: number | string | null | undefined): string {
  if (v === null || v === undefined) return "—";
  return `Bs. ${Number(v).toLocaleString("es-VE", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
}

function StatusBadge({ status }: { status: string }) {
  if (status === "posted" || status === "POSTED")
    return <span className="badge bg-secondary">Registrado</span>;
  if (status === "pending")
    return <span className="badge bg-warning text-dark">Pendiente</span>;
  if (status === "cancelled" || status === "canceled")
    return <span className="badge bg-danger">Cancelado</span>;
  return <span className="badge bg-light text-dark border">{status}</span>;
}

function SkeletonRow() {
  return <tr>{Array.from({ length: 8 }).map((_, i) => <td key={i}><span className="placeholder col-7 rounded" /></td>)}</tr>;
}

export default function PurchaseTable({ purchases, loading, error, total, limit, offset, onPageChange, onDetail }: Props) {
  const totalPages = Math.ceil(total / limit);
  const currentPage = Math.floor(offset / limit) + 1;

  if (error) {
    return (
      <div className="alert alert-danger d-flex align-items-center gap-2 mt-3">
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
              <th>ID</th>
              <th>Proveedor</th>
              <th>Fecha</th>
              <th>Total USD</th>
              <th>Total Bs</th>
              <th>Estado</th>
              <th>Líneas</th>
              <th>Acciones</th>
            </tr>
          </thead>
          <tbody>
            {loading
              ? Array.from({ length: 8 }).map((_, i) => <SkeletonRow key={i} />)
              : purchases.length === 0
              ? (
                <tr>
                  <td colSpan={8} className="text-center text-muted py-4">
                    No hay recepciones registradas
                  </td>
                </tr>
              )
              : purchases.map((p) => (
                <tr key={p.id}>
                  <td><code className="text-body">#{p.id}</code></td>
                  <td>{p.supplier_name ?? <span className="text-muted">Sin proveedor</span>}</td>
                  <td>{fmtDate(p.purchase_date)}</td>
                  <td>{fmtUSD(p.total_usd)}</td>
                  <td>{fmtBs(p.total_bs)}</td>
                  <td><StatusBadge status={p.status} /></td>
                  <td className="text-center">{p.lines ? p.lines.length : "—"}</td>
                  <td>
                    <button className="btn btn-sm btn-outline-primary" onClick={() => onDetail(p)}>
                      Ver detalle
                    </button>
                  </td>
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
            <button className="btn btn-sm btn-outline-secondary" disabled={currentPage === 1} onClick={() => onPageChange(Math.max(0, offset - limit))}>‹ Anterior</button>
            <span className="btn btn-sm btn-light pe-none">{currentPage} / {totalPages}</span>
            <button className="btn btn-sm btn-outline-secondary" disabled={currentPage >= totalPages} onClick={() => onPageChange(offset + limit)}>Siguiente ›</button>
          </div>
        </div>
      )}
    </>
  );
}
