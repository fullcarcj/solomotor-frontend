"use client";
import { useEffect, useState } from "react";
import type { MlStats } from "@/types/mercadolibre";

interface Props {
  period?: string;
}

function Skeleton() {
  return (
    <div className="col-6 col-lg-3">
      <div className="card border-0 shadow-sm">
        <div className="card-body placeholder-glow">
          <div className="placeholder col-5 rounded mb-2" style={{ height: 12 }} />
          <div className="placeholder col-8 rounded" style={{ height: 28 }} />
        </div>
      </div>
    </div>
  );
}

export default function MlStatsCards({ period = "today" }: Props) {
  const [stats, setStats]   = useState<MlStats | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    setLoading(true);
    fetch(`/api/mercadolibre/stats?period=${period}`, { credentials: "include" })
      .then(async r => { const d = await r.json().catch(() => null); if (d) setStats(d as MlStats); })
      .catch(() => null)
      .finally(() => setLoading(false));
  }, [period]);

  if (loading) return <>{Array.from({ length: 4 }).map((_, i) => <Skeleton key={i} />)}</>;

  const ordenes    = stats?.orders?.count          ?? 0;
  const activas    = stats?.listings?.active        ?? 0;
  const pendientes = stats?.questions?.pending_total ?? 0;
  const sinStock   = stats?.listings?.zero_stock    ?? 0;

  const cards = [
    { label: "Órdenes hoy",     value: ordenes,    border: "",               icon: "ti-shopping-cart" },
    { label: "Listings activos",value: activas,    border: "",               icon: "ti-list" },
    { label: "Preguntas pend.", value: pendientes, border: pendientes > 0 ? "border-warning" : "", icon: "ti-message-question" },
    { label: "Sin stock",       value: sinStock,   border: sinStock > 0 ? "border-danger" : "",    icon: "ti-package-off" },
  ];

  return (
    <>
      {cards.map(c => (
        <div key={c.label} className="col-6 col-lg-3">
          <div className={`card shadow-sm h-100 ${c.border || "border-0"}`}>
            <div className="card-body d-flex align-items-center gap-3">
              <div className="rounded-circle bg-primary bg-opacity-10 d-flex align-items-center justify-content-center flex-shrink-0"
                   style={{ width: 44, height: 44 }}>
                <i className={`ti ${c.icon} text-primary fs-5`} />
              </div>
              <div>
                <div className="text-muted small">{c.label}</div>
                <div className="fw-bold fs-4 lh-1">{c.value.toLocaleString()}</div>
              </div>
            </div>
          </div>
        </div>
      ))}
    </>
  );
}
