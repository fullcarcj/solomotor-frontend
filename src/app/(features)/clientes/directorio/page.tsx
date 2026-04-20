"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import "./directorio-crm.scss";
import { useCustomers } from "@/hooks/useCustomers";
import CustomerTable from "./components/CustomerTable";
import CustomerDetailModal from "./components/CustomerDetailModal";
import type { CustomerFilters as TCustomerFilters } from "@/types/customers";
import {
  customerMatchesSource,
  type DirectorioSource,
} from "./directorioChannel";

const SOURCE_BTNS: {
  id: DirectorioSource;
  abbr: string;
  title: string;
  cls: string;
}[] = [
  { id: "all", abbr: "∗", title: "Todos los orígenes", cls: "" },
  { id: "wa", abbr: "WA", title: "WhatsApp", cls: "crm-dir-src-btn--wa" },
  { id: "ml", abbr: "ML", title: "Mercado Libre", cls: "crm-dir-src-btn--ml" },
  { id: "ecom", abbr: "EC", title: "E-commerce", cls: "crm-dir-src-btn--ecom" },
  { id: "mostrador", abbr: "MO", title: "Mostrador", cls: "crm-dir-src-btn--mostrador" },
  { id: "fuerza", abbr: "FV", title: "Fuerza de ventas", cls: "crm-dir-src-btn--fuerza" },
];

export default function ClientesDirectorioPage() {
  const { customers, meta, loading, error, filters, setFilters, refetch } =
    useCustomers();
  const [selectedId, setSelectedId] = useState<number | null>(null);
  const [source, setSource] = useState<DirectorioSource>("all");
  const [requireOrders, setRequireOrders] = useState(false);
  const searchRef = useRef<HTMLInputElement>(null);

  const handleFilterChange = useCallback(
    (partial: Partial<TCustomerFilters>) => {
      setFilters((prev) => ({ ...prev, ...partial }));
    },
    [setFilters]
  );

  const displayed = useMemo(() => {
    let rows = customers.filter((c) => customerMatchesSource(c, source));
    if (requireOrders) rows = rows.filter((c) => (c.total_orders ?? 0) > 0);
    return rows;
  }, [customers, source, requireOrders]);

  const countOnPage = useCallback(
    (s: DirectorioSource) =>
      customers.filter((c) => customerMatchesSource(c, s)).length,
    [customers]
  );

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key.toLowerCase() === "k") {
        e.preventDefault();
        searchRef.current?.focus();
      }
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, []);

  const isClientFiltered = source !== "all" || requireOrders;

  const statusPills: {
    key: string;
    label: string;
    active: boolean;
    onClick: () => void;
  }[] = [
    {
      key: "all",
      label: "Todos",
      active: filters.status === "" && !requireOrders,
      onClick: () => {
        setRequireOrders(false);
        handleFilterChange({ status: "", offset: 0 });
      },
    },
    {
      key: "active",
      label: "Activos",
      active: filters.status === "active",
      onClick: () => {
        setRequireOrders(false);
        handleFilterChange({ status: "active", offset: 0 });
      },
    },
    {
      key: "lead",
      label: "Leads",
      active: filters.status === "lead",
      onClick: () => {
        setRequireOrders(false);
        handleFilterChange({ status: "lead", offset: 0 });
      },
    },
    {
      key: "inactive",
      label: "Inactivos",
      active: filters.status === "inactive",
      onClick: () => {
        setRequireOrders(false);
        handleFilterChange({ status: "inactive", offset: 0 });
      },
    },
    {
      key: "blocked",
      label: "Bloqueados",
      active: filters.status === "blocked",
      onClick: () => {
        setRequireOrders(false);
        handleFilterChange({ status: "blocked", offset: 0 });
      },
    },
    {
      key: "orders",
      label: "Con órdenes",
      active: requireOrders,
      onClick: () => {
        setRequireOrders((v) => !v);
        handleFilterChange({ offset: 0 });
      },
    },
  ];

  return (
    <div className="page-wrapper">
      <div className="content p-0">
        <div className="crm-directorio">
          <div className="crm-dir-grid">
            <aside className="crm-dir-source" aria-label="Filtrar por origen">
              <span className="crm-dir-source-label">Origen</span>
              {SOURCE_BTNS.map((b) => {
                const active = source === b.id;
                const count =
                  b.id === "all"
                    ? meta.total
                    : countOnPage(b.id);
                return (
                  <button
                    key={b.id}
                    type="button"
                    title={b.title}
                    className={`crm-dir-src-btn ${b.cls}${active ? " active" : ""}`}
                    onClick={() => {
                      setSource(b.id);
                      handleFilterChange({ offset: 0 });
                    }}
                  >
                    {b.abbr}
                    <span className="crm-dir-src-count">
                      {b.id === "all"
                        ? meta.total.toLocaleString("es-VE")
                        : count}
                    </span>
                  </button>
                );
              })}
            </aside>

            <div className="crm-dir-main">
              <div className="crm-dir-topbar">
                <h2>
                  Clientes
                  <span className="crm-dir-total">
                    · {loading ? "…" : `${meta.total.toLocaleString("es-VE")} totales`}
                  </span>
                </h2>
                <div className="crm-dir-search">
                  <span aria-hidden>⌕</span>
                  <input
                    ref={searchRef}
                    type="search"
                    placeholder="Buscar por nombre, teléfono, email…"
                    value={filters.search}
                    onChange={(e) =>
                      handleFilterChange({ search: e.target.value, offset: 0 })
                    }
                    aria-label="Buscar clientes"
                  />
                  <span className="crm-dir-kbd">⌘K</span>
                </div>
                <div className="crm-dir-actions">
                  <button
                    type="button"
                    className="crm-dir-btn crm-dir-btn--ghost"
                    title="Próximamente"
                    disabled
                  >
                    Exportar
                  </button>
                  <button
                    type="button"
                    className="crm-dir-btn crm-dir-btn--primary"
                    title="Próximamente"
                    disabled
                  >
                    + Nuevo
                  </button>
                </div>
              </div>

              {isClientFiltered && (
                <div
                  className="px-4 py-2 small"
                  style={{
                    borderBottom: "1px solid var(--crm-border-soft, #1a2236)",
                    color: "var(--crm-text-lo, #5e6a82)",
                    fontFamily: "var(--crm-mono, monospace)",
                    fontSize: 11,
                  }}
                >
                  Filtro por origen u órdenes se aplica sobre la página actual de
                  resultados. Para paginar, usá &quot;Todos&quot; en origen.
                </div>
              )}

              <div className="crm-dir-filter-row">
                <span className="crm-dir-filter-label">Filtros:</span>
                {statusPills.map((p) => (
                  <button
                    key={p.key}
                    type="button"
                    className={`crm-dir-pill${p.active ? " active" : ""}`}
                    onClick={p.onClick}
                  >
                    <span className="dot" />
                    {p.label}
                  </button>
                ))}
              </div>

              <CustomerTable
                customers={displayed}
                meta={meta}
                loading={loading}
                error={error}
                onRowClick={(id) => setSelectedId(id)}
                onPageChange={(offset) => handleFilterChange({ offset })}
                onRetry={refetch}
                showPagination={!isClientFiltered}
              />
            </div>
          </div>
        </div>

        <CustomerDetailModal
          customerId={selectedId}
          onClose={() => setSelectedId(null)}
        />
      </div>
    </div>
  );
}
