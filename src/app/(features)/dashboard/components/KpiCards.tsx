"use client";

import type { OverviewChanges, OverviewToday } from "@/types/stats";
import ChangeBadge from "./ChangeBadge";

function n(v: number | string | undefined | null): string {
  if (v == null || v === "") return "—";
  const x = Number(String(v).replace(",", "."));
  if (!Number.isFinite(x)) return "—";
  return x.toLocaleString("es-VE", { minimumFractionDigits: 2, maximumFractionDigits: 2 });
}

function ni(v: number | undefined | null): string {
  if (v == null) return "—";
  return v.toLocaleString("es-VE");
}

function cardClass(extra?: string) {
  return `card h-100 ${extra ?? ""}`.trim();
}

export default function KpiCards({
  today,
  changes,
}: {
  today: OverviewToday | undefined;
  changes: OverviewChanges | undefined;
}) {
  const t = today;
  const c = changes;

  const pendingBs = t ? Number(t.pending_bs) : 0;
  const pendingOrders = t?.pending_orders ?? 0;

  return (
    <div className="row g-3 mb-4">
      {/* Fila 1 — Ventas */}
      <div className="col-6 col-md-3">
        <div className={cardClass()}>
          <div className="card-body">
            <div className="text-muted small mb-1">Órdenes hoy</div>
            <h3 className="fw-bold mb-0">
              {ni(t?.orders_count)}
              <ChangeBadge pct={c?.orders_pct ?? null} />
            </h3>
          </div>
        </div>
      </div>

      <div className="col-6 col-md-3">
        <div className={cardClass()}>
          <div className="card-body">
            <div className="text-muted small mb-1">Ingresos USD</div>
            <h3 className="fw-bold mb-0">
              ${n(t?.revenue_usd)}
              <ChangeBadge pct={c?.revenue_pct ?? null} />
            </h3>
          </div>
        </div>
      </div>

      <div className="col-6 col-md-3">
        <div className={cardClass()}>
          <div className="card-body">
            <div className="text-muted small mb-1">Cobrado Bs</div>
            <h3 className="fw-bold mb-0">Bs. {n(t?.collected_bs)}</h3>
          </div>
        </div>
      </div>

      <div className="col-6 col-md-3">
        <div
          className={cardClass(
            pendingBs > 0 ? "border-danger border-2" : undefined
          )}
        >
          <div className="card-body">
            <div className="text-muted small mb-1">Pendiente Bs</div>
            <h3
              className={`fw-bold mb-0 ${pendingBs > 0 ? "text-danger" : ""}`}
            >
              Bs. {n(t?.pending_bs)}
            </h3>
          </div>
        </div>
      </div>

      {/* Fila 2 — Operaciones */}
      <div className="col-6 col-md-3">
        <div
          className={cardClass(
            pendingOrders > 0 ? "border-warning border-2" : undefined
          )}
        >
          <div className="card-body">
            <div className="text-muted small mb-1">Órd. pendientes</div>
            <h3
              className={`fw-bold mb-0 ${pendingOrders > 0 ? "text-warning" : ""}`}
            >
              {ni(t?.pending_orders)}
            </h3>
          </div>
        </div>
      </div>

      <div className="col-6 col-md-3">
        <div className={cardClass()}>
          <div className="card-body">
            <div className="text-muted small mb-1">Clientes nuevos</div>
            <h3 className="fw-bold mb-0">{ni(t?.new_customers)}</h3>
          </div>
        </div>
      </div>

      <div className="col-6 col-md-3">
        <div className={cardClass()}>
          <div className="card-body">
            <div className="text-muted small mb-1">Msgs recibidos</div>
            <h3 className="fw-bold mb-0">{ni(t?.messages_received)}</h3>
          </div>
        </div>
      </div>

      <div className="col-6 col-md-3">
        <div className={cardClass()}>
          <div className="card-body">
            <div className="text-muted small mb-1">Concil. manual</div>
            <h3 className="fw-bold mb-0">{ni(t?.manual_pending)}</h3>
          </div>
        </div>
      </div>
    </div>
  );
}
