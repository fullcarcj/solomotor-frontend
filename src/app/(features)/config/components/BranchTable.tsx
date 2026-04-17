"use client";
import type { Branch } from "@/types/config";

export default function BranchTable({
  branches,
  loading,
  error,
  onEdit,
  onDelete,
}: {
  branches: Branch[];
  loading: boolean;
  error: string | null;
  onEdit: (b: Branch) => void;
  onDelete: (b: Branch) => void;
}) {
  if (error) return <div className="alert alert-danger">{error}</div>;

  return (
    <div className="table-responsive">
      <table className="table table-hover table-sm align-middle mb-0">
        <thead className="table-light">
          <tr>
            <th>Código</th>
            <th>Nombre</th>
            <th>Principal</th>
            <th>Estado</th>
            <th>Acciones</th>
          </tr>
        </thead>
        <tbody>
          {loading
            ? Array.from({ length: 4 }).map((_, i) => (
              <tr key={i}>{Array.from({ length: 5 }).map((__, j) => <td key={j}><span className="placeholder col-8 rounded" /></td>)}</tr>
            ))
            : branches.length === 0
            ? <tr><td colSpan={5} className="text-center text-muted py-4">Sin sucursales</td></tr>
            : branches.map(b => (
              <tr key={b.id}>
                <td><code className="badge bg-light text-dark border">{b.code}</code></td>
                <td>{b.name}</td>
                <td>
                  {b.is_principal
                    ? <span className="badge bg-primary">Principal</span>
                    : <span className="text-muted">—</span>}
                </td>
                <td>
                  {b.is_active
                    ? <span className="badge bg-success">Activa</span>
                    : <span className="badge bg-secondary">Inactiva</span>}
                </td>
                <td>
                  <button type="button" className="btn btn-sm btn-outline-primary me-1" onClick={() => onEdit(b)}>Editar</button>
                  {!b.is_principal && (
                    <button type="button" className="btn btn-sm btn-outline-danger" onClick={() => onDelete(b)}>Eliminar</button>
                  )}
                </td>
              </tr>
            ))}
        </tbody>
      </table>
    </div>
  );
}
