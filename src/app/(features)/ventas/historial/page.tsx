"use client";

/**
 * Historial de pedidos procesados/cerrados (GET /api/ventas/historial → include_completed=1).
 *
 * Definición de "procesado" por canal (documentación; el filtro real lo aplica el backend):
 * - MercadoLibre: feedback_sale = 'positive' O date_created > 10 días → en BD suele ser status = 'completed'.
 * - Mostrador / WA / Ecommerce / Fuerza ventas: status = 'completed' O 'cancelled'.
 *
 * Comparado con "Todos los pedidos" (/ventas/pedidos): aquí solo órdenes cerradas/completadas
 * según política del backend; fechas por defecto últimos 30 días; estados típicos completed/cancelled.
 */

import Link from "next/link";
import { useCallback, useEffect, useMemo, useState } from "react";
import CommonFooter from "@/core/common/footer/commonFooter";
import { all_routes } from "@/data/all_routes";
import type { SalesHistorialResponse, SalesOrderSummary } from "@/types/ventas";

const LIMIT = 20;

const SOURCE_OPTIONS: { value: string; label: string }[] = [
  { value: "", label: "Todos" },
  { value: "mercadolibre", label: "MercadoLibre" },
  { value: "mostrador", label: "Mostrador" },
  { value: "social_media", label: "WhatsApp" },
  { value: "ecommerce", label: "Ecommerce" },
  { value: "fuerza_ventas", label: "Fuerza de ventas" },
];

const STATUS_OPTIONS: { value: string; label: string }[] = [
  { value: "", label: "Todos" },
  { value: "completed", label: "Completado" },
  { value: "cancelled", label: "Cancelado" },
];

const BREAKDOWN_KEYS: { key: string; label: string }[] = [
  { key: "mercadolibre", label: "MercadoLibre" },
  { key: "mostrador", label: "Mostrador" },
  { key: "social_media", label: "WhatsApp" },
  { key: "ecommerce", label: "Ecommerce" },
  { key: "fuerza_ventas", label: "Fuerza de ventas" },
];

function toYmd(d: Date): string {
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, "0");
  const day = String(d.getDate()).padStart(2, "0");
  return `${y}-${m}-${day}`;
}

function defaultDateRange(): { from: string; to: string } {
  const to = new Date();
  const from = new Date();
  from.setDate(from.getDate() - 30);
  return { from: toYmd(from), to: toYmd(to) };
}

function normalizeOrder(raw: Record<string, unknown>): SalesOrderSummary {
  const idRaw = raw.id;
  const id = typeof idRaw === "string" || typeof idRaw === "number" ? String(idRaw) : String(idRaw ?? "");
  const cn =
    raw.customer_name != null
      ? String(raw.customer_name)
      : raw.full_name != null
        ? String(raw.full_name)
        : null;
  return {
    id,
    source: String(raw.source ?? ""),
    source_id: typeof raw.source_id === "number" ? raw.source_id : Number(raw.source_id) || 0,
    customer_id: raw.customer_id == null ? null : Number(raw.customer_id),
    customer_name: cn,
    status: String(raw.status ?? ""),
    total_usd: raw.total_usd == null || raw.total_usd === "" ? null : Number(raw.total_usd),
    notes: raw.notes == null ? null : String(raw.notes),
    created_at: String(raw.created_at ?? ""),
  };
}

function parseHistorialJson(json: unknown): SalesHistorialResponse {
  const o = json as Record<string, unknown>;
  const data = (o.data as Record<string, unknown>) ?? o;
  const rawList =
    (Array.isArray(data) ? data : null) ??
    (Array.isArray(data.orders) ? data.orders : null) ??
    (Array.isArray(data.sales) ? data.sales : null) ??
    (Array.isArray(o.orders) ? o.orders : null) ??
    (Array.isArray(o.sales) ? o.sales : null) ??
    (data.items as unknown[]) ??
    [];

  const orders = (rawList as Record<string, unknown>[]).map(normalizeOrder);
  const m = (data.meta ?? o.meta) as Record<string, unknown> | undefined;
  return {
    orders,
    total: Number(m?.total ?? o.total) || 0,
    limit: Number(m?.limit) || LIMIT,
    offset: Number(m?.offset) || 0,
  };
}

function fmtDate(iso: string): string {
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return "—";
  return d.toLocaleString("es-VE", {
    day: "2-digit",
    month: "2-digit",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });
}

function fmtUsd(n: number | null | undefined): string {
  if (n == null || Number.isNaN(Number(n))) return "—";
  return Number(n).toLocaleString("en-US", { style: "currency", currency: "USD" });
}

function fmtUsdPlain(n: number): string {
  return n.toLocaleString("en-US", { style: "currency", currency: "USD" });
}

function idPrefix(source: string): { code: string; className: string } {
  switch (source.toLowerCase()) {
    case "mercadolibre":
      return { code: "ML", className: "bg-warning text-dark" };
    case "mostrador":
      return { code: "POS", className: "bg-primary" };
    case "social_media":
      return { code: "WA", className: "bg-success" };
    case "ecommerce":
      return { code: "EC", className: "" };
    case "fuerza_ventas":
      return { code: "FV", className: "bg-secondary" };
    default:
      return { code: "?", className: "bg-light text-dark" };
  }
}

function ChannelBadge({ source }: { source: string }) {
  const key = source.toLowerCase();
  const labels: Record<string, string> = {
    mercadolibre: "MercadoLibre",
    mostrador: "Mostrador",
    social_media: "WhatsApp",
    ecommerce: "Ecommerce",
    fuerza_ventas: "Fuerza de ventas",
  };
  const label = labels[key] ?? source ?? "—";
  const bg: Record<string, string> = {
    mostrador: "primary",
    mercadolibre: "warning text-dark",
    social_media: "info text-dark",
    ecommerce: "dark",
    fuerza_ventas: "success",
  };
  const b = bg[key] ?? "secondary";
  return <span className={`badge rounded-pill bg-${b}`}>{label}</span>;
}

function HistorialStatusBadge({ status }: { status: string }) {
  const s = String(status).toLowerCase();
  if (s === "completed") return <span className="badge bg-success">Completado</span>;
  if (s === "cancelled") return <span className="badge bg-danger">Cancelado</span>;
  if (s === "paid") return <span className="badge bg-primary">Pagado</span>;
  return <span className="badge bg-light text-dark text-wrap">{status || "—"}</span>;
}

function CustomerCell({ row }: { row: SalesOrderSummary }) {
  const notes = row.notes ?? "";
  const consumidor = notes.includes("[consumidor_final]");

  if (row.customer_id != null) {
    const name = row.customer_name?.trim() || `Cliente #${row.customer_id}`;
    return (
      <Link href={`/clientes/${row.customer_id}`} className="text-primary text-decoration-none">
        {name}
      </Link>
    );
  }
  if (consumidor) {
    return <span className="text-muted">Consumidor final</span>;
  }
  return <span className="text-warning">Sin identificar</span>;
}

function HistorialStatsCards({
  total,
  orders,
}: {
  total: number;
  orders: SalesOrderSummary[];
}) {
  const sumUsd = useMemo(
    () => orders.reduce((acc, o) => acc + (Number(o.total_usd) || 0), 0),
    [orders]
  );
  const counts = useMemo(() => {
    const m: Record<string, number> = {};
    for (const k of BREAKDOWN_KEYS) m[k.key] = 0;
    for (const o of orders) {
      const k = (o.source ?? "").toLowerCase();
      if (k in m) m[k] += 1;
    }
    return m;
  }, [orders]);

  const ticket = orders.length > 0 ? sumUsd / orders.length : 0;

  return (
    <div className="row g-3 mb-4">
      <div className="col-12 col-md-6 col-xl-3">
        <div className="card h-100 border-0 shadow-sm">
          <div className="card-body">
            <div className="text-muted small mb-1">Pedidos procesados</div>
            <div className="fs-3 fw-semibold">{total}</div>
          </div>
        </div>
      </div>
      <div className="col-12 col-md-6 col-xl-3">
        <div className="card h-100 border-0 shadow-sm">
          <div className="card-body">
            <div className="text-muted small mb-1">Facturado USD</div>
            <div className="fs-3 fw-semibold">{fmtUsdPlain(sumUsd)}</div>
            <div className="text-muted small mt-1">Página actual</div>
          </div>
        </div>
      </div>
      <div className="col-12 col-md-6 col-xl-3">
        <div className="card h-100 border-0 shadow-sm">
          <div className="card-body">
            <div className="text-muted small mb-2">Por canal</div>
            <ul className="list-unstyled small mb-0">
              {BREAKDOWN_KEYS.map(({ key, label }) => (
                <li key={key} className="d-flex justify-content-between py-1 border-bottom border-light">
                  <span>{label}</span>
                  <span className="fw-medium">{counts[key] ?? 0}</span>
                </li>
              ))}
            </ul>
            <div className="text-muted small mt-1">Página actual</div>
          </div>
        </div>
      </div>
      <div className="col-12 col-md-6 col-xl-3">
        <div className="card h-100 border-0 shadow-sm">
          <div className="card-body">
            <div className="text-muted small mb-1">Ticket promedio USD</div>
            <div className="fs-3 fw-semibold">{orders.length ? fmtUsdPlain(ticket) : "—"}</div>
            <div className="text-muted small mt-1">Página actual</div>
          </div>
        </div>
      </div>
    </div>
  );
}

export default function VentasHistorialPage() {
  const defaults = useMemo(() => defaultDateRange(), []);

  const [draftSource, setDraftSource] = useState("");
  const [draftStatus, setDraftStatus] = useState("");
  const [draftFrom, setDraftFrom] = useState(defaults.from);
  const [draftTo, setDraftTo] = useState(defaults.to);

  const [appliedSource, setAppliedSource] = useState("");
  const [appliedStatus, setAppliedStatus] = useState("");
  const [appliedFrom, setAppliedFrom] = useState(defaults.from);
  const [appliedTo, setAppliedTo] = useState(defaults.to);

  const [offset, setOffset] = useState(0);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [payload, setPayload] = useState<SalesHistorialResponse | null>(null);

  const load = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const params = new URLSearchParams();
      params.set("limit", String(LIMIT));
      params.set("offset", String(offset));
      if (appliedSource) params.set("source", appliedSource);
      if (appliedStatus) params.set("status", appliedStatus);
      if (appliedFrom) params.set("from", appliedFrom);
      if (appliedTo) params.set("to", appliedTo);

      const res = await fetch(`/api/ventas/historial?${params}`, {
        credentials: "include",
        cache: "no-store",
      });
      const raw: unknown = await res.json().catch(() => ({}));
      if (!res.ok) {
        const o = raw as Record<string, unknown>;
        let msg = "Error al cargar historial";
        if (typeof o.error === "string" && o.error) {
          msg = o.error;
        } else if (o.error && typeof o.error === "object") {
          const errMsg = (o.error as { message?: unknown }).message;
          if (typeof errMsg === "string" && errMsg) msg = errMsg;
        } else if (typeof o.message === "string" && o.message) {
          msg = o.message;
        }
        setError(msg);
        setPayload(null);
        return;
      }
      setPayload(parseHistorialJson(raw));
    } catch {
      setError("Error de red.");
      setPayload(null);
    } finally {
      setLoading(false);
    }
  }, [offset, appliedSource, appliedStatus, appliedFrom, appliedTo]);

  useEffect(() => {
    void load();
  }, [load]);

  const orders = payload?.orders ?? [];
  const total = payload?.total ?? 0;
  const canPrev = offset > 0;
  const canNext = offset + LIMIT < total;
  const start = total === 0 ? 0 : offset + 1;
  const end = total === 0 ? 0 : Math.min(offset + LIMIT, total);

  const applyFilters = () => {
    setAppliedSource(draftSource);
    setAppliedStatus(draftStatus);
    setAppliedFrom(draftFrom);
    setAppliedTo(draftTo);
    setOffset(0);
  };

  const clearFilters = () => {
    const d = defaultDateRange();
    setDraftSource("");
    setDraftStatus("");
    setDraftFrom(d.from);
    setDraftTo(d.to);
    setAppliedSource("");
    setAppliedStatus("");
    setAppliedFrom(d.from);
    setAppliedTo(d.to);
    setOffset(0);
  };

  return (
    <div className="page-wrapper">
      <div className="content">
        <div className="page-header">
          <div className="page-title d-flex flex-wrap align-items-center justify-content-between gap-2">
            <div>
              <h4 className="mb-0">Historial de pedidos</h4>
              <p className="text-muted small mb-0">
                Pedidos procesados y cerrados (auditoría).{" "}
                <Link href={all_routes.ventasPedidos} className="text-decoration-none">
                  Ver pedidos activos
                </Link>
              </p>
            </div>
          </div>
        </div>

        <HistorialStatsCards total={total} orders={orders} />

        <div className="card mb-4">
          <div className="card-body py-3">
            <div className="row g-2 align-items-end flex-wrap">
              <div className="col-12 col-md-6 col-lg-2">
                <label className="form-label small text-muted mb-1">Canal / Fuente</label>
                <select
                  className="form-select form-select-sm"
                  value={draftSource}
                  onChange={(e) => setDraftSource(e.target.value)}
                >
                  {SOURCE_OPTIONS.map((o) => (
                    <option key={o.value || "all"} value={o.value}>
                      {o.label}
                    </option>
                  ))}
                </select>
              </div>
              <div className="col-12 col-md-6 col-lg-2">
                <label className="form-label small text-muted mb-1">Estado</label>
                <select
                  className="form-select form-select-sm"
                  value={draftStatus}
                  onChange={(e) => setDraftStatus(e.target.value)}
                >
                  {STATUS_OPTIONS.map((o) => (
                    <option key={o.value || "all"} value={o.value}>
                      {o.label}
                    </option>
                  ))}
                </select>
              </div>
              <div className="col-12 col-md-6 col-lg-2">
                <label className="form-label small text-muted mb-1">Desde</label>
                <input
                  type="date"
                  className="form-control form-control-sm"
                  value={draftFrom}
                  onChange={(e) => setDraftFrom(e.target.value)}
                />
              </div>
              <div className="col-12 col-md-6 col-lg-2">
                <label className="form-label small text-muted mb-1">Hasta</label>
                <input
                  type="date"
                  className="form-control form-control-sm"
                  value={draftTo}
                  onChange={(e) => setDraftTo(e.target.value)}
                />
              </div>
              <div className="col-12 col-md-6 col-lg-auto d-flex gap-2">
                <button type="button" className="btn btn-primary btn-sm" onClick={applyFilters} disabled={loading}>
                  Aplicar
                </button>
                <button type="button" className="btn btn-outline-secondary btn-sm" onClick={clearFilters} disabled={loading}>
                  Limpiar
                </button>
              </div>
            </div>
          </div>
        </div>

        {error && (
          <div className="alert alert-danger d-flex align-items-center gap-2 mb-4">
            <i className="ti ti-alert-circle" />
            <span>{error}</span>
          </div>
        )}

        <div className="card">
          <div className="card-body p-0">
            <div className="table-responsive">
              <table className="table table-hover table-sm mb-0 align-middle">
                <thead className="table-light">
                  <tr>
                    <th>ID</th>
                    <th>Canal</th>
                    <th>Cliente</th>
                    <th>Total USD</th>
                    <th>Estado</th>
                    <th>Fecha</th>
                    <th className="text-end">Acciones</th>
                  </tr>
                </thead>
                <tbody>
                  {loading ? (
                    Array.from({ length: 8 }).map((_, i) => (
                      <tr key={`sk-${i}`}>
                        {Array.from({ length: 7 }).map((__, j) => (
                          <td key={j} className="py-3">
                            <p className="placeholder-glow mb-0">
                              <span className="placeholder col-12 rounded" />
                            </p>
                          </td>
                        ))}
                      </tr>
                    ))
                  ) : orders.length === 0 ? (
                    <tr>
                      <td colSpan={7} className="text-center py-5 text-muted">
                        No hay pedidos procesados en el período seleccionado
                      </td>
                    </tr>
                  ) : (
                    orders.map((row) => {
                      const pref = idPrefix(row.source);
                      return (
                        <tr key={`${row.id}-${row.created_at}`}>
                          <td>
                            {pref.code === "EC" ? (
                              <span className="badge me-1 text-white" style={{ backgroundColor: "#6f42c1" }}>
                                EC
                              </span>
                            ) : (
                              <span className={`badge me-1 ${pref.className}`.trim()}>{pref.code}</span>
                            )}
                            <span className="font-monospace small">#{row.id}</span>
                          </td>
                          <td>
                            <ChannelBadge source={row.source} />
                          </td>
                          <td className="small">
                            <CustomerCell row={row} />
                          </td>
                          <td>{fmtUsd(row.total_usd)}</td>
                          <td>
                            <HistorialStatusBadge status={row.status} />
                          </td>
                          <td className="small text-nowrap">{fmtDate(row.created_at)}</td>
                          <td className="text-end">
                            <Link href={`/ordenes/${row.id}`} className="btn btn-sm btn-outline-primary">
                              Ver detalle
                            </Link>
                          </td>
                        </tr>
                      );
                    })
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </div>

        <div className="d-flex justify-content-between align-items-center mt-3">
          <button
            type="button"
            className="btn btn-outline-secondary btn-sm"
            disabled={!canPrev || loading}
            onClick={() => setOffset((o) => Math.max(0, o - LIMIT))}
          >
            Anterior
          </button>
          <span className="text-muted small">
            {total > 0 ? `Mostrando ${start}–${end} de ${total} pedidos` : ""}
          </span>
          <button
            type="button"
            className="btn btn-outline-secondary btn-sm"
            disabled={!canNext || loading}
            onClick={() => setOffset((o) => o + LIMIT)}
          >
            Siguiente
          </button>
        </div>

        <CommonFooter />
      </div>
    </div>
  );
}
