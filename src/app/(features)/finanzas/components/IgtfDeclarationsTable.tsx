"use client";

import type { IgtfDeclaration } from "@/types/finanzas";

const MONTH_NAMES = [
  "Enero","Febrero","Marzo","Abril","Mayo","Junio",
  "Julio","Agosto","Septiembre","Octubre","Noviembre","Diciembre",
];

function fmtUsd(v: number | string | null | undefined): string {
  if (v == null) return "—";
  const n = Number(v);
  if (!Number.isFinite(n)) return "—";
  return `$${n.toLocaleString("es-VE", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
}

function fmtDate(s: string | null | undefined): string {
  if (!s) return "—";
  const d = new Date(s);
  if (isNaN(d.getTime())) return s;
  return d.toLocaleDateString("es-VE", { day: "2-digit", month: "2-digit", year: "numeric" });
}

interface Props {
  declarations: IgtfDeclaration[];
  loading:      boolean;
}

function SkeletonRows() {
  return (
    <>
      {Array.from({ length: 4 }).map((_, i) => (
        <tr key={i} className="placeholder-glow">
          <td><span className="placeholder col-6" /></td>
          <td><span className="placeholder col-4" /></td>
          <td><span className="placeholder col-5" /></td>
          <td><span className="placeholder col-4" /></td>
        </tr>
      ))}
    </>
  );
}

export default function IgtfDeclarationsTable({ declarations, loading }: Props) {
  return (
    <div className="table-responsive">
      <table className="table table-sm table-hover align-middle">
        <thead className="table-light">
          <tr>
            <th>Período</th>
            <th>Estado</th>
            <th>Total IGTF</th>
            <th>Cerrado</th>
          </tr>
        </thead>
        <tbody>
          {loading ? (
            <SkeletonRows />
          ) : declarations.length === 0 ? (
            <tr>
              <td colSpan={4} className="text-center text-muted py-5">
                <i className="ti ti-file-off fs-24 d-block mb-2" />
                No hay declaraciones IGTF registradas.
                <br />
                <small>Las declaraciones se generan automáticamente al cerrar un período.</small>
              </td>
            </tr>
          ) : (
            declarations.map((d, idx) => (
              <tr key={idx}>
                <td className="fw-semibold">
                  {MONTH_NAMES[(d.month ?? 1) - 1]} {d.year}
                </td>
                <td>
                  {d.status === "open" ? (
                    <span className="badge bg-warning">Abierto</span>
                  ) : (
                    <span className="badge bg-success">Cerrado</span>
                  )}
                </td>
                <td className="fw-semibold">{fmtUsd(d.total_igtf_usd)}</td>
                <td className="small text-muted">{fmtDate(d.closed_at)}</td>
              </tr>
            ))
          )}
        </tbody>
      </table>
    </div>
  );
}
