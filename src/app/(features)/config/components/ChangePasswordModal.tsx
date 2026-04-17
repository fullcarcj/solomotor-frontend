"use client";
import { useEffect, useState } from "react";
import type { ErpUser } from "@/types/config";

interface Props {
  user: ErpUser | null;
  open: boolean;
  currentUserId: number | null;
  actorRole: string | null;
  onClose: () => void;
  onSuccess: (msg: string) => void;
}

export default function ChangePasswordModal({
  user, open, currentUserId, actorRole, onClose, onSuccess,
}: Props) {
  const [currentPassword, setCurrentPassword] = useState("");
  const [newPassword, setNewPassword]         = useState("");
  const [confirm, setConfirm]               = useState("");
  const [saving, setSaving]                 = useState(false);
  const [error, setError]                   = useState<string | null>(null);

  const isSelf = user != null && currentUserId != null && user.id === currentUserId;
  const isSuper = actorRole === "SUPERUSER";

  useEffect(() => {
    if (open) {
      setCurrentPassword("");
      setNewPassword("");
      setConfirm("");
      setError(null);
    }
  }, [open, user]);

  if (!open || !user) return null;

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    if (newPassword !== confirm) {
      setError("Las contraseñas nuevas no coinciden.");
      return;
    }
    if (!newPassword) {
      setError("Indicá la nueva contraseña.");
      return;
    }
    if (isSelf && !currentPassword) {
      setError("Contraseña actual obligatoria.");
      return;
    }
    setSaving(true);
    setError(null);
    try {
      const body: Record<string, string> = { new_password: newPassword };
      if (isSelf) body.current_password = currentPassword;
      const res = await fetch(`/api/config/usuarios/${user.id}/password`, {
        method: "POST",
        credentials: "include",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(body),
      });
      const d = await res.json().catch(() => ({})) as Record<string, unknown>;
      if (!res.ok) {
        const code = d.code ?? d.error;
        const msg = typeof d.message === "string" ? d.message : typeof d.error === "string" ? d.error : `HTTP ${res.status}`;
        if (String(code).includes("WRONG") || /incorrecta/i.test(msg)) {
          setError("Contraseña actual incorrecta.");
        } else {
          setError(msg);
        }
        return;
      }
      onSuccess("Contraseña actualizada");
      onClose();
    } catch {
      setError("Error de red.");
    } finally {
      setSaving(false);
    }
  }

  return (
    <div className="modal fade show d-block" tabIndex={-1} style={{ background: "rgba(0,0,0,0.45)" }}>
      <div className="modal-dialog">
        <div className="modal-content">
          <div className="modal-header">
            <h5 className="modal-title">Cambiar contraseña — @{user.username}</h5>
            <button type="button" className="btn-close" onClick={onClose} disabled={saving} />
          </div>
          <form onSubmit={submit}>
            <div className="modal-body">
              {error && <div className="alert alert-danger py-2 small">{error}</div>}
              {isSelf && (
                <div className="mb-2">
                  <label className="form-label">Contraseña actual *</label>
                  <input type="password" className="form-control" value={currentPassword} onChange={e => setCurrentPassword(e.target.value)} autoComplete="current-password" />
                </div>
              )}
              {!isSelf && isSuper && (
                <p className="small text-muted">Como superusuario podés asignar una nueva contraseña sin la actual.</p>
              )}
              <div className="mb-2">
                <label className="form-label">Nueva contraseña *</label>
                <input type="password" className="form-control" value={newPassword} onChange={e => setNewPassword(e.target.value)} autoComplete="new-password" />
              </div>
              <div className="mb-2">
                <label className="form-label">Confirmar nueva contraseña *</label>
                <input type="password" className="form-control" value={confirm} onChange={e => setConfirm(e.target.value)} autoComplete="new-password" />
              </div>
            </div>
            <div className="modal-footer">
              <button type="button" className="btn btn-outline-secondary" onClick={onClose} disabled={saving}>Cancelar</button>
              <button type="submit" className="btn btn-primary" disabled={saving}>Guardar</button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
}
