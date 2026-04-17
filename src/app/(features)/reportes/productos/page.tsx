"use client";

import dynamic from "next/dynamic";
import { useCallback, useEffect, useState } from "react";
import type { PnlPeriod } from "@/hooks/usePnl";
import type { ProductReport } from "@/types/reportes";
import ReportPeriodSelector from "../components/ReportPeriodSelector";
import ReportsTabs from "../components/ReportsTabs";
import TopProductsTable from "../components/TopProductsTable";
import { parseProductReport } from "../lib/parseReportData";

const TopProductsChart = dynamic(() => import("../components/TopProductsChart"), { ssr: false });

const LIMITS = [10, 25, 50] as const;

function errMsg(json: unknown): string {
  if (json && typeof json === "object") {
    const o = json as Record<string, unknown>;
    if (typeof o.error === "string") return o.error;
    if (typeof o.message === "string") return o.message;
  }
  return "No se pudieron cargar los datos.";
}

export default function ReportesProductosPage() {
  const [period, setPeriod] = useState<PnlPeriod>("month");
  const [limit, setLimit] = useState<(typeof LIMITS)[number]>(10);
  const [data, setData] = useState<ProductReport | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const load = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const qs = new URLSearchParams({
        period,
        limit: String(limit),
      });
      const res = await fetch(`/api/reportes/productos?${qs}`, {
        credentials: "include",
        cache: "no-store",
      });
      const json: unknown = await res.json().catch(() => ({}));
      if (!res.ok) {
        setData(null);
        setError(errMsg(json));
        return;
      }
      setData(parseProductReport(json));
    } catch {
      setData(null);
      setError("Error al conectar con el servidor.");
    } finally {
      setLoading(false);
    }
  }, [period, limit]);

  useEffect(() => {
    void load();
  }, [load]);

  return (
    <div className="page-wrapper">
      <div className="content">
        <div className="d-flex align-items-start justify-content-between flex-wrap gap-3 mb-2">
          <div>
            <h1 className="mb-1 custome-heading">Top Productos Vendidos</h1>
            <p className="text-muted small mb-0">Basado en líneas de detalle de órdenes</p>
          </div>
          <div className="d-flex flex-column align-items-end gap-2">
            <div className="btn-group" role="group" aria-label="Límite">
              {LIMITS.map((n) => (
                <button
                  key={n}
                  type="button"
                  className={`btn btn-sm ${limit === n ? "btn-primary" : "btn-outline-secondary"}`}
                  onClick={() => setLimit(n)}
                >
                  Top {n}
                </button>
              ))}
            </div>
            <ReportPeriodSelector value={period} onChange={setPeriod} />
          </div>
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

        <TopProductsChart data={loading ? null : data} />
        <TopProductsTable data={loading ? null : data} />
      </div>
    </div>
  );
}
