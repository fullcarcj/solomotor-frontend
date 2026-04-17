"use client";

import { useEffect, useState } from "react";
import type { DispatchRecord } from "@/types/dispatch";
import DispatchChannelBadge from "./DispatchChannelBadge";

interface BinMovement { bin_id: number; sku: string; qty: number }

interface Props {
  record:    DispatchRecord | null;
  onClose:   () => void;
  onSuccess: () => void;
}

export default function ConfirmDispatchModal({ record, onClose, onSuccess }: Props) {
  const [trackingNumber, setTrackingNumber] = useState("");
  const [notes, setNotes]                   = useState("");
  const [useBins, setUseBins]               = useState(false);
  const [binMovements, setBinMovements]     = useState<BinMovement[]>([]);
  const [newSku, setNewSku]                 = useState("");
  const [newBinId, setNewBinId]             = useState("");
  const [newQty, setNewQty]                 = useState("");
  const [submitting, setSubmitting]         = useState(false);
  const [error, setError]                   = useState<string | null>(null);

  useEffect(() => {
    if (record) {
      setTrackingNumber("");
      setNotes("");
      setUseBins(false);
      setBinMovements([]);
      setError(null);
    }
  }, [record]);

  if (!record) return null;

  const isML        = record.channel === "mercadolibre";
  const trackingReq = isML && !trackingNumber.trim();

  const addBin = () => {
    if (!newSku || !newBinId || !newQty) return;
    setBinMovements((prev) => [
      ...prev,
      { bin_id: Number(newBinId), sku: newSku.trim(), qty: Number(newQty) },
    ]);
    setNewSku(""); setNewBinId(""); setNewQty("");
  };

  const removeBin = (i: number) =>
    setBinMovements((prev) => prev.filter((_, idx) => idx !== i));

  const fmtDT = (iso: string | null) => {
    if (!iso) return "—";
    const d = new Date(iso);
    return isNaN(d.getTime()) ? iso : d.toLocaleString("es-VE", { day: "2-digit", month: "2-digit", year: "numeric", hour: "2-digit", minute: "2-digit" });
  };

  const handleConfirm = async () => {
    if (trackingReq) { setError("El número de seguimiento es requerido para despachos de MercadoLibre."); return; }
    setSubmitting(true); setError(null);
    try {
      const body: Record<string, unknown> = {};
      if (trackingNumber.trim()) body.tracking_number = trackingNumber.trim();
      if (notes.trim())          body.notes = notes.trim();
      if (useBins && binMovements.length > 0) body.bin_movements = binMovements;

      const res = await fetch(`/api/logistica/${record.dispatch_id}/confirm`, {
        method: "POST",
        credentials: "include",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(body),
      });
      const json = await res.json().catch(() => ({})) as Record<string, unknown>;
      if (!res.ok) throw new Error((json.error as string) ?? (json.message as string) ?? "Error al confirmar");
      onSuccess();
      onClose();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Error inesperado");
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <>
      <div className="modal-backdrop fade show" style={{ zIndex: 1040 }} onClick={onClose} />
      <div className="modal fade show d-block" tabIndex={-1} style={{ zIndex: 1050 }} role="dialog">
        <div className="modal-dialog modal-lg modal-dialog-scrollable">
          <div className="modal-content">

            <div className="modal-header">
              <h5 className="modal-title">
                Confirmar Despacho #{record.dispatch_id}
              </h5>
              <button type="button" className="btn-close" onClick={onClose} />
            </div>

            <div className="modal-body">
              {/* Info del despacho */}
              <div className="card bg-light mb-4">
                <div className="card-body py-3">
                  <div className="row g-2 small">
                    <div className="col-sm-4">
                      <span className="text-muted d-block">Canal</span>
                      <DispatchChannelBadge channel={record.channel} />
                    </div>
                    <div className="col-sm-4">
                      <span className="text-muted d-block">Referencia</span>
                      <code>{record.order_reference ?? `Sale #${record.sale_id}`}</code>
                    </div>
                    <div className="col-sm-4">
                      <span className="text-muted d-block">Solicitado por</span>
                      <strong>{record.requested_by ?? "—"}</strong>
                    </div>
                    <div className="col-sm-6">
                      <span className="text-muted d-block">Fecha solicitud</span>
                      {fmtDT(record.requested_at)}
                    </div>
                    {record.notes && (
                      <div className="col-12">
                        <span className="text-muted d-block">Notas del vendedor</span>
                        <em>{record.notes}</em>
                      </div>
                    )}
                  </div>
                </div>
              </div>

              {/* Tracking */}
              <div className="mb-3">
                <label className="form-label fw-semibold">
                  Número de seguimiento
                  {isML && <span className="text-danger ms-1">*</span>}
                </label>
                <input
                  type="text"
                  className="form-control"
                  placeholder="Ej: ML123456789VE"
                  value={trackingNumber}
                  onChange={(e) => setTrackingNumber(e.target.value)}
                />
                {isML && (
                  <div className="form-text text-warning">
                    Requerido para despachos de MercadoLibre.
                  </div>
                )}
              </div>

              {/* Notas */}
              <div className="mb-3">
                <label className="form-label fw-semibold">Notas (opcional)</label>
                <textarea
                  className="form-control"
                  rows={2}
                  placeholder="Observaciones del despacho…"
                  value={notes}
                  onChange={(e) => setNotes(e.target.value)}
                />
              </div>

              {/* Bins */}
              <div className="mb-3">
                <p className="small text-muted mb-2">
                  <i className="ti ti-info-circle me-1" />
                  Si especificás los bins, el stock se descuenta automáticamente. Si no, confirmá sin bins.
                </p>
                <div className="form-check mb-3">
                  <input
                    type="checkbox"
                    id="useBins"
                    className="form-check-input"
                    checked={useBins}
                    onChange={(e) => setUseBins(e.target.checked)}
                  />
                  <label htmlFor="useBins" className="form-check-label">
                    Especificar bins manualmente
                  </label>
                </div>

                {useBins && (
                  <>
                    <div className="row g-2 align-items-end mb-2">
                      <div className="col-4">
                        <label className="form-label small mb-1">SKU</label>
                        <input type="text" className="form-control form-control-sm" placeholder="SKU" value={newSku} onChange={(e) => setNewSku(e.target.value)} />
                      </div>
                      <div className="col-3">
                        <label className="form-label small mb-1">Bin ID</label>
                        <input type="number" className="form-control form-control-sm" placeholder="Bin ID" value={newBinId} onChange={(e) => setNewBinId(e.target.value)} />
                      </div>
                      <div className="col-3">
                        <label className="form-label small mb-1">Cantidad</label>
                        <input type="number" className="form-control form-control-sm" placeholder="Qty" min="1" value={newQty} onChange={(e) => setNewQty(e.target.value)} />
                      </div>
                      <div className="col-2">
                        <button type="button" className="btn btn-sm btn-outline-primary w-100" onClick={addBin}>
                          + Agregar
                        </button>
                      </div>
                    </div>

                    {binMovements.length > 0 && (
                      <ul className="list-group list-group-flush small">
                        {binMovements.map((bm, i) => (
                          <li key={i} className="list-group-item d-flex justify-content-between align-items-center py-1 px-0">
                            <span><code>{bm.sku}</code> · Bin {bm.bin_id} · ×{bm.qty}</span>
                            <button type="button" className="btn btn-link btn-sm text-danger p-0" onClick={() => removeBin(i)}>
                              <i className="ti ti-x" />
                            </button>
                          </li>
                        ))}
                      </ul>
                    )}
                  </>
                )}
              </div>

              {error && (
                <div className="alert alert-danger py-2 small" role="alert">
                  {error}
                </div>
              )}
            </div>

            <div className="modal-footer">
              <button type="button" className="btn btn-secondary" onClick={onClose} disabled={submitting}>
                Cancelar
              </button>
              <button type="button" className="btn btn-success" onClick={handleConfirm} disabled={submitting}>
                {submitting ? <><span className="spinner-border spinner-border-sm me-2" />Confirmando…</> : "Confirmar Despacho"}
              </button>
            </div>

          </div>
        </div>
      </div>
    </>
  );
}
