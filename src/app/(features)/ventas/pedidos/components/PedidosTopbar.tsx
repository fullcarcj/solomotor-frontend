"use client";

import type { ChangeEvent } from "react";
import { useEffect, useState } from "react";
import type { ActiveFilter, PedidosFilterCounts } from "./PedidosFiltersBar";

interface Props {
  search: string;
  onSearch: (v: string) => void;
  onRefetch: () => void;
  isLoading: boolean;
  notificationCount?: number;
  activeFilter: ActiveFilter;
  onFilterChange: (f: ActiveFilter) => void;
  counts: PedidosFilterCounts;
}

const PILLS: [ActiveFilter, string, keyof PedidosFilterCounts][] = [
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

function fmtClock(d: Date): string {
  return d.toLocaleTimeString("es-VE", {
    hour: "2-digit",
    minute: "2-digit",
  });
}

export default function PedidosTopbar({
  search,
  onSearch,
  onRefetch,
  isLoading,
  notificationCount,
  activeFilter,
  onFilterChange,
  counts,
}: Props) {
  const [now, setNow] = useState<Date>(() => new Date());

  useEffect(() => {
    const id = window.setInterval(() => setNow(new Date()), 30_000);
    return () => window.clearInterval(id);
  }, []);

  return (
    <div className="pd-topbar pd-topbar--unified" role="toolbar" aria-label="Pedidos omnicanal">
      <div className="pd-search pd-search--toolbar">
        <svg
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          strokeWidth="2"
          aria-hidden="true"
        >
          <circle cx="11" cy="11" r="7" />
          <path d="m21 21-4.3-4.3" />
        </svg>
        <input
          type="search"
          placeholder="Cliente, SKU, orden…"
          value={search}
          onChange={(e: ChangeEvent<HTMLInputElement>) => onSearch(e.target.value)}
          aria-label="Buscar órdenes"
        />
        <kbd className="pd-search-kbd">⌘K</kbd>
      </div>

      <div className="pd-toolbar-filters">
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
      </div>

      <div className="pd-filter-pills-group">
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
      </div>

      <div className="pd-topbar-actions">
        <button
          type="button"
          className="pd-top-btn"
          title={`Hora local · ${fmtClock(now)}`}
          aria-label={`Hora local ${fmtClock(now)}`}
        >
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" aria-hidden="true">
            <path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2z" />
            <path d="M12 6v6l4 2" />
          </svg>
        </button>

        <button
          type="button"
          className="pd-top-btn"
          aria-label="Notificaciones"
          title="Notificaciones"
        >
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" aria-hidden="true">
            <path d="M18 8A6 6 0 0 0 6 8c0 7-3 9-3 9h18s-3-2-3-9" />
            <path d="M13.73 21a2 2 0 0 1-3.46 0" />
          </svg>
          {notificationCount != null && notificationCount > 0 && (
            <span className="pd-notif-badge">{notificationCount > 99 ? "99+" : notificationCount}</span>
          )}
        </button>

        <button
          className="pd-top-btn"
          onClick={onRefetch}
          aria-label="Refrescar lista de órdenes"
          title="Refrescar"
          disabled={isLoading}
        >
          <i
            className={`ti ti-refresh${isLoading ? " spin" : ""}`}
            style={{ fontSize: 15 }}
            aria-hidden="true"
          />
        </button>

        <button
          className="pd-primary-btn"
          aria-label="Crear nueva orden"
          title="Nueva orden"
          type="button"
        >
          <svg
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="2.5"
            aria-hidden="true"
          >
            <path d="M12 5v14M5 12h14" />
          </svg>
          <span className="btn-label">Nueva orden</span>
        </button>
      </div>
    </div>
  );
}

export type { ActiveFilter, PedidosFilterCounts } from "./PedidosFiltersBar";
