"use client";

import type { Quotation } from "@/types/quotations";

export default function QuotationSummaryCards({
  items,
  total,
}: {
  items: Quotation[];
  total: number;
}) {
  const draft = items.filter(
    (q) => String(q.status).toLowerCase() === "draft"
  ).length;
  const sent = items.filter(
    (q) => String(q.status).toLowerCase() === "sent"
  ).length;

  return (
    <div className="row g-3 mb-4">
      <div className="col-12 col-md-4">
        <div className="card h-100">
          <div className="card-body">
            <div className="text-muted small">Total</div>
            <div className="fs-4 fw-semibold">{total}</div>
          </div>
        </div>
      </div>
      <div className="col-12 col-md-4">
        <div className="card h-100 border-secondary border-opacity-25">
          <div className="card-body">
            <div className="text-muted small">Borradores</div>
            <div className="fs-4 fw-semibold text-secondary">{draft}</div>
          </div>
        </div>
      </div>
      <div className="col-12 col-md-4">
        <div className="card h-100 border-primary border-opacity-25">
          <div className="card-body">
            <div className="text-muted small">Enviadas</div>
            <div className="fs-4 fw-semibold text-primary">{sent}</div>
          </div>
        </div>
      </div>
    </div>
  );
}
