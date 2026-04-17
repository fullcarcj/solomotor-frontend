"use client";

import { useCallback, useEffect, useState } from "react";
import type { BankStatement } from "@/types/finanzas";
import BankStatementFilters from "../components/BankStatementFilters";
import BankStatementTable from "../components/BankStatementTable";

const EMPTY_FILTERS = { tx_type: "", status: "", search: "", from: "", to: "" };
const LIMIT = 50;

export default function FinanzasBanescoPage() {
  const [rows, setRows]           = useState<BankStatement[]>([]);
  const [total, setTotal]         = useState(0);
  const [offset, setOffset]       = useState(0);
  const [loading, setLoading]     = useState(true);
  const [error, setError]         = useState<string | null>(null);
  const [filters, setFilters]     = useState(EMPTY_FILTERS);
  const [unjustified, setUnjustified] = useState(0);

  const fetchData = useCallback(
    (currentOffset: number, currentFilters: typeof EMPTY_FILTERS) => {
      setLoading(true);
      setError(null);

      const params = new URLSearchParams();
      params.set("limit", String(LIMIT));
      params.set("offset", String(currentOffset));
      if (currentFilters.tx_type) params.set("tx_type", currentFilters.tx_type);
      if (currentFilters.status)  params.set("status",  currentFilters.status);
      if (currentFilters.search)  params.set("search",  currentFilters.search);
      if (currentFilters.from)    params.set("from",    currentFilters.from);
      if (currentFilters.to)      params.set("to",      currentFilters.to);

      fetch(`/api/finanzas/banesco?${params}`, { credentials: "include" })
        .then((r) => r.json())
        .then((json) => {
          setRows((json?.data ?? []) as BankStatement[]);
          setTotal(Number(json?.meta?.total ?? 0));

          const allRows = (json?.data ?? []) as BankStatement[];
          const unjust = allRows.filter(
            (r) => r.tx_type === "DEBIT" && r.reconciliation_status === "UNMATCHED"
          ).length;
          if (currentOffset === 0) setUnjustified(unjust);
        })
        .catch(() => setError("Error al cargar movimientos"))
        .finally(() => setLoading(false));
    },
    []
  );

  useEffect(() => {
    setOffset(0);
    fetchData(0, filters);
  }, [filters, fetchData]);

  const totalPages = Math.ceil(total / LIMIT);
  const currentPage = Math.floor(offset / LIMIT);

  return (
    <div className="page-wrapper">
      <div className="content">

        {/* Título */}
        <div className="d-flex align-items-center justify-content-between flex-wrap gap-3 mb-4">
          <div>
            <h1 className="mb-1 custome-heading">Estados de Cuenta Banesco</h1>
            <p className="text-muted small mb-0">
              {loading ? "Cargando…" : `${total} movimientos en total`}
            </p>
          </div>
          <button
            type="button"
            className="btn btn-outline-secondary btn-sm"
            onClick={() => fetchData(offset, filters)}
          >
            <i className="ti ti-refresh me-1" />
            Actualizar
          </button>
        </div>

        {/* Alerta débitos sin justificar */}
        {unjustified > 0 && !loading && (
          <div className="alert alert-warning d-flex align-items-center gap-2 mb-3" role="alert">
            <i className="ti ti-alert-triangle fs-18" />
            <span>
              <strong>{unjustified}</strong> débito{unjustified !== 1 ? "s" : ""} sin justificar en esta página
            </span>
          </div>
        )}

        {/* Error */}
        {error && (
          <div className="alert alert-danger d-flex align-items-center gap-3 mb-3" role="alert">
            <i className="ti ti-alert-circle fs-18" />
            <span className="flex-fill">{error}</span>
            <button
              type="button"
              className="btn btn-sm btn-outline-danger"
              onClick={() => fetchData(offset, filters)}
            >
              Reintentar
            </button>
          </div>
        )}

        {/* Filtros */}
        <BankStatementFilters
          filters={filters}
          onChange={(f) => setFilters(f)}
          onClear={() => setFilters(EMPTY_FILTERS)}
        />

        {/* Tabla */}
        <div className="card">
          <div className="card-body p-0">
            <BankStatementTable
              rows={rows}
              loading={loading}
              onRefetch={() => fetchData(offset, filters)}
            />
          </div>

          {/* Paginación */}
          {totalPages > 1 && (
            <div className="card-footer d-flex justify-content-between align-items-center">
              <small className="text-muted">
                Mostrando {offset + 1}–{Math.min(offset + LIMIT, total)} de {total}
              </small>
              <nav>
                <ul className="pagination pagination-sm mb-0">
                  <li className={`page-item ${currentPage === 0 ? "disabled" : ""}`}>
                    <button
                      className="page-link"
                      onClick={() => {
                        const next = offset - LIMIT;
                        setOffset(next);
                        fetchData(next, filters);
                      }}
                    >
                      ‹
                    </button>
                  </li>
                  <li className="page-item active">
                    <span className="page-link">{currentPage + 1} / {totalPages}</span>
                  </li>
                  <li className={`page-item ${currentPage >= totalPages - 1 ? "disabled" : ""}`}>
                    <button
                      className="page-link"
                      onClick={() => {
                        const next = offset + LIMIT;
                        setOffset(next);
                        fetchData(next, filters);
                      }}
                    >
                      ›
                    </button>
                  </li>
                </ul>
              </nav>
            </div>
          )}
        </div>

      </div>
    </div>
  );
}
