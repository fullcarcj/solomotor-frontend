"use client";

import { useSearchParams } from "next/navigation";
import { useEffect, useRef, useState } from "react";
import type { Customer, CustomerHistoryFilters } from "@/types/customers";
import { useCustomerHistory } from "@/hooks/useCustomerHistory";
import OrderHistoryFilters from "./components/OrderHistoryFilters";
import OrderHistoryTable from "./components/OrderHistoryTable";

/* ── Helpers ─────────────────────────────────────────────────────────────── */

function initials(name: string): string {
  const parts = name.trim().split(/\s+/);
  if (parts.length >= 2) return (parts[0][0] + parts[1][0]).toUpperCase();
  return name.slice(0, 2).toUpperCase();
}

function parseCustomers(json: unknown): Customer[] {
  if (!json || typeof json !== "object") return [];
  const o = json as Record<string, unknown>;
  const raw = o.data ?? o;
  if (Array.isArray(raw)) return raw as Customer[];
  if (Array.isArray((raw as Record<string, unknown>)?.customers))
    return (raw as Record<string, unknown>).customers as Customer[];
  return [];
}

function parseCustomerOne(json: unknown): Customer | null {
  if (!json || typeof json !== "object") return null;
  const o = json as Record<string, unknown>;
  const raw = (o.data as Record<string, unknown>) ?? o;
  if (typeof raw.id === "number" && typeof raw.full_name === "string")
    return raw as Customer;
  return null;
}

/* ── Buscador de cliente ─────────────────────────────────────────────────── */

function CustomerSearchPanel({
  onSelect,
}: {
  onSelect: (c: Customer) => void;
}) {
  const [query, setQuery]       = useState("");
  const [results, setResults]   = useState<Customer[]>([]);
  const [searching, setSearching] = useState(false);
  const [open, setOpen]         = useState(false);
  const debounceRef             = useRef<ReturnType<typeof setTimeout> | null>(null);
  const wrapperRef              = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (query.trim().length < 2) { setResults([]); setOpen(false); return; }
    if (debounceRef.current) clearTimeout(debounceRef.current);
    debounceRef.current = setTimeout(async () => {
      setSearching(true);
      try {
        const res = await fetch(
          `/api/clientes/directorio?search=${encodeURIComponent(query)}&limit=10`,
          { credentials: "include", cache: "no-store" }
        );
        const json: unknown = await res.json().catch(() => ({}));
        const list = parseCustomers(json);
        setResults(list);
        setOpen(list.length > 0);
      } catch {
        /* silencioso */
      } finally {
        setSearching(false);
      }
    }, 300);
  }, [query]);

  /* Cerrar dropdown al click fuera */
  useEffect(() => {
    const handler = (e: MouseEvent) => {
      if (wrapperRef.current && !wrapperRef.current.contains(e.target as Node)) {
        setOpen(false);
      }
    };
    document.addEventListener("mousedown", handler);
    return () => document.removeEventListener("mousedown", handler);
  }, []);

  const handleSelect = (c: Customer) => {
    setQuery("");
    setResults([]);
    setOpen(false);
    onSelect(c);
  };

  return (
    <div
      className="d-flex flex-column align-items-center justify-content-center"
      style={{ minHeight: "55vh" }}
    >
      <div className="text-center mb-4">
        <i className="ti ti-users-group fs-1 text-primary opacity-75 d-block mb-2" />
        <h4 className="fw-semibold mb-1">Historial de Compras</h4>
        <p className="text-muted">
          Busca un cliente para ver su historial de compras
        </p>
      </div>

      <div ref={wrapperRef} className="position-relative" style={{ width: "100%", maxWidth: 480 }}>
        <div className="input-group input-group-lg shadow-sm">
          <span className="input-group-text bg-white">
            {searching ? (
              <span className="spinner-border spinner-border-sm text-muted" />
            ) : (
              <i className="ti ti-search text-muted" />
            )}
          </span>
          <input
            type="text"
            className="form-control"
            placeholder="Nombre del cliente…"
            value={query}
            autoFocus
            onChange={(e) => setQuery(e.target.value)}
            onFocus={() => results.length > 0 && setOpen(true)}
          />
        </div>

        {open && results.length > 0 && (
          <ul
            className="list-group shadow position-absolute w-100 mt-1"
            style={{ zIndex: 9999 }}
          >
            {results.map((c) => (
              <li
                key={c.id}
                className="list-group-item list-group-item-action d-flex align-items-center gap-3 py-2"
                style={{ cursor: "pointer" }}
                onMouseDown={() => handleSelect(c)}
              >
                <div
                  className="rounded-circle bg-primary d-flex align-items-center justify-content-center text-white fw-bold flex-shrink-0"
                  style={{ width: 36, height: 36, fontSize: 13 }}
                >
                  {initials(c.full_name)}
                </div>
                <div className="flex-fill overflow-hidden">
                  <p className="mb-0 fw-semibold text-truncate">{c.full_name}</p>
                  <p className="mb-0 text-muted small">
                    {c.phone ?? c.email ?? `ID ${c.id}`}
                  </p>
                </div>
                <span className="badge bg-light text-dark border small">
                  {c.total_orders} órdenes
                </span>
              </li>
            ))}
          </ul>
        )}
      </div>
    </div>
  );
}

/* ── Badge tipo cliente ──────────────────────────────────────────────────── */

function TypeBadge({ type }: { type: string | null }) {
  const map: Record<string, { bg: string; label: string }> = {
    mostrador:    { bg: "primary",           label: "Mostrador" },
    mercadolibre: { bg: "warning text-dark", label: "ML"        },
    cartera:      { bg: "success",           label: "Cartera"   },
    online:       { bg: "dark",              label: "Online"    },
  };
  if (!type) return null;
  const cfg = map[type.toLowerCase()];
  if (!cfg) return null;
  return <span className={`badge rounded-pill bg-${cfg.bg} ms-1`}>{cfg.label}</span>;
}

function StatusBadge({ status }: { status: string | null }) {
  const map: Record<string, { bg: string; label: string }> = {
    active:   { bg: "success",        label: "Activo"    },
    lead:     { bg: "info text-dark", label: "Lead"      },
    inactive: { bg: "secondary",      label: "Inactivo"  },
    blocked:  { bg: "danger",         label: "Bloqueado" },
  };
  if (!status) return <span className="badge bg-light text-dark border">—</span>;
  const cfg = map[status.toLowerCase()];
  if (!cfg) return <span className="badge bg-secondary">{status}</span>;
  return <span className={`badge bg-${cfg.bg}`}>{cfg.label}</span>;
}

/* ── Header del cliente seleccionado ─────────────────────────────────────── */

function CustomerHeader({
  customer,
  onChangeCustomer,
}: {
  customer: Customer;
  onChangeCustomer: () => void;
}) {
  return (
    <div className="card mb-3">
      <div className="card-body d-flex align-items-center gap-3 py-3 flex-wrap">
        {/* Avatar */}
        <div
          className="rounded-circle bg-primary d-flex align-items-center justify-content-center text-white fw-bold flex-shrink-0"
          style={{ width: 52, height: 52, fontSize: 20 }}
        >
          {initials(customer.full_name)}
        </div>

        {/* Info */}
        <div className="flex-fill">
          <div className="d-flex align-items-center gap-2 flex-wrap">
            <h5 className="mb-0 fw-bold">{customer.full_name}</h5>
            <TypeBadge type={customer.customer_type} />
            <StatusBadge status={customer.crm_status} />
          </div>
          <div className="d-flex gap-3 flex-wrap mt-1">
            {customer.phone && (
              <span className="small text-muted">
                <i className="ti ti-phone me-1" />
                {customer.phone}
              </span>
            )}
            {customer.email && (
              <span className="small text-muted">
                <i className="ti ti-mail me-1" />
                {customer.email}
              </span>
            )}
            <span className="small text-muted">
              <i className="ti ti-shopping-bag me-1" />
              {customer.total_orders} órdenes registradas
            </span>
          </div>
        </div>

        {/* Botón cambiar */}
        <button
          type="button"
          className="btn btn-outline-secondary btn-sm flex-shrink-0"
          onClick={onChangeCustomer}
        >
          <i className="ti ti-arrows-exchange me-1" />
          Cambiar cliente
        </button>
      </div>
    </div>
  );
}

/* ── Página principal ─────────────────────────────────────────────────────── */

export default function ClientesHistorialPage() {
  const searchParams = useSearchParams();
  const [selectedCustomer, setSelectedCustomer] = useState<Customer | null>(null);

  const idFromUrl = searchParams.get("id");

  useEffect(() => {
    if (!idFromUrl) return;
    const id = Number(idFromUrl);
    if (!Number.isFinite(id) || id <= 0) return;
    let cancelled = false;
    fetch(`/api/clientes/directorio/${id}`, { credentials: "include", cache: "no-store" })
      .then((r) => r.json().then((j) => ({ r, j })))
      .then(({ r, j }) => {
        if (cancelled || !r.ok) return;
        const c = parseCustomerOne(j);
        if (c) setSelectedCustomer(c);
      })
      .catch(() => {});
    return () => {
      cancelled = true;
    };
  }, [idFromUrl]);

  const { orders, pagination, loading, error, filters, setFilters, refetch } =
    useCustomerHistory(selectedCustomer?.id ?? null);

  const handleFilterChange = (partial: Partial<CustomerHistoryFilters>) => {
    setFilters(partial);
  };

  return (
    <div className="page-wrapper">
      <div className="content">

        {/* ── Header de página ─────────────────────────────────────── */}
        <div className="d-flex align-items-center justify-content-between flex-wrap gap-3 mb-4">
          <div>
            <h1 className="mb-1 custome-heading">Historial de Compras</h1>
            <p className="text-muted small mb-0">
              Consulta de compras por cliente — ML + Mostrador
            </p>
          </div>
        </div>

        {/* ── Estado A: Sin cliente ─────────────────────────────────── */}
        {!selectedCustomer && (
          <CustomerSearchPanel onSelect={setSelectedCustomer} />
        )}

        {/* ── Estado B: Cliente seleccionado ───────────────────────── */}
        {selectedCustomer && (
          <>
            <CustomerHeader
              customer={selectedCustomer}
              onChangeCustomer={() => setSelectedCustomer(null)}
            />

            <OrderHistoryFilters
              filters={filters}
              onChange={handleFilterChange}
            />

            <OrderHistoryTable
              orders={orders}
              pagination={pagination}
              loading={loading}
              error={error}
              onPageChange={(offset) => setFilters({ offset })}
              onRetry={refetch}
            />

            <p className="text-muted small mt-3">
              <i className="ti ti-info-circle me-1" />
              Solo incluye compras de MercadoLibre y Mostrador.
              Las ventas POS recientes se integrarán próximamente.
            </p>
          </>
        )}

      </div>
    </div>
  );
}
