"use client";
import { useCallback, useEffect, useState } from "react";
import type { MlListing, MlPublication } from "@/types/mercadolibre";
import MlSyncStatusBadge from "../components/MlSyncStatusBadge";

function parsePubs(raw: unknown): { rows: MlPublication[]; total: number } {
  if (!raw || typeof raw !== "object") return { rows: [], total: 0 };
  const r = raw as Record<string, unknown>;
  const inner = (r.data as Record<string, unknown>) ?? r;
  const rows: MlPublication[] = Array.isArray(inner.rows) ? (inner.rows as MlPublication[]) : [];
  return { rows, total: typeof inner.total === "number" ? inner.total : rows.length };
}

function parseUnmapped(raw: unknown): { rows: MlListing[]; total: number } {
  if (!raw || typeof raw !== "object") return { rows: [], total: 0 };
  const r = raw as Record<string, unknown>;
  const inner = (r.data as Record<string, unknown>) ?? r;
  const rows: MlListing[] = Array.isArray(inner.rows) ? (inner.rows as MlListing[]) : [];
  return { rows, total: typeof inner.total === "number" ? inner.total : rows.length };
}

function SkeletonRow({ cols }: { cols: number }) {
  return <tr>{Array.from({ length: cols }).map((_, i) => <td key={i}><span className="placeholder col-7 rounded" /></td>)}</tr>;
}

function StockDiff({ erp, ml }: { erp: number | string; ml: number | string }) {
  const a = Number(erp), b = Number(ml);
  if (a !== b) return <span className="text-danger fw-bold">{b} <small>(ERP: {a})</small></span>;
  return <span className="text-success">{b}</span>;
}

export default function MapeoPage() {
  const [pubs,     setPubs]     = useState<MlPublication[]>([]);
  const [pubsTotal, setPubsTotal] = useState(0);
  const [pubsLoading, setPubsLoading] = useState(true);
  const [pubsError,   setPubsError]   = useState<string | null>(null);

  const [unmapped,      setUnmapped]      = useState<MlListing[]>([]);
  const [unmappedTotal, setUnmappedTotal] = useState(0);
  const [unmappedLoading, setUnmappedLoading] = useState(true);

  const [syncingSkus, setSyncingSkus] = useState<Set<string>>(new Set());
  const [toastMsg,    setToastMsg]    = useState<string | null>(null);

  function showToast(msg: string) { setToastMsg(msg); setTimeout(() => setToastMsg(null), 3500); }

  const loadPubs = useCallback(async (offset = 0) => {
    setPubsLoading(true); setPubsError(null);
    try {
      const r = await fetch(`/api/mercadolibre/publications?limit=50&offset=${offset}`, { credentials: "include" });
      const d: unknown = await r.json().catch(() => ({}));
      if (!r.ok) throw new Error(((d as Record<string,unknown>).error as string) ?? `HTTP ${r.status}`);
      const { rows, total } = parsePubs(d);
      setPubs(rows); setPubsTotal(total);
    } catch (e) { setPubsError(e instanceof Error ? e.message : "Error."); }
    finally { setPubsLoading(false); }
  }, []);

  useEffect(() => {
    void loadPubs();
    fetch("/api/mercadolibre/listings/unmapped?limit=50", { credentials: "include" })
      .then(async r => { const d: unknown = await r.json().catch(() => ({})); const { rows, total } = parseUnmapped(d); setUnmapped(rows); setUnmappedTotal(total); })
      .catch(() => null)
      .finally(() => setUnmappedLoading(false));
  }, [loadPubs]);

  async function handleSync(sku: string) {
    setSyncingSkus(prev => new Set([...prev, sku]));
    try {
      const r = await fetch(`/api/mercadolibre/publications/sync/${encodeURIComponent(sku)}`, { credentials: "include" });
      if (r.ok) { showToast(`Stock sincronizado: ${sku}`); void loadPubs(); }
      else { showToast("Error al sincronizar."); }
    } catch { showToast("Error de red."); }
    finally { setSyncingSkus(prev => { const n = new Set(prev); n.delete(sku); return n; }); }
  }

  return (
    <div className="page-wrapper">
      <div className="content">
        {toastMsg && (
          <div className="position-fixed top-0 end-0 p-3" style={{ zIndex: 9999 }}>
            <div className="toast show align-items-center text-bg-success border-0">
              <div className="d-flex">
                <div className="toast-body"><i className="ti ti-check me-2" />{toastMsg}</div>
                <button type="button" className="btn-close btn-close-white me-2 m-auto" onClick={() => setToastMsg(null)} />
              </div>
            </div>
          </div>
        )}

        <div className="page-header">
          <h4 className="page-title">Mapeo de SKUs y Publicaciones</h4>
        </div>

        {/* Sin mapear — alerta */}
        {unmappedTotal > 0 && (
          <div className="alert alert-warning d-flex align-items-center gap-2 mb-3">
            <i className="ti ti-alert-triangle fs-5" />
            <strong>⚠ {unmappedTotal} publicaciones activas sin control del ERP</strong>
          </div>
        )}

        {/* Sección 1: Publicaciones mapeadas */}
        <div className="card mb-4">
          <div className="card-header">
            <h6 className="card-title mb-0">Publicaciones mapeadas ({pubsTotal.toLocaleString()})</h6>
          </div>
          <div className="card-body p-0">
            {pubsError && <div className="alert alert-danger m-3">{pubsError}</div>}
            <div className="table-responsive">
              <table className="table table-hover table-sm align-middle mb-0">
                <thead className="table-light">
                  <tr>
                    <th>Item ID</th><th>SKU</th><th>Título</th>
                    <th className="text-end">Stock ML</th><th>Sync</th><th>Acción</th>
                  </tr>
                </thead>
                <tbody>
                  {pubsLoading
                    ? Array.from({ length: 8 }).map((_, i) => <SkeletonRow key={i} cols={6} />)
                    : pubs.length === 0
                    ? <tr><td colSpan={6} className="text-center text-muted py-4">Sin publicaciones mapeadas</td></tr>
                    : pubs.map(p => (
                      <tr key={p.item_id}>
                        <td><code className="text-body small">{p.item_id}</code></td>
                        <td><code className="text-body small">{p.local_sku ?? "—"}</code></td>
                        <td className="small text-truncate" style={{ maxWidth: 240 }} title={p.title}>{p.title}</td>
                        <td className="text-end">
                          <StockDiff erp={p.stock_qty ?? 0} ml={p.available_quantity ?? 0} />
                        </td>
                        <td><MlSyncStatusBadge status={p.sync_status} /></td>
                        <td>
                          {p.local_sku && (
                            <button
                              className="btn btn-sm btn-outline-primary"
                              disabled={syncingSkus.has(p.local_sku)}
                              onClick={() => void handleSync(p.local_sku!)}
                            >
                              {syncingSkus.has(p.local_sku) ? <span className="spinner-border spinner-border-sm" /> : "Sync manual"}
                            </button>
                          )}
                        </td>
                      </tr>
                    ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>

        {/* Sección 2: Sin mapear */}
        <div className="card">
          <div className="card-header d-flex align-items-center gap-2">
            <h6 className="card-title mb-0">Sin mapear — publicaciones activas sin ERP</h6>
            {unmappedTotal > 0 && <span className="badge bg-warning text-dark">{unmappedTotal}</span>}
          </div>
          <div className="card-body p-0">
            <div className="table-responsive">
              <table className="table table-hover table-sm align-middle mb-0">
                <thead className="table-light">
                  <tr><th>Item ID</th><th>Título</th><th className="text-end">Stock ML</th><th className="text-end">Precio</th><th>Acción</th></tr>
                </thead>
                <tbody>
                  {unmappedLoading
                    ? Array.from({ length: 5 }).map((_, i) => <SkeletonRow key={i} cols={5} />)
                    : unmapped.length === 0
                    ? <tr><td colSpan={5} className="text-center text-success py-4"><i className="ti ti-circle-check me-2" />Todas las publicaciones activas están mapeadas</td></tr>
                    : unmapped.map(l => (
                      <tr key={l.item_id}>
                        <td><code className="text-body small">{l.item_id}</code></td>
                        <td className="small text-truncate" style={{ maxWidth: 280 }} title={l.title}>{l.title}</td>
                        <td className="text-end">{Number(l.available_quantity)}</td>
                        <td className="text-end">${Number(l.price).toFixed(2)} <small className="text-muted">{l.currency_id}</small></td>
                        <td>
                          {l.permalink && (
                            <a href={l.permalink} target="_blank" rel="noopener noreferrer" className="btn btn-sm btn-outline-warning">
                              Ver en ML <i className="ti ti-external-link ms-1" />
                            </a>
                          )}
                        </td>
                      </tr>
                    ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
