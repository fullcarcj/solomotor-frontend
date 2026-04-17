"use client";

import { useCallback, useEffect, useState } from "react";
import type { Comprobante } from "@/types/finanzas";
import ComprobanteTable from "../components/ComprobanteTable";

const EMPTY_FILTERS = { status: "", from: "", to: "" };
const LIMIT = 50;

const STATUS_OPTIONS = [
  { value: "",              label: "Todos" },
  { value: "matched",       label: "Conciliado" },
  { value: "no_match",      label: "Sin match" },
  { value: "pending",       label: "Pendiente" },
  { value: "manual_review", label: "Revisión manual" },
];

export default function FinanzasComprobantesPage() {
  const [rows, setRows]       = useState<Comprobante[]>([]);
  const [total, setTotal]     = useState(0);
  const [offset, setOffset]   = useState(0);
  const [loading, setLoading] = useState(true);
  const [error, setError]     = useState<string | null>(null);
  const [filters, setFilters] = useState(EMPTY_FILTERS);

  const fetchData = useCallback(
    (currentOffset: number, currentFilters: typeof EMPTY_FILTERS) => {
      setLoading(true);
      setError(null);
      const params = new URLSearchParams();
      params.set("limit",  String(LIMIT));
      params.set("offset", String(currentOffset));
      if (currentFilters.status) params.set("status", currentFilters.status);
      if (currentFilters.from)   params.set("from",   currentFilters.from);
      if (currentFilters.to)     params.set("to",     currentFilters.to);

      fetch(`/api/finanzas/comprobantes?${params}`, { credentials: "include" })
        .then((r) => r.json())
        .then((json) => {
          setRows((json?.data ?? []) as Comprobante[]);
          setTotal(Number(json?.pagination?.total ?? json?.meta?.total ?? 0));
        })
        .catch(() => setError("Error al cargar comprobantes"))
        .finally(() => setLoading(false));
    },
    []
  );

  useEffect(() => {
    setOffset(0);
    fetchData(0, filters);
  }, [filters, fetchData]);

  // Conteos rápidos del lote visible
  const matched       = rows.filter((r) => r.reconciliation_status === "matched").length;
  const noMatch       = rows.filter((r) => r.reconciliation_status === "no_match").length;
  const failedExtract = rows.filter((r) => r.extracted_amount_bs == null).length;

  const totalPages  = Math.ceil(total / LIMIT);
  const currentPage = Math.floor(offset / LIMIT);

  return (
    <div className="page-wrapper">
      <div className="content">

        {/* Título */}
        <div className="mb-4">
          <h1 className="mb-1 custome-heading">Comprobantes WhatsApp</h1>
          <p className="text-muted small mb-0">
            Procesados automáticamente por IA — {loading ? "…" : `${total} en total`}
          </p>
        </div>

        {/* Error */}
        {error && (
          <div className="alert alert-danger d-flex align-items-center gap-3 mb-3" role="alert">
            <i className="ti ti-alert-circle fs-18" />
            <span className="flex-fill">{error}</span>
            <button type="button" className="btn btn-sm btn-outline-danger" onClick={() => fetchData(offset, filters)}>
              Reintentar
            </button>
          </div>
        )}

        {/* Cards resumen */}
        <div className="row row-cols-2 row-cols-md-4 g-3 mb-4">
          {[
            { label: "Total",       value: loading ? "…" : rows.length,     cls: "" },
            { label: "Conciliados", value: loading ? "…" : matched,         cls: "text-success" },
            { label: "Sin match",   value: loading ? "…" : noMatch,         cls: "text-warning" },
            { label: "Fallos IA",   value: loading ? "…" : failedExtract,   cls: "text-danger" },
          ].map((c) => (
            <div key={c.label} className="col">
              <div className="card text-center h-100">
                <div className="card-body py-3">
                  <div className={`fs-4 fw-bold ${c.cls}`}>{c.value}</div>
                  <div className="text-muted small">{c.label}</div>
                </div>
              </div>
            </div>
          ))}
        </div>

        {/* Filtros */}
        <div className="d-flex flex-wrap gap-2 align-items-end mb-3">
          <div>
            <label className="form-label small mb-1">Estado</label>
            <select
              className="form-select form-select-sm"
              value={filters.status}
              onChange={(e) => setFilters((f) => ({ ...f, status: e.target.value }))}
              style={{ minWidth: 160 }}
            >
              {STATUS_OPTIONS.map((o) => (
                <option key={o.value} value={o.value}>{o.label}</option>
              ))}
            </select>
          </div>
          <div>
            <label className="form-label small mb-1">Desde</label>
            <input
              type="date"
              className="form-control form-control-sm"
              value={filters.from}
              onChange={(e) => setFilters((f) => ({ ...f, from: e.target.value }))}
            />
          </div>
          <div>
            <label className="form-label small mb-1">Hasta</label>
            <input
              type="date"
              className="form-control form-control-sm"
              value={filters.to}
              onChange={(e) => setFilters((f) => ({ ...f, to: e.target.value }))}
            />
          </div>
          <div>
            <button
              type="button"
              className="btn btn-outline-secondary btn-sm"
              onClick={() => setFilters(EMPTY_FILTERS)}
            >
              <i className="ti ti-x me-1" />Limpiar
            </button>
          </div>
        </div>

        {/* Tabla */}
        <div className="card">
          <div className="card-body p-0">
            <ComprobanteTable rows={rows} loading={loading} />
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
                    >‹</button>
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
                    >›</button>
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
