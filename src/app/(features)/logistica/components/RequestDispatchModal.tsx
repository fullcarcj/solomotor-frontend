"use client";

import { useEffect, useState } from "react";
import DispatchChannelBadge from "./DispatchChannelBadge";

interface Props {
  saleId:    string | number | null;
  saleTable: "sales" | "sales_orders";
  channel:   string;
  reference?: string | null;
  onClose:   () => void;
  onSuccess: () => void;
}

export default function RequestDispatchModal({ saleId, saleTable, channel, reference, onClose, onSuccess }: Props) {
  const [notes, setNotes]           = useState("");
  const [warehouseId, setWarehouse] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [error, setError]           = useState<string | null>(null);

  useEffect(() => {
    if (saleId !== null && saleId !== undefined) {
      setNotes(""); setWarehouse(""); setError(null);
    }
  }, [saleId]);

  /* Usar comparación estricta contra null/undefined — evita falso negativo con NaN o 0 */
  if (saleId === null || saleId === undefined) return null;

  const handleRequest = async () => {
    setSubmitting(true); setError(null);
    try {
      const body: Record<string, unknown> = { sale_id: saleId, sale_table: saleTable, channel };
      if (notes.trim())   body.notes = notes.trim();
      if (warehouseId)    body.warehouse_id = Number(warehouseId);

      const res = await fetch("/api/logistica/request", {
        method: "POST",
        credentials: "include",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(body),
      });
      const json = await res.json().catch(() => ({})) as Record<string, unknown>;
      if (!res.ok) throw new Error((json.error as string) ?? (json.message as string) ?? "Error al solicitar despacho");
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
        <div className="modal-dialog">
          <div className="modal-content">

            <div className="modal-header">
              <h5 className="modal-title">Solicitar Despacho</h5>
              <button type="button" className="btn-close" onClick={onClose} />
            </div>

            <div className="modal-body">
              {/* Info de la venta */}
              <div className="card bg-light mb-4">
                <div className="card-body py-3 small">
                  <div className="row g-2">
                    <div className="col-6">
                      <span className="text-muted d-block">Referencia</span>
                      <code>{reference ?? `Sale #${saleId}`}</code>
                    </div>
                    <div className="col-6">
                      <span className="text-muted d-block">Canal</span>
                      <DispatchChannelBadge channel={channel} />
                    </div>
                  </div>
                </div>
              </div>

              {/* Notas */}
              <div className="mb-3">
                <label className="form-label fw-semibold">Notas para el almacenista (opcional)</label>
                <textarea
                  className="form-control"
                  rows={3}
                  placeholder="Instrucciones especiales, empaque, prioridad…"
                  value={notes}
                  onChange={(e) => setNotes(e.target.value)}
                />
              </div>

              {/* Almacén */}
              <div className="mb-3">
                <label className="form-label fw-semibold">Almacén destino (opcional)</label>
                <input
                  type="number"
                  className="form-control"
                  placeholder="ID del almacén (dejar vacío para predeterminado)"
                  value={warehouseId}
                  onChange={(e) => setWarehouse(e.target.value)}
                />
              </div>

              {error && (
                <div className="alert alert-danger py-2 small" role="alert">{error}</div>
              )}
            </div>

            <div className="modal-footer">
              <button type="button" className="btn btn-secondary" onClick={onClose} disabled={submitting}>
                Cancelar
              </button>
              <button type="button" className="btn btn-primary" onClick={handleRequest} disabled={submitting}>
                {submitting ? <><span className="spinner-border spinner-border-sm me-2" />Solicitando…</> : "Solicitar Despacho"}
              </button>
            </div>

          </div>
        </div>
      </div>
    </>
  );
}
