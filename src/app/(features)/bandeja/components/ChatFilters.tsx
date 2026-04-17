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
    <div className="px-2 py-2 border-bottom">
      <div className="d-flex gap-2">
        <div className="input-group input-group-sm flex-grow-1">
          <span className="input-group-text bg-transparent border-end-0 border-secondary-subtle">
            <i className="ti ti-search text-muted" style={{ fontSize: "0.9rem" }} />
          </span>
          <input
            type="text"
            className="form-control form-control-sm border-start-0 border-secondary-subtle"
            placeholder="Nombre o teléfono…"
            value={filters.search}
            onChange={e => onChange({ search: e.target.value })}
          />
        </div>
        <select
          className="form-select form-select-sm"
          style={{ maxWidth: 140 }}
          value={filters.src}
          onChange={e => onChange({ src: e.target.value })}
        >
          {SOURCES.map(s => <option key={s.value} value={s.value}>{s.label}</option>)}
        </select>
        {isDirty && (
          <button
            className="btn btn-sm btn-outline-secondary"
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
