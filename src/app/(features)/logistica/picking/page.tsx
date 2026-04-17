"use client";

import { useState } from "react";
import { useDispatchPending } from "@/hooks/useDispatch";
import type { DispatchRecord } from "@/types/dispatch";
import DispatchTable from "../components/DispatchTable";
import ConfirmDispatchModal from "../components/ConfirmDispatchModal";

export default function LogisticaPickingPage() {
  const { records, pagination, loading, error, filters, setFilters, refetch } =
    useDispatchPending(30_000);
  const [selected, setSelected] = useState<DispatchRecord | null>(null);
  const [toast, setToast]       = useState(false);

  const showToast = () => { setToast(true); setTimeout(() => setToast(false), 3000); };

  return (
    <div className="page-wrapper">
      <div className="content">

        {/* Header */}
        <div className="d-flex align-items-center justify-content-between flex-wrap gap-3 mb-4">
          <div>
            <h1 className="mb-1 custome-heading">Cola de Picking</h1>
            <p className="text-muted small mb-0">
              {loading ? "Cargando…" : `${pagination.total} despacho(s) pendiente(s)`}
              <span className="ms-2 badge badge-live">● Auto-refresh 30s</span>
            </p>
          </div>
          <button type="button" className="btn btn-outline-secondary btn-sm" onClick={refetch}>
            <i className="ti ti-refresh me-1" />Actualizar
          </button>
        </div>

        {/* Filtro canal */}
        <div className="card mb-3">
          <div className="card-body py-3">
            <div className="row g-2 align-items-center">
              <div className="col-md-3">
                <select className="form-select" value={filters.channel}
                  onChange={(e) => setFilters((f) => ({ ...f, channel: e.target.value, offset: 0 }))}>
                  <option value="">Todos los canales</option>
                  <option value="mostrador">Mostrador</option>
                  <option value="mercadolibre">MercadoLibre</option>
                  <option value="whatsapp">WhatsApp</option>
                  <option value="social_media">Redes Sociales</option>
                  <option value="ecommerce">E-commerce</option>
                </select>
              </div>
              <div className="col-auto">
                <button type="button" className="btn btn-outline-secondary"
                  onClick={() => setFilters((f) => ({ ...f, channel: "", offset: 0 }))}>
                  <i className="ti ti-x me-1" />Limpiar
                </button>
              </div>
            </div>
          </div>
        </div>

        <DispatchTable
          records={records}
          pagination={pagination}
          loading={loading}
          error={error}
          actionLabel="Confirmar Despacho"
          onAction={(r) => setSelected(r)}
          onPageChange={(offset) => setFilters((f) => ({ ...f, offset }))}
          onRetry={refetch}
          emptyMessage="No hay despachos pendientes en este momento"
        />

        <ConfirmDispatchModal
          record={selected}
          onClose={() => setSelected(null)}
          onSuccess={() => { showToast(); refetch(); }}
        />

        {/* Toast */}
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
