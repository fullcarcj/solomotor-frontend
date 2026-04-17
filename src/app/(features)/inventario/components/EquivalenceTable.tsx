"use client";
import type { Equivalence } from "@/types/wms";

interface Props {
  items:   Equivalence[];
  loading: boolean;
  error:   string | null;
  skuQuery: string;
}

function fmtUSD(v: number | string | null): string {
  if (v === null || v === undefined) return "—";
  const n = Number(v);
  return Number.isFinite(n) ? `$${n.toFixed(2)}` : "—";
}

function SkeletonRow() {
  return <tr>{Array.from({ length: 4 }).map((_, i) => <td key={i}><span className="placeholder col-8 rounded" /></td>)}</tr>;
}

export default function EquivalenceTable({ items, loading, error, skuQuery }: Props) {
  if (error) {
    return (
      <div className="alert alert-warning d-flex align-items-center gap-2 mt-2">
        <i className="ti ti-alert-triangle" />
        <span>Sin datos disponibles. {error}</span>
      </div>
    );
  }

  return (
    <div className="table-responsive mt-3">
      <table className="table table-hover table-sm align-middle mb-0">
        <thead className="table-light">
          <tr>
            <th>SKU Equivalente</th>
            <th>Descripción</th>
            <th className="text-end">Precio USD</th>
            <th className="text-end">Stock Disp.</th>
          </tr>
        </thead>
        <tbody>
          {loading
            ? Array.from({ length: 5 }).map((_, i) => <SkeletonRow key={i} />)
            : items.length === 0
            ? (
              <tr>
                <td colSpan={4} className="text-center text-muted py-4">
                  {skuQuery
                    ? `No hay equivalencias para el SKU "${skuQuery}"`
                    : "Ingresa un SKU para buscar equivalencias"}
                </td>
              </tr>
            )
            : items.map((eq, i) => (
              <tr key={`${eq.sku_equivalente}-${i}`}>
                <td><code className="text-body">{eq.sku_equivalente}</code></td>
                <td>{eq.descripcion_equivalente}</td>
                <td className="text-end">{fmtUSD(eq.precio_equivalente)}</td>
                <td className="text-end">
                  <span className={`fw-semibold ${Number(eq.stock_disponible) > 0 ? "text-success" : "text-danger"}`}>
                    {Number(eq.stock_disponible)}
                  </span>
                </td>
              </tr>
            ))}
        </tbody>
      </table>
    </div>
  );
}
