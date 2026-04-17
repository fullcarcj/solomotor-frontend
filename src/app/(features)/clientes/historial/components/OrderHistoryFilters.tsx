import type { CustomerHistoryFilters } from "@/types/customers";

interface Props {
  filters:  CustomerHistoryFilters;
  onChange: (partial: Partial<CustomerHistoryFilters>) => void;
}

export default function OrderHistoryFilters({ filters, onChange }: Props) {
  const handleReset = () =>
    onChange({ source: "", from: "", to: "", offset: 0 });

  return (
    <div className="card mb-3">
      <div className="card-body py-3">
        <div className="row g-2 align-items-center">
          {/* Canal */}
          <div className="col-md-3">
            <select
              className="form-select"
              value={filters.source}
              onChange={(e) => onChange({ source: e.target.value })}
            >
              <option value="">Todos los canales</option>
              <option value="mercadolibre">MercadoLibre</option>
              <option value="mostrador">Mostrador</option>
            </select>
          </div>

          {/* Desde */}
          <div className="col-md-3">
            <div className="input-group">
              <span className="input-group-text bg-white text-muted small">
                Desde
              </span>
              <input
                type="date"
                className="form-control"
                value={filters.from}
                onChange={(e) => onChange({ from: e.target.value })}
              />
            </div>
          </div>

          {/* Hasta */}
          <div className="col-md-3">
            <div className="input-group">
              <span className="input-group-text bg-white text-muted small">
                Hasta
              </span>
              <input
                type="date"
                className="form-control"
                value={filters.to}
                onChange={(e) => onChange({ to: e.target.value })}
              />
            </div>
          </div>

          {/* Limpiar */}
          <div className="col-auto">
            <button
              type="button"
              className="btn btn-outline-secondary"
              onClick={handleReset}
            >
              <i className="ti ti-x me-1" />
              Limpiar
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
