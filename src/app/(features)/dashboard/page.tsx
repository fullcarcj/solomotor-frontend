"use client";

import CommonFooter from "@/core/common/footer/commonFooter";
import { useDashboard } from "@/hooks/useDashboard";
import AlertsPanel from "./components/AlertsPanel";
import ChannelBreakdown from "./components/ChannelBreakdown";
import KpiCards from "./components/KpiCards";
import RealtimeWidget from "./components/RealtimeWidget";

function fmtTime(d: Date): string {
  return d.toLocaleTimeString("es-VE", {
    hour: "2-digit",
    minute: "2-digit",
    second: "2-digit",
  });
}

export default function DashboardPage() {
  const { overview, realtime, loading, error, lastUpdated, refetch } =
    useDashboard();

  if (loading && !overview) {
    return (
      <div className="page-wrapper">
        <div className="content d-flex align-items-center justify-content-center min-vh-50">
          <div className="text-center">
            <div
              className="spinner-border text-primary"
              role="status"
              aria-label="Cargando"
            />
            <p className="text-muted mt-2 small">Cargando dashboard…</p>
          </div>
        </div>
      </div>
    );
  }

  if (error && !overview) {
    return (
      <div className="page-wrapper">
        <div className="content">
          <div className="alert alert-danger d-flex align-items-center gap-3" role="alert">
            <span>{error}</span>
            <button
              type="button"
              className="btn btn-sm btn-outline-danger ms-auto"
              onClick={() => void refetch()}
            >
              Reintentar
            </button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="page-wrapper">
      <div className="content">
        {/* Header */}
        <div className="page-header d-flex flex-wrap align-items-center justify-content-between gap-2 mb-4">
          <div>
            <h4 className="mb-0">
              Dashboard{" "}
              {!loading && (
                <span className="badge badge-live ms-2">● En vivo</span>
              )}
            </h4>
            {lastUpdated && (
              <p className="text-muted small mb-0">
                Última actualización: {fmtTime(lastUpdated)}
              </p>
            )}
          </div>
          {error && (
            <div className="alert alert-warning py-1 px-2 mb-0 small d-flex align-items-center gap-2">
              {error}
              <button
                type="button"
                className="btn btn-sm btn-warning py-0"
                onClick={() => void refetch()}
              >
                Reintentar
              </button>
            </div>
          )}
        </div>

        {/* Alertas */}
        <AlertsPanel alerts={overview?.alerts ?? []} />

        {/* KPIs */}
        <KpiCards
          today={overview?.today}
          changes={overview?.changes}
        />

        {/* Realtime + Canal */}
        <div className="row g-3 mb-4">
          <div className="col-md-8">
            <RealtimeWidget realtime={realtime} lastUpdated={lastUpdated} />
          </div>
          <div className="col-md-4">
            <ChannelBreakdown
              totalOrders={overview?.today?.orders_count}
            />
          </div>
        </div>

        <CommonFooter />
      </div>
    </div>
  );
}
