"use client";
import type { MlListing } from "@/types/mercadolibre";

function StatusBadge({ status }: { status: string }) {
  if (status === "active")   return <span className="badge bg-success">Activo</span>;
  if (status === "paused")   return <span className="badge bg-warning text-dark">Pausado</span>;
  if (status === "closed")   return <span className="badge bg-danger">Cerrado</span>;
  return <span className="badge bg-secondary">{status}</span>;
}

function StockCell({ qty }: { qty: number | string }) {
  const n = Number(qty);
  if (n === 0) return <span className="fw-bold text-danger">0</span>;
  if (n <= 5)  return <span className="fw-semibold text-warning">{n}</span>;
  return <span className="text-success">{n}</span>;
}

function SkeletonRow() {
  return <tr>{Array.from({ length: 7 }).map((_, i) => <td key={i}><span className="placeholder col-8 rounded" /></td>)}</tr>;
}

interface Props {
  listings:    MlListing[];
  loading:     boolean;
  error:       string | null;
  total:       number;
  limit:       number;
  offset:      number;
  onPageChange:(offset: number) => void;
}

export default function MlListingsTable({ listings, loading, error, total, limit, offset, onPageChange }: Props) {
  const totalPages  = Math.max(1, Math.ceil(total / limit));
  const currentPage = Math.floor(offset / limit) + 1;

  if (error) return <div className="alert alert-danger mt-2">{error}</div>;

  return (
    <>
      <div className="table-responsive">
        <table className="table table-hover table-sm align-middle mb-0">
          <thead className="table-light">
            <tr>
              <th>Item ID</th>
              <th>Título</th>
              <th>Estado</th>
              <th className="text-end">Precio</th>
              <th className="text-end">Stock</th>
              <th>Tipo</th>
              <th>Ver</th>
            </tr>
          </thead>
          <tbody>
            {loading
              ? Array.from({ length: 10 }).map((_, i) => <SkeletonRow key={i} />)
              : listings.length === 0
              ? <tr><td colSpan={7} className="text-center text-muted py-4">No hay publicaciones</td></tr>
              : listings.map(l => (
                <tr key={l.item_id}>
                  <td><code className="text-body small">{l.item_id}</code></td>
                  <td className="small text-truncate" style={{ maxWidth: 280 }} title={l.title}>{l.title}</td>
                  <td><StatusBadge status={l.status} /></td>
                  <td className="text-end">${Number(l.price).toFixed(2)} <small className="text-muted">{l.currency_id}</small></td>
                  <td className="text-end"><StockCell qty={l.available_quantity} /></td>
                  <td><span className="badge bg-light text-dark border small">{l.listing_type}</span></td>
                  <td>
                    {l.permalink && (
                      <a href={l.permalink} target="_blank" rel="noopener noreferrer" className="btn btn-sm btn-outline-secondary py-0">
                        <i className="ti ti-external-link" />
                      </a>
                    )}
                  </td>
                </tr>
              ))}
          </tbody>
        </table>
      </div>
      {!loading && total > limit && (
        <div className="d-flex justify-content-between align-items-center mt-3 px-1">
          <small className="text-muted">Mostrando {offset + 1}–{Math.min(offset + limit, total)} de {total.toLocaleString()}</small>
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
