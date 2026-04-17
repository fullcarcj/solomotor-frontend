"use client";

import dynamic from "next/dynamic";
import { useCallback, useEffect, useState } from "react";
import type { InventoryReport } from "@/types/reportes";
import ReportsTabs from "../components/ReportsTabs";
import InventorySummaryCards from "../components/InventorySummaryCards";
import StockoutTable from "../components/StockoutTable";
import { parseInventoryReport } from "../lib/parseReportData";

const InventoryCategoryChart = dynamic(() => import("../components/InventoryCategoryChart"), { ssr: false });

function errMsg(json: unknown): string {
  if (json && typeof json === "object") {
    const o = json as Record<string, unknown>;
    if (typeof o.error === "string") return o.error;
    if (typeof o.message === "string") return o.message;
  }
  return "No se pudieron cargar los datos.";
}

export default function ReportesInventarioPage() {
  const [data, setData] = useState<InventoryReport | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const load = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await fetch("/api/reportes/inventario", {
        credentials: "include",
        cache: "no-store",
      });
      const json: unknown = await res.json().catch(() => ({}));
      if (!res.ok) {
        setData(null);
        setError(errMsg(json));
        return;
      }
      setData(parseInventoryReport(json));
    } catch {
      setData(null);
      setError("Error al conectar con el servidor.");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    void load();
  }, [load]);

  return (
    <div className="page-wrapper">
      <div className="content">
        <div className="mb-4">
          <h1 className="mb-1 custome-heading">Reporte de Inventario</h1>
          <p className="text-muted small mb-0">Stock, categorías y SKUs agotados</p>
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

        <InventorySummaryCards data={loading ? null : data} />

        <div className="row g-3">
          <div className="col-md-7">
            <InventoryCategoryChart data={loading ? null : data} />
          </div>
          <div className="col-md-5">
            <StockoutTable data={loading ? null : data} />
          </div>
        </div>
      </div>
    </div>
  );
}
