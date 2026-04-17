"use client";

import dynamic from "next/dynamic";
import { usePnl } from "@/hooks/usePnl";
import type { PnlPeriod } from "@/hooks/usePnl";
import PeriodSelector from "./components/PeriodSelector";
import PnlSummaryCards from "./components/PnlSummaryCards";
import RevenueByChannel from "./components/RevenueByChannel";

const MonthlyChart = dynamic(() => import("./components/MonthlyChart"), {
  ssr: false,
});

function fmtBs(v: number | string | null | undefined): string {
  if (v == null || v === "") return "—";
  const n = Number(String(v).replace(",", "."));
  if (!Number.isFinite(n)) return "—";
  return `Bs. ${n.toLocaleString("es-VE", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
}

function fmtInt(v: number | null | undefined): string {
  if (v == null) return "—";
  return v.toLocaleString("es-VE");
}

const SOURCE_LABELS: Record<string, string> = {
  mercadolibre:  "MercadoLibre",
  mostrador:     "Mostrador",
  ecommerce:     "E-commerce",
  social_media:  "Redes Sociales",
  fuerza_ventas: "Fuerza de Ventas",
};

export default function FinanzasUtilidadPage() {
  const { pnl, sales, loading, error, period, setPeriod, refetch } = usePnl();

  return (
    <div className="page-wrapper">
      <div className="content">

        {/* ── Fila 1: Título + PeriodSelector ─────────────────────────── */}
        <div className="d-flex align-items-center justify-content-between flex-wrap gap-3 mb-4">
          <div>
            <h1 className="mb-1 custome-heading">Utilidad Real</h1>
            <p className="text-muted small mb-0">
              P&amp;L básico del período — solo visible para administradores
            </p>
          </div>
          <PeriodSelector
            value={period}
            onChange={(p) => setPeriod(p as PnlPeriod)}
          />
        </div>

        {/* ── Error global ─────────────────────────────────────────────── */}
        {error && (
          <div
            className="alert alert-danger d-flex align-items-center gap-3 mb-4"
            role="alert"
          >
            <i className="ti ti-alert-circle fs-18" />
            <span className="flex-fill">{error}</span>
            <button
              type="button"
              className="btn btn-sm btn-outline-danger"
              onClick={refetch}
            >
              Reintentar
            </button>
          </div>
        )}

        {/* ── Loading spinner ───────────────────────────────────────────── */}
        {loading && (
          <div className="d-flex justify-content-center align-items-center py-5">
            <div className="spinner-border text-primary" role="status">
              <span className="visually-hidden">Cargando…</span>
            </div>
          </div>
        )}

        {/* ── Contenido principal ───────────────────────────────────────── */}
        {!loading && pnl && (
          <>
            {/* Fila 2: Summary Cards */}
            <PnlSummaryCards pnl={pnl} />

            {/* Fila 3: Gráfico + Canales */}
            <div className="row g-3 mb-4">
              <div className="col-md-7 d-flex">
                <MonthlyChart data={pnl.chart_monthly} />
              </div>
              <div className="col-md-5 d-flex">
                <RevenueByChannel revenue={pnl.revenue} />
              </div>
            </div>

            {/* Fila 4: Detalle de Ventas */}
            {sales && (
              <div className="row g-3">
                <div className="col-12">
                  <h5 className="fw-semibold mb-3">Detalle de Ventas</h5>
                </div>

                {/* By Source */}
                {sales.by_source && sales.by_source.length > 0 && (
                  <div className="col-md-6">
                    <div className="card">
                      <div className="card-header d-flex align-items-center gap-2">
                        <i className="ti ti-layout-grid text-primary" />
                        <h6 className="card-title mb-0">Por Canal de Venta</h6>
                      </div>
                      <div className="card-body p-0">
                        <div className="table-responsive">
                          <table className="table table-sm table-hover mb-0">
                            <thead className="table-light">
                              <tr>
                                <th className="ps-3">Canal</th>
                                <th className="text-center">Órdenes</th>
                                <th className="text-end pe-3">Total Bs</th>
                              </tr>
                            </thead>
                            <tbody>
                              {sales.by_source.map((s) => (
                                <tr key={s.source}>
                                  <td className="ps-3">
                                    {SOURCE_LABELS[s.source] ?? s.source}
                                  </td>
                                  <td className="text-center">
                                    {fmtInt(s.orders)}
                                  </td>
                                  <td className="text-end pe-3 fw-semibold">
                                    {fmtBs(s.total_bs)}
                                  </td>
                                </tr>
                              ))}
                            </tbody>
                            <tfoot className="table-light fw-bold">
                              <tr>
                                <td className="ps-3">TOTAL</td>
                                <td className="text-center">
                                  {fmtInt(sales.total_orders)}
                                </td>
                                <td className="text-end pe-3">
                                  {fmtBs(sales.total_bs)}
                                </td>
                              </tr>
                            </tfoot>
                          </table>
                        </div>
                      </div>
                    </div>
                  </div>
                )}

                {/* By Seller */}
                {sales.by_seller && sales.by_seller.length > 0 && (
                  <div className="col-md-6">
                    <div className="card">
                      <div className="card-header d-flex align-items-center gap-2">
                        <i className="ti ti-user-check text-success" />
                        <h6 className="card-title mb-0">Por Vendedor</h6>
                      </div>
                      <div className="card-body p-0">
                        <div className="table-responsive">
                          <table className="table table-sm table-hover mb-0">
                            <thead className="table-light">
                              <tr>
                                <th className="ps-3">Vendedor</th>
                                <th className="text-center">Órdenes</th>
                                <th className="text-end pe-3">Total Bs</th>
                              </tr>
                            </thead>
                            <tbody>
                              {sales.by_seller.map((s) => (
                                <tr key={s.seller}>
                                  <td className="ps-3">{s.seller || "—"}</td>
                                  <td className="text-center">
                                    {fmtInt(s.orders)}
                                  </td>
                                  <td className="text-end pe-3 fw-semibold">
                                    {fmtBs(s.total_bs)}
                                  </td>
                                </tr>
                              ))}
                            </tbody>
                            <tfoot className="table-light fw-bold">
                              <tr>
                                <td className="ps-3">Ticket promedio</td>
                                <td className="text-center">—</td>
                                <td className="text-end pe-3">
                                  {fmtBs(sales.avg_ticket_bs)}
                                </td>
                              </tr>
                            </tfoot>
                          </table>
                        </div>
                      </div>
                    </div>
                  </div>
                )}
              </div>
            )}
          </>
        )}

        {/* Sin datos (no loading, no error, no pnl) */}
        {!loading && !error && !pnl && (
          <div className="alert alert-info" role="alert">
            <i className="ti ti-info-circle me-2" />
            No hay datos disponibles para el período seleccionado.
          </div>
        )}

      </div>
    </div>
  );
}
