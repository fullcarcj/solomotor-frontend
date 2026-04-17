"use client";

import { useState } from "react";
import { useCustomers } from "@/hooks/useCustomers";
import CustomerFilters from "./components/CustomerFilters";
import CustomerTable from "./components/CustomerTable";
import CustomerDetailModal from "./components/CustomerDetailModal";
import type { CustomerFilters as TCustomerFilters } from "@/types/customers";

export default function ClientesDirectorioPage() {
  const { customers, meta, loading, error, filters, setFilters, refetch } =
    useCustomers();
  const [selectedId, setSelectedId] = useState<number | null>(null);

  const handleFilterChange = (partial: Partial<TCustomerFilters>) => {
    setFilters((prev) => ({ ...prev, ...partial }));
  };

  return (
    <div className="page-wrapper">
      <div className="content">

        {/* ── Header ──────────────────────────────────────────────── */}
        <div className="d-flex align-items-center justify-content-between flex-wrap gap-3 mb-4">
          <div>
            <h1 className="mb-1 custome-heading">Directorio de Clientes</h1>
            <p className="text-muted small mb-0">
              {loading
                ? "Cargando…"
                : `${meta.total.toLocaleString("es-VE")} clientes registrados`}
            </p>
          </div>
        </div>

        {/* ── Filtros ─────────────────────────────────────────────── */}
        <CustomerFilters filters={filters} onChange={handleFilterChange} />

        {/* ── Tabla ───────────────────────────────────────────────── */}
        <CustomerTable
          customers={customers}
          meta={meta}
          loading={loading}
          error={error}
          onRowClick={(id) => setSelectedId(id)}
          onPageChange={(offset) => handleFilterChange({ offset })}
          onRetry={refetch}
        />

        {/* ── Modal de detalle ────────────────────────────────────── */}
        <CustomerDetailModal
          customerId={selectedId}
          onClose={() => setSelectedId(null)}
        />

      </div>
    </div>
  );
}
