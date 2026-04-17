"use client";
import { useEffect, useState } from "react";
import type { ErpUser } from "@/types/config";
import { ERP_ROLES, USER_STATUSES } from "../configRoles";

interface Props {
  user: ErpUser | null;
  mode: "create" | "edit";
  open: boolean;
  actorRole: string | null;
  onClose: () => void;
  onSuccess: () => void;
}

export default function UserModal({ user, mode, open, actorRole, onClose, onSuccess }: Props) {
  const [username, setUsername]   = useState("");
  const [password, setPassword]     = useState("");
  const [fullName, setFullName]   = useState("");
  const [email, setEmail]         = useState("");
  const [role, setRole]           = useState<string>("VENDEDOR_MOSTRADOR");
  const [status, setStatus]       = useState<string>("ACTIVE");
  const [saving, setSaving]       = useState(false);
  const [error, setError]         = useState<string | null>(null);

  const canOfferSuperuser = actorRole === "SUPERUSER";
  const roleOptions = ERP_ROLES.filter(r => canOfferSuperuser || r !== "SUPERUSER");

  useEffect(() => {
    if (!open) return;
    setError(null);
    if (mode === "edit" && user) {
      setUsername(user.username);
      setPassword("");
      setFullName(user.full_name ?? "");
      setEmail(user.email ?? "");
      setRole(user.role);
      setStatus(user.status);
    } else {
      setUsername("");
      setPassword("");
      setFullName("");
      setEmail("");
      setRole("VENDEDOR_MOSTRADOR");
      setStatus("ACTIVE");
    }
  }, [open, mode, user]);

  if (!open) return null;

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    setSaving(true);
    setError(null);
    try {
      if (mode === "create") {
        if (!username.trim() || !password) {
          setError("Usuario y contraseña son obligatorios.");
          setSaving(false);
          return;
        }
        const res = await fetch("/api/config/usuarios", {
          method: "POST",
          credentials: "include",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            username: username.trim(),
            password,
            full_name: fullName.trim() || null,
            email: email.trim() || null,
            role,
            status,
          }),
        });
        const d = await res.json().catch(() => ({})) as Record<string, unknown>;
        if (!res.ok) throw new Error((d.error as string) ?? (d.message as string) ?? `HTTP ${res.status}`);
      } else if (user) {
        const res = await fetch(`/api/config/usuarios/${user.id}`, {
          method: "PATCH",
          credentials: "include",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            full_name: fullName.trim() || null,
            email: email.trim() || null,
            role,
            status,
          }),
        });
        const d = await res.json().catch(() => ({})) as Record<string, unknown>;
        if (!res.ok) throw new Error((d.error as string) ?? (d.message as string) ?? `HTTP ${res.status}`);
      }
      onSuccess();
      onClose();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Error.");
    } finally {
      setSaving(false);
    }
  }

  return (
    <div className="modal fade show d-block" tabIndex={-1} style={{ background: "rgba(0,0,0,0.45)" }}>
      <div className="modal-dialog modal-lg">
        <div className="modal-content">
          <div className="modal-header">
            <h5 className="modal-title">{mode === "create" ? "Nuevo usuario" : "Editar usuario"}</h5>
            <button type="button" className="btn-close" onClick={onClose} disabled={saving} />
          </div>
          <form onSubmit={submit}>
            <div className="modal-body">
              {error && <div className="alert alert-danger py-2 small">{error}</div>}
              {mode === "edit" && user && (
                <p className="small text-muted mb-3">
                  Usuario: <code>@{user.username}</code> (no editable desde aquí)
                </p>
              )}
              {mode === "create" && (
                <>
                  <div className="row g-2 mb-2">
                    <div className="col-md-6">
                      <label className="form-label">Usuario *</label>
                      <input className="form-control" value={username} onChange={e => setUsername(e.target.value)} required autoComplete="username" />
                    </div>
                    <div className="col-md-6">
                      <label className="form-label">Contraseña *</label>
                      <input type="password" className="form-control" value={password} onChange={e => setPassword(e.target.value)} required autoComplete="new-password" />
                    </div>
                  </div>
                </>
              )}
              <div className="row g-2 mb-2">
                <div className="col-md-6">
                  <label className="form-label">Nombre completo</label>
                  <input className="form-control" value={fullName} onChange={e => setFullName(e.target.value)} />
                </div>
                <div className="col-md-6">
                  <label className="form-label">Email</label>
                  <input type="email" className="form-control" value={email} onChange={e => setEmail(e.target.value)} />
                </div>
              </div>
              <div className="row g-2">
                <div className="col-md-6">
                  <label className="form-label">Rol *</label>
                  <select className="form-select" value={role} onChange={e => setRole(e.target.value)}>
                    {roleOptions.map(r => <option key={r} value={r}>{r}</option>)}
                  </select>
                </div>
                <div className="col-md-6">
                  <label className="form-label">Estado</label>
                  <select className="form-select" value={status} onChange={e => setStatus(e.target.value)}>
                    {USER_STATUSES.map(s => <option key={s} value={s}>{s}</option>)}
                  </select>
                </div>
              </div>
            </div>
            <div className="modal-footer">
              <button type="button" className="btn btn-outline-secondary" onClick={onClose} disabled={saving}>Cancelar</button>
              <button type="submit" className="btn btn-primary" disabled={saving}>
                {saving ? <span className="spinner-border spinner-border-sm" /> : "Guardar"}
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
}
