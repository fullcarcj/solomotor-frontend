"use client";

import { useEffect, useState } from "react";
import type { SaleDetail } from "@/types/sales";
import SaleSourceBadge from "./SaleSourceBadge";
import SaleStatusBadge from "./SaleStatusBadge";
import SaleResolvedCustomerBlock from "./SaleResolvedCustomerBlock";

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

function fmtNum(v: number | string | null | undefined, prefix = "$"): string {
  if (v == null || v === "") return "—";
  const n = Number(String(v).replace(",", "."));
  if (!Number.isFinite(n)) return "—";
  return `${prefix}${n.toLocaleString("es-VE", {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  })}`;
}

function isMercadoLibreSource(source: string | undefined): boolean {
  const s = String(source || "").toLowerCase();
  return s.includes("mercadolibre") || s.startsWith("ml_");
}

function parseSaleDetail(json: unknown): SaleDetail | null {
  if (!json || typeof json !== "object") return null;
  const o = json as Record<string, unknown>;
  const data = (o.data as Record<string, unknown>) ?? o;
  if (!data.id) return null;
  return data as unknown as SaleDetail;
}

function ItemsSkeleton() {
  return (
    <tbody>
      {Array.from({ length: 4 }).map((_, i) => (
        <tr key={i}>
          {[1, 2, 3, 4].map((j) => (
            <td key={j} className="py-3">
              <p className="placeholder-glow mb-0">
                <span className="placeholder col-12 rounded" />
              </p>
            </td>
          ))}
        </tr>
      ))}
    </tbody>
  );
}

export default function SaleDetailModal({
  saleId,
  onClose,
  onOpenQuote,
}: {
  saleId: string | number | null;
  onClose: () => void;
  /** Abre el modal de cotización (mismo chat / presupuesto que bandeja). */
  onOpenQuote?: (detail: SaleDetail) => void;
}) {
  const [detail, setDetail] = useState<SaleDetail | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (saleId == null) {
      setDetail(null);
      setError(null);
      return;
    }
    let alive = true;
    setLoading(true);
    setDetail(null);
    setError(null);
    void (async () => {
      try {
        const res = await fetch(
          `/api/ventas/pedidos/${encodeURIComponent(String(saleId))}`,
          { credentials: "include", cache: "no-store" }
        );
        const json: unknown = await res.json().catch(() => ({}));
        if (!alive) return;
        if (!res.ok) {
          setError("No se pudo cargar el detalle de la venta.");
          return;
        }
        const parsed = parseSaleDetail(json);
        setDetail(parsed);
        if (!parsed) setError("Respuesta inesperada del servidor.");
      } catch {
        if (alive) setError("Error de red.");
      } finally {
        if (alive) setLoading(false);
      }
    })();
    return () => {
      alive = false;
    };
  }, [saleId]);

  if (saleId == null) return null;

  const itemsTotal = detail
    ? detail.items.reduce((s, it) => {
        const n = Number(it.line_total_usd);
        return s + (Number.isFinite(n) ? n : 0);
      }, 0)
    : 0;

  return (
    <div
      className="modal fade show d-block"
      tabIndex={-1}
      role="dialog"
      aria-modal="true"
      style={{ background: "rgba(0,0,0,0.45)" }}
      onMouseDown={(e) => {
        if (e.target === e.currentTarget) onClose();
      }}
    >
      <div className="modal-dialog modal-lg modal-dialog-scrollable">
        <div className="modal-content">
          <div className="modal-header">
            <h5 className="modal-title">
              Venta #{saleId}
              {detail ? (
                <>
                  {" "}—{" "}
                  <SaleSourceBadge source={detail.source} />
                </>
              ) : null}
            </h5>
            <button
              type="button"
              className="btn-close"
              aria-label="Cerrar"
              onClick={onClose}
            />
          </div>
          <div className="modal-body small">
            {error && (
              <div className="alert alert-danger py-2" role="alert">
                {error}
              </div>
            )}

            {(loading || !detail) && !error ? (
              <div className="table-responsive">
                <table className="table table-sm mb-0">
                  <thead>
                    <tr>
                      <th>SKU</th>
                      <th>Cant.</th>
                      <th>Precio USD</th>
                      <th>Subtotal</th>
                    </tr>
                  </thead>
                  <ItemsSkeleton />
                </table>
              </div>
            ) : detail ? (
              <>
                <div className="row g-3 mb-3">
                  <div className="col-12 col-md-6">
                    <dl className="row mb-0 small">
                      <dt className="col-5 text-muted">Estado</dt>
                      <dd className="col-7">
                        <SaleStatusBadge status={detail.status} />
                      </dd>
                      <dt className="col-5 text-muted">Canal</dt>
                      <dd className="col-7">
                        <SaleSourceBadge source={detail.source} />
                      </dd>
                      <dt className="col-5 text-muted">Fecha</dt>
                      <dd className="col-7">{fmtDate(detail.created_at)}</dd>
                      <dt className="col-5 text-muted">Vendedor</dt>
                      <dd className="col-7">{detail.sold_by?.trim() || "—"}</dd>
                    </dl>
                  </div>
                  <div className="col-12 col-md-6">
                    <dl className="row mb-0 small">
                      <dt className="col-6 text-muted">Total USD</dt>
                      <dd className="col-6 fw-semibold">
                        {fmtNum(detail.total_usd)}
                      </dd>
                      {detail.total_amount_bs != null && (
                        <>
                          <dt className="col-6 text-muted">Total Bs</dt>
                          <dd className="col-6">
                            {fmtNum(detail.total_amount_bs, "Bs. ")}
                          </dd>
                        </>
                      )}
                      {detail.exchange_rate_bs_per_usd != null && (
                        <>
                          <dt className="col-6 text-muted">Tasa</dt>
                          <dd className="col-6">
                            {fmtNum(detail.exchange_rate_bs_per_usd, "Bs. ")}
                          </dd>
                        </>
                      )}
                      <dt className="col-6 text-muted">Método pago</dt>
                      <dd className="col-6">
                        {detail.payment_method?.trim() || "—"}
                      </dd>
                    </dl>
                  </div>
                </div>

                {detail.source === "mercadolibre" && (
                  <div className="mb-3">
                    <h6 className="mb-2">Comprador</h6>
                    <SaleResolvedCustomerBlock saleId={detail.id} />
                  </div>
                )}

                <h6 className="mb-2">Ítems</h6>
                <div className="table-responsive mb-3">
                  <table className="table table-sm table-bordered mb-0">
                    <thead>
                      <tr>
                        <th>SKU</th>
                        <th>Cant.</th>
                        <th>Precio USD</th>
                        <th>Subtotal</th>
                      </tr>
                    </thead>
                    <tbody>
                      {detail.items.length === 0 ? (
                        <tr>
                          <td colSpan={4} className="text-muted text-center">
                            Sin ítems
                          </td>
                        </tr>
                      ) : (
                        detail.items.map((it) => (
                          <tr key={it.id}>
                            <td className="font-monospace">{it.sku}</td>
                            <td>{it.quantity}</td>
                            <td>{fmtNum(it.unit_price_usd)}</td>
                            <td>{fmtNum(it.line_total_usd)}</td>
                          </tr>
                        ))
                      )}
                    </tbody>
                    {detail.items.length > 0 && (
                      <tfoot className="table-light">
                        <tr>
                          <td colSpan={3} className="text-end fw-semibold">
                            Total
                          </td>
                          <td className="fw-semibold">
                            ${itemsTotal.toFixed(2)}
                          </td>
                        </tr>
                      </tfoot>
                    )}
                  </table>
                </div>

                {detail.motivo_anulacion?.trim() && (
                  <div className="alert alert-warning py-2" role="status">
                    <strong>Motivo anulación:</strong>{" "}
                    {detail.motivo_anulacion}
                  </div>
                )}

                {detail.notes?.trim() && (
                  <div className="bg-light rounded p-2 small text-muted">
                    <strong>Notas:</strong> {detail.notes}
                  </div>
                )}
              </>
            ) : null}
          </div>
          <div className="modal-footer">
            {detail &&
            onOpenQuote &&
            (isMercadoLibreSource(detail.source) ||
              (detail.chat_id != null && String(detail.chat_id).trim() !== "")) ? (
              <button
                type="button"
                className="btn btn-primary me-auto"
                title={
                  detail.chat_id != null && String(detail.chat_id).trim() !== ""
                    ? "Mismo presupuesto que en Bandeja."
                    : "Sin chat CRM: vinculá la conversación en Bandeja; igual podés revisar el mensaje al abrir."
                }
                onClick={() => {
                  onOpenQuote(detail);
                }}
              >
                <i className="ti ti-file-invoice me-1" aria-hidden="true" />
                Cotización
              </button>
            ) : null}
            <button
              type="button"
              className="btn btn-secondary"
              onClick={onClose}
            >
              Cerrar
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
