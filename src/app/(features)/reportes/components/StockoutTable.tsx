"use client";
import Link from "next/link";
import { all_routes } from "@/data/all_routes";
import type { InventoryReport } from "@/types/reportes";

export default function StockoutTable({ data }: { data: InventoryReport | null }) {
  const rows = data?.stockouts ?? [];

  if (!data) {
    return (
      <div className="card border-0 shadow-sm h-100">
        <div className="card-header bg-white border-0"><h6 className="mb-0">SKUs sin stock</h6></div>
        <div className="card-body placeholder-glow"><div className="placeholder col-12 rounded" style={{ height: 200 }} /></div>
      </div>
    );
  }

  if (rows.length === 0) {
    return (
      <div className="card border-0 shadow-sm h-100">
        <div className="card-header bg-white border-0"><h6 className="mb-0">SKUs sin stock</h6></div>
        <div className="card-body">
          <div className="alert alert-success mb-0 small">
            Excelente — sin stockouts actualmente
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="card border-0 shadow-sm h-100">
      <div className="card-header bg-white border-0">
        <h6 className="mb-0">SKUs sin stock ({rows.length})</h6>
      </div>
      <div className="table-responsive">
        <table className="table table-sm table-hover mb-0">
          <thead className="table-light">
            <tr>
              <th>SKU</th>
              <th>Nombre</th>
              <th>Categoría</th>
              <th />
            </tr>
          </thead>
          <tbody>
            {rows.map((r) => (
              <tr key={r.sku}>
                <td><code className="small">{r.sku}</code></td>
                <td>{r.name}</td>
                <td>{r.category}</td>
                <td className="text-end">
                  <Link
                    href={`${all_routes.inventarioProductos}?search=${encodeURIComponent(r.sku)}`}
                    className="small"
                  >
                    Ver producto →
                  </Link>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
