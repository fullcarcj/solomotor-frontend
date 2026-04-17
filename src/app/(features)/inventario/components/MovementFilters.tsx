"use client";
import type { MovementFiltersState } from "@/types/wms";

const REASONS = [
  { value: "", label: "Todas las razones" },
  { value: "PURCHASE_RECEIPT", label: "Compra" },
  { value: "SALE_DISPATCH",    label: "Despacho" },
  { value: "ADJUSTMENT",       label: "Ajuste" },
  { value: "RESERVATION",      label: "Reserva" },
  { value: "COMMITMENT",       label: "Compromiso" },
  { value: "RELEASE",          label: "Liberación" },
  { value: "TRANSFER",         label: "Transferencia" },
  { value: "INVENTORY_COUNT",  label: "Conteo físico" },
  { value: "RETURN",           label: "Devolución" },
];

interface Props {
  filters:  MovementFiltersState;
  onChange: (f: Partial<MovementFiltersState>) => void;
}

export default function MovementFilters({ filters, onChange }: Props) {
  const isDirty = filters.sku || filters.reason || filters.from || filters.to;

  return (
    <div className="card mb-3">
      <div className="card-body py-2">
        <div className="d-flex flex-wrap gap-2 align-items-center">
          {/* SKU search */}
          <div className="input-group" style={{ maxWidth: 220 }}>
            <span className="input-group-text bg-transparent border-end-0">
              <i className="ti ti-search text-muted" />
            </span>
            <input
              type="text"
              className="form-control border-start-0"
              placeholder="Filtrar por SKU…"
              value={filters.sku}
              onChange={e => onChange({ sku: e.target.value, offset: 0 })}
            />
          </div>

          {/* Reason */}
          <select
            className="form-select"
            style={{ maxWidth: 180 }}
            value={filters.reason}
            onChange={e => onChange({ reason: e.target.value, offset: 0 })}
          >
            {REASONS.map(r => <option key={r.value} value={r.value}>{r.label}</option>)}
          </select>

          {/* From */}
          <div className="d-flex align-items-center gap-1">
            <label className="form-label mb-0 text-nowrap small">Desde</label>
            <input
              type="date"
              className="form-control form-control-sm"
              style={{ width: 140 }}
              value={filters.from}
              onChange={e => onChange({ from: e.target.value, offset: 0 })}
            />
          </div>

          {/* To */}
          <div className="d-flex align-items-center gap-1">
            <label className="form-label mb-0 text-nowrap small">Hasta</label>
            <input
              type="date"
              className="form-control form-control-sm"
              style={{ width: 140 }}
              value={filters.to}
              onChange={e => onChange({ to: e.target.value, offset: 0 })}
            />
          </div>

          {isDirty && (
            <button
              className="btn btn-sm btn-outline-secondary"
              onClick={() => onChange({ sku: "", reason: "", from: "", to: "", offset: 0 })}
            >
              <i className="ti ti-x me-1" />Limpiar
            </button>
          )}
        </div>
      </div>
    </div>
  );
}
