"use client";

export interface ListingsFiltersState {
  q:          string;
  status:     string;
  zero_stock: boolean;
  limit:      number;
  offset:     number;
}

const STATUSES = [
  { value: "",         label: "Todos los estados" },
  { value: "active",   label: "Activo" },
  { value: "paused",   label: "Pausado" },
  { value: "closed",   label: "Cerrado" },
  { value: "under_review", label: "En revisión" },
];

interface Props {
  filters:  ListingsFiltersState;
  onChange: (partial: Partial<ListingsFiltersState>) => void;
}

export default function MlListingsFilters({ filters, onChange }: Props) {
  const isDirty = filters.q || filters.status || filters.zero_stock;
  return (
    <div className="card mb-3">
      <div className="card-body py-2">
        <div className="d-flex flex-wrap gap-2 align-items-center">
          <div className="input-group" style={{ maxWidth: 260 }}>
            <span className="input-group-text bg-transparent border-end-0">
              <i className="ti ti-search text-muted" />
            </span>
            <input
              type="text"
              className="form-control border-start-0"
              placeholder="Buscar título…"
              value={filters.q}
              onChange={e => onChange({ q: e.target.value, offset: 0 })}
            />
          </div>
          <select
            className="form-select"
            style={{ maxWidth: 170 }}
            value={filters.status}
            onChange={e => onChange({ status: e.target.value, offset: 0 })}
          >
            {STATUSES.map(s => <option key={s.value} value={s.value}>{s.label}</option>)}
          </select>
          <div className="form-check mb-0">
            <input
              type="checkbox"
              className="form-check-input"
              id="zeroStock"
              checked={filters.zero_stock}
              onChange={e => onChange({ zero_stock: e.target.checked, offset: 0 })}
            />
            <label className="form-check-label" htmlFor="zeroStock">Solo sin stock</label>
          </div>
          {isDirty && (
            <button className="btn btn-sm btn-outline-secondary" onClick={() => onChange({ q: "", status: "", zero_stock: false, offset: 0 })}>
              <i className="ti ti-x me-1" />Limpiar
            </button>
          )}
        </div>
      </div>
    </div>
  );
}
