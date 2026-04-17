"use client";

import { useState } from "react";
import type { Comprobante } from "@/types/finanzas";

function fmtBs(v: number | string | null): string {
  if (v == null) return "—";
  const n = Number(v);
  if (!Number.isFinite(n)) return "—";
  return `Bs. ${n.toLocaleString("es-VE", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
}

function StatusBadge({ status }: { status: string }) {
  const map: Record<string, { cls: string; label: string }> = {
    matched:       { cls: "bg-success",   label: "Conciliado" },
    no_match:      { cls: "bg-warning",   label: "Sin match" },
    pending:       { cls: "bg-info",      label: "Pendiente" },
    manual_review: { cls: "bg-secondary", label: "Revisión" },
  };
  const cfg = map[status?.toLowerCase()] ?? { cls: "bg-danger", label: status || "Fallo" };
  return <span className={`badge ${cfg.cls}`}>{cfg.label}</span>;
}

interface Props {
  comprobante: Comprobante | null;
  onClose:     () => void;
}

export default function ComprobanteDetailModal({ comprobante, onClose }: Props) {
  const [imgError, setImgError] = useState(false);

  if (!comprobante) return null;

  return (
    <div
      className="modal fade show d-block"
      style={{ backgroundColor: "rgba(0,0,0,0.5)" }}
      onClick={(e) => { if (e.target === e.currentTarget) onClose(); }}
    >
      <div className="modal-dialog modal-lg modal-dialog-centered modal-dialog-scrollable">
        <div className="modal-content">
          <div className="modal-header">
            <h5 className="modal-title">
              Comprobante #{comprobante.id}
            </h5>
            <button type="button" className="btn-close" onClick={onClose} />
          </div>

          <div className="modal-body">
            <div className="row g-3">
              {/* Imagen */}
              <div className="col-md-6">
                <div className="border rounded p-2 bg-light text-center" style={{ minHeight: 200 }}>
                  {comprobante.firebase_url && !imgError ? (
                    <img
                      src={comprobante.firebase_url}
                      alt="Comprobante"
                      style={{ maxWidth: "100%", maxHeight: 420, objectFit: "contain" }}
                      onError={() => setImgError(true)}
                    />
                  ) : (
                    <div className="d-flex flex-column align-items-center justify-content-center h-100 text-muted py-5">
                      <i className="ti ti-photo-off fs-32 mb-2" />
                      <p className="small mb-2">Imagen no disponible</p>
                    </div>
                  )}
                  {comprobante.firebase_url && (
                    <a
                      href={comprobante.firebase_url}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="btn btn-outline-secondary btn-sm mt-2"
                    >
                      <i className="ti ti-external-link me-1" />
                      Abrir imagen
                    </a>
                  )}
                </div>
              </div>

              {/* Datos extraídos */}
              <div className="col-md-6">
                <h6 className="fw-semibold text-muted mb-3 small text-uppercase">
                  Datos extraídos por IA
                </h6>
                <table className="table table-sm table-borderless mb-0">
                  <tbody>
                    <tr>
                      <th className="text-muted small fw-normal" style={{ width: "40%" }}>Banco</th>
                      <td>{comprobante.extracted_bank ?? "—"}</td>
                    </tr>
                    <tr>
                      <th className="text-muted small fw-normal">Monto Bs</th>
                      <td className="fw-semibold">{fmtBs(comprobante.extracted_amount_bs)}</td>
                    </tr>
                    <tr>
                      <th className="text-muted small fw-normal">Referencia</th>
                      <td>
                        <code className="small">{comprobante.extracted_reference ?? "—"}</code>
                      </td>
                    </tr>
                    <tr>
                      <th className="text-muted small fw-normal">Fecha</th>
                      <td>{comprobante.extracted_date ?? "—"}</td>
                    </tr>
                    <tr>
                      <th className="text-muted small fw-normal">Estado</th>
                      <td><StatusBadge status={comprobante.reconciliation_status} /></td>
                    </tr>
                    {comprobante.external_order_id && (
                      <tr>
                        <th className="text-muted small fw-normal">Orden</th>
                        <td>
                          <code className="small">{comprobante.external_order_id}</code>
                        </td>
                      </tr>
                    )}
                    <tr>
                      <th className="text-muted small fw-normal">Cliente</th>
                      <td className="small">
                        {comprobante.customer_name ?? comprobante.customer_phone ?? "Anónimo"}
                      </td>
                    </tr>
                  </tbody>
                </table>
              </div>
            </div>
          </div>

          <div className="modal-footer">
            <button type="button" className="btn btn-secondary" onClick={onClose}>
              Cerrar
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
