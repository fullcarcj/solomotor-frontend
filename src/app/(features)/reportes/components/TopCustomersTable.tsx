"use client";
import { useRouter } from "next/navigation";
import type { CustomerReport } from "@/types/reportes";
import { all_routes } from "@/data/all_routes";

function fmtBs(v: number | string) {
  const n = Number(v);
  return Number.isFinite(n) ? n.toLocaleString("es-VE", { minimumFractionDigits: 0, maximumFractionDigits: 2 }) : "—";
}

function fmtDate(iso: string | null) {
  if (!iso) return "—";
  try {
    const d = new Date(iso);
    if (Number.isNaN(d.getTime())) return "—";
    return d.toLocaleDateString("es-VE", { day: "2-digit", month: "2-digit", year: "numeric" });
  } catch {
    return "—";
  }
}

export default function TopCustomersTable({ data }: { data: CustomerReport | null }) {
  const router = useRouter();
  const rows = data?.top_customers ?? [];

  if (!data) {
    return (
      <div className="card border-0 shadow-sm">
        <div className="card-header bg-white border-0"><h6 className="mb-0">Top clientes</h6></div>
        <div className="card-body placeholder-glow"><div className="placeholder col-12 rounded" style={{ height: 160 }} /></div>
      </div>
    );
  }

  if (rows.length === 0) {
    return (
      <div className="card border-0 shadow-sm">
        <div className="card-header bg-white border-0"><h6 className="mb-0">Top clientes</h6></div>
        <div className="card-body text-muted small">Sin datos de clientes en este período</div>
      </div>
    );
  }

  return (
    <div className="card border-0 shadow-sm">
      <div className="card-header bg-white border-0">
        <h6 className="mb-0">Top clientes</h6>
      </div>
      <div className="table-responsive">
        <table className="table table-hover table-sm mb-0">
          <thead className="table-light">
            <tr>
              <th>Cliente</th>
              <th className="text-end">Órdenes</th>
              <th className="text-end">Total Bs</th>
              <th className="text-end">Última compra</th>
            </tr>
          </thead>
          <tbody>
            {rows.map((r) => {
              const name = r.full_name?.trim() || `ID #${r.customer_id}`;
              return (
                <tr
                  key={r.customer_id}
                  role="button"
                  style={{ cursor: "pointer" }}
                  onClick={() =>
                    router.push(`${all_routes.clientesHistorial}?id=${r.customer_id}`)
                  }
                >
                  <td>{name}</td>
                  <td className="text-end">{r.orders_count}</td>
                  <td className="text-end">Bs. {fmtBs(r.total_spent_bs)}</td>
                  <td className="text-end">{fmtDate(r.last_purchase)}</td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    </div>
  );
}
