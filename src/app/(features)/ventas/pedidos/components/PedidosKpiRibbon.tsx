"use client";

import { useMemo } from "react";
import type { Sale } from "@/types/sales";
import type { TodayRates } from "@/hooks/useTodayCurrencyRates";

interface Props {
  sales: Sale[];
  loading: boolean;
  /** Tasas del día (una sola petición desde la página de Pedidos). */
  rates: TodayRates;
}

function fmtCompact(n: number): string {
  if (!Number.isFinite(n) || n === 0) return "—";
  if (n >= 1_000_000) return `${(n / 1_000_000).toFixed(1)}M`;
  if (n >= 1_000) return `${(n / 1_000).toFixed(1)}k`;
  return n.toFixed(0);
}

const UpArrow = () => (
  <svg
    viewBox="0 0 24 24"
    fill="none"
    stroke="currentColor"
    strokeWidth="2.5"
    aria-hidden="true"
  >
    <path d="m7 14 5-5 5 5" />
  </svg>
);

export default function PedidosKpiRibbon({ sales, loading, rates }: Props) {
  const { bcvRate, binanceRate, rateDate } = rates;

  const kpis = useMemo(() => {
    const now = new Date();
    const todayStr = now.toDateString();

    const todaySales = sales.filter(
      (s) => new Date(s.created_at).toDateString() === todayStr
    );

    const todayVes = todaySales.reduce((a, s) => {
      const isVes = s.rate_type === "NATIVE_VES";
      return a + (isVes
        ? (Number(s.total_amount_bs) || Number(s.order_total_amount) || 0)
        : (Number(s.total_amount_bs) || 0));
    }, 0);
    const todayUsd = todaySales.reduce((a, s) => {
      if (s.rate_type === "NATIVE_VES") return a;
      return a + (Number(s.total_usd) || 0);
    }, 0);
    const dispatch = sales.filter((s) =>
      ["paid", "ready_to_ship"].includes(String(s.status))
    ).length;

    return { todayVes, todayUsd, dispatch };
  }, [sales]);

  const sk = (width: string) => (
    <span
      className="pd-skeleton"
      style={{ width, height: 22, borderRadius: 4 }}
      aria-hidden="true"
    />
  );

  return (
    <div className="pd-kpi-ribbon" aria-label="KPIs del día">
      {/* KPI 1 · Hoy VES */}
      <div className="pd-kpi-cell">
        <span className="pd-kpi-lbl">Hoy VES</span>
        {loading ? (
          sk("60%")
        ) : (
          <span className="pd-kpi-val accent">
            {fmtCompact(kpis.todayVes)}
          </span>
        )}
        <span className="pd-kpi-delta">
          <UpArrow />
          Hoy
        </span>
      </div>

      {/* KPI 2 · Hoy USD */}
      <div className="pd-kpi-cell">
        <span className="pd-kpi-lbl">Hoy USD</span>
        {loading ? (
          sk("55%")
        ) : (
          <span className="pd-kpi-val usd">
            ${kpis.todayUsd > 0 ? kpis.todayUsd.toFixed(0) : "—"}
          </span>
        )}
        <span className="pd-kpi-delta">Hoy</span>
      </div>

      {/* KPI 3 · Tasa BCV */}
      <div className="pd-kpi-cell">
        <span className="pd-kpi-lbl">BCV Bs./USD</span>
        {loading ? (
          sk("70%")
        ) : (
          <span className="pd-kpi-val sm">
            {bcvRate != null
              ? bcvRate.toLocaleString("es-VE", { minimumFractionDigits: 2, maximumFractionDigits: 2 })
              : "—"}
          </span>
        )}
        <span
          className="pd-kpi-delta"
          style={{ color: bcvRate != null ? undefined : "var(--pd-text-faint)" }}
        >
          {rateDate ? rateDate : (bcvRate == null ? "No disponible" : "Hoy")}
        </span>
      </div>

      {/* KPI 3b · Tasa BINANCE */}
      <div className="pd-kpi-cell">
        <span className="pd-kpi-lbl">BINANCE Bs./USD</span>
        {loading ? (
          sk("70%")
        ) : (
          <span className="pd-kpi-val sm" style={{ color: "var(--pd-accent)" }}>
            {binanceRate != null
              ? binanceRate.toLocaleString("es-VE", { minimumFractionDigits: 2, maximumFractionDigits: 2 })
              : "—"}
          </span>
        )}
        <span
          className="pd-kpi-delta"
          style={{ color: binanceRate != null ? undefined : "var(--pd-text-faint)" }}
        >
          {binanceRate != null ? "Paralelo" : "No disponible"}
        </span>
      </div>

      {/* KPI 4 · Por despachar */}
      <div className="pd-kpi-cell">
        <span className="pd-kpi-lbl">Por despachar</span>
        {loading ? (
          sk("40%")
        ) : (
          <span
            className={`pd-kpi-val ${kpis.dispatch > 0 ? "warn" : "ok"}`}
          >
            {kpis.dispatch}
          </span>
        )}
        <span
          className={`pd-kpi-delta${kpis.dispatch > 5 ? " down" : ""}`}
        >
          {kpis.dispatch > 0 ? "Pendientes despacho" : "Sin pendientes"}
        </span>
      </div>
    </div>
  );
}
