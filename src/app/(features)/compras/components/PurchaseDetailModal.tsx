"use client";
import { useEffect, useState } from "react";
import type { Purchase, PurchaseLine } from "@/types/compras";

interface Props {
  purchaseId: number | null;
  onClose:    () => void;
}

function fmtDate(s: string): string {
  try { return new Date(s).toLocaleDateString("es-VE", { day: "2-digit", month: "2-digit", year: "numeric" }); } catch { return s; }
}
function fmtUSD(v: number | string | null | undefined): string {
  if (v === null || v === undefined) return "—";
  return `$${Number(v).toFixed(2)}`;
}
function fmtBs(v: number | string | null | undefined): string {
  if (v === null || v === undefined) return "—";
  return `Bs. ${Number(v).toLocaleString("es-VE", { minimumFractionDigits: 2 })}`;
}

export default function PurchaseDetailModal({ purchaseId, onClose }: Props) {
  const [purchase, setPurchase] = useState<Purchase | null>(null);
  const [loading,  setLoading]  = useState(false);
  const [error,    setError]    = useState<string | null>(null);

  useEffect(() => {
    if (purchaseId === null) { setPurchase(null); return; }
    setLoading(true);
    setError(null);
    fetch(`/api/compras/ordenes/${purchaseId}`, { credentials: "include" })
      .then(async (r) => {
        const d = await r.json().catch(() => ({})) as Record<string, unknown>;
        if (!r.ok) throw new Error((d.error as string) ?? `HTTP ${r.status}`);
        const p = (d.data ?? d) as Purchase;
        setPurchase(p);
      })
      .catch((e: unknown) => setError(e instanceof Error ? e.message : "Error al cargar detalle."))
      .finally(() => setLoading(false));
  }, [purchaseId]);

  if (purchaseId === null) return null;

  return (
    <div className="modal fade show d-block" tabIndex={-1} style={{ background: "rgba(0,0,0,0.5)" }}>
      <div className="modal-dialog modal-lg">
        <div className="modal-content">
          <div className="modal-header">
            <h5 className="modal-title">
              Detalle de recepción{purchase ? ` #${purchase.id}` : ""}
            </h5>
            <button className="btn-close" onClick={onClose} />
          </div>
          <div className="modal-body">
            {loading && (
              <div className="d-flex justify-content-center py-4">
                <div className="spinner-border text-primary" />
              </div>
            )}
            {error && <div className="alert alert-danger">{error}</div>}
            {!loading && !error && purchase && (
              <>
                <div className="row g-2 mb-4">
                  <div className="col-md-4">
                    <small className="text-muted d-block">Proveedor</small>
                    <strong>{purchase.supplier_name ?? "Sin proveedor"}</strong>
                  </div>
                  <div className="col-md-4">
                    <small className="text-muted d-block">Fecha</small>
                    <strong>{fmtDate(purchase.purchase_date)}</strong>
                  </div>
                  <div className="col-md-4">
                    <small className="text-muted d-block">Tasa BCV</small>
                    <strong>{purchase.rate_applied ? `Bs. ${Number(purchase.rate_applied).toFixed(2)}` : "—"}</strong>
                    {purchase.rate_type && <span className="ms-1 badge bg-light text-dark border small">{purchase.rate_type}</span>}
                  </div>
                  <div className="col-md-4">
                    <small className="text-muted d-block">Subtotal USD</small>
                    <strong>{fmtUSD(purchase.subtotal_usd)}</strong>
                  </div>
                  <div className="col-md-4">
                    <small className="text-muted d-block">Total USD</small>
                    <strong className="text-success">{fmtUSD(purchase.total_usd)}</strong>
                  </div>
                  <div className="col-md-4">
                    <small className="text-muted d-block">Total Bs</small>
                    <strong>{fmtBs(purchase.total_bs)}</strong>
                  </div>
                  {purchase.notes && (
                    <div className="col-12">
                      <small className="text-muted d-block">Notas</small>
                      <span>{purchase.notes}</span>
                    </div>
                  )}
                </div>

                {purchase.lines && purchase.lines.length > 0 ? (
                  <>
                    <h6 className="fw-semibold mb-2">Líneas de productos</h6>
                    <div className="table-responsive">
                      <table className="table table-sm table-bordered align-middle mb-0">
                        <thead className="table-light">
                          <tr>
                            <th>SKU</th>
                            <th>Descripción</th>
                            <th className="text-end">Cant.</th>
                            <th className="text-end">Costo USD</th>
                            <th className="text-end">Landed Cost</th>
                            <th className="text-end">Subtotal</th>
                          </tr>
                        </thead>
                        <tbody>
                          {purchase.lines.map((l: PurchaseLine) => (
                            <tr key={l.id}>
                              <td><code className="text-body">{l.product_sku}</code></td>
                              <td>{l.product_description ?? "—"}</td>
                              <td className="text-end">{Number(l.quantity)}</td>
                              <td className="text-end">{fmtUSD(l.unit_cost_usd)}</td>
                              <td className="text-end">{l.landed_cost_usd ? fmtUSD(l.landed_cost_usd) : "—"}</td>
                              <td className="text-end fw-semibold">{fmtUSD(l.line_total_usd)}</td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  </>
                ) : (
                  <p className="text-muted text-center py-2">Sin líneas de detalle disponibles.</p>
                )}
              </>
            )}
          </div>
          <div className="modal-footer">
            <button className="btn btn-secondary" onClick={onClose}>Cerrar</button>
          </div>
        </div>
      </div>
    </div>
  );
}
