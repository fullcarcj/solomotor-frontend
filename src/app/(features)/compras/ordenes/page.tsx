"use client";
import { useState } from "react";
import Link from "next/link";
import type { Purchase } from "@/types/compras";
import PurchaseTable from "../components/PurchaseTable";
import PurchaseDetailModal from "../components/PurchaseDetailModal";
import { usePurchases } from "@/hooks/usePurchases";
import { all_routes } from "@/data/all_routes";

export default function OrdenesPage() {
  const { purchases, pagination, loading, error, filters, setFilters, refetch } = usePurchases();
  const [selectedId, setSelectedId] = useState<number | null>(null);

  return (
    <div className="page-wrapper">
      <div className="content">
        <div className="page-header d-flex justify-content-between align-items-center">
          <div>
            <h4 className="page-title">Órdenes de Compra</h4>
            <p className="text-muted mb-0">Historial de recepciones de mercancía</p>
          </div>
          <Link href={all_routes.comprasRecepcion} className="btn btn-primary d-flex align-items-center gap-2">
            <i className="ti ti-plus" />
            Nueva Recepción
          </Link>
        </div>

        {/* Filtros */}
        <div className="card mb-3">
          <div className="card-body py-2">
            <div className="d-flex flex-wrap gap-2 align-items-center">
              <div className="d-flex align-items-center gap-2">
                <label className="form-label mb-0 text-nowrap">Desde</label>
                <input
                  type="date"
                  className="form-control form-control-sm"
                  style={{ width: 150 }}
                  value={filters.from}
                  onChange={e => setFilters({ from: e.target.value })}
                />
              </div>
              <div className="d-flex align-items-center gap-2">
                <label className="form-label mb-0 text-nowrap">Hasta</label>
                <input
                  type="date"
                  className="form-control form-control-sm"
                  style={{ width: 150 }}
                  value={filters.to}
                  onChange={e => setFilters({ to: e.target.value })}
                />
              </div>
              {(filters.from || filters.to) && (
                <button className="btn btn-sm btn-outline-secondary" onClick={() => { setFilters({ from: "", to: "" }); refetch(); }}>
                  <i className="ti ti-x me-1" />Limpiar
                </button>
              )}
            </div>
          </div>
        </div>

        <div className="card">
          <div className="card-body">
            <PurchaseTable
              purchases={purchases}
              loading={loading}
              error={error}
              total={pagination.total}
              limit={pagination.limit}
              offset={pagination.offset}
              onPageChange={(o) => setFilters({ offset: o })}
              onDetail={(p: Purchase) => setSelectedId(p.id)}
            />
          </div>
        </div>

        <PurchaseDetailModal
          purchaseId={selectedId}
          onClose={() => setSelectedId(null)}
        />
      </div>
    </div>
  );
}
