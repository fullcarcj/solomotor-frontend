"use client";

interface Filters {
  tx_type: string;
  status:  string;
  search:  string;
  from:    string;
  to:      string;
}

interface Props {
  filters:   Filters;
  onChange:  (f: Filters) => void;
  onClear:   () => void;
}

export default function BankStatementFilters({ filters, onChange, onClear }: Props) {
  const set = (key: keyof Filters, value: string) =>
    onChange({ ...filters, [key]: value });

  return (
    <div className="d-flex flex-wrap gap-2 align-items-end mb-3">
      <div>
        <label className="form-label small mb-1">Tipo</label>
        <select
          className="form-select form-select-sm"
          value={filters.tx_type}
          onChange={(e) => set("tx_type", e.target.value)}
          style={{ minWidth: 130 }}
        >
          <option value="">Todos</option>
          <option value="CREDIT">Crédito</option>
          <option value="DEBIT">Débito</option>
        </select>
      </div>

      <div>
        <label className="form-label small mb-1">Estado</label>
        <select
          className="form-select form-select-sm"
          value={filters.status}
          onChange={(e) => set("status", e.target.value)}
          style={{ minWidth: 160 }}
        >
          <option value="">Todos</option>
          <option value="UNMATCHED">Sin conciliar</option>
          <option value="MATCHED">Conciliado</option>
          <option value="MANUAL_REVIEW">Revisión manual</option>
        </select>
      </div>

      <div className="flex-grow-1" style={{ minWidth: 180 }}>
        <label className="form-label small mb-1">Buscar</label>
        <div className="input-group input-group-sm">
          <span className="input-group-text"><i className="ti ti-search" /></span>
          <input
            type="text"
            className="form-control"
            placeholder="Referencia o descripción"
            value={filters.search}
            onChange={(e) => set("search", e.target.value)}
          />
        </div>
      </div>

      <div>
        <label className="form-label small mb-1">Desde</label>
        <input
          type="date"
          className="form-control form-control-sm"
          value={filters.from}
          onChange={(e) => set("from", e.target.value)}
        />
      </div>

      <div>
        <label className="form-label small mb-1">Hasta</label>
        <input
          type="date"
          className="form-control form-control-sm"
          value={filters.to}
          onChange={(e) => set("to", e.target.value)}
        />
      </div>

      <div>
        <button
          type="button"
          className="btn btn-outline-secondary btn-sm"
          onClick={onClear}
        >
          <i className="ti ti-x me-1" />
          Limpiar
        </button>
      </div>
    </div>
  );
}
