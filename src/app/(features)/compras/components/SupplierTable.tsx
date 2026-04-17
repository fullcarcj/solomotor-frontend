"use client";
import type { Supplier } from "@/types/compras";

interface Props {
  suppliers: Supplier[];
  loading:   boolean;
  error:     string | null;
  total:     number;
  limit:     number;
  offset:    number;
  onPageChange: (offset: number) => void;
  onEdit:    (s: Supplier) => void;
  onToggle:  (s: Supplier) => void;
}

function SkeletonRow() {
  return (
    <tr>
      {Array.from({ length: 7 }).map((_, i) => (
        <td key={i}><span className="placeholder col-8 rounded" /></td>
      ))}
    </tr>
  );
}

export default function SupplierTable({ suppliers, loading, error, total, limit, offset, onPageChange, onEdit, onToggle }: Props) {
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
              <th>Nombre</th>
              <th>País</th>
              <th>Moneda</th>
              <th>Plazo entrega</th>
              <th>Estado</th>
              <th>Acciones</th>
            </tr>
          </thead>
          <tbody>
            {loading
              ? Array.from({ length: 8 }).map((_, i) => <SkeletonRow key={i} />)
              : suppliers.length === 0
              ? (
                <tr>
                  <td colSpan={6} className="text-center text-muted py-4">
                    No hay proveedores registrados
                  </td>
                </tr>
              )
              : suppliers.map((s) => (
                <tr key={s.id}>
                  <td><strong>{s.name}</strong></td>
                  <td>{s.country || "Venezuela"}</td>
                  <td>
                    <span className="badge bg-light text-dark border">
                      {s.currency ?? "USD"}
                    </span>
                  </td>
                  <td>{s.lead_time_days ?? 0} días</td>
                  <td>
                    {s.is_active
                      ? <span className="badge bg-success">Activo</span>
                      : <span className="badge bg-secondary">Inactivo</span>}
                  </td>
                  <td>
                    <div className="d-flex gap-1">
                      <button
                        className="btn btn-sm btn-outline-primary"
                        onClick={() => onEdit(s)}
                      >
                        Editar
                      </button>
                      <button
                        className={`btn btn-sm ${s.is_active ? "btn-outline-warning" : "btn-outline-success"}`}
                        onClick={() => onToggle(s)}
                      >
                        {s.is_active ? "Desactivar" : "Activar"}
                      </button>
                    </div>
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
            <button
              className="btn btn-sm btn-outline-secondary"
              disabled={currentPage === 1}
              onClick={() => onPageChange(Math.max(0, offset - limit))}
            >
              ‹ Anterior
            </button>
            <span className="btn btn-sm btn-light pe-none">
              {currentPage} / {totalPages}
            </span>
            <button
              className="btn btn-sm btn-outline-secondary"
              disabled={currentPage >= totalPages}
              onClick={() => onPageChange(offset + limit)}
            >
              Siguiente ›
            </button>
          </div>
        </div>
      )}
    </>
  );
}
