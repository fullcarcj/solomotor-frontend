"use client";

import { useCallback, useEffect, useState } from "react";
import { DELIVERY_CURRENCIES, type DeliveryCurrency } from "../deliveryTypes";

type ZoneRow = {
  id: number;
  zone_name: string;
  description: string | null;
  base_cost_bs: string | number;
  client_price_bs: string | number;
  base_cost_usd: string | number | null;
  currency_pago: string;
  estimated_minutes: number | null;
  is_active: boolean;
};

function num(v: string | number | null | undefined): number {
  const n = Number(String(v ?? "").replace(",", "."));
  return Number.isFinite(n) ? n : 0;
}

function parseActiveRate(json: unknown): number | null {
  if (!json || typeof json !== "object") return null;
  const o = json as Record<string, unknown>;
  const d = o.data;
  if (d && typeof d === "object") {
    const r = Number((d as Record<string, unknown>).active_rate);
    return Number.isFinite(r) && r > 0 ? r : null;
  }
  return null;
}

type ZonesTabProps = { canEdit: boolean };

export default function ZonesTab({ canEdit }: ZonesTabProps) {
  const [rows, setRows] = useState<ZoneRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [rateBs, setRateBs] = useState<number | null>(null);
  const [modalOpen, setModalOpen] = useState(false);
  const [editing, setEditing] = useState<ZoneRow | null>(null);
  const [saving, setSaving] = useState(false);
  const [form, setForm] = useState({
    zone_name: "",
    description: "",
    base_cost_bs: "",
    client_price_bs: "",
    base_cost_usd: "",
    currency_pago: "BS" as DeliveryCurrency,
    estimated_minutes: "30",
    is_active: true,
  });

  const loadZones = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const [zRes, rRes] = await Promise.all([
        fetch("/api/delivery/zones?all=1", { credentials: "include", cache: "no-store" }),
        fetch("/api/currency/today", { credentials: "include", cache: "no-store" }),
      ]);
      const zj = (await zRes.json().catch(() => ({}))) as Record<string, unknown>;
      if (!zRes.ok) {
        setError(String(zj.message ?? zj.error ?? "No se pudieron cargar las zonas"));
        setRows([]);
        return;
      }
      const data = zj.data;
      setRows(Array.isArray(data) ? (data as ZoneRow[]) : []);
      const rj = await rRes.json().catch(() => ({}));
      setRateBs(parseActiveRate(rj));
    } catch {
      setError("Error de red.");
      setRows([]);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    void loadZones();
  }, [loadZones]);

  const openCreate = () => {
    setEditing(null);
    setForm({
      zone_name: "",
      description: "",
      base_cost_bs: "",
      client_price_bs: "",
      base_cost_usd: "",
      currency_pago: "BS",
      estimated_minutes: "30",
      is_active: true,
    });
    setModalOpen(true);
  };

  const openEdit = (z: ZoneRow) => {
    setEditing(z);
    setForm({
      zone_name: z.zone_name,
      description: z.description ?? "",
      base_cost_bs: String(z.base_cost_bs ?? ""),
      client_price_bs: String(z.client_price_bs ?? ""),
      base_cost_usd: z.base_cost_usd != null ? String(z.base_cost_usd) : "",
      currency_pago: (z.currency_pago as DeliveryCurrency) || "BS",
      estimated_minutes: String(z.estimated_minutes ?? 30),
      is_active: Boolean(z.is_active),
    });
    setModalOpen(true);
  };

  const syncUsdPlaceholders = () => {
    if (form.currency_pago !== "USD") return;
    const usd = num(form.base_cost_usd || form.client_price_bs || form.base_cost_bs);
    if (usd <= 0) return;
    const s = String(usd);
    setForm((f) => ({ ...f, base_cost_bs: s, client_price_bs: s, base_cost_usd: s }));
  };

  const saveZone = async () => {
    if (!canEdit || saving) return;
    const zone_name = form.zone_name.trim();
    if (zone_name.length < 2) {
      setError("El nombre de la zona debe tener al menos 2 caracteres.");
      return;
    }
    const base_cost_bs = num(form.base_cost_bs);
    const client_price_bs = num(form.client_price_bs);
    if (base_cost_bs <= 0 || client_price_bs <= 0) {
      setError("Los montos en Bs (referencia) deben ser mayores que cero.");
      return;
    }
    const estimated_minutes = Math.min(
      600,
      Math.max(1, Math.floor(Number(form.estimated_minutes) || 30))
    );
    const base_cost_usd =
      form.currency_pago === "USD" && num(form.base_cost_usd) > 0 ? num(form.base_cost_usd) : undefined;
    const body: Record<string, unknown> = {
      zone_name,
      description: form.description.trim() || undefined,
      base_cost_bs,
      client_price_bs,
      currency_pago: form.currency_pago,
      estimated_minutes,
    };
    if (base_cost_usd != null && base_cost_usd > 0) body.base_cost_usd = base_cost_usd;

    setSaving(true);
    setError(null);
    try {
      if (editing) {
        body.is_active = form.is_active;
        const res = await fetch(`/api/delivery/zones/${editing.id}`, {
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
        const res = await fetch("/api/delivery/zones", {
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
      await loadZones();
    } catch {
      setError("Error de red al guardar.");
    } finally {
      setSaving(false);
    }
  };

  const toggleActive = async (z: ZoneRow) => {
    if (!canEdit) return;
    try {
      const res = await fetch(`/api/delivery/zones/${z.id}`, {
        method: "PATCH",
        credentials: "include",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ is_active: !z.is_active }),
      });
      if (!res.ok) {
        const j = await res.json().catch(() => ({}));
        setError(String((j as Record<string, unknown>).message ?? "Error"));
        return;
      }
      await loadZones();
    } catch {
      setError("Error de red.");
    }
  };

  const usdHint = (z: ZoneRow) => {
    if (String(z.currency_pago).toUpperCase() !== "USD" || !rateBs) return null;
    const u = num(z.base_cost_usd);
    if (u <= 0) return null;
    const bs = u * rateBs;
    return `≈ Bs ${bs.toLocaleString("es-VE", { minimumFractionDigits: 2, maximumFractionDigits: 2 })} (tasa activa)`;
  };

  return (
    <div>
      <div className="d-flex align-items-center justify-content-between flex-wrap gap-2 mb-3">
        <p className="text-muted small mb-0">
          Tarifas por zona. Zonas en USD usan el mismo recálculo BCV/Binance que el catálogo al cotizar.
        </p>
        <div className="d-flex gap-2">
          <button type="button" className="btn btn-sm btn-outline-secondary" onClick={() => void loadZones()}>
            <i className="ti ti-refresh" /> Recargar
          </button>
          {canEdit && (
            <button type="button" className="btn btn-sm btn-primary" onClick={openCreate}>
              <i className="ti ti-plus" /> Nueva zona
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
        <p className="text-muted">Cargando zonas…</p>
      ) : (
        <div className="table-responsive border rounded">
          <table className="table table-sm table-hover align-middle mb-0">
            <thead className="table-light">
              <tr>
                <th>Zona</th>
                <th>Moneda</th>
                <th className="text-end">Base Bs</th>
                <th className="text-end">Cliente Bs</th>
                <th className="text-end">USD</th>
                <th className="text-end">Min</th>
                <th>Activa</th>
                {canEdit && <th />}
              </tr>
            </thead>
            <tbody>
              {rows.map((z) => (
                <tr key={z.id} className={!z.is_active ? "table-secondary" : undefined}>
                  <td>
                    <div className="fw-medium">{z.zone_name}</div>
                    {z.description && <div className="text-muted small text-truncate" style={{ maxWidth: 280 }}>{z.description}</div>}
                    {usdHint(z) && <div className="text-muted small">{usdHint(z)}</div>}
                  </td>
                  <td><span className="badge bg-light text-dark border">{z.currency_pago}</span></td>
                  <td className="text-end">{num(z.base_cost_bs).toLocaleString("es-VE", { minimumFractionDigits: 2 })}</td>
                  <td className="text-end">{num(z.client_price_bs).toLocaleString("es-VE", { minimumFractionDigits: 2 })}</td>
                  <td className="text-end">{z.base_cost_usd != null ? num(z.base_cost_usd).toFixed(2) : "—"}</td>
                  <td className="text-end">{z.estimated_minutes ?? "—"}</td>
                  <td>{z.is_active ? <span className="text-success">Sí</span> : <span className="text-muted">No</span>}</td>
                  {canEdit && (
                    <td className="text-end text-nowrap">
                      <button type="button" className="btn btn-link btn-sm py-0" onClick={() => openEdit(z)}>
                        Editar
                      </button>
                      <button type="button" className="btn btn-link btn-sm py-0" onClick={() => void toggleActive(z)}>
                        {z.is_active ? "Desactivar" : "Activar"}
                      </button>
                    </td>
                  )}
                </tr>
              ))}
            </tbody>
          </table>
          {!rows.length && <p className="text-muted small p-3 mb-0">No hay zonas registradas.</p>}
        </div>
      )}

      {modalOpen && (
        <div className="modal d-block" tabIndex={-1} role="dialog" style={{ background: "rgba(0,0,0,0.45)" }}>
          <div className="modal-dialog modal-lg modal-dialog-centered">
            <div className="modal-content">
              <div className="modal-header">
                <h5 className="modal-title">{editing ? "Editar zona" : "Nueva zona"}</h5>
                <button type="button" className="btn-close" aria-label="Cerrar" onClick={() => setModalOpen(false)} />
              </div>
              <div className="modal-body">
                <div className="row g-2">
                  <div className="col-md-8">
                    <label className="form-label small">Nombre</label>
                    <input
                      className="form-control form-control-sm"
                      value={form.zone_name}
                      onChange={(e) => setForm((f) => ({ ...f, zone_name: e.target.value }))}
                      maxLength={100}
                    />
                  </div>
                  <div className="col-md-4">
                    <label className="form-label small">Moneda de pago</label>
                    <select
                      className="form-select form-select-sm"
                      value={form.currency_pago}
                      onChange={(e) =>
                        setForm((f) => ({ ...f, currency_pago: e.target.value as DeliveryCurrency }))
                      }
                    >
                      {DELIVERY_CURRENCIES.map((c) => (
                        <option key={c} value={c}>{c}</option>
                      ))}
                    </select>
                  </div>
                  <div className="col-12">
                    <label className="form-label small">Descripción</label>
                    <textarea
                      className="form-control form-control-sm"
                      rows={2}
                      value={form.description}
                      onChange={(e) => setForm((f) => ({ ...f, description: e.target.value }))}
                      maxLength={500}
                    />
                  </div>
                  <div className="col-md-4">
                    <label className="form-label small">Precio base (referencia Bs)</label>
                    <input
                      className="form-control form-control-sm"
                      type="number"
                      step="0.01"
                      min="0"
                      value={form.base_cost_bs}
                      onChange={(e) => setForm((f) => ({ ...f, base_cost_bs: e.target.value }))}
                    />
                  </div>
                  <div className="col-md-4">
                    <label className="form-label small">Precio cliente (referencia Bs)</label>
                    <input
                      className="form-control form-control-sm"
                      type="number"
                      step="0.01"
                      min="0"
                      value={form.client_price_bs}
                      onChange={(e) => setForm((f) => ({ ...f, client_price_bs: e.target.value }))}
                    />
                  </div>
                  <div className="col-md-4">
                    <label className="form-label small">Tarifa USD (opcional)</label>
                    <input
                      className="form-control form-control-sm"
                      type="number"
                      step="0.0001"
                      min="0"
                      value={form.base_cost_usd}
                      onChange={(e) => setForm((f) => ({ ...f, base_cost_usd: e.target.value }))}
                    />
                    {form.currency_pago === "USD" && (
                      <button type="button" className="btn btn-link btn-sm p-0 mt-1" onClick={syncUsdPlaceholders}>
                        Igualar Bs referencia al monto USD
                      </button>
                    )}
                  </div>
                  <div className="col-md-4">
                    <label className="form-label small">Tiempo estimado (min)</label>
                    <input
                      className="form-control form-control-sm"
                      type="number"
                      min={1}
                      max={600}
                      value={form.estimated_minutes}
                      onChange={(e) => setForm((f) => ({ ...f, estimated_minutes: e.target.value }))}
                    />
                  </div>
                  {editing && (
                    <div className="col-md-4 d-flex align-items-end">
                      <div className="form-check">
                        <input
                          className="form-check-input"
                          type="checkbox"
                          id="z-active"
                          checked={form.is_active}
                          onChange={(e) => setForm((f) => ({ ...f, is_active: e.target.checked }))}
                        />
                        <label className="form-check-label small" htmlFor="z-active">Zona activa</label>
                      </div>
                    </div>
                  )}
                </div>
              </div>
              <div className="modal-footer">
                <button type="button" className="btn btn-sm btn-outline-secondary" onClick={() => setModalOpen(false)}>
                  Cancelar
                </button>
                {canEdit && (
                  <button type="button" className="btn btn-sm btn-primary" disabled={saving} onClick={() => void saveZone()}>
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
