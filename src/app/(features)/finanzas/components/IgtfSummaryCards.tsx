"use client";

import type { FinanceSummary } from "@/types/finanzas";

const MONTH_NAMES = [
  "Enero","Febrero","Marzo","Abril","Mayo","Junio",
  "Julio","Agosto","Septiembre","Octubre","Noviembre","Diciembre",
];

function fmtUsd(v: number | string | null | undefined): string {
  if (v == null) return "—";
  const n = Number(v);
  if (!Number.isFinite(n)) return "—";
  return `$${n.toLocaleString("es-VE", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
}

interface Props {
  summary:         FinanceSummary | null;
  loading:         boolean;
  paymentMethods:  string[];
}

export default function IgtfSummaryCards({ summary, loading, paymentMethods }: Props) {
  const now = new Date();
  const currentMonth = `${MONTH_NAMES[now.getMonth()]} ${now.getFullYear()}`;

  if (loading) {
    return (
      <div className="row g-3 mb-4 placeholder-glow">
        {Array.from({ length: 3 }).map((_, i) => (
          <div key={i} className="col-md-4">
            <div className="card">
              <div className="card-body">
                <p className="placeholder col-6 mb-2" />
                <h4 className="placeholder col-8" />
                <p className="placeholder col-5 mt-2" />
              </div>
            </div>
          </div>
        ))}
      </div>
    );
  }

  if (!summary) return null;

  const { igtf } = summary;

  return (
    <div className="row g-3 mb-4">
      <div className="col-md-4">
        <div className="card border-info border-opacity-50 h-100">
          <div className="card-body">
            <p className="text-muted small mb-1">
              <i className="ti ti-percentage me-1 text-info" />
              Tasa IGTF actual
            </p>
            <h3 className="mb-0 fw-bold text-info">{igtf.rate_pct ?? 3}%</h3>
            <p className="text-muted small mb-0 mt-1">Configurada en finance_settings</p>
          </div>
        </div>
      </div>

      <div className="col-md-4">
        <div className="card h-100">
          <div className="card-body">
            <p className="text-muted small mb-1">
              <i className="ti ti-cash me-1 text-success" />
              IGTF cobrado — {currentMonth}
            </p>
            <h3 className="mb-0 fw-bold">{fmtUsd(igtf.collected_usd)}</h3>
            <p className="text-muted small mb-0 mt-1">
              {igtf.transactions} transacciones con IGTF
            </p>
          </div>
        </div>
      </div>

      <div className="col-md-4">
        <div className="card h-100">
          <div className="card-body">
            <p className="text-muted small mb-1">
              <i className="ti ti-credit-card me-1 text-warning" />
              Métodos que generan IGTF
            </p>
            <div className="d-flex flex-wrap gap-1 mt-2">
              {paymentMethods.length > 0 ? (
                paymentMethods.map((m) => (
                  <span key={m} className="badge bg-warning text-dark">{m}</span>
                ))
              ) : (
                <span className="text-muted small">USD cash, Zelle, Binance, Panamá</span>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
