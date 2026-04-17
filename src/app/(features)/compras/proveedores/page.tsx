"use client";
import { useState } from "react";
import type { Supplier } from "@/types/compras";
import SupplierTable from "../components/SupplierTable";
import SupplierModal from "../components/SupplierModal";
import { useSuppliers } from "@/hooks/useSuppliers";

export default function ProveedoresPage() {
  const { suppliers, pagination, loading, error, filters, setFilters, refetch } = useSuppliers();
  const [selectedSupplier, setSelectedSupplier] = useState<Supplier | null | undefined>(undefined);
  // undefined = modal cerrado; null = modo crear; Supplier = modo editar

  function openCreate()           { setSelectedSupplier(null); }
  function openEdit(s: Supplier)  { setSelectedSupplier(s); }
  function closeModal()           { setSelectedSupplier(undefined); }
  function handleSuccess()        { setSelectedSupplier(undefined); refetch(); }

  async function handleToggle(s: Supplier) {
    try {
      const res = await fetch(`/api/compras/proveedores/${s.id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify({ is_active: !s.is_active }),
      });
      if (res.ok) refetch();
    } catch { /* ignore */ }
  }

  return (
    <div className="page-wrapper">
      <div className="content">
        <div className="page-header d-flex justify-content-between align-items-center">
          <div>
            <h4 className="page-title">Proveedores</h4>
            <p className="text-muted mb-0">Gestión del directorio de proveedores</p>
          </div>
          <button className="btn btn-primary d-flex align-items-center gap-2" onClick={openCreate}>
            <i className="ti ti-plus" />
            Nuevo Proveedor
          </button>
        </div>

        {/* Filtros */}
        <div className="card mb-3">
          <div className="card-body py-2">
            <div className="d-flex flex-wrap gap-2 align-items-center">
              <div className="input-group" style={{ maxWidth: 280 }}>
                <span className="input-group-text bg-transparent border-end-0">
                  <i className="ti ti-search text-muted" />
                </span>
                <input
                  type="text"
                  className="form-control border-start-0"
                  placeholder="Buscar proveedor…"
                  value={filters.search}
                  onChange={e => setFilters({ search: e.target.value })}
                />
              </div>
              <div className="form-check mb-0">
                <input
                  type="checkbox"
                  className="form-check-input"
                  id="showInactive"
                  checked={filters.is_active === "false"}
                  onChange={e => setFilters({ is_active: e.target.checked ? "false" : "" })}
                />
                <label className="form-check-label" htmlFor="showInactive">
                  Mostrar inactivos
                </label>
              </div>
              {(filters.search || filters.is_active) && (
                <button className="btn btn-sm btn-outline-secondary" onClick={() => setFilters({ search: "", is_active: "" })}>
                  <i className="ti ti-x me-1" />Limpiar
                </button>
              )}
            </div>
          </div>
        </div>

        <div className="card">
          <div className="card-body">
            <SupplierTable
              suppliers={suppliers}
              loading={loading}
              error={error}
              total={pagination.total}
              limit={pagination.limit}
              offset={pagination.offset}
              onPageChange={(o) => setFilters({ offset: o })}
              onEdit={openEdit}
              onToggle={handleToggle}
            />
          </div>
        </div>

        {selectedSupplier !== undefined && (
          <SupplierModal
            supplier={selectedSupplier}
            onClose={closeModal}
            onSuccess={handleSuccess}
          />
        )}
      </div>
    </div>
  );
}
