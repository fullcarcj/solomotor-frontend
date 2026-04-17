"use client";
import type { CustomerReport } from "@/types/reportes";

export default function CustomerMetricsCards({ data }: { data: CustomerReport | null }) {
  if (!data) {
    return (
      <div className="row g-3 mb-4">
        {Array.from({ length: 3 }).map((_, i) => (
          <div key={i} className="col-md-4">
            <div className="card border-0 shadow-sm placeholder-glow">
              <div className="card-body"><div className="placeholder col-12 rounded" style={{ height: 56 }} /></div>
            </div>
          </div>
        ))}
      </div>
    );
  }

  const topSource = [...data.by_source].sort((a, b) => b.count - a.count)[0];

  return (
    <div className="row g-3 mb-4">
      <div className="col-md-4">
        <div className="card border-0 shadow-sm h-100">
          <div className="card-body">
            <div className="text-muted small mb-1">Clientes activos</div>
            <div className="fs-5 fw-bold text-primary">{data.total_active}</div>
          </div>
        </div>
      </div>
      <div className="col-md-4">
        <div className="card border-0 shadow-sm h-100">
          <div className="card-body">
            <div className="text-muted small mb-1">Nuevos este período</div>
            <div className="fs-5 fw-bold text-success">{data.new_this_period}</div>
          </div>
        </div>
      </div>
      <div className="col-md-4">
        <div className="card border-0 shadow-sm h-100">
          <div className="card-body">
            <div className="text-muted small mb-1">Principal fuente</div>
            {topSource ? (
              <>
                <div className="fs-6 fw-semibold">{topSource.source}</div>
                <div className="text-muted small">{topSource.count} clientes</div>
              </>
            ) : (
              <div className="text-muted">—</div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
