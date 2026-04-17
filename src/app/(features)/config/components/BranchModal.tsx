"use client";
import { useEffect, useState } from "react";
import type { Branch } from "@/types/config";

interface Props {
  branch: Branch | null;
  open: boolean;
  onClose: () => void;
  onSuccess: () => void;
}

export default function BranchModal({ branch, open, onClose, onSuccess }: Props) {
  const [name, setName]       = useState("");
  const [code, setCode]       = useState("");
  const [isActive, setActive] = useState(true);
  const [saving, setSaving]   = useState(false);
  const [error, setError]     = useState<string | null>(null);

  useEffect(() => {
    if (!open) return;
    setError(null);
    if (branch) {
      setName(branch.name);
      setCode(branch.code);
      setActive(branch.is_active);
    } else {
      setName("");
      setCode("");
      setActive(true);
    }
  }, [open, branch]);

  if (!open) return null;

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    if (!name.trim() || !code.trim()) { setError("Nombre y código son obligatorios."); return; }
    setSaving(true);
    setError(null);
    const body = {
      name: name.trim(),
      code: code.trim().toUpperCase(),
      is_active: isActive,
    };
    try {
      const url = branch
        ? `/api/config/sucursales/${branch.id}`
        : "/api/config/sucursales";
      const res = await fetch(url, {
        method: branch ? "PUT" : "POST",
        credentials: "include",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(body),
      });
      const d = await res.json().catch(() => ({})) as Record<string, unknown>;
      if (!res.ok) throw new Error((d.error as string) ?? `HTTP ${res.status}`);
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
      <div className="modal-dialog">
        <div className="modal-content">
          <div className="modal-header">
            <h5 className="modal-title">{branch ? "Editar sucursal" : "Nueva sucursal"}</h5>
            <button type="button" className="btn-close" onClick={onClose} disabled={saving} />
          </div>
          <form onSubmit={submit}>
            <div className="modal-body">
              {error && <div className="alert alert-danger py-2 small">{error}</div>}
              <div className="mb-2">
                <label className="form-label">Nombre *</label>
                <input className="form-control" value={name} onChange={e => setName(e.target.value)} required />
              </div>
              <div className="mb-2">
                <label className="form-label">Código *</label>
                <input className="form-control text-uppercase" value={code}
                  onChange={e => setCode(e.target.value.toUpperCase())} required />
              </div>
              <div className="form-check">
                <input type="checkbox" className="form-check-input" id="brAct"
                  checked={isActive} onChange={e => setActive(e.target.checked)} />
                <label className="form-check-label" htmlFor="brAct">Activa</label>
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
