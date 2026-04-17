"use client";
import type { CompatResult } from "@/types/wms";

interface Props {
  items:    CompatResult[];
  loading:  boolean;
  error:    string | null;
  searched: boolean;
}

function fmtUSD(v: number | string | null): string {
  if (v === null || v === undefined) return "—";
  const n = Number(v);
  return Number.isFinite(n) ? `$${n.toFixed(2)}` : "—";
}

function SkeletonRow() {
  return <tr>{Array.from({ length: 5 }).map((_, i) => <td key={i}><span className="placeholder col-8 rounded" /></td>)}</tr>;
}

export default function CompatResultsTable({ items, loading, error, searched }: Props) {
  if (!searched && !loading) {
    return (
      <div className="text-center text-muted py-5">
        <i className="ti ti-car fs-2 d-block mb-2" />
        Completa el formulario y haz clic en Buscar
      </div>
    );
  }

  if (error) {
    return (
      <div className="alert alert-warning d-flex align-items-center gap-2 mt-3">
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
            <th>SKU</th>
            <th>Descripción</th>
            <th className="text-end">Precio USD</th>
            <th className="text-end">Stock Disp.</th>
            <th>Años compat.</th>
          </tr>
        </thead>
        <tbody>
          {loading
            ? Array.from({ length: 6 }).map((_, i) => <SkeletonRow key={i} />)
            : items.length === 0
            ? (
              <tr>
                <td colSpan={5} className="text-center text-muted py-4">
                  No se encontraron productos compatibles con ese vehículo
                </td>
              </tr>
            )
            : items.map((c) => (
              <tr key={c.compat_id}>
                <td><code className="text-body">{c.producto_sku}</code></td>
                <td>{c.descripcion}</td>
                <td className="text-end">{fmtUSD(c.precio_usd)}</td>
                <td className="text-end">
                  <span className={`fw-semibold ${Number(c.stock_available) > 0 ? "text-success" : "text-danger"}`}>
                    {Number(c.stock_available)}
                  </span>
                </td>
                <td>
                  <span className="badge bg-light text-dark border">
                    {c.year_start}–{c.year_end}
                  </span>
                </td>
              </tr>
            ))}
        </tbody>
      </table>
    </div>
  );
}
