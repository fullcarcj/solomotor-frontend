"use client";
import { useEffect, useState } from "react";
import type { MlReputation } from "@/types/mercadolibre";

export default function MlReputationWidget() {
  const [data, setData]     = useState<MlReputation | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError]   = useState<string | null>(null);

  useEffect(() => {
    fetch("/api/mercadolibre/reputation", { credentials: "include" })
      .then(async r => {
        const d = await r.json().catch(() => ({})) as Record<string, unknown>;
        if (!r.ok) throw new Error((d.error as string) ?? `HTTP ${r.status}`);
        setData(d as unknown as MlReputation);
      })
      .catch((e: unknown) => setError(e instanceof Error ? e.message : "Error."))
      .finally(() => setLoading(false));
  }, []);

  if (loading) return (
    <div className="card border-0 shadow-sm h-100">
      <div className="card-body placeholder-glow d-flex flex-column gap-2">
        {Array.from({ length: 4 }).map((_, i) => <div key={i} className="placeholder col-8 rounded" style={{ height: 14 }} />)}
      </div>
    </div>
  );

  if (error || !data) return (
    <div className="card border-0 shadow-sm h-100">
      <div className="card-body">
        <div className="alert alert-warning py-2 small mb-0">{error ?? "Sin datos de reputación."}</div>
      </div>
    </div>
  );

  const compRate = Number(data.sales?.completion_rate_pct ?? 0);

  return (
    <div className="card border-0 shadow-sm h-100">
      <div className="card-header bg-transparent border-0 pb-0">
        <h6 className="card-title mb-0 d-flex align-items-center gap-2">
          <i className="ti ti-star text-warning" /> Reputación ML
        </h6>
      </div>
      <div className="card-body pt-2">
        <div className="mb-3">
          <div className="d-flex justify-content-between mb-1">
            <small className="text-muted">Tasa de completación</small>
            <small className={`fw-bold ${compRate >= 95 ? "text-success" : compRate >= 90 ? "text-warning" : "text-danger"}`}>
              {compRate.toFixed(1)}%
            </small>
          </div>
          <div className="progress" style={{ height: 6 }}>
            <div className={`progress-bar ${compRate >= 95 ? "bg-success" : compRate >= 90 ? "bg-warning" : "bg-danger"}`}
                 style={{ width: `${Math.min(100, compRate)}%` }} />
          </div>
        </div>

        <div className="d-flex justify-content-between small mb-2">
          <span className="text-muted">API health 24h</span>
          <span className="fw-semibold">{data.api_health?.success_24h ?? 0} / {data.api_health?.calls_24h ?? 0}</span>
        </div>

        <div className="d-flex justify-content-between small mb-3">
          <span className="text-muted">Período</span>
          <span className="fw-semibold">últimos {data.period_days} días</span>
        </div>

        <div className="alert alert-light border py-2 mb-0 small text-muted">
          <i className="ti ti-info-circle me-1" />
          Métricas locales — integración directa ML en v2
        </div>
      </div>
    </div>
  );
}
