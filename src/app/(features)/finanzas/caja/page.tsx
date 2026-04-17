"use client";

import { useEffect, useState } from "react";
import dynamic from "next/dynamic";
import type { FinanceSummary, FinancePeriod } from "@/types/finanzas";
import FinanceSummaryCards from "../components/FinanceSummaryCards";
import ReconciliationStatusWidget from "../components/ReconciliationStatusWidget";

const CashflowChart = dynamic(() => import("../components/CashflowChart"), { ssr: false });

const PERIOD_OPTIONS: { value: FinancePeriod; label: string }[] = [
  { value: "today", label: "Hoy" },
  { value: "week",  label: "Semana" },
  { value: "month", label: "Mes" },
  { value: "year",  label: "Año" },
];

export default function FinanzasCajaPage() {
  const [period, setPeriod]   = useState<FinancePeriod>("today");
  const [summary, setSummary] = useState<FinanceSummary | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError]     = useState<string | null>(null);

  const load = (p: FinancePeriod) => {
    setLoading(true);
    setError(null);
    fetch(`/api/finanzas/summary?period=${p}`, { credentials: "include" })
      .then((r) => r.json())
      .then((json) => {
        if (json?.data) setSummary(json.data as FinanceSummary);
        else setError(json?.error ?? "Sin datos");
      })
      .catch(() => setError("Error al conectar con el servidor"))
      .finally(() => setLoading(false));
  };

  useEffect(() => { load(period); }, [period]);

  return (
    <div className="page-wrapper">
      <div className="content">

        {/* Título + PeriodSelector */}
        <div className="d-flex align-items-center justify-content-between flex-wrap gap-3 mb-4">
          <div>
            <h1 className="mb-1 custome-heading">Caja y Finanzas</h1>
            <p className="text-muted small mb-0">
              Resumen financiero del período — solo visible para administradores y contadores
            </p>
          </div>
          <div className="btn-group" role="group" aria-label="Período">
            {PERIOD_OPTIONS.map((opt) => (
              <button
                key={opt.value}
                type="button"
                className={`btn ${period === opt.value ? "btn-primary" : "btn-outline-secondary"}`}
                onClick={() => setPeriod(opt.value)}
              >
                {opt.label}
              </button>
            ))}
          </div>
        </div>

        {/* Error global */}
        {error && (
          <div className="alert alert-danger d-flex align-items-center gap-3 mb-4" role="alert">
            <i className="ti ti-alert-circle fs-18" />
            <span className="flex-fill">{error}</span>
            <button
              type="button"
              className="btn btn-sm btn-outline-danger"
              onClick={() => load(period)}
            >
              Reintentar
            </button>
          </div>
        )}

        {/* Cards de resumen */}
        <FinanceSummaryCards summary={summary} loading={loading} />

        {/* Gráfico + Widget conciliación */}
        <div className="row g-3">
          <div className="col-md-7">
            <CashflowChart period={period} />
          </div>
          <div className="col-md-5">
            <ReconciliationStatusWidget />
          </div>
        </div>

      </div>
    </div>
  );
}
