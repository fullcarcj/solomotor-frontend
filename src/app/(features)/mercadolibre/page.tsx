"use client";
import { useEffect, useState } from "react";
import Link from "next/link";
import type { MlProfitability } from "@/types/mercadolibre";
import MlStatsCards from "./components/MlStatsCards";
import MlReputationWidget from "./components/MlReputationWidget";

const QUICK_LINKS = [
  { href: "/mercadolibre/preguntas", icon: "ti-message-question", label: "Preguntas",    color: "warning" },
  { href: "/mercadolibre/mapeo",     icon: "ti-arrows-exchange",  label: "Mapeo SKUs",   color: "primary" },
  { href: "/mercadolibre/precios",   icon: "ti-currency-dollar",  label: "Precios",      color: "success" },
  { href: "/mercadolibre/reputacion",icon: "ti-star",             label: "Reputación",   color: "info" },
  { href: "/mercadolibre/mensajes",  icon: "ti-messages",         label: "Mensajes",     color: "secondary" },
];

function fmtUSD(v: number | string) { return `$${Number(v).toFixed(2)}`; }
function fmtPct(v: number | string) { return `${Number(v).toFixed(1)}%`; }

function ProfitabilityTable() {
  const [data, setData]     = useState<MlProfitability | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError]   = useState<string | null>(null);

  useEffect(() => {
    fetch("/api/mercadolibre/profitability?period=month", { credentials: "include" })
      .then(async r => { const d = await r.json().catch(() => ({})) as Record<string, unknown>; if (!r.ok) throw new Error((d.error as string) ?? `HTTP ${r.status}`); setData(d as unknown as MlProfitability); })
      .catch((e: unknown) => setError(e instanceof Error ? e.message : "Error."))
      .finally(() => setLoading(false));
  }, []);

  if (loading) return <div className="placeholder-glow">{Array.from({ length: 6 }).map((_, i) => <div key={i} className="placeholder col-12 rounded mb-2" style={{ height: 28 }} />)}</div>;
  if (error || !data) return <div className="alert alert-warning py-2 small">{error ?? "Sin datos de rentabilidad."}</div>;

  const margin = Number(data.avg_margin_pct ?? 0);
  const payoutColor = margin >= 20 ? "text-success" : margin >= 10 ? "text-warning" : "text-danger";

  return (
    <table className="table table-sm mb-0">
      <tbody>
        <tr><td className="text-muted small">Órdenes</td><td className="text-end">{data.orders_count}</td></tr>
        <tr><td className="text-muted small">Ingresos</td><td className="text-end">{fmtUSD(data.revenue_usd)}</td></tr>
        <tr><td className="text-muted small">Comisiones ML</td><td className="text-end text-danger">−{fmtUSD(data.fees?.sale_fee_usd ?? 0)}</td></tr>
        <tr><td className="text-muted small">Envíos</td><td className="text-end text-danger">−{fmtUSD(data.fees?.shipping_usd ?? 0)}</td></tr>
        <tr><td className="text-muted small">Impuestos</td><td className="text-end text-danger">−{fmtUSD(data.fees?.taxes_usd ?? 0)}</td></tr>
        <tr className="border-top">
          <td className="fw-bold">Neto real</td>
          <td className={`text-end fw-bold fs-5 ${payoutColor}`}>{fmtUSD(data.payout_usd)}</td>
        </tr>
        <tr><td className="text-muted small">Margen promedio</td><td className="text-end">{fmtPct(data.avg_margin_pct ?? 0)}</td></tr>
      </tbody>
    </table>
  );
}

export default function CentralMlPage() {
  return (
    <div className="page-wrapper">
      <div className="content">
        <div className="page-header d-flex justify-content-between align-items-center">
          <div>
            <h4 className="page-title d-flex align-items-center gap-2">
              <span className="badge bg-warning text-dark p-2"><i className="ti ti-brand-tabler" /></span>
              Central MercadoLibre
            </h4>
            <p className="text-muted mb-0">Resumen operativo del canal ML</p>
          </div>
        </div>

        {/* Stats */}
        <div className="row g-3 mb-4">
          <MlStatsCards period="today" />
        </div>

        {/* Acceso rápido */}
        <div className="d-flex flex-wrap gap-2 mb-4">
          {QUICK_LINKS.map(l => (
            <Link key={l.href} href={l.href} className={`btn btn-outline-${l.color} d-flex align-items-center gap-2`}>
              <i className={`ti ${l.icon}`} /> {l.label}
            </Link>
          ))}
        </div>

        {/* Rentabilidad + Reputación */}
        <div className="row g-3">
          <div className="col-md-7">
            <div className="card border-0 shadow-sm h-100">
              <div className="card-header bg-transparent border-0 pb-0">
                <h6 className="card-title mb-0 d-flex align-items-center gap-2">
                  <i className="ti ti-chart-bar text-success" /> Rentabilidad del mes
                </h6>
              </div>
              <div className="card-body pt-2">
                <ProfitabilityTable />
              </div>
            </div>
          </div>
          <div className="col-md-5">
            <MlReputationWidget />
          </div>
        </div>
      </div>
    </div>
  );
}
