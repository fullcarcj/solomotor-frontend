"use client";

import type { Dispatch, SetStateAction } from "react";
import type { QuotationFilters as QF } from "@/hooks/useQuotations";

export default function QuotationFilters({
  filters,
  onChange,
}: {
  filters: QF;
  onChange: Dispatch<SetStateAction<QF>>;
}) {
  const limit = filters.limit ?? 50;

  const clear = () => {
    onChange({ limit, offset: 0 });
  };

  return (
    <div className="card mb-4">
      <div className="card-body py-3">
        <div className="row g-2 align-items-end flex-wrap">
          <div className="col-12 col-lg-3">
            <label className="form-label small text-muted mb-1">
              Buscar referencia o cliente
            </label>
            <div className="input-group input-group-sm">
              <span className="input-group-text" aria-hidden>
                🔍
              </span>
              <input
                type="search"
                className="form-control"
                placeholder="Referencia o cliente…"
                value={filters.search ?? ""}
                onChange={(e) =>
                  onChange((f) => ({
                    ...f,
                    search: e.target.value || undefined,
                    offset: 0,
                  }))
                }
                autoComplete="off"
              />
            </div>
          </div>
          <div className="col-12 col-md-4 col-lg-2">
            <label className="form-label small text-muted mb-1">Estado</label>
            <select
              className="form-select form-select-sm"
              value={filters.status ?? ""}
              onChange={(e) =>
                onChange((f) => ({
                  ...f,
                  status: e.target.value || undefined,
                  offset: 0,
                }))
              }
            >
              <option value="">Todos</option>
              <option value="draft">Borrador</option>
              <option value="sent">Enviada</option>
            </select>
          </div>
          <div className="col-12 col-md-4 col-lg-2">
            <label className="form-label small text-muted mb-1">Desde</label>
            <input
              type="date"
              className="form-control form-control-sm"
              value={filters.fecha_desde ?? ""}
              onChange={(e) =>
                onChange((f) => ({
                  ...f,
                  fecha_desde: e.target.value || undefined,
                  offset: 0,
                }))
              }
            />
          </div>
          <div className="col-12 col-md-4 col-lg-2">
            <label className="form-label small text-muted mb-1">Hasta</label>
            <input
              type="date"
              className="form-control form-control-sm"
              value={filters.fecha_hasta ?? ""}
              onChange={(e) =>
                onChange((f) => ({
                  ...f,
                  fecha_hasta: e.target.value || undefined,
                  offset: 0,
                }))
              }
            />
          </div>
          <div className="col-12 col-lg-3 text-lg-end">
            <button
              type="button"
              className="btn btn-outline-secondary btn-sm"
              onClick={clear}
            >
              Limpiar
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
