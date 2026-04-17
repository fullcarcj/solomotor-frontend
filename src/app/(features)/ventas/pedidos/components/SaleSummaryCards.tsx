"use client";

import type { Sale, SalesMeta } from "@/types/sales";

export default function SaleSummaryCards({
  sales,
  meta,
}: {
  sales: Sale[];
  meta: SalesMeta;
}) {
  const paid = sales.filter(
    (s) => String(s.status).toLowerCase() === "paid"
  ).length;
  const pending = sales.filter((s) => {
    const st = String(s.status).toLowerCase();
    return st === "pending" || st === "pending_payment";
  }).length;
  const totalUsd = sales.reduce((sum, s) => {
    const n = Number(s.total_usd);
    return sum + (Number.isFinite(n) ? n : 0);
  }, 0);

  return (
    <div className="row g-3 mb-4">
      <div className="col-12 col-sm-6 col-xl-3">
        <div className="card h-100">
          <div className="card-body">
            <div className="text-muted small">Total ventas</div>
            <div className="fs-4 fw-semibold">{meta.total}</div>
          </div>
        </div>
      </div>
      <div className="col-12 col-sm-6 col-xl-3">
        <div className="card h-100 border-success border-opacity-25">
          <div className="card-body">
            <div className="text-muted small">Pagadas</div>
            <div className="fs-4 fw-semibold text-success">{paid}</div>
          </div>
        </div>
      </div>
      <div className="col-12 col-sm-6 col-xl-3">
        <div className="card h-100 border-warning border-opacity-50">
          <div className="card-body">
            <div className="text-muted small">Pendientes</div>
            <div className="fs-4 fw-semibold text-warning">{pending}</div>
          </div>
        </div>
      </div>
      <div className="col-12 col-sm-6 col-xl-3">
        <div className="card h-100 border-primary border-opacity-25">
          <div className="card-body">
            <div className="text-muted small">Total USD (página)</div>
            <div className="fs-4 fw-semibold text-primary">
              ${totalUsd.toFixed(2)}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
