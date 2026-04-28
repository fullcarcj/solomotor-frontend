"use client";

import { useCallback, useEffect, useState } from "react";
import { DELIVERY_CURRENCIES, type DeliveryCurrency } from "../deliveryTypes";
import { normalizeVePhoneTo584 } from "../phoneNormalize";

type ProviderRow = {
  id: number;
  name: string;
  phone: string | null;
  id_document: string | null;
  preferred_currency: string;
  is_active: boolean;
  created_at?: string;
};

type DebtRow = {
  provider_id: number;
  provider_name: string;
  phone: string | null;
  pending_count: number;
  total_owed_bs: string | number;
};

type ProvidersTabProps = { canEdit: boolean };

export default function ProvidersTab({ canEdit }: ProvidersTabProps) {
  const [rows, setRows] = useState<ProviderRow[]>([]);
  const [debts, setDebts] = useState<DebtRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [modalOpen, setModalOpen] = useState(false);
  const [editing, setEditing] = useState<ProviderRow | null>(null);
  const [saving, setSaving] = useState(false);
  const [form, setForm] = useState({
    name: "",
    phone: "",
    id_document: "",
    preferred_currency: "BS" as DeliveryCurrency,
    is_active: true,
  });

  const owedByProvider = useCallback(
    (id: number) => {
      const d = debts.find((x) => Number(x.provider_id) === id);
      if (!d || !Number(d.pending_count)) return null;
      const t = Number(String(d.total_owed_bs).replace(",", "."));
      return Number.isFinite(t) ? t : 0;
    },
    [debts]
  );

  const load = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const [pRes, dRes] = await Promise.all([
        fetch("/api/delivery/providers", { credentials: "include", cache: "no-store" }),
        fetch("/api/delivery/debt-summary", { credentials: "include", cache: "no-store" }),
      ]);
      const pj = (await pRes.json().catch(() => ({}))) as Record<string, unknown>;
      if (!pRes.ok) {
        setError(String(pj.message ?? pj.error ?? "No se pudieron cargar los motorizados"));
        setRows([]);
      } else {
        const data = pj.data;
        setRows(Array.isArray(data) ? (data as ProviderRow[]) : []);
      }
      const dj = (await dRes.json().catch(() => ({}))) as Record<string, unknown>;
      if (dRes.ok) {
        const data = dj.data;
        setDebts(Array.isArray(data) ? (data as DebtRow[]) : []);
      } else {
        setDebts([]);
      }
    } catch {
      setError("Error de red.");
      setRows([]);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    void load();
  }, [load]);

  const openCreate = () => {
    setEditing(null);
    setForm({ name: "", phone: "", id_document: "", preferred_currency: "BS", is_active: true });
    setModalOpen(true);
  };

  const openEdit = (p: ProviderRow) => {
    setEditing(p);
    setForm({
      name: p.name,
      phone: p.phone ?? "",
      id_document: p.id_document ?? "",
      preferred_currency: (p.preferred_currency as DeliveryCurrency) || "BS",
      is_active: p.is_active,
    });
    setModalOpen(true);
  };

  const saveProvider = async () => {
    if (!canEdit || saving) return;
    const name = form.name.trim();
    if (name.length < 2) {
      setError("El nombre debe tener al menos 2 caracteres.");
      return;
    }
    const phoneNorm = normalizeVePhoneTo584(form.phone);
    if (form.phone.trim() && !phoneNorm) {
      setError("Teléfono inválido. Usá formato móvil (ej. 4141234567 o 584141234567).");
      return;
    }
    const body: Record<string, unknown> = {
      name,
      id_document: form.id_document.trim() || undefined,
      preferred_currency: form.preferred_currency,
    };
    if (phoneNorm) body.phone = phoneNorm;

    setSaving(true);
    setError(null);
    try {
      if (editing) {
        body.is_active = form.is_active;
        const res = await fetch(`/api/delivery/providers/${editing.id}`, {
          method: "PATCH",
          credentials: "include",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(body),
        });
        const j = await res.json().catch(() => ({}));
        if (!res.ok) {
          setError(String((j as Record<string, unknown>).message ?? "Error al guardar"));
          return;
        }
      } else {
        const res = await fetch("/api/delivery/providers", {
          method: "POST",
          credentials: "include",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(body),
        });
        const j = await res.json().catch(() => ({}));
        if (!res.ok) {
          setError(String((j as Record<string, unknown>).message ?? "Error al crear"));
          return;
        }
      }
      setModalOpen(false);
      await load();
    } catch {
      setError("Error de red al guardar.");
    } finally {
      setSaving(false);
    }
  };

  return (
    <div>
      <div className="d-flex align-items-center justify-content-between flex-wrap gap-2 mb-3">
        <p className="text-muted small mb-0">
          Motorizados de confianza. El teléfono debe quedar en formato <code>584XXXXXXXXX</code> para integraciones futuras (WhatsApp).
        </p>
        <div className="d-flex gap-2">
          <button type="button" className="btn btn-sm btn-outline-secondary" onClick={() => void load()}>
            <i className="ti ti-refresh" /> Recargar
          </button>
          {canEdit && (
            <button type="button" className="btn btn-sm btn-primary" onClick={openCreate}>
              <i className="ti ti-plus" /> Nuevo motorizado
            </button>
          )}
        </div>
      </div>

      {error && (
        <div className="alert alert-warning py-2 small mb-3" role="alert">
          {error}
        </div>
      )}

      {loading ? (
        <p className="text-muted">Cargando…</p>
      ) : (
        <div className="table-responsive border rounded">
          <table className="table table-sm table-hover align-middle mb-0">
            <thead className="table-light">
              <tr>
                <th>Nombre</th>
                <th>Teléfono</th>
                <th>Documento</th>
                <th>Moneda pago</th>
                <th className="text-end">Deuda pendiente (Bs)</th>
                <th>Activo</th>
                {canEdit && <th />}
              </tr>
            </thead>
            <tbody>
              {rows.map((p) => {
                const owed = owedByProvider(Number(p.id));
                return (
                  <tr key={p.id} className={!p.is_active ? "table-secondary" : undefined}>
                    <td className="fw-medium">{p.name}</td>
                    <td><code className="small">{p.phone ?? "—"}</code></td>
                    <td className="small">{p.id_document ?? "—"}</td>
                    <td><span className="badge bg-light text-dark border">{p.preferred_currency}</span></td>
                    <td className="text-end">
                      {owed != null && owed > 0 ? (
                        <span className="text-warning fw-semibold">{owed.toLocaleString("es-VE", { minimumFractionDigits: 2 })}</span>
                      ) : (
                        "—"
                      )}
                    </td>
                    <td>{p.is_active ? <span className="text-success">Sí</span> : <span className="text-muted">No</span>}</td>
                    {canEdit && (
                      <td className="text-end">
                        <button type="button" className="btn btn-link btn-sm py-0" onClick={() => openEdit(p)}>
                          Editar
                        </button>
                      </td>
                    )}
                  </tr>
                );
              })}
            </tbody>
          </table>
          {!rows.length && <p className="text-muted small p-3 mb-0">No hay motorizados registrados.</p>}
        </div>
      )}

      {modalOpen && (
        <div className="modal d-block" tabIndex={-1} role="dialog" style={{ background: "rgba(0,0,0,0.45)" }}>
          <div className="modal-dialog modal-dialog-centered">
            <div className="modal-content">
              <div className="modal-header">
                <h5 className="modal-title">{editing ? "Editar motorizado" : "Nuevo motorizado"}</h5>
                <button type="button" className="btn-close" aria-label="Cerrar" onClick={() => setModalOpen(false)} />
              </div>
              <div className="modal-body">
                <div className="mb-2">
                  <label className="form-label small">Nombre</label>
                  <input
                    className="form-control form-control-sm"
                    value={form.name}
                    onChange={(e) => setForm((f) => ({ ...f, name: e.target.value }))}
                    maxLength={100}
                  />
                </div>
                <div className="mb-2">
                  <label className="form-label small">Teléfono (móvil VE)</label>
                  <input
                    className="form-control form-control-sm"
                    placeholder="4141234567 o 584141234567"
                    value={form.phone}
                    onChange={(e) => setForm((f) => ({ ...f, phone: e.target.value }))}
                  />
                </div>
                <div className="mb-2">
                  <label className="form-label small">Cédula / RIF (opcional)</label>
                  <input
                    className="form-control form-control-sm"
                    value={form.id_document}
                    onChange={(e) => setForm((f) => ({ ...f, id_document: e.target.value }))}
                    maxLength={20}
                  />
                </div>
                <div className="mb-2">
                  <label className="form-label small">Moneda de liquidación preferida</label>
                  <select
                    className="form-select form-select-sm"
                    value={form.preferred_currency}
                    onChange={(e) =>
                      setForm((f) => ({ ...f, preferred_currency: e.target.value as DeliveryCurrency }))
                    }
                  >
                    {DELIVERY_CURRENCIES.map((c) => (
                      <option key={c} value={c}>{c}</option>
                    ))}
                  </select>
                </div>
                {editing && (
                  <div className="form-check mt-2">
                    <input
                      className="form-check-input"
                      type="checkbox"
                      id="p-active"
                      checked={form.is_active}
                      onChange={(e) => setForm((f) => ({ ...f, is_active: e.target.checked }))}
                    />
                    <label className="form-check-label small" htmlFor="p-active">Activo</label>
                  </div>
                )}
              </div>
              <div className="modal-footer">
                <button type="button" className="btn btn-sm btn-outline-secondary" onClick={() => setModalOpen(false)}>
                  Cancelar
                </button>
                {canEdit && (
                  <button type="button" className="btn btn-sm btn-primary" disabled={saving} onClick={() => void saveProvider()}>
                    {saving ? "Guardando…" : "Guardar"}
                  </button>
                )}
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
