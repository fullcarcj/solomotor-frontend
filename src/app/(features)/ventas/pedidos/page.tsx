"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import { useSales } from "@/hooks/useSales";
import type { Sale } from "@/types/sales";
import SaleDetailModal from "./components/SaleDetailModal";
import RequestDispatchModal from "@/app/(features)/logistica/components/RequestDispatchModal";
import PedidosPageIntro from "./components/PedidosPageIntro";
import PedidosTopbar from "./components/PedidosTopbar";
import PedidosFiltersBar from "./components/PedidosFiltersBar";
import type { ActiveFilter } from "./components/PedidosFiltersBar";
import PedidosKpiRibbon from "./components/PedidosKpiRibbon";
import OrdTable from "./components/OrdTable";
import "./pedidos-theme.scss";

export default function VentasPedidosPage() {
  const { sales, meta, loading, error, setFilters, refetch } = useSales();

  const [selectedId, setSelectedId] = useState<string | number | null>(null);
  const [dispatchSale, setDispatchSale] = useState<Sale | null>(null);
  const [dispatchToast, setDispatchToast] = useState(false);
  const [search, setSearch] = useState("");
  const [activeFilter, setActiveFilter] = useState<ActiveFilter>("all");

  // Track whether data has been loaded at least once (to distinguish skeleton vs refetch)
  const [hasData, setHasData] = useState(false);
  useEffect(() => {
    if (!loading) setHasData(true);
  }, [loading]);

  const isInitialLoad = loading && !hasData;
  const isRefetching = loading && hasData;

  // Map filter pill → useSales filter params
  const handleFilterChange = useCallback(
    (f: ActiveFilter) => {
      setActiveFilter(f);
      switch (f) {
        case "all":
          setFilters((prev) => ({
            ...prev,
            status: undefined,
            include_completed: false,
            offset: 0,
          }));
          break;
        case "pending":
          setFilters((prev) => ({
            ...prev,
            status: "pending",
            include_completed: false,
            offset: 0,
          }));
          break;
        case "in_progress":
          setFilters((prev) => ({
            ...prev,
            status: "paid",
            include_completed: false,
            offset: 0,
          }));
          break;
        case "closed":
          setFilters((prev) => ({
            ...prev,
            status: undefined,
            include_completed: true,
            offset: 0,
          }));
          break;
      }
    },
    [setFilters]
  );

  const handleRefetch = useCallback(() => {
    void refetch?.();
  }, [refetch]);

  // Client-side search filter over loaded sales
  const filteredSales = useMemo(() => {
    const q = search.trim().toLowerCase();
    if (!q) return sales;
    return sales.filter((s) => {
      const id = String(s.id).toLowerCase();
      const ext = String(s.external_order_id ?? "").toLowerCase();
      const vendor = String(s.sold_by ?? "").toLowerCase();
      const cust = String(s.customer_id ?? "").toLowerCase();
      return (
        id.includes(q) ||
        ext.includes(q) ||
        vendor.includes(q) ||
        cust.includes(q)
      );
    });
  }, [sales, search]);

  // SLA time buckets derived from loaded sales
  const slaBuckets = useMemo(() => {
    let hot = 0;
    let warn = 0;
    let cold = 0;
    for (const s of sales) {
      const st = String(s.status).toLowerCase();
      if (
        ["completed", "delivered", "cancelled", "canceled"].includes(st)
      )
        continue;
      const hours =
        (Date.now() - new Date(s.created_at).getTime()) / 3_600_000;
      if (hours > 48) hot++;
      else if (hours > 12) warn++;
      else cold++;
    }
    return { hot, warn, cold };
  }, [sales]);

  // Status counts for filter pills
  const statusCounts = useMemo(() => {
    const pending = sales.filter((s) =>
      ["pending", "pending_payment"].includes(String(s.status))
    ).length;
    const inProgress = sales.filter((s) =>
      ["paid", "shipped", "ready_to_ship", "dispatched"].includes(
        String(s.status)
      )
    ).length;
    const closed = sales.filter((s) =>
      ["completed", "delivered", "cancelled", "canceled"].includes(
        String(s.status)
      )
    ).length;
    return { all: meta.total, pending, inProgress, closed };
  }, [sales, meta.total]);

  const showDispatchToast = () => {
    setDispatchToast(true);
    setTimeout(() => setDispatchToast(false), 3000);
  };

  return (
    <div className="page-wrapper">
      <div className="content p-0">
        <div className="pedidos-page">
          {/* Error banner */}
          {error && !loading && (
            <div className="pd-error-bar" role="alert">
              <span>{error}</span>
              <button type="button" onClick={handleRefetch}>
                Reintentar
              </button>
            </div>
          )}

          <PedidosPageIntro />

          <PedidosTopbar
            search={search}
            onSearch={setSearch}
            onRefetch={handleRefetch}
            isLoading={isRefetching}
          />

          <PedidosFiltersBar
            activeFilter={activeFilter}
            onFilterChange={handleFilterChange}
            counts={statusCounts}
            sla={slaBuckets}
          />

          <PedidosKpiRibbon sales={sales} loading={isInitialLoad} />

          {/* Subtle loading bar on refetch (keeps existing rows visible) */}
          {isRefetching && (
            <div className="pd-loading-bar" role="status" aria-label="Actualizando órdenes">
              <div className="bar-inner" />
            </div>
          )}

          <div className="pd-table-wrap">
            <OrdTable
              sales={filteredSales}
              loading={isInitialLoad}
              onRowClick={setSelectedId}
              selectedId={selectedId}
              onRequestDispatch={setDispatchSale}
              onClearFilters={() => handleFilterChange("all")}
            />
          </div>
        </div>
      </div>

      {/* ── Existing modals preserved ── */}
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
          handleRefetch();
        }}
      />

      {/* Dispatch toast */}
      {dispatchToast && (
        <div
          className="position-fixed bottom-0 end-0 p-3"
          style={{ zIndex: 9999 }}
          role="status"
          aria-live="polite"
        >
          <div className="toast show align-items-center text-bg-success border-0">
            <div className="d-flex">
              <div className="toast-body">
                <i className="ti ti-check me-2" aria-hidden="true" />
                Despacho solicitado correctamente
              </div>
              <button
                type="button"
                className="btn-close btn-close-white me-2 m-auto"
                aria-label="Cerrar notificación"
                onClick={() => setDispatchToast(false)}
              />
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
