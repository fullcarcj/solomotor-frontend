"use client";
import { useMemo } from "react";
import type { SalesBySource } from "@/types/reportes";
import SaleSourceBadge from "@/app/(features)/ventas/pedidos/components/SaleSourceBadge";

function fmtBs(v: number | string) {
  const n = Number(v);
  return Number.isFinite(n) ? n.toLocaleString("es-VE", { minimumFractionDigits: 0, maximumFractionDigits: 2 }) : "—";
}

function fmtPct(v: number | string) {
  const n = Number(v);
  return Number.isFinite(n) ? `${n.toFixed(1)}%` : "—";
}

export default function SalesByChannelTable({ rows }: { rows: SalesBySource[] }) {
  const sorted = useMemo(
    () => [...rows].sort((a, b) => Number(b.revenue_bs) - Number(a.revenue_bs)),
    [rows]
  );

  return (
    <div className="card border-0 shadow-sm h-100">
      <div className="card-header bg-white border-0">
        <h6 className="mb-0">Resumen por canal</h6>
      </div>
      <div className="card-body p-0">
        <div className="table-responsive">
          <table className="table table-sm table-hover mb-0">
            <thead className="table-light">
              <tr>
                <th>Canal</th>
                <th className="text-end">Órdenes</th>
                <th className="text-end">Revenue Bs</th>
                <th className="text-end">% Total</th>
                <th className="text-end">Ticket prom.</th>
                <th className="text-end">% Cancel.</th>
              </tr>
            </thead>
            <tbody>
              {sorted.map((r) => (
                <tr key={r.source}>
                  <td><SaleSourceBadge source={r.source} /></td>
                  <td className="text-end">{r.orders}</td>
                  <td className="text-end">Bs. {fmtBs(r.revenue_bs)}</td>
                  <td className="text-end">{fmtPct(r.pct_of_total)}</td>
                  <td className="text-end">Bs. {fmtBs(r.avg_ticket_bs)}</td>
                  <td className="text-end">{fmtPct(r.cancelled_pct)}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
