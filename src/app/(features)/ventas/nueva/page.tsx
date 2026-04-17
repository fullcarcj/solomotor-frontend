"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import CommonFooter from "@/core/common/footer/commonFooter";
import { usePaymentMethods } from "@/hooks/usePaymentMethods";
import { useTodayRate } from "@/hooks/useTodayRate";
import type { CartLine, PaymentLine } from "@/types/pos";
import CartTable from "./components/CartTable";
import CustomerSearch from "./components/CustomerSearch";
import PaymentPanel from "./components/PaymentPanel";
import ProductSearch from "./components/ProductSearch";
import RateBanner from "./components/RateBanner";
import SaleConfirmModal from "./components/SaleConfirmModal";

/** Tasa BCV/activa: Bs por 1 USD (misma fuente que RateBanner). */
function activeRateFromToday(rate: { active_rate: number | string } | null | undefined): number | null {
  if (!rate || rate.active_rate === "" || rate.active_rate == null) return null;
  const n = Number(String(rate.active_rate).replace(",", "."));
  if (!Number.isFinite(n) || n <= 0) return null;
  return n;
}

export default function VentasNuevaPosPage() {
  const { rate: rateData, loading: rateLoading, error: rateError } =
    useTodayRate();
  const { methods, loading: methodsLoading } = usePaymentMethods();

  const [cart, setCart] = useState<CartLine[]>([]);
  const [customerId, setCustomerId] = useState<number | null>(null);
  const [customerName, setCustomerName] = useState<string | null>(null);
  const [paymentsDraft, setPaymentsDraft] = useState<PaymentLine[]>([]);
  const [notes, setNotes] = useState("");
  const [modalOpen, setModalOpen] = useState(false);
  const [toast, setToast] = useState<string | null>(null);

  const activeRateNum = useMemo(() => activeRateFromToday(rateData), [rateData]);

  const totalUsd = useMemo(
    () => cart.reduce((s, l) => s + l.subtotal_usd, 0),
    [cart]
  );

  useEffect(() => {
    if (!toast) return;
    const t = setTimeout(() => setToast(null), 5000);
    return () => clearTimeout(t);
  }, [toast]);

  const handleAddProduct = useCallback((line: CartLine) => {
    setCart((prev) => {
      const i = prev.findIndex((l) => l.product_sku === line.product_sku);
      if (i >= 0) {
        const next = [...prev];
        const q = next[i].quantity + 1;
        next[i] = {
          ...next[i],
          quantity: q,
          subtotal_usd: q * next[i].unit_price_usd,
        };
        return next;
      }
      return [...prev, line];
    });
  }, []);

  const handlePaymentConfirm = useCallback((payments: PaymentLine[]) => {
    setPaymentsDraft(payments);
    setModalOpen(true);
  }, []);

  const handleSaleSuccess = useCallback(
    (summary: { id?: number; reference?: string }) => {
      setCart([]);
      setCustomerId(null);
      setCustomerName(null);
      setPaymentsDraft([]);
      setNotes("");
      setModalOpen(false);
      const ref =
        summary.reference ??
        (summary.id != null ? `#${summary.id}` : "venta");
      setToast(`Venta creada — ${ref}`);
    },
    []
  );

  return (
    <div className="page-wrapper">
      <div className="content">
        <div className="page-header">
          <div className="page-title">
            <h4 className="mb-0">Nueva venta (POS)</h4>
            <p className="text-muted small mb-0">
              Mostrador — búsqueda, carrito y cobro en una sola pantalla
            </p>
          </div>
        </div>

        <RateBanner rate={rateData} loading={rateLoading} error={rateError} />

        <div className="row g-3">
          <div className="col-md-8">
            <CustomerSearch
              onSelect={(id, name) => {
                setCustomerId(id);
                setCustomerName(name);
              }}
            />

            <ProductSearch onAdd={handleAddProduct} />

            <label className="form-label small text-muted">Notas (opcional)</label>
            <textarea
              className="form-control form-control-sm mb-3"
              rows={2}
              placeholder="Observaciones internas…"
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
            />

            <CartTable
              lines={cart}
              rate={activeRateNum}
              onChange={setCart}
            />
          </div>

          <div className="col-md-4">
            <PaymentPanel
              totalUsd={totalUsd}
              rate={activeRateNum}
              methods={methods}
              loadingMethods={methodsLoading}
              onRequestConfirm={handlePaymentConfirm}
            />
          </div>
        </div>

        <SaleConfirmModal
          open={modalOpen}
          onClose={() => setModalOpen(false)}
          onSuccess={handleSaleSuccess}
          cart={cart}
          payments={paymentsDraft}
          customerId={customerId}
          customerName={customerName}
          totalUsd={totalUsd}
          rate={rateData}
          notes={notes}
        />

        <div
          className="toast-container position-fixed bottom-0 end-0 p-3"
          style={{ zIndex: 1080 }}
        >
          <div
            className={`toast align-items-center text-bg-success border-0 ${
              toast ? "show" : ""
            }`}
            role="status"
          >
            <div className="d-flex">
              <div className="toast-body">{toast}</div>
              <button
                type="button"
                className="btn-close btn-close-white me-2 m-auto"
                aria-label="Cerrar"
                onClick={() => setToast(null)}
              />
            </div>
          </div>
        </div>

        <CommonFooter />
      </div>
    </div>
  );
}
