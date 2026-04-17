"use client";
import type { ErpUser } from "@/types/config";
import { roleBadgeClass, roleLabel } from "../configRoles";

function RoleBadge({ role }: { role: string }) {
  if (role === "OPERADOR_DIGITAL") {
    return (
      <span className="badge text-white" style={{ backgroundColor: "#6f42c1" }}>
        {roleLabel(role)}
      </span>
    );
  }
  return <span className={`badge ${roleBadgeClass(role)}`}>{roleLabel(role)}</span>;
}

function StatusBadge({ status }: { status: string }) {
  if (status === "ACTIVE") return <span className="badge bg-success">Activo</span>;
  if (status === "LOCKED") return <span className="badge bg-danger">Bloqueado</span>;
  if (status === "INACTIVE") return <span className="badge bg-secondary">Inactivo</span>;
  return <span className="badge bg-secondary">{status}</span>;
}

function fmtLogin(iso: string | null) {
  if (!iso) return "Nunca";
  try {
    return new Date(iso).toLocaleString("es-VE", {
      day: "2-digit", month: "2-digit", year: "numeric", hour: "2-digit", minute: "2-digit",
    });
  } catch { return iso; }
}

export default function UserTable({
  users,
  loading,
  error,
  onEdit,
  onChangePassword,
}: {
  users: ErpUser[];
  loading: boolean;
  error: string | null;
  onEdit: (u: ErpUser) => void;
  onChangePassword: (u: ErpUser) => void;
}) {
  if (error) return <div className="alert alert-danger">{error}</div>;

  return (
    <div className="table-responsive">
      <table className="table table-hover table-sm align-middle mb-0">
        <thead className="table-light">
          <tr>
            <th>Usuario</th>
            <th>Nombre</th>
            <th>Rol</th>
            <th>Estado</th>
            <th>Último login</th>
            <th>Acciones</th>
          </tr>
        </thead>
        <tbody>
          {loading
            ? Array.from({ length: 6 }).map((_, i) => (
              <tr key={i}>{Array.from({ length: 6 }).map((__, j) => <td key={j}><span className="placeholder col-10 rounded" /></td>)}</tr>
            ))
            : users.length === 0
            ? <tr><td colSpan={6} className="text-center text-muted py-4">Sin usuarios</td></tr>
            : users.map(u => (
              <tr key={u.id}>
                <td><code className="small">@{u.username}</code></td>
                <td className="small">{u.full_name?.trim() || "—"}</td>
                <td><RoleBadge role={u.role} /></td>
                <td><StatusBadge status={u.status} /></td>
                <td className="small text-nowrap">{fmtLogin(u.last_login_at)}</td>
                <td>
                  <button type="button" className="btn btn-sm btn-outline-primary me-1" onClick={() => onEdit(u)}>Editar</button>
                  <button type="button" className="btn btn-sm btn-outline-secondary" onClick={() => onChangePassword(u)}>Cambiar clave</button>
                </td>
              </tr>
            ))}
        </tbody>
      </table>
    </div>
  );
}
