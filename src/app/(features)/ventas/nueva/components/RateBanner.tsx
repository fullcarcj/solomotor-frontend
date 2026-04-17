"use client";

import type { TodayRate } from "@/types/pos";

function num(n: number | string | undefined | null): number | null {
  if (n == null || n === "") return null;
  const x = Number(String(n).replace(",", "."));
  return Number.isFinite(x) ? x : null;
}

export default function RateBanner({
  rate,
  loading,
  error,
}: {
  rate: TodayRate | null;
  loading: boolean;
  error: string | null;
}) {
  if (loading) {
    return (
      <div className="alert alert-info mb-3 py-2">
        <p className="placeholder-glow mb-0">
          <span className="placeholder col-8 col-md-4" />
        </p>
      </div>
    );
  }

  if (error || !rate) {
    return (
      <div className="alert alert-warning mb-3 py-2" role="status">
        Sin tasa disponible
      </div>
    );
  }

  const ar = num(rate.active_rate);
  const label =
    ar != null
      ? `Bs. ${ar.toLocaleString("es-VE", { minimumFractionDigits: 2, maximumFractionDigits: 4 })} / USD`
      : "—";

  return (
    <div className="alert alert-info mb-3 py-2" role="status">
      <strong>Tasa BCV hoy:</strong> {label}{" "}
      <span className="text-muted small">
        [{rate.active_rate_type || "—"}] — {rate.rate_date || "—"}
      </span>
    </div>
  );
}
