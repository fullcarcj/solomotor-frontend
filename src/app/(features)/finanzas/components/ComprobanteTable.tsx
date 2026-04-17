"use client";

import { useState } from "react";
import type { Comprobante } from "@/types/finanzas";
import ComprobanteDetailModal from "./ComprobanteDetailModal";

function fmtDateTime(s: string): string {
  if (!s) return "—";
  const d = new Date(s);
  if (isNaN(d.getTime())) return s;
  return d.toLocaleString("es-VE", {
    day: "2-digit", month: "2-digit",
    hour: "2-digit", minute: "2-digit",
  });
}

function fmtBs(v: number | string | null): string {
  if (v == null) return "—";
  const n = Number(v);
  if (!Number.isFinite(n)) return "—";
  return `Bs. ${n.toLocaleString("es-VE", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
}

function StatusBadge({ status, hasAmount }: { status: string; hasAmount: boolean }) {
  if (!hasAmount) return <span className="badge bg-danger">Fallo extracción</span>;
  const map: Record<string, { cls: string; label: string }> = {
    matched:       { cls: "bg-success",   label: "Conciliado" },
    no_match:      { cls: "bg-warning",   label: "Sin match" },
    pending:       { cls: "bg-info",      label: "Pendiente" },
    manual_review: { cls: "bg-secondary", label: "Revisión" },
  };
  const cfg = map[status?.toLowerCase()] ?? { cls: "bg-secondary", label: status || "—" };
  return <span className={`badge ${cfg.cls}`}>{cfg.label}</span>;
}

function SkeletonRows() {
  return (
    <>
      {Array.from({ length: 8 }).map((_, i) => (
        <tr key={i} className="placeholder-glow">
          {Array.from({ length: 7 }).map((_, j) => (
            <td key={j}><span className="placeholder col-7" /></td>
          ))}
        </tr>
      ))}
    </>
  );
}

interface Props {
  rows:    Comprobante[];
  loading: boolean;
}

export default function ComprobanteTable({ rows, loading }: Props) {
  const [selected, setSelected] = useState<Comprobante | null>(null);

  return (
    <>
      <div className="table-responsive">
        <table className="table table-sm table-hover align-middle mb-0">
          <thead className="table-light">
            <tr>
              <th>Fecha</th>
              <th>Cliente</th>
              <th>Banco</th>
              <th>Monto Bs</th>
              <th>Referencia</th>
              <th>Estado</th>
              <th>Ver</th>
            </tr>
          </thead>
          <tbody>
            {loading ? (
              <SkeletonRows />
            ) : rows.length === 0 ? (
              <tr>
                <td colSpan={7} className="text-center text-muted py-4">
                  Sin comprobantes para los filtros seleccionados
                </td>
              </tr>
            ) : (
              rows.map((row) => {
                const hasAmount = row.extracted_amount_bs != null;
                return (
                  <tr key={row.id}>
                    <td className="text-nowrap small">{fmtDateTime(row.created_at)}</td>
                    <td className="small">
                      {row.customer_name ?? row.customer_phone ?? (
                        <span className="text-muted">Anónimo</span>
                      )}
                    </td>
                    <td className="small">{row.extracted_bank ?? <span className="text-muted">—</span>}</td>
                    <td className={`small ${!hasAmount ? "text-muted" : "fw-semibold"}`}>
                      {hasAmount ? fmtBs(row.extracted_amount_bs) : "No extraído"}
                    </td>
                    <td>
                      <code className="small">{row.extracted_reference ?? "—"}</code>
                    </td>
                    <td>
                      <StatusBadge
                        status={row.reconciliation_status}
                        hasAmount={hasAmount}
                      />
                    </td>
                    <td>
                      <button
                        type="button"
                        className="btn btn-outline-primary btn-sm"
                        onClick={() => setSelected(row)}
                      >
                        <i className="ti ti-eye" />
                      </button>
                    </td>
                  </tr>
                );
              })
            )}
          </tbody>
        </table>
      </div>

      <ComprobanteDetailModal
        comprobante={selected}
        onClose={() => setSelected(null)}
      />
    </>
  );
}
