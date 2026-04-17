"use client";

import { useCallback, useState } from "react";
import CommonFooter from "@/core/common/footer/commonFooter";
import { useSales } from "@/hooks/useSales";
import type { Sale } from "@/types/sales";
import SaleDetailModal from "./components/SaleDetailModal";
import SalesFilters from "./components/SalesFilters";
import SalesSummaryCards from "./components/SaleSummaryCards";
import SalesTable from "./components/SalesTable";
import RequestDispatchModal from "@/app/(features)/logistica/components/RequestDispatchModal";

export default function VentasPedidosPage() {
  const { sales, meta, loading, error, filters, setFilters, refetch } = useSales();
  const [selectedId, setSelectedId]           = useState<string | number | null>(null);
  const [dispatchSale, setDispatchSale]       = useState<Sale | null>(null);
  const [dispatchToast, setDispatchToast]     = useState(false);

  const onPageChange = useCallback(
    (offset: number) => setFilters((f) => ({ ...f, offset })),
    [setFilters]
  );

  const showDispatchToast = () => {
    setDispatchToast(true);
    setTimeout(() => setDispatchToast(false), 3000);
  };

  return (
    <div className="page-wrapper">
      <div className="content">
        <div className="page-header">
          <div className="page-title">
            <h4 className="mb-0">Pedidos y Ventas</h4>
            <p className="text-muted small mb-0">
              {loading ? "Cargando…" : `${meta.total} venta(s) encontrada(s)`}
            </p>
          </div>
        </div>

        <SalesSummaryCards sales={sales} meta={meta} />

        <SalesFilters filters={filters} onChange={setFilters} />

        <SalesTable
          sales={sales}
          meta={meta}
          loading={loading}
          error={error}
          onRowClick={setSelectedId}
          onPageChange={onPageChange}
          onRequestDispatch={(sale) => setDispatchSale(sale)}
        />

        <SaleDetailModal
          saleId={selectedId}
          onClose={() => setSelectedId(null)}
        />

        <RequestDispatchModal
          saleId={dispatchSale?.id ?? null}
          saleTable="sales"
          channel={dispatchSale?.source ?? ""}
          reference={dispatchSale?.external_order_id}
          onClose={() => setDispatchSale(null)}
          onSuccess={() => {
            setDispatchSale(null);
            showDispatchToast();
            void refetch?.();
          }}
        />

        {dispatchToast && (
          <div className="position-fixed bottom-0 end-0 p-3" style={{ zIndex: 9999 }}>
            <div className="toast show align-items-center text-bg-success border-0">
              <div className="d-flex">
                <div className="toast-body">
                  <i className="ti ti-check me-2" />Despacho solicitado correctamente
                </div>
                <button type="button" className="btn-close btn-close-white me-2 m-auto"
                  onClick={() => setDispatchToast(false)} />
              </div>
            </div>
          </div>
        )}

        <CommonFooter />
      </div>
    </div>
  );
}
