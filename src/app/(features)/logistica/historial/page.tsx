"use client";

import { useDispatchHistory } from "@/hooks/useDispatch";
import DispatchTable from "../components/DispatchTable";

export default function LogisticaHistorialPage() {
  const { records, pagination, loading, error, filters, setFilters, refetch } =
    useDispatchHistory();

  const handleReset = () =>
    setFilters((f) => ({ ...f, channel: "", from: "", to: "", offset: 0 }));

  return (
    <div className="page-wrapper">
      <div className="content">

        <div className="d-flex align-items-center justify-content-between flex-wrap gap-3 mb-4">
          <div>
            <h1 className="mb-1 custome-heading">Historial de Entregas</h1>
            <p className="text-muted small mb-0">
              {loading ? "Cargando…" : `${pagination.total} despachos completados`}
            </p>
          </div>
        </div>

        {/* Filtros */}
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
              <div className="col-md-3">
                <div className="input-group">
                  <span className="input-group-text bg-white text-muted small">Desde</span>
                  <input type="date" className="form-control" value={filters.from}
                    onChange={(e) => setFilters((f) => ({ ...f, from: e.target.value, offset: 0 }))} />
                </div>
              </div>
              <div className="col-md-3">
                <div className="input-group">
                  <span className="input-group-text bg-white text-muted small">Hasta</span>
                  <input type="date" className="form-control" value={filters.to}
                    onChange={(e) => setFilters((f) => ({ ...f, to: e.target.value, offset: 0 }))} />
                </div>
              </div>
              <div className="col-auto">
                <button type="button" className="btn btn-outline-secondary" onClick={handleReset}>
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
          actionLabel="Ver Detalle"
          onAction={(r) => console.log("Detalle historial:", r)}
          onPageChange={(offset) => setFilters((f) => ({ ...f, offset }))}
          onRetry={refetch}
          emptyMessage="No hay despachos completados en este período"
          showAction={false}
        />

      </div>
    </div>
  );
}
