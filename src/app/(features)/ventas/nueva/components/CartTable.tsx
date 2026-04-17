"use client";

import type { CartLine } from "@/types/pos";

/** Tasa Bs por 1 USD (p. ej. active_rate de useTodayRate). No usar montos del panel de pago. */
function parseExchangeRate(rate: number | null | undefined): number | null {
  if (rate == null) return null;
  const n = Number(rate);
  if (!Number.isFinite(n) || n <= 0) return null;
  return n;
}

export default function CartTable({
  lines,
  rate,
  onChange,
}: {
  lines: CartLine[];
  /** Bs por 1 USD — debe venir solo de la tasa del día (useTodayRate → active_rate). */
  rate: number | null;
  onChange: (lines: CartLine[]) => void;
}) {
  // Total carrito en USD: siempre desde cantidad × precio (evita subtotal_usd desincronizado).
  const totalUsd = lines.reduce(
    (s, l) => s + Number(l.quantity) * Number(l.unit_price_usd),
    0
  );
  const rateNum = parseExchangeRate(rate);
  const totalBs = rateNum != null ? totalUsd * rateNum : null;

  const update = (sku: string, patch: Partial<Pick<CartLine, "quantity" | "unit_price_usd">>) => {
    onChange(
      lines.map((l) => {
        if (l.product_sku !== sku) return l;
        const quantity = Math.max(1, Number(patch.quantity ?? l.quantity) || 1);
        const unit_price_usd = Math.max(
          0.01,
          Number(patch.unit_price_usd ?? l.unit_price_usd) || 0.01
        );
        return {
          ...l,
          quantity,
          unit_price_usd,
          subtotal_usd: quantity * unit_price_usd,
        };
      })
    );
  };

  const remove = (sku: string) => {
    onChange(lines.filter((l) => l.product_sku !== sku));
  };

  if (lines.length === 0) {
    return (
      <div className="card">
        <div className="card-body text-muted small">
          Agregá productos para comenzar
        </div>
      </div>
    );
  }

  return (
    <div className="card">
      <div className="card-body p-0">
        <div className="table-responsive">
          <table className="table table-sm table-hover mb-0 align-middle">
            <thead className="table-light">
              <tr>
                <th>SKU</th>
                <th>Producto</th>
                <th style={{ width: 110 }}>Precio USD</th>
                <th style={{ width: 90 }}>Cant.</th>
                <th>Subtotal</th>
                <th style={{ width: 44 }} />
              </tr>
            </thead>
            <tbody>
              {lines.map((l) => (
                <tr key={l.product_sku}>
                  <td className="font-monospace small">{l.product_sku}</td>
                  <td className="small">{l.product_name}</td>
                  <td>
                    <input
                      type="number"
                      className="form-control form-control-sm"
                      min={0.01}
                      step="0.01"
                      value={l.unit_price_usd}
                      onChange={(e) =>
                        update(l.product_sku, {
                          unit_price_usd: Number(e.target.value),
                        })
                      }
                    />
                  </td>
                  <td>
                    <input
                      type="number"
                      className="form-control form-control-sm"
                      min={1}
                      step={1}
                      value={l.quantity}
                      onChange={(e) =>
                        update(l.product_sku, {
                          quantity: Number(e.target.value),
                        })
                      }
                    />
                  </td>
                  <td className="small">
                    ${l.subtotal_usd.toFixed(2)}
                  </td>
                  <td>
                    <button
                      type="button"
                      className="btn btn-sm btn-outline-danger py-0"
                      aria-label="Eliminar"
                      onClick={() => remove(l.product_sku)}
                    >
                      ×
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
            <tfoot className="table-light">
              <tr>
                <td colSpan={4} className="text-end fw-semibold">
                  Total USD
                </td>
                <td colSpan={2} className="fw-semibold">
                  ${totalUsd.toFixed(2)}
                </td>
              </tr>
              <tr>
                <td colSpan={4} className="text-end text-muted">
                  Total Bs
                </td>
                <td colSpan={2} className="text-muted">
                  {totalBs != null
                    ? `Bs. ${totalBs.toLocaleString("es-VE", {
                        minimumFractionDigits: 2,
                        maximumFractionDigits: 2,
                      })}`
                    : "Bs. —"}
                </td>
              </tr>
            </tfoot>
          </table>
        </div>
      </div>
    </div>
  );
}
