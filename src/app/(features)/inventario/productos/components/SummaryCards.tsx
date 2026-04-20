"use client";

import type { ProductsSummary } from "@/hooks/useProducts";

interface KpiCellProps {
  label: string;
  icon: string;
  value: number | string;
  variant?: "default" | "warn" | "danger" | "success";
  loading?: boolean;
}

function KpiCell({ label, icon, value, variant = "default", loading }: KpiCellProps) {
  return (
    <div className="pinv-kpi">
      <div className="pinv-kpi__label">
        <i className={`ti ti-${icon} pinv-kpi__icon`} />
        {label}
      </div>
      {loading
        ? <div className="placeholder-glow"><span className="placeholder col-6 rounded" style={{ height: 28 }} /></div>
        : <div className={`pinv-kpi__val pinv-kpi__val--${variant}`}>{value}</div>
      }
    </div>
  );
}

export default function SummaryCards({
  summary,
  loading,
}: {
  summary: ProductsSummary;
  loading?: boolean;
}) {
  return (
    <div className="pinv-kpi-ribbon">
      <KpiCell
        label="Total productos"
        icon="package"
        value={summary.total_products}
        loading={loading}
      />
      <KpiCell
        label="Stock OK"
        icon="circle-check"
        value={summary.ok_count}
        variant="success"
        loading={loading}
      />
      <KpiCell
        label="Stock bajo"
        icon="alert-triangle"
        value={summary.alerts_count}
        variant="warn"
        loading={loading}
      />
      <KpiCell
        label="Sin stock"
        icon="circle-x"
        value={summary.stockout_count}
        variant="danger"
        loading={loading}
      />
    </div>
  );
}
