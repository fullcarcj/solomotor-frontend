"use client";

import { useCallback, useEffect, useState } from "react";
import CommonFooter from "@/core/common/footer/commonFooter";
import { useQuotations } from "@/hooks/useQuotations";
import NewQuotationModal from "./components/NewQuotationModal";
import QuotationFilters from "./components/QuotationFilters";
import QuotationSummaryCards from "./components/QuotationSummaryCards";
import QuotationTable from "./components/QuotationTable";

export default function VentasCotizacionesPage() {
  const {
    items,
    pagination,
    loading,
    error,
    filters,
    setFilters,
    refetch,
  } = useQuotations();

  const [modalOpen, setModalOpen] = useState(false);
  const [toastVisible, setToastVisible] = useState(false);

  useEffect(() => {
    if (!toastVisible) return;
    const t = setTimeout(() => setToastVisible(false), 4000);
    return () => clearTimeout(t);
  }, [toastVisible]);

  const onPageChange = useCallback((offset: number) => {
    setFilters((f) => ({ ...f, offset }));
  }, [setFilters]);

  const onClearFilters = useCallback(() => {
    setFilters({ limit: 50, offset: 0 });
  }, [setFilters]);

  const onQuotationSuccess = useCallback(() => {
    setModalOpen(false);
    void refetch();
    setToastVisible(true);
  }, [refetch]);

  return (
    <div className="page-wrapper">
      <div className="content">
        <div className="page-header d-flex flex-wrap justify-content-between align-items-center gap-3">
          <div className="page-title">
            <h4 className="mb-0">Cotizaciones</h4>
          </div>
          <button
            type="button"
            className="btn btn-primary"
            onClick={() => setModalOpen(true)}
          >
            Nueva cotización
          </button>
        </div>

        <QuotationSummaryCards items={items} total={pagination.total} />

        <QuotationFilters filters={filters} onChange={setFilters} />

        <QuotationTable
          items={items}
          pagination={pagination}
          loading={loading}
          error={error}
          onPageChange={onPageChange}
          onClearFilters={onClearFilters}
        />

        <NewQuotationModal
          open={modalOpen}
          onClose={() => setModalOpen(false)}
          onSuccess={onQuotationSuccess}
        />

        <div
          className="toast-container position-fixed bottom-0 end-0 p-3"
          style={{ zIndex: 1080 }}
        >
          <div
            className={`toast align-items-center text-bg-success border-0 ${
              toastVisible ? "show" : ""
            }`}
            role="status"
            aria-live="polite"
            aria-atomic="true"
          >
            <div className="d-flex">
              <div className="toast-body">Cotización creada</div>
              <button
                type="button"
                className="btn-close btn-close-white me-2 m-auto"
                aria-label="Cerrar"
                onClick={() => setToastVisible(false)}
              />
            </div>
          </div>
        </div>

        <CommonFooter />
      </div>
    </div>
  );
}
