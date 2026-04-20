"use client";
import { useEffect, useRef, useState } from "react";

const CUSTOMER_TYPES = [
  { value: "", label: "Sin segmento" },
  { value: "retail", label: "Minorista" },
  { value: "wholesale", label: "Mayorista" },
  { value: "vip", label: "VIP" },
  { value: "mechanic", label: "Mecánico / Taller" },
  { value: "fleet", label: "Flota" },
  { value: "other", label: "Otro" },
] as const;

interface Props {
  open: boolean;
  customerId: number;
  currentName: string | null;
  currentPhone: string | null;
  onClose: () => void;
  onSuccess: () => void;
}

/**
 * EditCustomerModal — Sprint 6B (B.4)
 *
 * Formulario de edición parcial del cliente CRM.
 * PATCH → /api/clientes/:id → BFF → backend PATCH /api/crm/customers/:id
 *
 * Campos: full_name (editable), phone (readonly), customer_type (dropdown).
 */
export default function EditCustomerModal({
  open,
  customerId,
  currentName,
  currentPhone,
  onClose,
  onSuccess,
}: Props) {
  const [fullName, setFullName] = useState(currentName ?? "");
  const [customerType, setCustomerType] = useState("");
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const nameRef = useRef<HTMLInputElement>(null);

  // Resetear al abrir
  useEffect(() => {
    if (open) {
      setFullName(currentName ?? "");
      setCustomerType("");
      setError(null);
      setTimeout(() => nameRef.current?.focus(), 60);
    }
  }, [open, currentName]);

  // Cerrar con Escape
  useEffect(() => {
    if (!open) return;
    function onKey(e: KeyboardEvent) {
      if (e.key === "Escape") onClose();
    }
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [open, onClose]);

  async function handleSave(e: React.FormEvent) {
    e.preventDefault();
    if (!fullName.trim()) { setError("El nombre no puede estar vacío"); return; }
    setSaving(true); setError(null);
    try {
      const body: Record<string, string> = { full_name: fullName.trim() };
      if (customerType) body.customer_type = customerType;

      const res = await fetch(`/api/clientes/${customerId}`, {
        method: "PATCH",
        credentials: "include",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(body),
      });
      const data = await res.json().catch(() => ({})) as Record<string, unknown>;
      if (!res.ok) {
        const msg = typeof data.error === "string" ? data.error : `Error ${res.status}`;
        throw new Error(msg);
      }
      onSuccess();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Error al guardar");
    } finally {
      setSaving(false);
    }
  }

  if (!open) return null;

  return (
    <>
      {/* Backdrop */}
      <div
        style={{
          position: "fixed",
          inset: 0,
          background: "rgba(0,0,0,0.5)",
          zIndex: 1050,
        }}
        onClick={onClose}
      />

      {/* Modal */}
      <div
        role="dialog"
        aria-modal
        aria-label="Editar cliente"
        style={{
          position: "fixed",
          top: "50%",
          left: "50%",
          transform: "translate(-50%, -50%)",
          zIndex: 1051,
          background: "var(--mu-panel, #1e2020)",
          border: "1px solid var(--mu-border, rgba(255,255,255,0.1))",
          borderRadius: 12,
          padding: "1.5rem",
          width: "min(400px, calc(100vw - 2rem))",
          boxShadow: "0 8px 40px rgba(0,0,0,0.5)",
        }}
      >
        <div className="d-flex align-items-center justify-content-between mb-3">
          <h6 style={{ fontWeight: 700, margin: 0 }}>
            <i className="ti ti-edit me-2 text-muted" />
            Editar cliente
          </h6>
          <button type="button" className="btn-close btn-close-white" style={{ opacity: 0.6 }} onClick={onClose} />
        </div>

        {error && (
          <div className="alert alert-danger py-2 small mb-3">{error}</div>
        )}

        <form onSubmit={(e) => void handleSave(e)}>
          {/* full_name */}
          <div className="mb-3">
            <label htmlFor="ecm-fullname" className="form-label" style={{ fontSize: "0.82rem" }}>
              Nombre completo <span style={{ color: "#ef4444" }}>*</span>
            </label>
            <input
              id="ecm-fullname"
              ref={nameRef}
              type="text"
              className="form-control form-control-sm"
              value={fullName}
              onChange={(e) => setFullName(e.target.value)}
              disabled={saving}
              required
              placeholder="Nombre del cliente"
            />
          </div>

          {/* phone (readonly) */}
          <div className="mb-3">
            <label className="form-label" style={{ fontSize: "0.82rem" }}>
              Teléfono <span style={{ fontSize: "0.72rem", color: "var(--mu-ink-mute)" }}>(solo lectura)</span>
            </label>
            <input
              type="text"
              className="form-control form-control-sm"
              value={currentPhone ?? ""}
              readOnly
              disabled
              style={{ opacity: 0.6 }}
            />
          </div>

          {/* customer_type */}
          <div className="mb-4">
            <label htmlFor="ecm-segment" className="form-label" style={{ fontSize: "0.82rem" }}>
              Segmento
            </label>
            <select
              id="ecm-segment"
              className="form-select form-select-sm"
              value={customerType}
              onChange={(e) => setCustomerType(e.target.value)}
              disabled={saving}
            >
              {CUSTOMER_TYPES.map(opt => (
                <option key={opt.value} value={opt.value}>{opt.label}</option>
              ))}
            </select>
          </div>

          <div className="d-flex gap-2 justify-content-end">
            <button
              type="button"
              className="btn btn-sm btn-outline-secondary"
              onClick={onClose}
              disabled={saving}
            >
              Cancelar
            </button>
            <button
              type="submit"
              className="btn btn-sm"
              style={{ background: "var(--mu-accent, #d4ff3a)", color: "#0a0b08", fontWeight: 600 }}
              disabled={saving || !fullName.trim()}
            >
              {saving ? <span className="spinner-border spinner-border-sm me-2" /> : <i className="ti ti-check me-1" />}
              Guardar
            </button>
          </div>
        </form>
      </div>
    </>
  );
}
