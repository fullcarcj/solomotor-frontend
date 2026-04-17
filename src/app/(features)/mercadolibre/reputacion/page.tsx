"use client";
import { useEffect, useState } from "react";
import type { MlReputation, MlProfitability } from "@/types/mercadolibre";

const PERIODS = [
  { value: "today", label: "Hoy" },
  { value: "week",  label: "Semana" },
  { value: "month", label: "Mes" },
  { value: "year",  label: "Año" },
];

function fmtUSD(v: number | string) { return `$${Number(v).toFixed(2)}`; }

function ProfitSection({ period }: { period: string }) {
  const [data, setData]     = useState<MlProfitability | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError]   = useState<string | null>(null);

  useEffect(() => {
    setLoading(true); setError(null);
    fetch(`/api/mercadolibre/profitability?period=${period}`, { credentials: "include" })
      .then(async r => { const d = await r.json().catch(() => ({})) as Record<string, unknown>; if (!r.ok) throw new Error((d.error as string) ?? `HTTP ${r.status}`); setData(d as unknown as MlProfitability); })
      .catch((e: unknown) => setError(e instanceof Error ? e.message : "Error."))
      .finally(() => setLoading(false));
  }, [period]);

  if (loading) return <div className="placeholder-glow">{Array.from({ length: 5 }).map((_, i) => <div key={i} className="placeholder col-12 rounded mb-2" style={{ height: 28 }} />)}</div>;
  if (error || !data) return <div className="alert alert-warning py-2 small">{error ?? "Sin datos."}</div>;

  const margin = Number(data.avg_margin_pct ?? 0);
  const payoutColor = margin >= 20 ? "text-success" : margin >= 10 ? "text-warning" : "text-danger";

  return (
    <table className="table table-sm mb-0">
      <tbody>
        <tr><td className="text-muted small">Órdenes</td><td className="text-end">{data.orders_count}</td></tr>
        <tr><td className="text-muted small">Ingresos</td><td className="text-end">{fmtUSD(data.revenue_usd)}</td></tr>
        <tr><td className="text-muted small">Comisiones ML</td><td className="text-end text-danger">−{fmtUSD(data.fees?.sale_fee_usd ?? 0)}</td></tr>
        <tr><td className="text-muted small">Envíos</td><td className="text-end text-danger">−{fmtUSD(data.fees?.shipping_usd ?? 0)}</td></tr>
        <tr><td className="text-muted small">Impuestos</td><td className="text-end text-danger">−{fmtUSD(data.fees?.taxes_usd ?? 0)}</td></tr>
        <tr className="border-top"><td className="fw-bold">Neto real</td><td className={`text-end fw-bold fs-5 ${payoutColor}`}>{fmtUSD(data.payout_usd)}</td></tr>
        <tr><td className="text-muted small">Margen promedio</td><td className="text-end">{Number(data.avg_margin_pct ?? 0).toFixed(1)}%</td></tr>
      </tbody>
    </table>
  );
}

export default function ReputacionPage() {
  const [rep,       setRep]       = useState<MlReputation | null>(null);
  const [repLoading,setRepLoading] = useState(true);
  const [repError,  setRepError]  = useState<string | null>(null);
  const [profPeriod, setProfPeriod] = useState("month");

  useEffect(() => {
    fetch("/api/mercadolibre/reputation", { credentials: "include" })
      .then(async r => { const d = await r.json().catch(() => ({})) as Record<string, unknown>; if (!r.ok) throw new Error((d.error as string) ?? `HTTP ${r.status}`); setRep(d as unknown as MlReputation); })
      .catch((e: unknown) => setRepError(e instanceof Error ? e.message : "Error."))
      .finally(() => setRepLoading(false));
  }, []);

  const compRate    = Number(rep?.sales?.completion_rate_pct ?? 0);
  const apiRate     = Number(rep?.api_health?.success_rate_pct ?? 0);
  const rateColor   = compRate >= 95 ? "text-success" : compRate >= 90 ? "text-warning" : "text-danger";
  const progressCls = compRate >= 95 ? "bg-success" : compRate >= 90 ? "bg-warning" : "bg-danger";

  return (
    <div className="page-wrapper">
      <div className="content">
        <div className="page-header">
          <h4 className="page-title">Monitor de Reputación ML</h4>
        </div>

        {repError && <div className="alert alert-danger mb-4">{repError}</div>}

        {/* Métricas de reputación */}
        <div className="row g-3 mb-4">
          <div className="col-md-3 col-6">
            <div className="card border-0 shadow-sm h-100">
              <div className="card-body">
                <div className="text-muted small">Ventas completadas</div>
                {repLoading
                  ? <div className="placeholder col-6 rounded mt-1" style={{ height: 28 }} />
                  : <div className="fw-bold fs-4">{rep?.sales?.completed ?? 0} <small className="text-muted fw-normal fs-6">/ {rep?.sales?.total ?? 0}</small></div>}
              </div>
            </div>
          </div>
          <div className="col-md-3 col-6">
            <div className={`card border-0 shadow-sm h-100 ${compRate < 90 ? "border-danger" : compRate < 95 ? "border-warning" : ""}`}>
              <div className="card-body">
                <div className="text-muted small">Tasa completación</div>
                {repLoading
                  ? <div className="placeholder col-6 rounded mt-1" style={{ height: 28 }} />
                  : <>
                    <div className={`fw-bold fs-4 ${rateColor}`}>{compRate.toFixed(1)}%</div>
                    <div className="progress mt-1" style={{ height: 4 }}>
                      <div className={`progress-bar ${progressCls}`} style={{ width: `${Math.min(100, compRate)}%` }} />
                    </div>
                    {compRate < 90 && <div className="small text-danger mt-1"><i className="ti ti-alert-triangle me-1" />Bajo mínimo</div>}
                  </>}
              </div>
            </div>
          </div>
          <div className="col-md-3 col-6">
            <div className="card border-0 shadow-sm h-100">
              <div className="card-body">
                <div className="text-muted small">Cancelaciones</div>
                {repLoading
                  ? <div className="placeholder col-6 rounded mt-1" style={{ height: 28 }} />
                  : <div className="fw-bold fs-4">{rep?.sales?.cancelled ?? 0}</div>}
              </div>
            </div>
          </div>
          <div className="col-md-3 col-6">
            <div className="card border-0 shadow-sm h-100">
              <div className="card-body">
                <div className="text-muted small">Período</div>
                {repLoading
                  ? <div className="placeholder col-6 rounded mt-1" style={{ height: 28 }} />
                  : <div className="fw-bold fs-5">últimos {rep?.period_days ?? "—"} días</div>}
              </div>
            </div>
          </div>
        </div>

        {/* API Health */}
        <div className="card mb-4 border-0 shadow-sm">
          <div className="card-header bg-transparent">
            <h6 className="card-title mb-0 d-flex align-items-center gap-2">
              <i className="ti ti-activity text-primary" /> Salud de la API ML
            </h6>
          </div>
          <div className="card-body">
            {repLoading
              ? <div className="placeholder-glow"><div className="placeholder col-12 rounded" style={{ height: 40 }} /></div>
              : (
                <div className="row g-3 text-center">
                  <div className="col-4">
                    <div className="fw-bold fs-4">{rep?.api_health?.calls_24h ?? 0}</div>
                    <small className="text-muted">Llamadas 24h</small>
                  </div>
                  <div className="col-4">
                    <div className="fw-bold fs-4 text-success">{rep?.api_health?.success_24h ?? 0}</div>
                    <small className="text-muted">Exitosas</small>
                  </div>
                  <div className="col-4">
                    <div className={`fw-bold fs-4 ${apiRate >= 99 ? "text-success" : apiRate >= 95 ? "text-warning" : "text-danger"}`}>{Number(apiRate).toFixed(1)}%</div>
                    <small className="text-muted">Tasa éxito</small>
                  </div>
                </div>
              )}
          </div>
        </div>

        {/* Rentabilidad */}
        <div className="card mb-4 border-0 shadow-sm">
          <div className="card-header bg-transparent d-flex justify-content-between align-items-center">
            <h6 className="card-title mb-0 d-flex align-items-center gap-2">
              <i className="ti ti-chart-bar text-success" /> Rentabilidad del canal
            </h6>
            <div className="btn-group btn-group-sm">
              {PERIODS.map(p => (
                <button key={p.value} className={`btn ${profPeriod === p.value ? "btn-primary" : "btn-outline-secondary"}`}
                        onClick={() => setProfPeriod(p.value)}>
                  {p.label}
                </button>
              ))}
            </div>
          </div>
          <div className="card-body"><ProfitSection period={profPeriod} /></div>
        </div>

        {/* Nota informativa */}
        <div className="alert alert-info d-flex gap-2">
          <i className="ti ti-info-circle flex-shrink-0 mt-1" />
          <div>
            La reputación oficial de ML (nivel de ventas, calificaciones) estará disponible en la próxima
            versión con integración directa a la API de ML.
          </div>
        </div>
      </div>
    </div>
  );
}
