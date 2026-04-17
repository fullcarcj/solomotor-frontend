import type { PnlRevenue } from "@/types/pnl";

function fmtBs(v: number | string | null | undefined): string {
  if (v == null || v === "") return "Bs. 0,00";
  const n = Number(String(v).replace(",", "."));
  if (!Number.isFinite(n)) return "Bs. 0,00";
  return `Bs. ${n.toLocaleString("es-VE", {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  })}`;
}

const CHANNEL_CONFIG: {
  key: keyof Omit<PnlRevenue, "total_bs" | "total_usd">;
  label:  string;
  bg:     string;
}[] = [
  { key: "mercadolibre", label: "MercadoLibre", bg: "warning text-dark" },
  { key: "mostrador",    label: "Mostrador",    bg: "primary"           },
  { key: "ecommerce",    label: "E-commerce",   bg: "dark"              },
  { key: "social_media", label: "Redes Soc.",   bg: "info text-dark"    },
];

interface Props {
  revenue: PnlRevenue;
}

export default function RevenueByChannel({ revenue }: Props) {
  const total = Number(revenue.total_bs) || 0;

  const activeChannels = CHANNEL_CONFIG.filter(
    (c) => Number(revenue[c.key]) > 0
  );

  if (activeChannels.length === 0) {
    return (
      <div className="card h-100">
        <div className="card-header">
          <h6 className="card-title mb-0">Ingresos por Canal</h6>
        </div>
        <div className="card-body d-flex align-items-center justify-content-center text-muted">
          Sin ingresos en este período
        </div>
      </div>
    );
  }

  return (
    <div className="card h-100">
      <div className="card-header">
        <h6 className="card-title mb-0">Ingresos por Canal</h6>
      </div>
      <div className="card-body p-0">
        <div className="table-responsive">
          <table className="table table-borderless mb-0">
            <thead className="table-light">
              <tr>
                <th className="ps-3">Canal</th>
                <th className="text-end">Ingresos Bs</th>
                <th className="text-end pe-3">% del Total</th>
              </tr>
            </thead>
            <tbody>
              {activeChannels.map((c) => {
                const val  = Number(revenue[c.key]) || 0;
                const pct  = total > 0 ? (val / total) * 100 : 0;
                return (
                  <tr key={c.key}>
                    <td className="ps-3">
                      <span className={`badge rounded-pill bg-${c.bg} me-1`}>
                        {c.label}
                      </span>
                    </td>
                    <td className="text-end fw-semibold">{fmtBs(val)}</td>
                    <td className="text-end pe-3 text-muted small">
                      {pct.toFixed(1)}%
                    </td>
                  </tr>
                );
              })}
            </tbody>
            <tfoot className="table-light fw-bold">
              <tr>
                <td className="ps-3">TOTAL</td>
                <td className="text-end">{fmtBs(total)}</td>
                <td className="text-end pe-3">100%</td>
              </tr>
            </tfoot>
          </table>
        </div>
      </div>
    </div>
  );
}
