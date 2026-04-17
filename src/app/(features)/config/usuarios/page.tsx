"use client";
import { useCallback, useEffect, useState } from "react";
import { useAppSelector } from "@/store/hooks";
import { useCurrentUser } from "@/hooks/useCurrentUser";
import type { ErpUser } from "@/types/config";
import UserTable from "../components/UserTable";
import UserModal from "../components/UserModal";
import ChangePasswordModal from "../components/ChangePasswordModal";
import RolePermissionsTable from "../components/RolePermissionsTable";

function parseUsers(raw: unknown): ErpUser[] {
  if (!raw || typeof raw !== "object") return [];
  const r = raw as Record<string, unknown>;
  if (Array.isArray(r.users)) return r.users as ErpUser[];
  if (Array.isArray(r.data)) return r.data as ErpUser[];
  const d = r.data as Record<string, unknown> | undefined;
  if (d && Array.isArray(d.rows)) return d.rows as ErpUser[];
  return [];
}

export default function ConfigUsuariosPage() {
  const actorRole = useAppSelector(s => s.auth.role);
  const { user: me, loading: meLoading } = useCurrentUser();

  const [users, setUsers]         = useState<ErpUser[]>([]);
  const [loading, setLoading]     = useState(true);
  const [error, setError]         = useState<string | null>(null);
  const [roleFilter, setRoleF]    = useState("");
  const [statusFilter, setStatF]  = useState("");
  const [tab, setTab]             = useState<"users" | "perms">("users");

  const [userModal, setUserModal] = useState<{ open: boolean; mode: "create" | "edit"; user: ErpUser | null }>({
    open: false, mode: "create", user: null,
  });
  const [pwdModal, setPwdModal]   = useState<{ open: boolean; user: ErpUser | null }>({ open: false, user: null });
  const [toast, setToast]         = useState<string | null>(null);

  const load = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const p = new URLSearchParams();
      if (roleFilter) p.set("role", roleFilter);
      if (statusFilter) p.set("status", statusFilter);
      const res = await fetch(`/api/config/usuarios?${p}`, { credentials: "include", cache: "no-store" });
      const d: unknown = await res.json().catch(() => ({}));
      if (!res.ok) throw new Error(((d as Record<string, unknown>).error as string) ?? `HTTP ${res.status}`);
      setUsers(parseUsers(d));
    } catch (e) {
      setError(e instanceof Error ? e.message : "Error.");
    } finally {
      setLoading(false);
    }
  }, [roleFilter, statusFilter]);

  useEffect(() => { void load(); }, [load]);

  function showToast(msg: string) {
    setToast(msg);
    setTimeout(() => setToast(null), 3500);
  }

  return (
    <div className="page-wrapper">
      <div className="content">
        {toast && (
          <div className="position-fixed top-0 end-0 p-3" style={{ zIndex: 1080 }}>
            <div className="toast show text-bg-success">{toast}</div>
          </div>
        )}

        <div className="page-header d-flex flex-wrap justify-content-between align-items-center gap-2">
          <div>
            <h4 className="page-title mb-0">Usuarios y Roles</h4>
            <p className="text-muted small mb-0">Administración de cuentas internas</p>
          </div>
          <button
            type="button"
            className="btn btn-primary"
            onClick={() => setUserModal({ open: true, mode: "create", user: null })}
          >
            <i className="ti ti-user-plus me-1" />Nuevo Usuario
          </button>
        </div>

        <ul className="nav nav-tabs mb-3">
          <li className="nav-item">
            <button type="button" className={`nav-link ${tab === "users" ? "active" : ""}`} onClick={() => setTab("users")}>
              Usuarios
            </button>
          </li>
          <li className="nav-item">
            <button type="button" className={`nav-link ${tab === "perms" ? "active" : ""}`} onClick={() => setTab("perms")}>
              Permisos por Rol
            </button>
          </li>
        </ul>

        {tab === "users" && (
          <>
            <div className="card mb-3">
              <div className="card-body py-2">
                <div className="d-flex flex-wrap gap-2 align-items-center">
                  <select className="form-select form-select-sm" style={{ maxWidth: 200 }} value={roleFilter} onChange={e => setRoleF(e.target.value)}>
                    <option value="">Todos los roles</option>
                    <option value="SUPERUSER">SUPERUSER</option>
                    <option value="ADMIN">ADMIN</option>
                    <option value="SUPERVISOR">SUPERVISOR</option>
                    <option value="VENDEDOR_MOSTRADOR">VENDEDOR_MOSTRADOR</option>
                    <option value="VENDEDOR_EXTERNO">VENDEDOR_EXTERNO</option>
                    <option value="OPERADOR_DIGITAL">OPERADOR_DIGITAL</option>
                    <option value="ALMACENISTA">ALMACENISTA</option>
                    <option value="CONTADOR">CONTADOR</option>
                  </select>
                  <select className="form-select form-select-sm" style={{ maxWidth: 160 }} value={statusFilter} onChange={e => setStatF(e.target.value)}>
                    <option value="">Todos los estados</option>
                    <option value="ACTIVE">ACTIVE</option>
                    <option value="LOCKED">LOCKED</option>
                    <option value="INACTIVE">INACTIVE</option>
                  </select>
                  {(roleFilter || statusFilter) && (
                    <button type="button" className="btn btn-sm btn-outline-secondary" onClick={() => { setRoleF(""); setStatF(""); }}>
                      Limpiar
                    </button>
                  )}
                </div>
              </div>
            </div>
            <div className="card border-0 shadow-sm">
              <div className="card-body p-0">
                <UserTable
                  users={users}
                  loading={loading || meLoading}
                  error={error}
                  onEdit={u => setUserModal({ open: true, mode: "edit", user: u })}
                  onChangePassword={u => setPwdModal({ open: true, user: u })}
                />
              </div>
            </div>
          </>
        )}

        {tab === "perms" && (
          <div className="card border-0 shadow-sm">
            <div className="card-body">
              <RolePermissionsTable />
            </div>
          </div>
        )}

        <UserModal
          user={userModal.user}
          mode={userModal.mode}
          open={userModal.open}
          actorRole={actorRole}
          onClose={() => setUserModal(s => ({ ...s, open: false, user: null }))}
          onSuccess={() => { showToast("Usuario guardado"); void load(); }}
        />

        <ChangePasswordModal
          user={pwdModal.user}
          open={pwdModal.open}
          currentUserId={me?.id ?? null}
          actorRole={actorRole}
          onClose={() => setPwdModal({ open: false, user: null })}
          onSuccess={showToast}
        />
      </div>
    </div>
  );
}
