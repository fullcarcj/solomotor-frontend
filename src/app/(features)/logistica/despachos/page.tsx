"use client";

import { useState } from "react";
import { useDispatchPending, useDispatchHistory } from "@/hooks/useDispatch";
import type { DispatchRecord } from "@/types/dispatch";
import DispatchTable from "../components/DispatchTable";
import ConfirmDispatchModal from "../components/ConfirmDispatchModal";

function todayIso(): string {
  return new Date().toISOString().split("T")[0];
}

export default function LogisticaDespachosPage() {
  const today = todayIso();

  const { records: pending, pagination: pendPag, loading: pendLoading, error: pendErr, filters: pendFilters, setFilters: setPendFilters, refetch: refetchPend } =
    useDispatchPending(0);

  const { records: shipped, pagination: shipPag, loading: shipLoading, error: shipErr, refetch: refetchShip } =
    useDispatchHistory();

  const [selected, setSelected] = useState<DispatchRecord | null>(null);
  const [toast, setToast]       = useState(false);

  // Inicializar filtros con fecha de hoy
  useState(() => {
    setPendFilters((f) => ({ ...f }));
  });

  const showToast = () => { setToast(true); setTimeout(() => setToast(false), 3000); };

  return (
    <div className="page-wrapper">
      <div className="content">

        <div className="d-flex align-items-center justify-content-between flex-wrap gap-3 mb-4">
          <div>
            <h1 className="mb-1 custome-heading">Despachos del Día</h1>
            <p className="text-muted small mb-0">
              {new Date().toLocaleDateString("es-VE", { weekday: "long", day: "numeric", month: "long" })}
            </p>
          </div>
          <button type="button" className="btn btn-outline-secondary btn-sm"
            onClick={() => { refetchPend(); refetchShip(); }}>
            <i className="ti ti-refresh me-1" />Actualizar
          </button>
        </div>

        {/* Sección 1: Pendientes hoy */}
        <div className="mb-2">
          <h5 className="fw-semibold text-warning d-flex align-items-center gap-2">
            <i className="ti ti-clock" />
            Pendientes hoy
            {!pendLoading && (
              <span className="badge bg-warning text-dark">{pendPag.total}</span>
            )}
          </h5>
        </div>

        <DispatchTable
          records={pending.filter((r) => r.status === "pending" || r.status === "ready_to_ship")}
          pagination={pendPag}
          loading={pendLoading}
          error={pendErr}
          actionLabel="Confirmar Despacho"
          onAction={(r) => setSelected(r)}
          onPageChange={(offset) => setPendFilters((f) => ({ ...f, offset }))}
          onRetry={refetchPend}
          emptyMessage="No hay despachos pendientes para hoy"
        />

        {/* Sección 2: Despachados hoy */}
        <div className="mt-4 mb-2">
          <h5 className="fw-semibold text-success d-flex align-items-center gap-2">
            <i className="ti ti-circle-check" />
            Despachados hoy
            {!shipLoading && (
              <span className="badge bg-success">{shipPag.total}</span>
            )}
          </h5>
        </div>

        <DispatchTable
          records={shipped.filter((r) => r.status === "shipped")}
          pagination={shipPag}
          loading={shipLoading}
          error={shipErr}
          actionLabel="Ver Detalle"
          onAction={(r) => console.log("Detalle despacho:", r)}
          onPageChange={(offset) => {}} // historial today es solo vista
          onRetry={refetchShip}
          emptyMessage="Aún no se han despachado pedidos hoy"
          showAction={false}
        />

        <ConfirmDispatchModal
          record={selected}
          onClose={() => setSelected(null)}
          onSuccess={() => { showToast(); refetchPend(); refetchShip(); }}
        />

        {toast && (
          <div className="position-fixed bottom-0 end-0 p-3" style={{ zIndex: 9999 }}>
            <div className="toast show align-items-center text-bg-success border-0">
              <div className="d-flex">
                <div className="toast-body">
                  <i className="ti ti-check me-2" />Despacho confirmado correctamente
                </div>
                <button type="button" className="btn-close btn-close-white me-2 m-auto" onClick={() => setToast(false)} />
              </div>
            </div>
          </div>
        )}

      </div>
    </div>
  );
}
