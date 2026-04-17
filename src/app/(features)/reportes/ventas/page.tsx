"use client";

import dynamic from "next/dynamic";
import { useCallback, useEffect, useState } from "react";
import type { PnlPeriod } from "@/hooks/usePnl";
import type { HourlyReport, SalesReport } from "@/types/reportes";
import ReportPeriodSelector from "../components/ReportPeriodSelector";
import ReportsTabs from "../components/ReportsTabs";
import SalesOverviewCards from "../components/SalesOverviewCards";
import SalesByChannelTable from "../components/SalesByChannelTable";
import SalesBySellerTable from "../components/SalesBySellerTable";
import SalesHeatmap from "../components/SalesHeatmap";
import { parseHourlyReport, parseSalesReport } from "../lib/parseReportData";

const SalesByChannelChart = dynamic(() => import("../components/SalesByChannelChart"), { ssr: false });

function errMsg(json: unknown): string {
  if (json && typeof json === "object") {
    const o = json as Record<string, unknown>;
    if (typeof o.error === "string") return o.error;
    if (typeof o.message === "string") return o.message;
  }
  return "No se pudieron cargar los datos.";
}

export default function ReportesVentasPage() {
  const [period, setPeriod] = useState<PnlPeriod>("month");
  const [sales, setSales] = useState<SalesReport | null>(null);
  const [hourly, setHourly] = useState<HourlyReport | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const load = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const [rSales, rHourly] = await Promise.all([
        fetch(`/api/reportes/ventas?period=${encodeURIComponent(period)}`, {
          credentials: "include",
          cache: "no-store",
        }),
        fetch(`/api/reportes/ventas/hourly?weeks=4`, {
          credentials: "include",
          cache: "no-store",
        }),
      ]);

      const jSales: unknown = await rSales.json().catch(() => ({}));
      if (!rSales.ok) {
        setSales(null);
        setHourly(null);
        setError(errMsg(jSales));
        return;
      }
      setSales(parseSalesReport(jSales));

      const jHourly: unknown = await rHourly.json().catch(() => ({}));
      if (rHourly.ok) setHourly(parseHourlyReport(jHourly));
      else setHourly(parseHourlyReport({}));
    } catch {
      setSales(null);
      setHourly(null);
      setError("Error al conectar con el servidor.");
    } finally {
      setLoading(false);
    }
  }, [period]);

  useEffect(() => {
    void load();
  }, [load]);

  return (
    <div className="page-wrapper">
      <div className="content">
        <div className="d-flex align-items-start justify-content-between flex-wrap gap-3 mb-2">
          <div>
            <h1 className="mb-1 custome-heading">Reporte de Ventas</h1>
            <p className="text-muted small mb-0">
              Ventas por canal, vendedor y distribución horaria
            </p>
          </div>
          <ReportPeriodSelector value={period} onChange={setPeriod} />
        </div>

        <ReportsTabs />

        {error && (
          <div className="alert alert-danger d-flex align-items-center gap-3 mb-4" role="alert">
            <i className="ti ti-alert-circle fs-18" />
            <span className="flex-fill">{error}</span>
            <button type="button" className="btn btn-sm btn-outline-danger" onClick={() => void load()}>
              Reintentar
            </button>
          </div>
        )}

        <SalesOverviewCards data={loading ? null : sales} />

        <div className="row g-3 mb-4">
          <div className="col-md-8">
            {loading ? (
              <div className="card border-0 shadow-sm h-100">
                <div className="card-body placeholder-glow">
                  <div className="placeholder col-12 rounded" style={{ height: 320 }} />
                </div>
              </div>
            ) : (
              <SalesByChannelChart chart={sales?.chart ?? []} />
            )}
          </div>
          <div className="col-md-4">
            {loading ? (
              <div className="card border-0 shadow-sm h-100">
                <div className="card-body placeholder-glow">
                  <div className="placeholder col-12 rounded" style={{ height: 240 }} />
                </div>
              </div>
            ) : (
              <SalesByChannelTable rows={sales?.by_source ?? []} />
            )}
          </div>
        </div>

        <SalesBySellerTable rows={sales?.by_seller} loading={loading} />

        <SalesHeatmap data={hourly} loading={loading} />
      </div>
    </div>
  );
}
