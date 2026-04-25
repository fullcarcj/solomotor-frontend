"use client";

import { useCallback, useEffect, useState } from "react";

export interface SaleReconcileContext {
  salesOrderId: number;
  /** Monto de la orden en Bs. para comparar (puede ser null si no existe). */
  totalBs: number | null;
  /** Etiqueta corta para el título del modal. */
  label: string;
}

interface BankCredit {
  id: number;
  tx_date: string;
  reference_number: string | null;
  description: string;
  amount: string | number;
  payment_type: string | null;
  reconciliation_status: string;
  account_number: string | null;
}

interface Props {
  ctx: SaleReconcileContext | null;
  onClose: () => void;
  onReconciled?: () => void;
}

function fmtBs(n: number | string | null | undefined): string {
  const v = Number(n);
  if (!Number.isFinite(v)) return "—";
  return `Bs. ${v.toLocaleString("es-VE", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
}

function fmtDate(s: string): string {
  if (!s) return "—";
  const d = new Date(s);
  if (isNaN(d.getTime())) return s;
  return d.toLocaleDateString("es-VE", { day: "2-digit", month: "short", year: "numeric" });
}

export default function SaleReconcileModal({ ctx, onClose, onReconciled }: Props) {
  const [credits, setCredits] = useState<BankCredit[]>([]);
  const [loadingList, setLoadingList] = useState(false);
  const [listError, setListError] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);
  const [saveError, setSaveError] = useState<string | null>(null);
  const [search, setSearch] = useState("");

  useEffect(() => {
    if (!ctx) { setCredits([]); return; }
    let alive = true;
    setLoadingList(true);
    setListError(null);
    void (async () => {
      try {
        const res = await fetch("/api/sales/bank-credits?limit=60", { credentials: "include", cache: "no-store" });
        const j = (await res.json().catch(() => ({}))) as Record<string, unknown>;
        if (!alive) return;
        if (!res.ok) { setListError(String(j.message ?? j.error ?? "Error al cargar extractos")); return; }
        const rows = Array.isArray(j.rows) ? (j.rows as BankCredit[]) : [];
        setCredits(rows);
      } catch { if (alive) setListError("Error de red al cargar extractos."); }
      finally { if (alive) setLoadingList(false); }
    })();
    return () => { alive = false; };
  }, [ctx]);

  const handleLink = useCallback(async (statementId: number) => {
    if (!ctx) return;
    setSaving(true);
    setSaveError(null);
    try {
      const soNumId = Number(String(ctx.salesOrderId).replace(/^so-/i, ""));
      const res = await fetch(`/api/sales/orders/${soNumId}/reconcile`, {
        method: "POST",
        credentials: "include",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ statement_id: statementId }),
        cache: "no-store",
      });
      const j = (await res.json().catch(() => ({}))) as Record<string, unknown>;
      if (!res.ok) {
        setSaveError(String(j.message ?? j.error ?? "Error al vincular el pago."));
        return;
      }
      onReconciled?.();
      onClose();
    } catch { setSaveError("Error de red al vincular pago."); }
    finally { setSaving(false); }
  }, [ctx, onClose, onReconciled]);

  if (!ctx) return null;

  const q = search.trim().toLowerCase();
  const filtered = credits.filter((c) =>
    !q ||
    String(c.reference_number ?? "").toLowerCase().includes(q) ||
    String(c.description ?? "").toLowerCase().includes(q) ||
    String(c.amount ?? "").includes(q)
  );

  return (
    <div
      className="modal fade show d-block"
      tabIndex={-1}
      role="dialog"
      aria-modal="true"
      aria-labelledby="reconcile-modal-title"
      style={{ background: "rgba(0,0,0,0.55)", zIndex: 1065 }}
      onMouseDown={(e) => { if (e.target === e.currentTarget) onClose(); }}
    >
      <div className="modal-dialog modal-lg modal-dialog-scrollable">
        <div className="modal-content">
          <div className="modal-header">
            <h5 className="modal-title" id="reconcile-modal-title" style={{ fontSize: 15 }}>
              <i className="ti ti-credit-card me-2 text-success" aria-hidden />
              Vincular Pago — {ctx.label}
            </h5>
            <button type="button" className="btn-close" onClick={onClose} aria-label="Cerrar" />
          </div>

          <div className="modal-body p-3">
            {ctx.totalBs != null && (
              <div className="alert alert-info py-2 px-3 mb-3" style={{ fontSize: 13 }}>
                <i className="ti ti-info-circle me-1" aria-hidden />
                Total esperado de la orden: <strong>{fmtBs(ctx.totalBs)}</strong>
              </div>
            )}

            {saveError && (
              <div className="alert alert-danger py-2 px-3 mb-3" style={{ fontSize: 13 }}>
                {saveError}
              </div>
            )}

            <div className="mb-3">
              <input
                type="search"
                className="form-control form-control-sm"
                placeholder="Buscar por referencia, descripción o monto…"
                value={search}
                onChange={(e) => setSearch(e.target.value)}
              />
            </div>

            {loadingList ? (
              <div className="text-center py-4 text-muted" style={{ fontSize: 13 }}>Cargando extractos bancarios…</div>
            ) : listError ? (
              <div className="alert alert-warning py-2 px-3" style={{ fontSize: 13 }}>{listError}</div>
            ) : filtered.length === 0 ? (
              <div className="text-muted text-center py-4" style={{ fontSize: 13 }}>No hay créditos bancarios disponibles.</div>
            ) : (
              <div className="table-responsive" style={{ maxHeight: 380, overflowY: "auto" }}>
                <table className="table table-sm table-hover align-middle mb-0" style={{ fontSize: 13 }}>
                  <thead className="table-light sticky-top">
                    <tr>
                      <th>Fecha</th>
                      <th>Referencia</th>
                      <th>Descripción</th>
                      <th className="text-end">Monto Bs.</th>
                      <th>Estado</th>
                      <th></th>
                    </tr>
                  </thead>
                  <tbody>
                    {filtered.map((c) => {
                      const amt = Number(c.amount);
                      const orderAmt = ctx.totalBs ?? 0;
                      const diff = orderAmt > 0 ? Math.abs(amt - orderAmt) / orderAmt : 1;
                      const isClose = diff < 0.02;
                      return (
                        <tr key={c.id} className={isClose ? "table-success" : undefined}>
                          <td className="text-nowrap">{fmtDate(c.tx_date)}</td>
                          <td className="text-nowrap">
                            <span className="font-monospace" style={{ fontSize: 12 }}>
                              {c.reference_number ?? "—"}
                            </span>
                          </td>
                          <td style={{ maxWidth: 200, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
                            {c.description}
                          </td>
                          <td className="text-end font-monospace text-nowrap">
                            {fmtBs(c.amount)}
                          </td>
                          <td>
                            <span className={`badge ${c.reconciliation_status === "UNMATCHED" ? "bg-secondary" : "bg-success"}`} style={{ fontSize: 11 }}>
                              {c.reconciliation_status === "UNMATCHED" ? "Libre" : "Vinculado"}
                            </span>
                          </td>
                          <td>
                            <button
                              type="button"
                              className="btn btn-sm btn-outline-success py-0 px-2"
                              disabled={saving}
                              onClick={() => void handleLink(c.id)}
                            >
                              {saving ? "…" : "Vincular"}
                            </button>
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            )}
          </div>

          <div className="modal-footer py-2">
            <button type="button" className="btn btn-secondary btn-sm" onClick={onClose}>
              Cancelar
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
