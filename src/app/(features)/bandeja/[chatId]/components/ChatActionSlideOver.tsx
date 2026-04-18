"use client";
import { useState } from "react";
import Link from "next/link";
import type { CartLine } from "@/types/pos";
import type { Sale } from "@/types/sales";
import ProductSearch from "@/app/(features)/ventas/nueva/components/ProductSearch";
import NewQuotationModal from "@/app/(features)/ventas/cotizaciones/components/NewQuotationModal";
import RequestDispatchModal from "@/app/(features)/logistica/components/RequestDispatchModal";
import SaleStatusBadge from "@/app/(features)/ventas/pedidos/components/SaleStatusBadge";

type ActionType = "quote" | "pay" | "pos" | "dispatch" | null;

interface Props {
  action:       ActionType;
  chatId:       number | string;
  customerId:   number | string | null;
  customerName: string | null;
  recentOrders: Sale[];
  onClose:      () => void;
  onSuccess:    (result?: unknown) => void;
}

/* ─── Mini POS ─────────────────────────────────── */
function MiniPos({
  customerId,
  onClose,
  onSuccess,
}: {
  customerId: number | string | null;
  onClose: () => void;
  onSuccess: () => void;
}) {
  const [lines, setLines]   = useState<CartLine[]>([]);
  const [saving, setSaving] = useState(false);
  const [error, setError]   = useState<string | null>(null);

  function addLine(line: CartLine) {
    setLines(prev => {
      const idx = prev.findIndex(l => l.product_sku === line.product_sku);
      if (idx >= 0) {
        const copy = [...prev];
        copy[idx] = { ...copy[idx], quantity: copy[idx].quantity + 1, subtotal_usd: (copy[idx].quantity + 1) * copy[idx].unit_price_usd };
        return copy;
      }
      return [...prev, line];
    });
  }

  function removeLine(sku: string) {
    setLines(prev => prev.filter(l => l.product_sku !== sku));
  }

  const total = lines.reduce((s, l) => s + l.subtotal_usd, 0);

  async function createSale() {
    if (lines.length === 0) return;
    setSaving(true); setError(null);
    try {
      const body = {
        customer_id: customerId ? Number(customerId) : undefined,
        lines: lines.map(l => ({ product_sku: l.product_sku, quantity: l.quantity, unit_price_usd: l.unit_price_usd })),
        status: "PENDING",
      };
      const res = await fetch("/api/pos/sales", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify(body),
      });
      const data = await res.json().catch(() => ({})) as Record<string, unknown>;
      if (!res.ok) throw new Error((data.error as string) ?? `HTTP ${res.status}`);
      onSuccess();
    } catch (e) {
      setError(e instanceof Error ? e.message : "Error.");
    } finally {
      setSaving(false);
    }
  }

  return (
    <div className="p-3">
      <h6 className="fw-bold mb-3 d-flex align-items-center gap-2">
        <i className="ti ti-shopping-cart text-warning" /> POS Rápido
      </h6>
      {error && <div className="alert alert-danger py-2 small">{error}</div>}
      <ProductSearch onAdd={addLine} />
      {lines.length > 0 && (
        <div className="mb-3">
          {lines.map(l => (
            <div key={l.product_sku} className="d-flex justify-content-between align-items-center py-1 border-bottom">
              <div>
                <div className="small fw-semibold">{l.product_name}</div>
                <div className="text-muted" style={{ fontSize: "0.75rem" }}>
                  {l.quantity} × ${l.unit_price_usd.toFixed(2)}
                </div>
              </div>
              <div className="d-flex align-items-center gap-2">
                <span className="fw-bold small">${l.subtotal_usd.toFixed(2)}</span>
                <button className="btn btn-sm btn-outline-danger py-0" onClick={() => removeLine(l.product_sku)}>
                  <i className="ti ti-x" style={{ fontSize: "0.7rem" }} />
                </button>
              </div>
            </div>
          ))}
          <div className="d-flex justify-content-between fw-bold pt-2 mb-3">
            <span>Total</span>
            <span>${total.toFixed(2)}</span>
          </div>
          <button className="btn btn-success w-100" disabled={saving} onClick={() => void createSale()}>
            {saving ? <span className="spinner-border spinner-border-sm me-2" /> : <i className="ti ti-check me-2" />}
            Crear venta
          </button>
        </div>
      )}
      <button className="btn btn-sm btn-outline-secondary w-100 mt-2" onClick={onClose}>Cerrar</button>
    </div>
  );
}

/* ─── Panel Cobrar ─────────────────────────────── */
function PayPanel({
  customerId,
  customerName,
  onClose,
}: {
  customerId: number | string | null;
  customerName: string | null;
  onClose: () => void;
}) {
  return (
    <div className="p-3">
      <h6 className="fw-bold mb-3 d-flex align-items-center gap-2">
        <i className="ti ti-cash text-success" /> Cobrar
      </h6>
      <p className="text-muted small mb-3">
        Para registrar un pago, confirma una cotización existente o crea una nueva venta desde el POS.
      </p>
      <div className="d-grid gap-2">
        {customerId && (
          <Link
            href={`/ventas/cotizaciones?customer_id=${customerId}`}
            className="btn btn-outline-primary"
            onClick={onClose}
          >
            <i className="ti ti-file-invoice me-2" />
            Ver cotizaciones de {customerName ?? `#${customerId}`}
          </Link>
        )}
        <Link href="/ventas/cotizaciones" className="btn btn-outline-secondary" onClick={onClose}>
          <i className="ti ti-list me-2" />Ir a Cotizaciones
        </Link>
      </div>
      <button className="btn btn-sm btn-outline-secondary w-100 mt-3" onClick={onClose}>Cerrar</button>
    </div>
  );
}

/* ─── Panel Despachar ──────────────────────────── */
function DispatchPanel({
  recentOrders,
  onClose,
  onSuccess,
}: {
  recentOrders: Sale[];
  onClose: () => void;
  onSuccess: () => void;
}) {
  const [selectedSale, setSelectedSale] = useState<Sale | null>(null);
  const paidOrders = recentOrders.filter(o => o.status === "paid");

  return (
    <div className="p-3">
      <h6 className="fw-bold mb-3 d-flex align-items-center gap-2">
        <i className="ti ti-truck text-secondary" /> Solicitar Despacho
      </h6>
      {paidOrders.length === 0 ? (
        <p className="text-muted small">Sin órdenes pagadas pendientes de despacho.</p>
      ) : (
        <div className="d-flex flex-column gap-2 mb-3">
          {paidOrders.map(o => (
            <div key={String(o.id)} className="border rounded p-2 d-flex justify-content-between align-items-center">
              <div>
                <code className="small">#{o.id}</code>
                <div><SaleStatusBadge status={o.status} /></div>
              </div>
              <button
                className="btn btn-sm btn-outline-primary"
                onClick={() => setSelectedSale(o)}
              >
                Solicitar
              </button>
            </div>
          ))}
        </div>
      )}
      <button className="btn btn-sm btn-outline-secondary w-100" onClick={onClose}>Cerrar</button>

      <RequestDispatchModal
        saleId={selectedSale?.id ?? null}
        saleTable="sales"
        channel={selectedSale?.source ?? ""}
        reference={selectedSale?.external_order_id ?? null}
        onClose={() => setSelectedSale(null)}
        onSuccess={() => { setSelectedSale(null); onSuccess(); }}
      />
    </div>
  );
}

/* ─── Contenedor principal ─────────────────────── */
export default function ChatActionSlideOver({
  action, chatId: _chatId, customerId, customerName, recentOrders, onClose, onSuccess,
}: Props) {
  if (!action) return null;

  /* Para 'quote' usamos directamente el modal Bootstrap — no necesita slide-over wrapper */
  if (action === "quote") {
    return (
      <NewQuotationModal
        open={true}
        onClose={onClose}
        onSuccess={() => onSuccess()}
      />
    );
  }

  const titles: Record<Exclude<NonNullable<ActionType>, "quote">, string> = {
    pay:      "Cobrar",
    pos:      "POS Rápido",
    dispatch: "Solicitar Despacho",
  };

  return (
    <>
      {/* Backdrop semitransparente */}
      <div
        className="position-fixed top-0 start-0 w-100 h-100"
        style={{ zIndex: 1040, background: "rgba(0,0,0,0.25)" }}
        onClick={onClose}
      />

      {/* Slide-over panel */}
      <div
        className="position-fixed top-0 end-0 h-100 bg-white shadow-lg overflow-y-auto"
        style={{ zIndex: 1045, width: 400, borderLeft: "1px solid var(--bs-border-color)" }}
      >
        {/* Header */}
        <div className="d-flex justify-content-between align-items-center px-3 py-2 border-bottom">
          <h6 className="mb-0 fw-bold">{titles[action as Exclude<NonNullable<ActionType>, "quote">]}</h6>
          <button className="btn-close" onClick={onClose} />
        </div>

        {action === "pay" && (
          <PayPanel
            customerId={customerId}
            customerName={customerName}
            onClose={onClose}
          />
        )}

        {action === "pos" && (
          <MiniPos
            customerId={customerId}
            onClose={onClose}
            onSuccess={() => { onSuccess(); onClose(); }}
          />
        )}

        {action === "dispatch" && (
          <DispatchPanel
            recentOrders={recentOrders}
            onClose={onClose}
            onSuccess={() => { onSuccess(); }}
          />
        )}
      </div>
    </>
  );
}
