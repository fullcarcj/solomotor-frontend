"use client";

import { useEffect, useState } from "react";
import type { CartLine, PaymentLine, PosSalePayload, TodayRate } from "@/types/pos";

function num(n: number | string | undefined | null): number {
  const x = Number(String(n ?? "").replace(",", "."));
  return Number.isFinite(x) ? x : 0;
}

function errFrom(json: unknown): string {
  if (json && typeof json === "object") {
    const o = json as Record<string, unknown>;
    const e = o.error;
    if (typeof e === "string") return e;
    if (e && typeof e === "object") {
      const m = (e as { message?: string }).message;
      if (typeof m === "string") return m;
    }
    const m = o.message;
    if (typeof m === "string") return m;
  }
  return "Error al crear la venta.";
}

export default function SaleConfirmModal({
  open,
  onClose,
  onSuccess,
  cart,
  payments,
  customerId,
  customerName,
  totalUsd,
  rate,
  notes,
}: {
  open: boolean;
  onClose: () => void;
  onSuccess: (summary: { id?: number; reference?: string }) => void;
  cart: CartLine[];
  payments: PaymentLine[];
  notes: string;
  customerId: number | null;
  customerName: string | null;
  totalUsd: number;
  rate: TodayRate | null;
}) {
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (open) setError(null);
  }, [open]);

  const r = rate ? num(rate.active_rate) : 0;
  const totalBs =
    r > 0 ? totalUsd * r : null;

  const submit = async () => {
    setSubmitting(true);
    setError(null);
    try {
      const rate_snapshot =
        rate && rate.rate_date
          ? {
              rate_applied: num(rate.active_rate),
              rate_type: String(rate.active_rate_type || "BCV"),
              rate_date: String(rate.rate_date),
            }
          : undefined;

      const payload: PosSalePayload = {
        lines: cart.map((l) => ({
          product_sku: l.product_sku,
          quantity: l.quantity,
          unit_price_usd: l.unit_price_usd,
        })),
        payments: payments.map((p) => ({
          payment_method_code: p.payment_method_code,
          amount_usd: p.amount_usd,
        })),
        status: "PAID",
        notes: notes.trim() || undefined,
        rate_snapshot,
      };
      if (customerId != null) payload.customer_id = customerId;

      const res = await fetch("/api/pos/sales", {
        method: "POST",
        credentials: "include",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
        cache: "no-store",
      });
      const json: unknown = await res.json().catch(() => ({}));

      if (!res.ok) {
        setError(errFrom(json));
        return;
      }

      const o = json as Record<string, unknown>;
      const data = (o.data as Record<string, unknown>) ?? o;
      const id = data.id != null ? Number(data.id) : undefined;
      const reference =
        data.reference != null ? String(data.reference) : undefined;

      onSuccess({ id, reference });
    } catch {
      setError("Error de red.");
    } finally {
      setSubmitting(false);
    }
  };

  if (!open) return null;

  return (
    <div
      className="modal fade show d-block"
      tabIndex={-1}
      role="dialog"
      aria-modal="true"
      style={{ background: "rgba(0,0,0,0.45)" }}
      onMouseDown={(e) => {
        if (e.target === e.currentTarget && !submitting) onClose();
      }}
    >
      <div className="modal-dialog modal-lg modal-dialog-scrollable">
        <div className="modal-content">
          <div className="modal-header">
            <h5 className="modal-title">Confirmar venta</h5>
            <button
              type="button"
              className="btn-close"
              aria-label="Cerrar"
              disabled={submitting}
              onClick={onClose}
            />
          </div>
          <div className="modal-body small">
            {error && (
              <div className="alert alert-danger py-2" role="alert">
                {error}
              </div>
            )}

            <p>
              <strong>Cliente:</strong>{" "}
              {customerName?.trim() || "Consumidor final"}
            </p>

            <div className="table-responsive mb-3">
              <table className="table table-sm table-bordered mb-0">
                <thead>
                  <tr>
                    <th>SKU</th>
                    <th>Cant.</th>
                    <th>Subtotal USD</th>
                  </tr>
                </thead>
                <tbody>
                  {cart.map((l) => (
                    <tr key={l.product_sku}>
                      <td className="font-monospace">{l.product_sku}</td>
                      <td>{l.quantity}</td>
                      <td>${l.subtotal_usd.toFixed(2)}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            <p>
              <strong>Total:</strong> ${totalUsd.toFixed(2)} USD
              {totalBs != null && (
                <>
                  {" "}
                  / Bs.{" "}
                  {totalBs.toLocaleString("es-VE", {
                    minimumFractionDigits: 2,
                    maximumFractionDigits: 2,
                  })}
                </>
              )}
            </p>

            <p className="mb-1">
              <strong>Pagos:</strong>
            </p>
            <ul className="mb-3">
              {payments.map((p) => (
                <li key={p.payment_method_code}>
                  {p.payment_method_label}: ${p.amount_usd.toFixed(2)} USD
                </li>
              ))}
            </ul>

            {notes.trim() ? (
              <p className="mb-0">
                <strong>Notas:</strong> {notes.trim()}
              </p>
            ) : null}
          </div>
          <div className="modal-footer">
            <button
              type="button"
              className="btn btn-outline-secondary"
              disabled={submitting}
              onClick={onClose}
            >
              Cancelar
            </button>
            <button
              type="button"
              className="btn btn-primary"
              disabled={submitting}
              onClick={() => void submit()}
            >
              {submitting ? "Creando…" : "Crear venta"}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
