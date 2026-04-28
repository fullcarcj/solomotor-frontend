"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import { DELIVERY_SERVICE_STATUS_LABELS, LIQUIDATE_PAID_BY } from "../deliveryTypes";

type ServiceRow = {
  id: number;
  order_id: number;
  zone_id: number;
  zone_name: string;
  provider_id: number | null;
  provider_name: string | null;
  client_amount_bs: string | number;
  provider_amount_bs: string | number;
  payment_currency: string;
  status: string;
  external_order_id: string | null;
  created_at: string;
  assigned_at?: string | null;
  delivered_at?: string | null;
  notes?: string | null;
};

type ProviderOpt = { id: number; name: string; is_active: boolean };

function num(v: string | number | null | undefined): number {
  const n = Number(String(v ?? "").replace(",", "."));
  return Number.isFinite(n) ? n : 0;
}

function toIsoStart(d: string): string {
  return `${d}T00:00:00.000Z`;
}

function toIsoEnd(d: string): string {
  return `${d}T23:59:59.999Z`;
}

type ServicesTabProps = { canEdit: boolean };

export default function ServicesTab({ canEdit }: ServicesTabProps) {
  const [rows, setRows] = useState<ServiceRow[]>([]);
  const [providers, setProviders] = useState<ProviderOpt[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [stats, setStats] = useState<Record<string, unknown> | null>(null);

  const today = useMemo(() => new Date().toISOString().slice(0, 10), []);
  const defaultFrom = useMemo(() => {
    const d = new Date();
    d.setDate(d.getDate() - 30);
    return d.toISOString().slice(0, 10);
  }, []);

  const [fromD, setFromD] = useState(defaultFrom);
  const [toD, setToD] = useState(today);
  const [statusFilter, setStatusFilter] = useState("");
  const [providerFilter, setProviderFilter] = useState("");

  const [assignOpen, setAssignOpen] = useState(false);
  const [assignSvcId, setAssignSvcId] = useState<number | null>(null);
  const [assignProvId, setAssignProvId] = useState("");
  const [assignBusy, setAssignBusy] = useState(false);

  const [deliverOpen, setDeliverOpen] = useState(false);
  const [deliverSvcId, setDeliverSvcId] = useState<number | null>(null);
  const [deliverNotes, setDeliverNotes] = useState("");
  const [deliverBusy, setDeliverBusy] = useState(false);

  const [liqProviderId, setLiqProviderId] = useState("");
  const [liqPending, setLiqPending] = useState<{
    pending_count: number;
    total_owed_bs: number;
    deliveries: Array<Record<string, unknown>>;
  } | null>(null);
  const [liqLoading, setLiqLoading] = useState(false);
  const [liqStatement, setLiqStatement] = useState("");
  const [liqManual, setLiqManual] = useState("");
  const [liqPaidBy, setLiqPaidBy] = useState<string>(LIQUIDATE_PAID_BY[0]);
  const [liqBusy, setLiqBusy] = useState(false);
  const [liqMsg, setLiqMsg] = useState<string | null>(null);

  const loadProviders = useCallback(async () => {
    const res = await fetch("/api/delivery/providers", { credentials: "include", cache: "no-store" });
    const j = (await res.json().catch(() => ({}))) as Record<string, unknown>;
    if (!res.ok) return;
    const data = j.data;
    if (!Array.isArray(data)) return;
    setProviders(
      (data as ProviderOpt[]).map((p) => ({
        id: Number(p.id),
        name: String(p.name),
        is_active: Boolean(p.is_active),
      }))
    );
  }, []);

  const loadServices = useCallback(async () => {
    setLoading(true);
    setError(null);
    const q = new URLSearchParams();
    q.set("limit", "200");
    q.set("offset", "0");
    q.set("from", toIsoStart(fromD));
    q.set("to", toIsoEnd(toD));
    if (statusFilter) q.set("status", statusFilter);
    if (providerFilter) q.set("provider_id", providerFilter);
    try {
      const [sRes, stRes] = await Promise.all([
        fetch(`/api/delivery/services?${q}`, { credentials: "include", cache: "no-store" }),
        fetch(
          `/api/delivery/stats?from=${encodeURIComponent(toIsoStart(fromD))}&to=${encodeURIComponent(toIsoEnd(toD))}`,
          { credentials: "include", cache: "no-store" }
        ),
      ]);
      const sj = (await sRes.json().catch(() => ({}))) as Record<string, unknown>;
      if (!sRes.ok) {
        setError(String(sj.message ?? sj.error ?? "Error al cargar carreras"));
        setRows([]);
      } else {
        const data = sj.data;
        setRows(Array.isArray(data) ? (data as ServiceRow[]) : []);
      }
      const stj = (await stRes.json().catch(() => ({}))) as Record<string, unknown>;
      if (stRes.ok && stj.data && typeof stj.data === "object") {
        setStats(stj.data as Record<string, unknown>);
      } else {
        setStats(null);
      }
    } catch {
      setError("Error de red.");
      setRows([]);
    } finally {
      setLoading(false);
    }
  }, [fromD, toD, statusFilter, providerFilter]);

  useEffect(() => {
    void loadProviders();
  }, [loadProviders]);

  useEffect(() => {
    void loadServices();
  }, [loadServices]);

  const openAssign = (svc: ServiceRow) => {
    setAssignSvcId(svc.id);
    setAssignProvId(svc.provider_id ? String(svc.provider_id) : "");
    setAssignOpen(true);
  };

  const submitAssign = async () => {
    if (!canEdit || !assignSvcId || assignBusy) return;
    const pid = Number(assignProvId);
    if (!Number.isFinite(pid) || pid <= 0) {
      setError("Seleccioná un motorizado.");
      return;
    }
    setAssignBusy(true);
    setError(null);
    try {
      const res = await fetch(`/api/delivery/services/${assignSvcId}/assign`, {
        method: "PATCH",
        credentials: "include",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ provider_id: pid }),
      });
      const j = await res.json().catch(() => ({}));
      if (!res.ok) {
        setError(String((j as Record<string, unknown>).message ?? "No se pudo asignar"));
        return;
      }
      setAssignOpen(false);
      await loadServices();
    } catch {
      setError("Error de red.");
    } finally {
      setAssignBusy(false);
    }
  };

  const openDeliver = (svc: ServiceRow) => {
    setDeliverSvcId(svc.id);
    setDeliverNotes("");
    setDeliverOpen(true);
  };

  const submitDeliver = async () => {
    if (!canEdit || !deliverSvcId || deliverBusy) return;
    setDeliverBusy(true);
    setError(null);
    try {
      const res = await fetch(`/api/delivery/services/${deliverSvcId}/deliver`, {
        method: "PATCH",
        credentials: "include",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ notes: deliverNotes.trim() || undefined }),
      });
      const j = await res.json().catch(() => ({}));
      if (!res.ok) {
        setError(String((j as Record<string, unknown>).message ?? "No se pudo marcar entregada"));
        return;
      }
      setDeliverOpen(false);
      await loadServices();
    } catch {
      setError("Error de red.");
    } finally {
      setDeliverBusy(false);
    }
  };

  const loadLiqPending = async () => {
    const pid = Number(liqProviderId);
    if (!Number.isFinite(pid) || pid <= 0) {
      setLiqPending(null);
      return;
    }
    setLiqLoading(true);
    setLiqMsg(null);
    try {
      const res = await fetch(`/api/delivery/providers/${pid}/pending`, {
        credentials: "include",
        cache: "no-store",
      });
      const j = (await res.json().catch(() => ({}))) as Record<string, unknown>;
      if (!res.ok) {
        setLiqPending(null);
        setLiqMsg(String(j.message ?? j.error ?? "Sin datos"));
        return;
      }
      const data = j.data as Record<string, unknown> | undefined;
      if (!data) {
        setLiqPending(null);
        return;
      }
      setLiqPending({
        pending_count: Number(data.pending_count ?? 0),
        total_owed_bs: Number(String(data.total_owed_bs ?? "0").replace(",", ".")) || 0,
        deliveries: Array.isArray(data.deliveries) ? (data.deliveries as Array<Record<string, unknown>>) : [],
      });
    } catch {
      setLiqMsg("Error de red.");
      setLiqPending(null);
    } finally {
      setLiqLoading(false);
    }
  };

  const submitLiquidate = async () => {
    if (!canEdit || liqBusy) return;
    const pid = Number(liqProviderId);
    if (!Number.isFinite(pid) || pid <= 0) {
      setLiqMsg("Seleccioná un motorizado.");
      return;
    }
    const sid = liqStatement.trim() ? Number(liqStatement.replace(/\D/g, "")) : NaN;
    const mid = liqManual.trim() ? Number(liqManual.replace(/\D/g, "")) : NaN;
    if (!Number.isFinite(sid) && !Number.isFinite(mid)) {
      setLiqMsg("Indicá statement_id o manual_tx_id del pago realizado.");
      return;
    }
    const body: Record<string, unknown> = { paid_by: liqPaidBy };
    if (Number.isFinite(sid) && sid > 0) body.statement_id = sid;
    if (Number.isFinite(mid) && mid > 0) body.manual_tx_id = mid;

    setLiqBusy(true);
    setLiqMsg(null);
    try {
      const res = await fetch(`/api/delivery/providers/${pid}/liquidate`, {
        method: "POST",
        credentials: "include",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(body),
      });
      const j = await res.json().catch(() => ({}));
      if (!res.ok) {
        setLiqMsg(String((j as Record<string, unknown>).message ?? (j as Record<string, unknown>).error ?? "Error"));
        return;
      }
      setLiqStatement("");
      setLiqManual("");
      setLiqPending(null);
      setLiqMsg("Liquidación registrada correctamente.");
      await loadServices();
      await loadProviders();
    } catch {
      setLiqMsg("Error de red.");
    } finally {
      setLiqBusy(false);
    }
  };

  const activeProviders = providers.filter((p) => p.is_active);

  return (
    <div>
      {stats && (
        <div className="row g-2 mb-3">
          {[
            ["Carreras (rango)", String(stats.total_deliveries ?? "—")],
            ["Sin asignar", String(stats.unassigned_count ?? "—")],
            ["Pend. pago motor.", String(stats.pending_payment_count ?? "—")],
            ["Pagadas", String(stats.paid_count ?? "—")],
            ["Total pend. liquidar (Bs)", num(stats.total_pending_bs as string | number).toLocaleString("es-VE", { minimumFractionDigits: 2 })],
          ].map(([k, v]) => (
            <div key={k} className="col-6 col-md">
              <div className="border rounded p-2 small h-100">
                <div className="text-muted text-uppercase" style={{ fontSize: "0.65rem" }}>{k}</div>
                <div className="fw-semibold">{v}</div>
              </div>
            </div>
          ))}
        </div>
      )}

      <div className="card mb-3">
        <div className="card-header py-2 small fw-semibold">Filtros</div>
        <div className="card-body py-2">
          <div className="row g-2 align-items-end">
            <div className="col-md-2">
              <label className="form-label small mb-0">Desde</label>
              <input type="date" className="form-control form-control-sm" value={fromD} onChange={(e) => setFromD(e.target.value)} />
            </div>
            <div className="col-md-2">
              <label className="form-label small mb-0">Hasta</label>
              <input type="date" className="form-control form-control-sm" value={toD} onChange={(e) => setToD(e.target.value)} />
            </div>
            <div className="col-md-3">
              <label className="form-label small mb-0">Estado</label>
              <select
                className="form-select form-select-sm"
                value={statusFilter}
                onChange={(e) => setStatusFilter(e.target.value)}
              >
                <option value="">Todos</option>
                {Object.keys(DELIVERY_SERVICE_STATUS_LABELS).map((s) => (
                  <option key={s} value={s}>{DELIVERY_SERVICE_STATUS_LABELS[s]}</option>
                ))}
              </select>
            </div>
            <div className="col-md-3">
              <label className="form-label small mb-0">Motorizado</label>
              <select
                className="form-select form-select-sm"
                value={providerFilter}
                onChange={(e) => setProviderFilter(e.target.value)}
              >
                <option value="">Todos</option>
                {providers.map((p) => (
                  <option key={p.id} value={String(p.id)}>{p.name}{!p.is_active ? " (inactivo)" : ""}</option>
                ))}
              </select>
            </div>
            <div className="col-md-2">
              <button type="button" className="btn btn-sm btn-primary w-100" onClick={() => void loadServices()}>
                Aplicar
              </button>
            </div>
          </div>
        </div>
      </div>

      {error && (
        <div className="alert alert-warning py-2 small mb-3" role="alert">
          {error}
        </div>
      )}

      {loading ? (
        <p className="text-muted">Cargando carreras…</p>
      ) : (
        <div className="table-responsive border rounded mb-4">
          <table className="table table-sm table-hover align-middle mb-0">
            <thead className="table-light">
              <tr>
                <th>ID</th>
                <th>Fecha</th>
                <th>Orden</th>
                <th>Zona</th>
                <th>Motorizado</th>
                <th className="text-end">Cliente Bs</th>
                <th className="text-end">Motor. Bs</th>
                <th>Estado</th>
                {canEdit && <th />}
              </tr>
            </thead>
            <tbody>
              {rows.map((r) => (
                <tr key={r.id}>
                  <td className="text-muted small">{r.id}</td>
                  <td className="small">{r.created_at ? new Date(r.created_at).toLocaleString("es-VE") : "—"}</td>
                  <td><code className="small">{r.external_order_id ?? `#${r.order_id}`}</code></td>
                  <td className="small">{r.zone_name}</td>
                  <td className="small">{r.provider_name ?? "—"}</td>
                  <td className="text-end">{num(r.client_amount_bs).toLocaleString("es-VE", { minimumFractionDigits: 2 })}</td>
                  <td className="text-end">{num(r.provider_amount_bs).toLocaleString("es-VE", { minimumFractionDigits: 2 })}</td>
                  <td>
                    <span className="badge bg-light text-dark border">
                      {DELIVERY_SERVICE_STATUS_LABELS[r.status] ?? r.status}
                    </span>
                  </td>
                  {canEdit && (
                    <td className="text-end text-nowrap">
                      {r.status === "pending_assignment" && (
                        <button type="button" className="btn btn-link btn-sm py-0" onClick={() => openAssign(r)}>
                          Asignar
                        </button>
                      )}
                      {r.status === "assigned" && (
                        <button type="button" className="btn btn-link btn-sm py-0" onClick={() => openDeliver(r)}>
                          Entregada
                        </button>
                      )}
                    </td>
                  )}
                </tr>
              ))}
            </tbody>
          </table>
          {!rows.length && <p className="text-muted small p-3 mb-0">No hay carreras en el rango.</p>}
        </div>
      )}

      <div className="card border-primary">
        <div className="card-header py-2 bg-primary text-white small fw-semibold">
          Liquidación a motorizados (ej. viernes)
        </div>
        <div className="card-body">
          <p className="text-muted small">
            Se marcan como pagadas las carreras en estado <strong>Pendiente pago motorizado</strong> vinculadas al comprobante de pago (extracto o transacción manual).
          </p>
          <div className="row g-2 align-items-end">
            <div className="col-md-3">
              <label className="form-label small mb-0">Motorizado</label>
              <select
                className="form-select form-select-sm"
                value={liqProviderId}
                onChange={(e) => {
                  setLiqProviderId(e.target.value);
                  setLiqPending(null);
                }}
              >
                <option value="">— Elegir —</option>
                {activeProviders.map((p) => (
                  <option key={p.id} value={String(p.id)}>{p.name}</option>
                ))}
              </select>
            </div>
            <div className="col-md-2">
              <button type="button" className="btn btn-sm btn-outline-secondary w-100" onClick={() => void loadLiqPending()} disabled={!liqProviderId || liqLoading}>
                {liqLoading ? "…" : "Ver pendientes"}
              </button>
            </div>
            <div className="col-md-2">
              <label className="form-label small mb-0">statement_id</label>
              <input className="form-control form-control-sm" value={liqStatement} onChange={(e) => setLiqStatement(e.target.value)} placeholder="ID extracto" />
            </div>
            <div className="col-md-2">
              <label className="form-label small mb-0">manual_tx_id</label>
              <input className="form-control form-control-sm" value={liqManual} onChange={(e) => setLiqManual(e.target.value)} placeholder="ID transacción" />
            </div>
            <div className="col-md-2">
              <label className="form-label small mb-0">Pagado por</label>
              <select className="form-select form-select-sm" value={liqPaidBy} onChange={(e) => setLiqPaidBy(e.target.value)}>
                {LIQUIDATE_PAID_BY.map((n) => (
                  <option key={n} value={n}>{n}</option>
                ))}
              </select>
            </div>
            <div className="col-md-1">
              <button
                type="button"
                className="btn btn-sm btn-success w-100"
                disabled={!canEdit || liqBusy || !liqProviderId}
                onClick={() => void submitLiquidate()}
              >
                Liquidar
              </button>
            </div>
          </div>
          {liqMsg && <div className={`small mt-2 ${liqMsg.includes("correctamente") ? "text-success" : "text-danger"}`}>{liqMsg}</div>}
          {liqPending && (
            <div className="mt-3 small">
              <strong>{liqPending.pending_count}</strong> carrera(s) · Total <strong>Bs {liqPending.total_owed_bs.toLocaleString("es-VE", { minimumFractionDigits: 2 })}</strong>
              {liqPending.deliveries.length > 0 && (
                <ul className="mb-0 mt-2">
                  {liqPending.deliveries.slice(0, 20).map((d) => (
                    <li key={String(d.id)}>
                      #{String(d.id)} — {String(d.zone_name ?? "")} — Bs {num(d.provider_amount_bs as string | number).toFixed(2)}
                    </li>
                  ))}
                  {liqPending.deliveries.length > 20 && <li>…</li>}
                </ul>
              )}
            </div>
          )}
        </div>
      </div>

      {assignOpen && (
        <div className="modal d-block" tabIndex={-1} role="dialog" style={{ background: "rgba(0,0,0,0.45)" }}>
          <div className="modal-dialog modal-dialog-centered">
            <div className="modal-content">
              <div className="modal-header">
                <h5 className="modal-title">Asignar motorizado</h5>
                <button type="button" className="btn-close" onClick={() => setAssignOpen(false)} aria-label="Cerrar" />
              </div>
              <div className="modal-body">
                <label className="form-label small">Motorizado</label>
                <select className="form-select form-select-sm" value={assignProvId} onChange={(e) => setAssignProvId(e.target.value)}>
                  <option value="">— Elegir —</option>
                  {activeProviders.map((p) => (
                    <option key={p.id} value={String(p.id)}>{p.name}</option>
                  ))}
                </select>
              </div>
              <div className="modal-footer">
                <button type="button" className="btn btn-sm btn-outline-secondary" onClick={() => setAssignOpen(false)}>Cancelar</button>
                <button type="button" className="btn btn-sm btn-primary" disabled={assignBusy} onClick={() => void submitAssign()}>Asignar</button>
              </div>
            </div>
          </div>
        </div>
      )}

      {deliverOpen && (
        <div className="modal d-block" tabIndex={-1} role="dialog" style={{ background: "rgba(0,0,0,0.45)" }}>
          <div className="modal-dialog modal-dialog-centered">
            <div className="modal-content">
              <div className="modal-header">
                <h5 className="modal-title">Confirmar entrega</h5>
                <button type="button" className="btn-close" onClick={() => setDeliverOpen(false)} aria-label="Cerrar" />
              </div>
              <div className="modal-body">
                <label className="form-label small">Notas (opcional)</label>
                <textarea className="form-control form-control-sm" rows={3} value={deliverNotes} onChange={(e) => setDeliverNotes(e.target.value)} />
              </div>
              <div className="modal-footer">
                <button type="button" className="btn btn-sm btn-outline-secondary" onClick={() => setDeliverOpen(false)}>Cancelar</button>
                <button type="button" className="btn btn-sm btn-primary" disabled={deliverBusy} onClick={() => void submitDeliver()}>Marcar entregada</button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
