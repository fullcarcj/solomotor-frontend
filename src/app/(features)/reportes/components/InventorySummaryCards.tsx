"use client";
import type { InventoryReport } from "@/types/reportes";

function fmtUsd(v: number | string) {
  const n = Number(v);
  return Number.isFinite(n) ? n.toLocaleString("es-VE", { minimumFractionDigits: 2, maximumFractionDigits: 2 }) : "—";
}

export default function InventorySummaryCards({ data }: { data: InventoryReport | null }) {
  if (!data) {
    return (
      <div className="row g-3 mb-4">
        {Array.from({ length: 5 }).map((_, i) => (
          <div key={i} className="col-6 col-lg">
            <div className="card border-0 shadow-sm placeholder-glow">
              <div className="card-body"><div className="placeholder col-12 rounded" style={{ height: 56 }} /></div>
            </div>
          </div>
        ))}
      </div>
    );
  }

  const s = data.summary;
  const skusWithStock =
    typeof s.skus_with_stock === "number"
      ? s.skus_with_stock
      : Math.max(0, s.total_skus - s.stockout_count);

  const stockVal = Number(s.stock_value_usd);
  const showValUsd = Number.isFinite(stockVal) && stockVal > 0;

  return (
    <div className="row g-3 mb-4">
      <div className="col-6 col-lg">
        <div className="card border-0 shadow-sm h-100">
          <div className="card-body">
            <div className="text-muted small mb-1">Total SKUs</div>
            <div className="fs-5 fw-bold text-primary">{s.total_skus}</div>
          </div>
        </div>
      </div>
      <div className="col-6 col-lg">
        <div className="card border-0 shadow-sm h-100">
          <div className="card-body">
            <div className="text-muted small mb-1">Con stock</div>
            <div className="fs-5 fw-bold text-success">{skusWithStock}</div>
          </div>
        </div>
      </div>
      <div className="col-6 col-lg">
        <div className="card border-0 shadow-sm h-100">
          <div className="card-body">
            <div className="d-flex align-items-center justify-content-between gap-2 mb-1">
              <span className="text-muted small">Sin stock</span>
              {s.stockout_count > 0 && <span className="badge bg-danger">Stockout</span>}
            </div>
            <div className="fs-5 fw-bold text-danger">{s.stockout_count}</div>
          </div>
        </div>
      </div>
      <div className="col-6 col-lg">
        <div className="card border-0 shadow-sm h-100">
          <div className="card-body">
            <div className="d-flex align-items-center justify-content-between gap-2 mb-1">
              <span className="text-muted small">Stock bajo</span>
              {s.low_stock_count > 0 && <span className="badge bg-warning text-dark">Bajo</span>}
            </div>
            <div className="fs-5 fw-bold text-warning">{s.low_stock_count}</div>
          </div>
        </div>
      </div>
      <div className="col-12 col-lg">
        <div className="card border-0 shadow-sm h-100">
          <div className="card-body">
            <div className="text-muted small mb-1">Valor inventario (USD)</div>
            {showValUsd ? (
              <div className="fs-5 fw-bold text-primary">${fmtUsd(s.stock_value_usd)}</div>
            ) : (
              <>
                <div className="fs-5 fw-bold text-muted">—</div>
                <div className="text-muted small mt-1">Requiere costo en productos</div>
              </>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
