"use client";

import { useEffect, useState } from "react";
import type { ReconciliationStatus } from "@/types/finanzas";

function fmtTime(iso: string | null | undefined): string {
  if (!iso) return "—";
  try {
    return new Date(iso).toLocaleTimeString("es-VE", { hour: "2-digit", minute: "2-digit" });
  } catch {
    return "—";
  }
}

export default function ReconciliationStatusWidget() {
  const [data, setData] = useState<ReconciliationStatus | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    fetch("/api/finanzas/reconciliation", { credentials: "include" })
      .then((r) => r.json())
      .then((json) => {
        if (json?.data) setData(json.data as ReconciliationStatus);
        else setError("Sin datos");
      })
      .catch(() => setError("Error al cargar conciliación"))
      .finally(() => setLoading(false));
  }, []);

  if (loading) {
    return (
      <div className="card h-100">
        <div className="card-body placeholder-glow">
          <p className="placeholder col-7 mb-3" />
          <p className="placeholder col-10" />
          <p className="placeholder col-6" />
          <div className="progress placeholder mt-3" style={{ height: "12px" }} />
        </div>
      </div>
    );
  }

  if (error || !data) {
    return (
      <div className="card h-100">
        <div className="card-body text-center text-muted py-4">
          <i className="ti ti-alert-circle fs-24 mb-2 d-block" />
          {error ?? "Sin datos de conciliación"}
        </div>
      </div>
    );
  }

  const total = data.total_statements;
  const byStatus = data.by_status ?? [];
  const matched = byStatus.find((s) => s.status === "MATCHED");
  const unmatched = byStatus.find((s) => s.status === "UNMATCHED");
  const manual = byStatus.find((s) => s.status === "MANUAL_REVIEW");

  const matchedCount = Number(matched?.count ?? 0);
  const unmatchedCount = Number(unmatched?.count ?? 0);
  const manualCount = Number(manual?.count ?? 0);
  const matchedPct = total > 0 ? Math.round((matchedCount / total) * 100) : 0;
  const manualPct = total > 0 ? Math.round((manualCount / total) * 100) : 0;

  const lastWorker = data.worker_24h?.[0];

  return (
    <div className="card h-100">
      <div className="card-header d-flex align-items-center gap-2">
        <i className="ti ti-arrows-exchange text-primary" />
        <span className="fw-semibold">Estado de Conciliación</span>
        <span className="ms-auto badge bg-secondary">{total} movimientos</span>
      </div>
      <div className="card-body">
        <div className="row g-2 mb-3">
          <div className="col-6">
            <div className="text-center">
              <div className="fw-bold text-success fs-5">{matchedCount}</div>
              <small className="text-muted">Conciliados</small>
            </div>
          </div>
          <div className="col-6">
            <div className="text-center">
              <div className="fw-bold text-warning fs-5">{unmatchedCount}</div>
              <small className="text-muted">Sin conciliar</small>
            </div>
          </div>
          <div className="col-6">
            <div className="text-center">
              <div className="fw-bold text-info fs-5">{manualCount}</div>
              <small className="text-muted">Revisión manual</small>
            </div>
          </div>
          <div className="col-6">
            <div className="text-center">
              <div className="fw-bold fs-5">{lastWorker ? fmtTime(lastWorker.last_run) : "—"}</div>
              <small className="text-muted">Última corrida</small>
            </div>
          </div>
        </div>

        <div className="progress" style={{ height: "12px" }} role="progressbar">
          <div
            className="progress-bar bg-success"
            style={{ width: `${matchedPct}%` }}
            title={`Conciliados: ${matchedPct}%`}
          />
          <div
            className="progress-bar bg-warning"
            style={{ width: `${manualPct}%` }}
            title={`Revisión: ${manualPct}%`}
          />
          <div
            className="progress-bar bg-danger"
            style={{ width: `${100 - matchedPct - manualPct}%` }}
            title="Sin conciliar"
          />
        </div>
        <div className="d-flex justify-content-between mt-1">
          <small className="text-muted">{matchedPct}% conciliado</small>
          <small className="text-muted">{unmatchedCount} pendientes</small>
        </div>
      </div>
    </div>
  );
}
