"use client";

import type { FinanceSummary, FinancePeriod } from "@/types/finanzas";

function fmtBs(v: number | string | null | undefined): string {
  if (v == null || v === "") return "—";
  const n = Number(String(v).replace(",", "."));
  if (!Number.isFinite(n)) return "—";
  return `Bs. ${n.toLocaleString("es-VE", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
}

function fmtUsd(v: number | string | null | undefined): string {
  if (v == null || v === "") return "—";
  const n = Number(String(v).replace(",", "."));
  if (!Number.isFinite(n)) return "—";
  return `$${n.toLocaleString("es-VE", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
}

interface Props {
  summary: FinanceSummary | null;
  loading: boolean;
}

function SkeletonCard() {
  return (
    <div className="col">
      <div className="card h-100">
        <div className="card-body placeholder-glow">
          <p className="placeholder col-6 mb-2" />
          <h4 className="placeholder col-8 mb-0" />
          <p className="placeholder col-5 mt-2" />
        </div>
      </div>
    </div>
  );
}

export default function FinanceSummaryCards({ summary, loading }: Props) {
  if (loading) {
    return (
      <div className="row row-cols-1 row-cols-md-3 g-3 mb-4">
        {Array.from({ length: 6 }).map((_, i) => <SkeletonCard key={i} />)}
      </div>
    );
  }

  if (!summary) return null;

  const balance = Number(summary.cashflow.balance_bs ?? 0);
  const balancePositive = balance >= 0;
  const unjustified = Number(summary.unjustified_debits ?? 0);
  const matched = Number(summary.comprobantes_wa?.matched ?? 0);
  const total = Number(summary.comprobantes_wa?.total_attempts ?? 0);

  return (
    <div className="row row-cols-1 row-cols-md-3 g-3 mb-4">
      {/* Fila 1: cashflow */}
      <div className="col">
        <div className="card h-100 border-success border-opacity-50">
          <div className="card-body">
            <p className="text-muted small mb-1">
              <i className="ti ti-arrow-up me-1 text-success" />
              Ingresos Bs
            </p>
            <h4 className="mb-0 text-success fw-bold">{fmtBs(summary.cashflow.ingresos_bs)}</h4>
            <p className="text-muted small mb-0 mt-1">Banesco — período seleccionado</p>
          </div>
        </div>
      </div>

      <div className="col">
        <div className="card h-100 border-danger border-opacity-50">
          <div className="card-body">
            <p className="text-muted small mb-1">
              <i className="ti ti-arrow-down me-1 text-danger" />
              Egresos Bs
            </p>
            <h4 className="mb-0 text-danger fw-bold">{fmtBs(summary.cashflow.egresos_bs)}</h4>
            <p className="text-muted small mb-0 mt-1">Banesco — período seleccionado</p>
          </div>
        </div>
      </div>

      <div className="col">
        <div className={`card h-100 border-${balancePositive ? "success" : "danger"} border-opacity-50`}>
          <div className="card-body">
            <p className="text-muted small mb-1">
              <i className={`ti ti-scale me-1 text-${balancePositive ? "success" : "danger"}`} />
              Balance Bs
            </p>
            <h4 className={`mb-0 fw-bold text-${balancePositive ? "success" : "danger"}`}>
              {fmtBs(summary.cashflow.balance_bs)}
            </h4>
            <p className="text-muted small mb-0 mt-1">
              {summary.cashflow.total_movimientos} movimientos
            </p>
          </div>
        </div>
      </div>

      {/* Fila 2: IGTF, comprobantes, débitos */}
      <div className="col">
        <div className="card h-100 border-info border-opacity-50">
          <div className="card-body">
            <p className="text-muted small mb-1">
              <i className="ti ti-receipt-tax me-1 text-info" />
              IGTF cobrado
            </p>
            <h4 className="mb-0 fw-bold text-info">{fmtUsd(summary.igtf.collected_usd)}</h4>
            <p className="text-muted small mb-0 mt-1">
              Tasa {summary.igtf.rate_pct ?? 3}% — {summary.igtf.transactions} transacciones
            </p>
          </div>
        </div>
      </div>

      <div className="col">
        <div className="card h-100">
          <div className="card-body">
            <p className="text-muted small mb-1">
              <i className="ti ti-brand-whatsapp me-1 text-success" />
              Comprobantes WA
            </p>
            <h4 className="mb-0 fw-bold">
              {matched}/{total}
            </h4>
            <p className="text-muted small mb-0 mt-1">
              conciliados
              {total > 0 && ` (${Number(summary.comprobantes_wa.match_rate_pct).toFixed(0)}%)`}
            </p>
          </div>
        </div>
      </div>

      <div className="col">
        <div className={`card h-100${unjustified > 0 ? " border-warning" : ""}`}>
          <div className="card-body">
            <p className="text-muted small mb-1">
              <i className={`ti ti-alert-triangle me-1 ${unjustified > 0 ? "text-warning" : "text-muted"}`} />
              Sin justificar
            </p>
            <h4 className={`mb-0 fw-bold ${unjustified > 0 ? "text-warning" : ""}`}>
              {unjustified}
            </h4>
            <p className="text-muted small mb-0 mt-1">débitos pendientes</p>
          </div>
        </div>
      </div>
    </div>
  );
}
