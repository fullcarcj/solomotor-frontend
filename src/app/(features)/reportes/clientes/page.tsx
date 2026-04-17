"use client";

import { useCallback, useEffect, useState } from "react";
import type { PnlPeriod } from "@/hooks/usePnl";
import type { CustomerReport } from "@/types/reportes";
import ReportPeriodSelector from "../components/ReportPeriodSelector";
import ReportsTabs from "../components/ReportsTabs";
import CustomerMetricsCards from "../components/CustomerMetricsCards";
import TopCustomersTable from "../components/TopCustomersTable";
import { parseCustomerReport } from "../lib/parseReportData";

function errMsg(json: unknown): string {
  if (json && typeof json === "object") {
    const o = json as Record<string, unknown>;
    if (typeof o.error === "string") return o.error;
    if (typeof o.message === "string") return o.message;
  }
  return "No se pudieron cargar los datos.";
}

export default function ReportesClientesPage() {
  const [period, setPeriod] = useState<PnlPeriod>("month");
  const [data, setData] = useState<CustomerReport | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const load = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await fetch(
        `/api/reportes/clientes?period=${encodeURIComponent(period)}`,
        { credentials: "include", cache: "no-store" }
      );
      const json: unknown = await res.json().catch(() => ({}));
      if (!res.ok) {
        setData(null);
        setError(errMsg(json));
        return;
      }
      setData(parseCustomerReport(json));
    } catch {
      setData(null);
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
            <h1 className="mb-1 custome-heading">Reporte de Clientes</h1>
            <p className="text-muted small mb-0">Métricas CRM y principales compradores</p>
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

        <CustomerMetricsCards data={loading ? null : data} />
        <TopCustomersTable data={loading ? null : data} />
      </div>
    </div>
  );
}
