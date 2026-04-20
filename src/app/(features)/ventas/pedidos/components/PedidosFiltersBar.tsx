"use client";

export type ActiveFilter = "all" | "pending" | "in_progress" | "closed";

interface Counts {
  all: number;
  pending: number;
  inProgress: number;
  closed: number;
}

interface Sla {
  hot: number;
  warn: number;
  cold: number;
}

interface Props {
  activeFilter: ActiveFilter;
  onFilterChange: (f: ActiveFilter) => void;
  counts: Counts;
  sla: Sla;
}

const PILLS: [ActiveFilter, string, keyof Counts][] = [
  ["all", "Todas", "all"],
  ["pending", "Pendientes", "pending"],
  ["in_progress", "En proceso", "inProgress"],
  ["closed", "Cerradas", "closed"],
];

const CalendarIcon = () => (
  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" aria-hidden="true">
    <rect x="3" y="4" width="18" height="18" rx="2" />
    <path d="M16 2v4M8 2v4M3 10h18" />
  </svg>
);

const FilterIcon = () => (
  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" aria-hidden="true">
    <path d="M22 3H2l8 9.46V19l4 2v-8.54L22 3z" />
  </svg>
);

export default function PedidosFiltersBar({
  activeFilter,
  onFilterChange,
  counts,
  sla,
}: Props) {
  return (
    <div className="pd-filters-bar" role="toolbar" aria-label="Filtros de órdenes">
      {PILLS.map(([key, label, countKey]) => (
        <button
          key={key}
          className={`pd-filter-pill${activeFilter === key ? " active" : ""}`}
          onClick={() => onFilterChange(key)}
          aria-pressed={activeFilter === key}
          type="button"
        >
          {label}
          <span className="pd-filter-cnt">{counts[countKey]}</span>
        </button>
      ))}

      <span className="pd-filter-sep" aria-hidden="true" />

      <button
        type="button"
        className="pd-filter-pill pd-filter-pill--soon"
        title="Próximamente: rango de fechas"
        onClick={(e) => e.preventDefault()}
        aria-disabled="true"
      >
        <CalendarIcon />
        Últimos 7 días
      </button>

      <button
        type="button"
        className="pd-filter-pill pd-filter-pill--soon"
        title="Próximamente: filtros avanzados"
        onClick={(e) => e.preventDefault()}
        aria-disabled="true"
      >
        <FilterIcon />
        Filtros avanzados
      </button>

      <div className="pd-filters-sla">
        <div className="pd-sla-chips" aria-label="SLA de órdenes activas">
          <div className="pd-sla-chip hot" title="Órdenes con SLA vencido">
            <span className="sla-dot" aria-hidden="true" />
            <span>Vencidos</span>
            <span className="sla-n">{sla.hot}</span>
          </div>
          <div className="pd-sla-chip warn" title="Órdenes próximas a vencer">
            <span className="sla-dot" aria-hidden="true" />
            <span>Por vencer</span>
            <span className="sla-n">{sla.warn}</span>
          </div>
          <div className="pd-sla-chip cold" title="Órdenes a tiempo">
            <span className="sla-dot" aria-hidden="true" />
            <span>A tiempo</span>
            <span className="sla-n">{sla.cold}</span>
          </div>
        </div>
      </div>
    </div>
  );
}
