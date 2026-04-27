"use client";

import { Suspense, useCallback, useEffect, useMemo, useRef, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { useAppDispatch, useAppSelector } from "@/store/hooks";
import { clearPendingMlSalesBellCount } from "@/store/realtimeSlice";
import { useSales } from "@/hooks/useSales";
import type { Sale, SaleReconcileContext } from "@/types/sales";
import SaleDetailModal from "./components/SaleDetailModal";
import RequestDispatchModal from "@/app/(features)/logistica/components/RequestDispatchModal";
import PedidosTopbar from "./components/PedidosTopbar";
import type { ActiveFilter } from "./components/PedidosFiltersBar";
import PedidosKpiRibbon from "./components/PedidosKpiRibbon";
import OrdTable from "./components/OrdTable";
import { useTodayCurrencyRates } from "@/hooks/useTodayCurrencyRates";
import MlOrderMessagingModal from "./components/MlOrderMessagingModal";
import MlSellerFeedbackModal from "./components/MlSellerFeedbackModal";
import SaleQuoteModal, { type SaleQuoteModalContext } from "./components/SaleQuoteModal";
import PendingStatementCreditsModal from "@/app/(features)/bandeja/[chatId]/components/PendingStatementCreditsModal";
import type { SaleDetail } from "@/types/sales";
import "./pedidos-theme.scss";

/** Destino del modal de mensajes pack ML (tabla o deep-link desde bandeja). */
type MlPackModalTarget = {
  saleId: string | number;
  externalHint?: string | null;
};

function VentasPedidosPageInner() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const dispatch = useAppDispatch();
  const salesOrdersSseNonce = useAppSelector((s) => s.realtime.salesOrdersSseNonce);
  const authRole = useAppSelector((s) => s.auth.role);

  /** Cinta HOY VES / tasas / por despachar: solo contador, supervisor y superuser (ERP). */
  const showPedidosKpiRibbon = useMemo(() => {
    const r = (authRole || "").trim().toUpperCase();
    return r === "CONTADOR" || r === "SUPERVISOR" || r === "SUPERUSER";
  }, [authRole]);
  const prevSalesSseNonceRef = useRef<number | null>(null);

  const { sales, meta, loading, error, setFilters, refetch } = useSales();
  const todayRates = useTodayCurrencyRates();

  useEffect(() => {
    if (prevSalesSseNonceRef.current === null) {
      prevSalesSseNonceRef.current = salesOrdersSseNonce;
      return;
    }
    if (salesOrdersSseNonce === prevSalesSseNonceRef.current) return;
    prevSalesSseNonceRef.current = salesOrdersSseNonce;
    dispatch(clearPendingMlSalesBellCount());
    void refetch();
  }, [salesOrdersSseNonce, refetch, dispatch]);

  const [selectedId, setSelectedId] = useState<string | number | null>(null);
  const [dispatchSale, setDispatchSale] = useState<Sale | null>(null);
  const [mlPackModal, setMlPackModal] = useState<MlPackModalTarget | null>(null);
  const [mlSellerFeedbackSale, setMlSellerFeedbackSale] = useState<Sale | null>(null);
  const [dispatchToast, setDispatchToast] = useState(false);
  const [quoteCtx, setQuoteCtx] = useState<SaleQuoteModalContext | null>(null);
  const [reconcileCtx, setReconcileCtx] = useState<SaleReconcileContext | null>(null);
  const [search, setSearch] = useState("");
  const [activeFilter, setActiveFilter] = useState<ActiveFilter>("all");

  // Track whether data has been loaded at least once (to distinguish skeleton vs refetch)
  const [hasData, setHasData] = useState(false);
  useEffect(() => {
    if (!loading) setHasData(true);
  }, [loading]);

  const isInitialLoad = loading && !hasData;
  const isRefetching = loading && hasData;

  const openReconcileFromSale = useCallback((sale: Sale) => {
    const rawId = String(sale.id).replace(/^so-/i, "");
    const numId = Number(rawId);
    if (!Number.isFinite(numId) || numId <= 0) return;
    setReconcileCtx({
      salesOrderId: numId,
      totalBs: sale.total_amount_bs ?? null,
      label: `Venta #${sale.id}${sale.external_order_id ? ` · ML ${sale.external_order_id}` : ""}`,
    });
  }, []);

  const openQuoteFromSale = useCallback((sale: Sale | SaleDetail) => {
    const src = String(sale.source || "").toLowerCase();
    const isMl = src.includes("mercadolibre") || src.startsWith("ml_");
    const rawChat = sale.chat_id;
    const chatId =
      rawChat != null && String(rawChat).trim() !== "" ? String(rawChat).trim() : "";
    setQuoteCtx({
      saleId: sale.id,
      chatId,
      customerId: sale.customer_id != null ? Number(sale.customer_id) : null,
      isMl,
      saleLabel: `Venta #${sale.id}${
        sale.external_order_id ? ` · ML ${sale.external_order_id}` : ""
      }`,
    });
  }, []);

  /** Query opcional (?open_ml_pack= / ?open_ml_order_id=) p. ej. enlaces guardados. */
  useEffect(() => {
    const stripKeys = (keys: string[]) => {
      const next = new URLSearchParams(searchParams.toString());
      for (const k of keys) next.delete(k);
      const q = next.toString();
      router.replace(q ? `/ventas/pedidos?${q}` : "/ventas/pedidos", { scroll: false });
    };

    const rawPack = searchParams.get("open_ml_pack");
    if (rawPack != null && String(rawPack).trim() !== "") {
      const saleId = String(rawPack).trim();
      const ext = searchParams.get("ml_ext");
      setMlPackModal({
        saleId,
        externalHint: ext != null && String(ext).trim() !== "" ? String(ext).trim() : null,
      });
      stripKeys(["open_ml_pack", "ml_ext", "open_ml_order_id"]);
      return;
    }

    const rawMlOid = searchParams.get("open_ml_order_id");
    if (rawMlOid == null || String(rawMlOid).trim() === "") return;

    let cancelled = false;
    const oid = String(rawMlOid).trim();

    void (async () => {
      try {
        const res = await fetch(
          `/api/ventas/pedidos/resolve-ml-order?ml_order_id=${encodeURIComponent(oid)}`,
          { credentials: "include", cache: "no-store" }
        );
        const j = (await res.json().catch(() => ({}))) as {
          data?: { id?: string; external_order_id?: string | null };
          error?: string;
          message?: string;
        };
        if (cancelled) return;
        if (res.ok && j.data?.id) {
          setMlPackModal({
            saleId: String(j.data.id).trim(),
            externalHint:
              j.data.external_order_id != null && String(j.data.external_order_id).trim() !== ""
                ? String(j.data.external_order_id).trim()
                : null,
          });
        }
      } finally {
        if (!cancelled) stripKeys(["open_ml_order_id"]);
      }
    })();

    return () => {
      cancelled = true;
    };
  }, [searchParams, router]);

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
      const custName = String(s.customer_name ?? "").toLowerCase();
      return (
        id.includes(q) ||
        ext.includes(q) ||
        vendor.includes(q) ||
        cust.includes(q) ||
        custName.includes(q)
      );
    });
  }, [sales, search]);

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

          <PedidosTopbar
            search={search}
            onSearch={setSearch}
            onRefetch={handleRefetch}
            isLoading={isRefetching}
            activeFilter={activeFilter}
            onFilterChange={handleFilterChange}
            counts={statusCounts}
          />

          {showPedidosKpiRibbon ? (
            <PedidosKpiRibbon sales={sales} loading={isInitialLoad} rates={todayRates} />
          ) : null}

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
              viewerRole={authRole}
              bcvRate={todayRates.bcvRate}
              binanceRate={todayRates.binanceRate}
              onRowClick={setSelectedId}
              selectedId={selectedId}
              onRequestDispatch={setDispatchSale}
              onOpenMlMessaging={(s) =>
                setMlPackModal({ saleId: s.id, externalHint: s.external_order_id })
              }
              onOpenQuote={openQuoteFromSale}
              onReconcile={openReconcileFromSale}
              onFulfillmentUpdated={refetch}
              onCustomerDirectoryChanged={refetch}
              onOpenMlSellerFeedback={(s) => setMlSellerFeedbackSale(s)}
              onClearFilters={() => handleFilterChange("all")}
            />
          </div>
        </div>
      </div>

      {/* ── Existing modals preserved ── */}
      <SaleDetailModal
        saleId={selectedId}
        onClose={() => setSelectedId(null)}
        onOpenQuote={openQuoteFromSale}
      />

      <SaleQuoteModal ctx={quoteCtx} onClose={() => setQuoteCtx(null)} />

      <PendingStatementCreditsModal
        open={reconcileCtx != null}
        onClose={() => setReconcileCtx(null)}
        subtitle={
          reconcileCtx
            ? `Vincular pago a ${reconcileCtx.label}. Tocá un movimiento del extracto para vincularlo a esta orden.`
            : undefined
        }
        expectedTotalBs={reconcileCtx?.totalBs ?? undefined}
        onPickStatement={async (item) => {
          const ctx = reconcileCtx;
          if (!ctx) return;
          const stmtId = Number(String(item.id).trim());
          if (!Number.isFinite(stmtId) || stmtId <= 0) {
            throw new Error("Movimiento inválido");
          }
          const soNumId = Number(String(ctx.salesOrderId).replace(/^so-/i, ""));
          const res = await fetch(
            `/api/sales/orders/${encodeURIComponent(String(soNumId))}/reconcile`,
            {
              method: "POST",
              credentials: "include",
              headers: { "Content-Type": "application/json" },
              body: JSON.stringify({ statement_id: stmtId }),
              cache: "no-store",
            }
          );
          const j = (await res.json().catch(() => ({}))) as Record<string, unknown>;
          if (!res.ok) {
            throw new Error(String(j.message ?? j.error ?? "Error al vincular el pago."));
          }
          void refetch?.();
        }}
      />

      {mlPackModal != null && (
        <MlOrderMessagingModal
          saleId={mlPackModal.saleId}
          externalHint={mlPackModal.externalHint ?? undefined}
          onClose={() => setMlPackModal(null)}
        />
      )}

      {mlSellerFeedbackSale != null && (
        <MlSellerFeedbackModal
          sale={mlSellerFeedbackSale}
          onClose={() => setMlSellerFeedbackSale(null)}
          onSubmitted={() => void refetch()}
        />
      )}

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

export default function VentasPedidosPage() {
  return (
    <Suspense
      fallback={
        <div className="page-wrapper">
          <div className="content p-0">
            <div className="pedidos-page p-4 text-muted small">Cargando pedidos…</div>
          </div>
        </div>
      }
    >
      <VentasPedidosPageInner />
    </Suspense>
  );
}
