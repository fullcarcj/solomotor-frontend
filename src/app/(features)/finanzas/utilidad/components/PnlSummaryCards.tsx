import type { PnlData } from "@/types/pnl";

function fmtBs(v: number | string | null | undefined): string {
  if (v == null || v === "") return "—";
  const n = Number(String(v).replace(",", "."));
  if (!Number.isFinite(n)) return "—";
  return `Bs. ${n.toLocaleString("es-VE", {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  })}`;
}

function fmtPct(v: number | string | null | undefined): string {
  if (v == null || v === "") return "—";
  const n = Number(String(v).replace(",", "."));
  if (!Number.isFinite(n)) return "—";
  return `${n.toFixed(1)}%`;
}

interface Props {
  pnl: PnlData;
}

export default function PnlSummaryCards({ pnl }: Props) {
  const profit = Number(pnl.gross_profit_bs);
  const margin = Number(pnl.gross_margin_pct);

  const profitBorderClass =
    profit > 0 ? "border-success" : profit < 0 ? "border-danger" : "border-secondary";
  const profitTextClass =
    profit > 0 ? "text-success" : profit < 0 ? "text-danger" : "text-secondary";
  const marginTextClass =
    margin > 0 ? "text-success" : margin < 0 ? "text-danger" : "text-secondary";

  return (
    <>
      <div className="row g-3 mb-2">
        {/* Ingresos Bs */}
        <div className="col-xl-3 col-sm-6 col-12 d-flex">
          <div className="card flex-fill border-start border-4 border-primary">
            <div className="card-body">
              <div className="d-flex align-items-center justify-content-between mb-1">
                <p className="mb-0 text-muted small fw-semibold text-uppercase">
                  Ingresos del Período
                </p>
                <span className="text-primary fs-20">
                  <i className="ti ti-trending-up" />
                </span>
              </div>
              <h3 className="mb-0 fw-bold">{fmtBs(pnl.revenue.total_bs)}</h3>
              <p className="text-muted small mb-0">
                {fmtBs(pnl.revenue.total_usd).replace("Bs.", "$").replace("VE", "")} USD ≈
              </p>
            </div>
          </div>
        </div>

        {/* Gastos Bs */}
        <div className="col-xl-3 col-sm-6 col-12 d-flex">
          <div className="card flex-fill border-start border-4 border-danger">
            <div className="card-body">
              <div className="d-flex align-items-center justify-content-between mb-1">
                <p className="mb-0 text-muted small fw-semibold text-uppercase">
                  Gastos del Período
                </p>
                <span className="text-danger fs-20">
                  <i className="ti ti-trending-down" />
                </span>
              </div>
              <h3 className="mb-0 fw-bold text-danger">
                {fmtBs(pnl.expenses.total_bs)}
              </h3>
              <p className="text-muted small mb-0">Débitos bancarios del período</p>
            </div>
          </div>
        </div>

        {/* Utilidad Bruta */}
        <div className={`col-xl-3 col-sm-6 col-12 d-flex`}>
          <div className={`card flex-fill border-start border-4 ${profitBorderClass}`}>
            <div className="card-body">
              <div className="d-flex align-items-center justify-content-between mb-1">
                <p className="mb-0 text-muted small fw-semibold text-uppercase">
                  Utilidad Bruta
                </p>
                <span className={`fs-20 ${profitTextClass}`}>
                  <i className={profit >= 0 ? "ti ti-circle-check" : "ti ti-circle-x"} />
                </span>
              </div>
              <h3 className={`mb-0 fw-bold ${profitTextClass}`}>
                {fmtBs(pnl.gross_profit_bs)}
              </h3>
              <p className="text-muted small mb-0">Ingresos − Gastos</p>
            </div>
          </div>
        </div>

        {/* Margen % */}
        <div className="col-xl-3 col-sm-6 col-12 d-flex">
          <div className="card flex-fill border-start border-4 border-info">
            <div className="card-body">
              <div className="d-flex align-items-center justify-content-between mb-1">
                <p className="mb-0 text-muted small fw-semibold text-uppercase">
                  Margen Bruto
                </p>
                <span className="text-info fs-20">
                  <i className="ti ti-percentage" />
                </span>
              </div>
              <h3 className={`mb-0 fw-bold ${marginTextClass}`}>
                {fmtPct(pnl.gross_margin_pct)}
              </h3>
              <p className="text-muted small mb-0">Margen sobre ingresos</p>
            </div>
          </div>
        </div>
      </div>

      <p className="text-muted small mb-3">
        <i className="ti ti-info-circle me-1" />
        * Ingresos de <em>sales_orders</em> únicamente. Ventas POS se integrarán en la
        próxima versión.
      </p>
    </>
  );
}
