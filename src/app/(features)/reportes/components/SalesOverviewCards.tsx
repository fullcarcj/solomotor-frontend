"use client";
import type { SalesReport } from "@/types/reportes";

function fmtBs(v: number | string) {
  const n = Number(v);
  return Number.isFinite(n) ? n.toLocaleString("es-VE", { minimumFractionDigits: 0, maximumFractionDigits: 2 }) : "—";
}

function fmtUsd(v: number | string) {
  const n = Number(v);
  return Number.isFinite(n) ? `$${n.toLocaleString("es-VE", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}` : "—";
}

export default function SalesOverviewCards({ data }: { data: SalesReport | null }) {
  if (!data) {
    return (
      <div className="row g-3 mb-4">
        {Array.from({ length: 4 }).map((_, i) => (
          <div key={i} className="col-6 col-md-3">
            <div className="card border-0 shadow-sm placeholder-glow">
              <div className="card-body"><div className="placeholder col-12 rounded" style={{ height: 48 }} /></div>
            </div>
          </div>
        ))}
      </div>
    );
  }

  const cards = [
    { label: "Total Bs", value: `Bs. ${fmtBs(data.total_bs)}`, icon: "ti-currency-dram", color: "primary" },
    { label: "Total órdenes", value: String(data.total_orders), icon: "ti-shopping-cart", color: "success" },
    { label: "Ticket prom. Bs", value: `Bs. ${fmtBs(data.avg_ticket_bs)}`, icon: "ti-receipt", color: "info" },
    { label: "Total USD", value: fmtUsd(data.total_usd), icon: "ti-currency-dollar", color: "warning" },
  ];

  return (
    <div className="row g-3 mb-4">
      {cards.map((c) => (
        <div key={c.label} className="col-6 col-md-3">
          <div className="card border-0 shadow-sm h-100">
            <div className="card-body">
              <div className="text-muted small mb-1 d-flex align-items-center gap-2">
                <i className={`ti ${c.icon}`} /> {c.label}
              </div>
              <div className={`fs-5 fw-bold text-${c.color}`}>{c.value}</div>
            </div>
          </div>
        </div>
      ))}
    </div>
  );
}
