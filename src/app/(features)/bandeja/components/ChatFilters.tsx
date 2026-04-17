"use client";
import type { InboxFilters } from "@/types/inbox";

const SOURCES = [
  { value: "",            label: "Todas las fuentes" },
  { value: "wa",          label: "WhatsApp" },
  { value: "ml_question", label: "ML Preguntas" },
  { value: "ml_message",  label: "ML Mensajes" },
];

interface Props {
  filters:  InboxFilters;
  onChange: (partial: Partial<InboxFilters>) => void;
}

export default function ChatFilters({ filters, onChange }: Props) {
  const isDirty = filters.search || filters.src;
  return (
    <div className="bandeja-wa-filters-block">
      <div className="bandeja-wa-search-row">
        <div className="input-group input-group-sm flex-grow-1">
          <span className="input-group-text border-0">
            <i className="ti ti-search" aria-hidden />
          </span>
          <input
            type="text"
            className="form-control border-0"
            placeholder="Buscar o filtrar por nombre o teléfono…"
            value={filters.search}
            onChange={e => onChange({ search: e.target.value })}
            aria-label="Buscar conversación"
          />
        </div>
      </div>
      <div className="bandeja-wa-source-row">
        <select
          className="form-select form-select-sm flex-grow-1"
          value={filters.src}
          onChange={e => onChange({ src: e.target.value })}
          aria-label="Fuente"
        >
          {SOURCES.map(s => <option key={s.value} value={s.value}>{s.label}</option>)}
        </select>
        {isDirty && (
          <button
            type="button"
            className="btn btn-sm btn-outline-secondary flex-shrink-0"
            onClick={() => onChange({ search: "", src: "" })}
            title="Limpiar filtros"
          >
            <i className="ti ti-x" />
          </button>
        )}
      </div>
    </div>
  );
}
