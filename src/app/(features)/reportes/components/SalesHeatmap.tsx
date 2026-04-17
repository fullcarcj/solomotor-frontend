"use client";
import { useMemo } from "react";
import type { HourlyReport } from "@/types/reportes";
import { buildHeatmapMatrix } from "../lib/parseReportData";

const DOW_LABELS = ["Lun", "Mar", "Mié", "Jue", "Vie", "Sáb", "Dom"];

/** Columnas: buckets de 2h → etiqueta hora inicio */
const HOUR_LABELS = Array.from({ length: 12 }, (_, i) => `${i * 2}h`);

function cellBg(orders: number, max: number): string {
  if (max <= 0 || orders <= 0) return "rgba(13, 110, 253, 0.06)";
  const t = Math.min(1, orders / max);
  const alpha = 0.12 + t * 0.78;
  return `rgba(13, 110, 253, ${alpha.toFixed(3)})`;
}

function fmtBs(v: number) {
  if (!Number.isFinite(v) || v === 0) return "Bs. 0";
  return `Bs. ${v.toLocaleString("es-VE", { minimumFractionDigits: 0, maximumFractionDigits: 2 })}`;
}

export default function SalesHeatmap({
  data,
  loading,
}: {
  data:     HourlyReport | null;
  loading?: boolean;
}) {
  const { matrix, maxOrders } = useMemo(() => {
    if (!data) return { matrix: null as ReturnType<typeof buildHeatmapMatrix> | null, maxOrders: 0 };
    const m = buildHeatmapMatrix(data);
    let max = 0;
    for (const row of m.orders) {
      for (const v of row) max = Math.max(max, v);
    }
    return { matrix: m, maxOrders: max };
  }, [data]);

  if (loading) {
    return (
      <div className="card border-0 shadow-sm mb-4">
        <div className="card-header bg-white border-0">
          <h6 className="mb-0">Actividad por día y hora</h6>
        </div>
        <div className="card-body placeholder-glow">
          <div className="placeholder col-12 rounded" style={{ height: 220 }} />
        </div>
      </div>
    );
  }

  if (!data || maxOrders === 0) {
    return (
      <div className="card border-0 shadow-sm mb-4">
        <div className="card-header bg-white border-0">
          <h6 className="mb-0">Actividad por día y hora</h6>
        </div>
        <div className="card-body text-muted small">Sin datos suficientes</div>
      </div>
    );
  }

  if (!matrix) return null;

  return (
    <div className="card border-0 shadow-sm mb-4">
      <div className="card-header bg-white border-0 d-flex justify-content-between align-items-center flex-wrap gap-2">
        <h6 className="mb-0">Actividad por día y hora (órdenes)</h6>
        {data.weeks != null && (
          <span className="badge bg-light text-dark border">Últimas {data.weeks} semana(s)</span>
        )}
      </div>
      <div className="card-body p-2">
        <div className="table-responsive">
          <table className="table table-bordered table-sm mb-0 text-center small" style={{ fontSize: 12 }}>
            <thead>
              <tr>
                <th className="text-muted bg-light" style={{ minWidth: 36 }} />
                {HOUR_LABELS.map((h) => (
                  <th key={h} className="text-muted bg-light px-1">{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {DOW_LABELS.map((dow, d) => (
                <tr key={dow}>
                  <th className="text-muted bg-light text-nowrap pe-1">{dow}</th>
                  {matrix.orders[d].map((orders, h) => {
                    const rev = matrix.revenue[d][h];
                    const title = `${orders} órdenes, ${fmtBs(rev)}`;
                    return (
                      <td
                        key={h}
                        style={{
                          backgroundColor: cellBg(orders, maxOrders),
                          minWidth: 28,
                          cursor: orders > 0 ? "default" : undefined,
                        }}
                        title={title}
                      >
                        {orders > 0 ? orders : ""}
                      </td>
                    );
                  })}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        <p className="text-muted small mb-0 mt-2 px-1">
          Más intenso = más órdenes. Pasa el cursor sobre una celda para ver el detalle.
        </p>
      </div>
    </div>
  );
}
