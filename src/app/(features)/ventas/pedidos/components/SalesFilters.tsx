"use client";

import type { Dispatch, SetStateAction } from "react";
import type { SalesFilters as SF } from "@/hooks/useSales";

const STATUS_OPTS = [
  { value: "", label: "Todos" },
  { value: "pending", label: "Pendiente" },
  { value: "pending_payment", label: "Pago pendiente" },
  { value: "paid", label: "Pagado" },
  { value: "cancelled", label: "Cancelado" },
  { value: "shipped", label: "Enviado" },
  { value: "completed", label: "Completado" },
];

const SOURCE_OPTS = [
  { value: "", label: "Todos" },
  { value: "mostrador", label: "Mostrador" },
  { value: "mercadolibre", label: "MercadoLibre" },
  { value: "social_media", label: "Redes" },
  { value: "ecommerce", label: "E-commerce" },
  { value: "fuerza_ventas", label: "Fuerza Ventas" },
];

export default function SalesFilters({
  filters,
  onChange,
}: {
  filters: SF;
  onChange: Dispatch<SetStateAction<SF>>;
}) {
  const limit = filters.limit ?? 50;

  const clear = () => {
    onChange({ limit, offset: 0 });
  };

  return (
    <div className="card mb-4">
      <div className="card-body py-3">
        <div className="row g-2 align-items-end flex-wrap">
          <div className="col-12 col-md-6 col-lg-2">
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
              {STATUS_OPTS.map((o) => (
                <option key={o.value} value={o.value}>
                  {o.label}
                </option>
              ))}
            </select>
          </div>

          <div className="col-12 col-md-6 col-lg-2">
            <label className="form-label small text-muted mb-1">Canal</label>
            <select
              className="form-select form-select-sm"
              value={filters.source ?? ""}
              onChange={(e) =>
                onChange((f) => ({
                  ...f,
                  source: e.target.value || undefined,
                  offset: 0,
                }))
              }
            >
              {SOURCE_OPTS.map((o) => (
                <option key={o.value} value={o.value}>
                  {o.label}
                </option>
              ))}
            </select>
          </div>

          <div className="col-12 col-md-6 col-lg-2">
            <label className="form-label small text-muted mb-1">Desde</label>
            <input
              type="date"
              className="form-control form-control-sm"
              value={filters.from ?? ""}
              onChange={(e) =>
                onChange((f) => ({
                  ...f,
                  from: e.target.value || undefined,
                  offset: 0,
                }))
              }
            />
          </div>

          <div className="col-12 col-md-6 col-lg-2">
            <label className="form-label small text-muted mb-1">Hasta</label>
            <input
              type="date"
              className="form-control form-control-sm"
              value={filters.to ?? ""}
              onChange={(e) =>
                onChange((f) => ({
                  ...f,
                  to: e.target.value || undefined,
                  offset: 0,
                }))
              }
            />
          </div>

          <div className="col-12 col-md-6 col-lg-3">
            <div className="form-check mt-3 mt-lg-4">
              <input
                id="inc-completed"
                type="checkbox"
                className="form-check-input"
                checked={filters.include_completed === true}
                onChange={(e) =>
                  onChange((f) => ({
                    ...f,
                    include_completed: e.target.checked || undefined,
                    offset: 0,
                  }))
                }
              />
              <label
                className="form-check-label small"
                htmlFor="inc-completed"
              >
                Incluir completadas ML
              </label>
            </div>
          </div>

          <div className="col-12 col-lg-1 text-lg-end">
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
