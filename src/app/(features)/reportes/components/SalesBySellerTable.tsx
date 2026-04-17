"use client";
import type { SalesBySeller } from "@/types/reportes";

function fmtBs(v: number | string) {
  const n = Number(v);
  return Number.isFinite(n) ? n.toLocaleString("es-VE", { minimumFractionDigits: 0, maximumFractionDigits: 2 }) : "—";
}

export default function SalesBySellerTable({
  rows,
  loading,
}: {
  rows:       SalesBySeller[] | undefined;
  loading?:   boolean;
}) {
  if (loading) {
    return (
      <div className="card border-0 shadow-sm mb-4">
        <div className="card-header bg-white border-0">
          <h6 className="mb-0">Por vendedor</h6>
        </div>
        <div className="card-body placeholder-glow">
          <div className="placeholder col-12 rounded" style={{ height: 80 }} />
        </div>
      </div>
    );
  }

  if (!rows || rows.length === 0) {
    return (
      <div className="card border-0 shadow-sm mb-4">
        <div className="card-body text-muted small">Sin datos de vendedor en este período</div>
      </div>
    );
  }

  return (
    <div className="card border-0 shadow-sm mb-4">
      <div className="card-header bg-white border-0">
        <h6 className="mb-0">Por vendedor</h6>
      </div>
      <div className="table-responsive">
        <table className="table table-sm table-hover mb-0">
          <thead className="table-light">
            <tr>
              <th>Vendedor</th>
              <th className="text-end">Órdenes</th>
              <th className="text-end">Revenue Bs</th>
            </tr>
          </thead>
          <tbody>
            {rows.map((r) => (
              <tr key={r.seller}>
                <td>{r.seller}</td>
                <td className="text-end">{r.orders}</td>
                <td className="text-end">Bs. {fmtBs(r.revenue_bs)}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
