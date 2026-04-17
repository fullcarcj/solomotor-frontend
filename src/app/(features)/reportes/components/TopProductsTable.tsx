"use client";
import Link from "next/link";
import { all_routes } from "@/data/all_routes";
import type { ProductReport } from "@/types/reportes";

function fmtUsd(v: number | string) {
  const n = Number(v);
  return Number.isFinite(n) ? n.toLocaleString("es-VE", { minimumFractionDigits: 2, maximumFractionDigits: 2 }) : "—";
}

export default function TopProductsTable({ data }: { data: ProductReport | null }) {
  const rows = data?.top_products ?? [];

  if (!data) {
    return (
      <div className="card border-0 shadow-sm">
        <div className="card-header bg-white border-0"><h6 className="mb-0">Detalle</h6></div>
        <div className="card-body placeholder-glow"><div className="placeholder col-12 rounded" style={{ height: 120 }} /></div>
      </div>
    );
  }

  if (rows.length === 0) {
    return (
      <div className="card border-0 shadow-sm">
        <div className="card-header bg-white border-0"><h6 className="mb-0">Detalle</h6></div>
        <div className="card-body text-muted small">
          <p className="mb-1">Sin datos de productos vendidos.</p>
          <p className="mb-0">
            Requiere líneas de detalle en las órdenes. Si las ventas ML no tienen ítems importados en{" "}
            <code>sales_order_items</code>, este listado puede quedar vacío.
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="card border-0 shadow-sm">
      <div className="card-header bg-white border-0">
        <h6 className="mb-0">Detalle</h6>
      </div>
      <div className="table-responsive">
        <table className="table table-sm table-hover mb-0">
          <thead className="table-light">
            <tr>
              <th>SKU</th>
              <th>Producto</th>
              <th className="text-end">Unidades</th>
              <th className="text-end">Revenue USD</th>
              <th className="text-end">Precio prom.</th>
              <th className="text-end">Órdenes</th>
            </tr>
          </thead>
          <tbody>
            {rows.map((r) => (
              <tr key={r.sku}>
                <td>
                  <Link
                    href={`${all_routes.inventarioProductos}?search=${encodeURIComponent(r.sku)}`}
                    className="font-monospace small"
                  >
                    {r.sku}
                  </Link>
                </td>
                <td>{r.part_name}</td>
                <td className="text-end">{r.units_sold}</td>
                <td className="text-end">${fmtUsd(r.revenue_usd)}</td>
                <td className="text-end">${fmtUsd(r.avg_price_usd)}</td>
                <td className="text-end">{r.orders_count}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
