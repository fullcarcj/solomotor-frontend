"use client";

import { useMemo, useState, useEffect } from "react";
import type { PaymentLine, PaymentMethodOption } from "@/types/pos";

function numRate(rate: number | null | undefined): number | null {
  if (rate == null || !Number.isFinite(rate)) return null;
  return rate;
}

/**
 * Monto en USD tal como lo escribe el usuario.
 * Acepta 15 / 15.5 / 15,50 y formato es-VE con miles: 7.196,66 → 7196.66
 * (evita que parseFloat("7.196,66") dé 7.196 al tropezar con el segundo punto).
 */
function parseUsdAmountInput(raw: string): number {
  const s = String(raw).trim().replace(/\s/g, "");
  if (!s) return 0;
  const hasCommaDecimal = /,\d{1,4}$/.test(s);
  if (hasCommaDecimal) {
    const normalized = s.replace(/\./g, "").replace(",", ".");
    const n = parseFloat(normalized);
    return Number.isFinite(n) ? n : 0;
  }
  const n = parseFloat(s.replace(",", "."));
  return Number.isFinite(n) ? n : 0;
}

export default function PaymentPanel({
  totalUsd,
  rate,
  methods,
  loadingMethods,
  onRequestConfirm,
}: {
  totalUsd: number;
  rate: number | null;
  methods: PaymentMethodOption[];
  loadingMethods?: boolean;
  onRequestConfirm: (payments: PaymentLine[]) => void;
}) {
  const [amounts, setAmounts] = useState<Record<string, string>>({});

  useEffect(() => {
    setAmounts((prev) => {
      const next = { ...prev };
      for (const m of methods) {
        if (next[m.code] === undefined) next[m.code] = "";
      }
      return next;
    });
  }, [methods]);

  const paymentLines: PaymentLine[] = useMemo(() => {
    return methods
      .map((m) => {
        const raw = amounts[m.code] ?? "";
        const amount_usd = parseUsdAmountInput(raw);
        return {
          payment_method_code: m.code,
          payment_method_label: m.label,
          amount_usd,
        };
      })
      .filter((p) => p.amount_usd > 0);
  }, [amounts, methods]);

  const sumPay = useMemo(
    () => paymentLines.reduce((s, p) => s + p.amount_usd, 0),
    [paymentLines]
  );

  const r = numRate(rate);
  const totalBs = r != null ? totalUsd * r : null;

  const hasPositive = paymentLines.length > 0;
  const coversTotal = totalUsd <= 0 || sumPay + 1e-6 >= totalUsd;
  const valid =
    totalUsd > 0 && hasPositive && coversTotal;

  const vuelto = sumPay > totalUsd + 1e-6 ? sumPay - totalUsd : 0;

  return (
    <div className="card sticky-top" style={{ top: "1rem" }}>
      <div className="card-header py-2">
        <strong>Pago</strong>
      </div>
      <div className="card-body small">
        <p className="mb-2">
          <span className="text-muted">Total a cobrar:</span>{" "}
          <span className="fs-5 fw-semibold">${totalUsd.toFixed(2)} USD</span>
        </p>
        <p className="mb-2 text-muted">
          Equivalente (referencia):{" "}
          {totalBs != null
            ? `Bs. ${totalBs.toLocaleString("es-VE", {
                minimumFractionDigits: 2,
                maximumFractionDigits: 2,
              })}`
            : "Bs. —"}
        </p>
        <p className="mb-3 small text-secondary">
          Los campos de abajo son montos en <strong>USD</strong> por método (no el total en Bs).
          Ej.: total ${totalUsd.toFixed(2)} USD → en efectivo USD podés poner{" "}
          <strong>{totalUsd.toFixed(2)}</strong> o <strong>{totalUsd.toFixed(2).replace(".", ",")}</strong>.
        </p>

        {loadingMethods && (
          <p className="text-muted small">Cargando métodos de pago…</p>
        )}

        {!loadingMethods && methods.length === 0 && (
          <p className="text-warning small">No hay métodos de pago configurados.</p>
        )}

        {methods.map((m) => (
          <div key={m.code} className="mb-2">
            <label className="form-label small mb-0 text-muted">{m.label}</label>
            <div className="input-group input-group-sm">
              <span className="input-group-text">USD</span>
              <input
                type="text"
                inputMode="decimal"
                className="form-control"
                placeholder="0.00"
                value={amounts[m.code] ?? ""}
                onChange={(e) =>
                  setAmounts((prev) => ({
                    ...prev,
                    [m.code]: e.target.value,
                  }))
                }
              />
            </div>
          </div>
        ))}

        {sumPay > 0 && !coversTotal && totalUsd > 0 && (
          <p className="text-danger small mb-2">
            Faltan ${(totalUsd - sumPay).toFixed(2)} USD para cubrir el total.
          </p>
        )}

        {vuelto > 0 && (
          <p className="text-success small mb-2">
            Vuelto: ${vuelto.toFixed(2)} USD
          </p>
        )}

        <button
          type="button"
          className="btn btn-primary w-100 mt-2"
          disabled={!valid}
          onClick={() => onRequestConfirm(paymentLines)}
        >
          Confirmar venta
        </button>
      </div>
    </div>
  );
}
