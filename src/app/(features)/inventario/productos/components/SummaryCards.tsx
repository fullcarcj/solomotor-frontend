"use client";

import type { ProductsSummary } from "@/hooks/useProducts";

export default function SummaryCards({ summary }: { summary: ProductsSummary }) {
  return (
    <div className="row g-3 mb-4">
      <div className="col-12 col-sm-6 col-xl-3">
        <div className="card h-100">
          <div className="card-body">
            <div className="text-muted small">Total productos</div>
            <div className="fs-4 fw-semibold">{summary.total_products}</div>
          </div>
        </div>
      </div>
      <div className="col-12 col-sm-6 col-xl-3">
        <div className="card h-100 border-warning border-opacity-50">
          <div className="card-body">
            <div className="text-muted small">
              En alerta stock <span className="text-warning">⚠</span>
            </div>
            <div className="fs-4 fw-semibold text-warning">
              {summary.alerts_count}
            </div>
          </div>
        </div>
      </div>
      <div className="col-12 col-sm-6 col-xl-3">
        <div className="card h-100 border-danger border-opacity-25">
          <div className="card-body">
            <div className="text-muted small">
              Sin stock <span className="text-danger">✗</span>
            </div>
            <div className="fs-4 fw-semibold text-danger">
              {summary.stockout_count}
            </div>
          </div>
        </div>
      </div>
      <div className="col-12 col-sm-6 col-xl-3">
        <div className="card h-100 border-success border-opacity-25">
          <div className="card-body">
            <div className="text-muted small">
              Stock OK <span className="text-success">✓</span>
            </div>
            <div className="fs-4 fw-semibold text-success">
              {summary.ok_count}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
