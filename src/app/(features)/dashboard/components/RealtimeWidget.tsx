"use client";

import type { RealtimeData } from "@/types/stats";

function n(v: number | string | undefined | null): string {
  if (v == null || v === "") return "—";
  const x = Number(String(v).replace(",", "."));
  if (!Number.isFinite(x)) return "—";
  return x.toLocaleString("es-VE", { minimumFractionDigits: 2, maximumFractionDigits: 2 });
}

function fmtHms(d: Date): string {
  return d.toLocaleTimeString("es-VE", {
    hour: "2-digit",
    minute: "2-digit",
    second: "2-digit",
  });
}

function fmtHm(iso: string | null): string {
  if (!iso) return "—";
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return "—";
  return d.toLocaleTimeString("es-VE", { hour: "2-digit", minute: "2-digit" });
}

export default function RealtimeWidget({
  realtime,
  lastUpdated,
}: {
  realtime: RealtimeData | null;
  lastUpdated: Date | null;
}) {
  const rt = realtime;
  const w = rt?.reconciliation_worker;

  return (
    <div className="card border-info h-100">
      <div className="card-header py-2 bg-transparent border-info d-flex justify-content-between align-items-center">
        <span className="fw-semibold">Últimos 60 minutos</span>
        {lastUpdated && (
          <span className="text-muted small">
            Actualizado: {fmtHms(lastUpdated)}
          </span>
        )}
      </div>
      <div className="card-body">
        {!rt ? (
          <p className="placeholder-glow mb-0">
            <span className="placeholder col-12 rounded" />
          </p>
        ) : (
          <>
            <div className="row g-2 mb-3">
              <div className="col-4 text-center">
                <div className="fs-4 fw-bold">{rt.last_60min.orders}</div>
                <div className="text-muted small">Órdenes</div>
              </div>
              <div className="col-4 text-center">
                <div className="fs-5 fw-bold">Bs. {n(rt.last_60min.revenue_bs)}</div>
                <div className="text-muted small">Ingresos</div>
              </div>
              <div className="col-4 text-center">
                <div className="fs-4 fw-bold">{rt.last_60min.chats}</div>
                <div className="text-muted small">Chats</div>
              </div>
            </div>

            <hr className="my-2" />

            <dl className="row small mb-0">
              <dt className="col-8 text-muted">Conciliación automática hoy</dt>
              <dd className="col-4 text-end fw-semibold">
                {w?.matched_today ?? "—"}
              </dd>
              <dt className="col-8 text-muted">Pendientes revisión manual</dt>
              <dd className="col-4 text-end fw-semibold">
                {w?.manual_today ?? "—"}
              </dd>
              {w?.last_match_at && (
                <>
                  <dt className="col-8 text-muted">Último match</dt>
                  <dd className="col-4 text-end">{fmtHm(w.last_match_at)}</dd>
                </>
              )}
            </dl>
          </>
        )}
      </div>
    </div>
  );
}
