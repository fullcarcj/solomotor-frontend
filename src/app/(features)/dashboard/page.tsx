"use client";

import { useMemo, useState } from "react";
import { useDashboard } from "@/hooks/useDashboard";
import { useCurrentUser } from "@/hooks/useCurrentUser";
import { useTodayRate } from "@/hooks/useTodayRate";
import type { AiGroqSnapshot, OverviewAlert } from "@/types/stats";
import DreamposDashboardBlocks from "@/components/dashboards/DreamposDashboardBlocks";
import styles from "./dashboard.module.scss";

function toNum(v: number | string | undefined | null): number {
  if (v == null || v === "") return 0;
  const x = Number(String(v).replace(",", "."));
  return Number.isFinite(x) ? x : 0;
}

function fmtBs(v: number | string | undefined | null): string {
  const x = toNum(v);
  return x.toLocaleString("es-VE", {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  });
}

function fmtInt(v: number | string | undefined | null): string {
  const x = toNum(v);
  return Math.round(x).toLocaleString("es-VE");
}

function fmtRate(v: number | string | undefined | null): string {
  const x = toNum(v);
  if (x <= 0) return "—";
  return x.toLocaleString("es-VE", {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  });
}

function fmtPct(p: number | null | undefined): {
  label: string;
  dir: "up" | "down" | "flat";
} {
  if (p == null || !Number.isFinite(p)) {
    return { label: "—", dir: "flat" };
  }
  if (p === 0) return { label: "0%", dir: "flat" };
  const abs = Math.abs(p).toFixed(1);
  return { label: `${abs}%`, dir: p > 0 ? "up" : "down" };
}

function fmtUpdatedTs(d: Date | null): string {
  if (!d) return "—";
  const date = d.toLocaleDateString("es-VE", {
    day: "2-digit",
    month: "2-digit",
    year: "numeric",
  });
  const time = d.toLocaleTimeString("es-VE", {
    hour: "2-digit",
    minute: "2-digit",
    second: "2-digit",
  });
  return `${date} · ${time}`;
}

function alertLabel(a: OverviewAlert): { strong: string; rest: string } {
  switch (a.type) {
    case "unjustified_debits":
      return {
        strong: `${a.count} débitos bancarios`,
        rest: " sin justificar requieren tu revisión",
      };
    case "payment_overdue":
      return {
        strong: `${a.count} órdenes`,
        rest: " con pago vencido requieren atención",
      };
    case "manual_review":
      return {
        strong: `${a.count} conciliaciones`,
        rest: " requieren revisión manual",
      };
    default:
      return { strong: `${a.count}`, rest: ` ${a.type}` };
  }
}

function groqPillClass(g: AiGroqSnapshot | undefined): string {
  if (!g) return styles["groq-pill--unknown"];
  if (g.error || g.label === "?") return styles["groq-pill--unknown"];
  return g.active ? styles["groq-pill--on"] : styles["groq-pill--off"];
}

function firstDeltaIcon(dir: "up" | "down" | "flat") {
  if (dir === "up") {
    return (
      <svg width="10" height="10" viewBox="0 0 10 10" fill="none">
        <path
          d="M2 6l3-3 3 3"
          stroke="currentColor"
          strokeWidth="1.5"
          strokeLinecap="round"
          strokeLinejoin="round"
        />
      </svg>
    );
  }
  if (dir === "down") {
    return (
      <svg width="10" height="10" viewBox="0 0 10 10" fill="none">
        <path
          d="M2 4l3 3 3-3"
          stroke="currentColor"
          strokeWidth="1.5"
          strokeLinecap="round"
          strokeLinejoin="round"
        />
      </svg>
    );
  }
  return null;
}

export default function DashboardPage() {
  const { overview, realtime, loading, error, lastUpdated, refetch } =
    useDashboard();
  const { user } = useCurrentUser();
  const { rate } = useTodayRate();
  const [alertDismissed, setAlertDismissed] = useState(false);

  const today = overview?.today;
  const changes = overview?.changes;
  const rt = realtime?.last_60min;
  const aiGroq = overview?.ai_groq ?? realtime?.ai_groq;

  const firstAlert = useMemo(() => {
    if (!overview?.alerts?.length) return null;
    return (
      overview.alerts.find((a) => a.severity === "high") ?? overview.alerts[0]
    );
  }, [overview?.alerts]);

  const revenueDelta = fmtPct(changes?.revenue_pct ?? null);
  const ordersDelta = fmtPct(changes?.orders_pct ?? null);
  const pendingBs = toNum(today?.pending_bs);
  const pendingOrders = today?.pending_orders ?? 0;
  const collectedBs = toNum(today?.collected_bs);
  const revenueBs = toNum(today?.revenue_bs);
  const collectedPct =
    revenueBs > 0 ? Math.round((collectedBs / revenueBs) * 100) : 0;
  const firstName = user?.username?.split(/[ .@]/)[0] ?? "Javier";
  const firstNameCap =
    firstName.charAt(0).toUpperCase() + firstName.slice(1).toLowerCase();

  if (loading && !overview) {
    return (
      <div className="page-wrapper">
        <div className={styles.dash}>
          <div className={styles["state-wrap"]}>
            <div className={styles["state-card"]}>
              <div className={styles.spinner} />
              <div>Cargando dashboard…</div>
            </div>
          </div>
        </div>
      </div>
    );
  }

  if (error && !overview) {
    return (
      <div className="page-wrapper">
        <div className={styles.dash}>
          <div className={styles["state-wrap"]}>
            <div className={styles["state-card"]}>
              <div>{error}</div>
              <button type="button" onClick={() => void refetch()}>
                Reintentar
              </button>
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="page-wrapper">
      <div className={styles.dash}>
        {/* Page header */}
        <div className={styles["page-head"]}>
          <div>
            <h1 className={styles["page-title"]}>
              Bienvenido, {firstNameCap}
            </h1>
            <div className={styles["page-badges"]} aria-label="Estado en vivo e IA">
              <span className={styles["live-pill"]}>
                <span className={styles["live-dot"]} />
                En vivo
              </span>
              {aiGroq ? (
                <span
                  className={`${styles["groq-pill"]} ${groqPillClass(aiGroq)}`}
                  title={aiGroq.detail}
                >
                  <span className={styles["groq-dot"]} aria-hidden />
                  <span className={styles["groq-pill-text"]}>
                    IA GROQ
                    <span className={styles["groq-pill-sep"]}>·</span>
                    <span className={styles["groq-pill-label"]}>
                      {aiGroq.label}
                    </span>
                  </span>
                </span>
              ) : null}
            </div>
            <div className={styles["page-sub"]}>
              Hoy:{" "}
              <strong>{fmtInt(today?.orders_count)} ventas</strong> · Cobrado{" "}
              Bs. {fmtBs(today?.collected_bs)} · {fmtInt(today?.messages_received)}{" "}
              mensajes recibidos
              {aiGroq ? (
                <>
                  {" · "}
                  <span
                    className={styles["groq-inline"]}
                    title={aiGroq.detail}
                  >
                    Groq (Tipo M):{" "}
                    <strong>{aiGroq.label}</strong>
                  </span>
                </>
              ) : null}
            </div>
          </div>
          <div className={styles["head-meta"]}>
            <div className={styles.ts}>
              Actualizado · <strong>{fmtUpdatedTs(lastUpdated)}</strong>
            </div>
            <button
              type="button"
              className={styles["date-picker"]}
              onClick={() => void refetch()}
              title="Actualizar"
            >
              <svg
                className={styles["ico-sm"]}
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="1.5"
              >
                <path d="M21 12a9 9 0 1 1-3-6.7L21 8" />
                <path d="M21 3v5h-5" />
              </svg>
              Actualizar ahora
            </button>
          </div>
        </div>

        {/* Alert */}
        {firstAlert && !alertDismissed && (
          <div className={styles["sm-alert"]}>
            <svg
              className={styles["alert-icon"]}
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="1.5"
            >
              <path d="M10.29 3.86 1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0zM12 9v4M12 17h.01" />
            </svg>
            <span className={styles["alert-text"]}>
              <strong>{alertLabel(firstAlert).strong}</strong>
              {alertLabel(firstAlert).rest}
            </span>
            <button type="button" className={styles["alert-cta"]}>
              Revisar ahora →
            </button>
            <button
              type="button"
              className={styles["alert-close"]}
              onClick={() => setAlertDismissed(true)}
              aria-label="Descartar alerta"
            >
              <svg
                className={styles["ico-sm"]}
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="1.5"
              >
                <path d="M18 6 6 18M6 6l12 12" />
              </svg>
            </button>
          </div>
        )}

        {/* Strip (últimos 60 min) */}
        <div className={styles.strip}>
          <div className={styles["strip-cell"]}>
            <span className={styles["strip-label"]}>Últimos 60 min</span>
            <span className={styles["strip-value"]}>Ventana en vivo</span>
          </div>
          <div className={styles["strip-cell"]}>
            <span className={styles["strip-label"]}>Órdenes</span>
            <span className={styles["strip-value"]}>{fmtInt(rt?.orders)}</span>
          </div>
          <div className={styles["strip-cell"]}>
            <span className={styles["strip-label"]}>Ingresos</span>
            <span className={styles["strip-value"]}>
              Bs. {fmtBs(rt?.revenue_bs)}
            </span>
          </div>
          <div className={styles["strip-cell"]}>
            <span className={styles["strip-label"]}>Chats nuevos</span>
            <span className={styles["strip-value"]}>{fmtInt(rt?.chats)}</span>
          </div>
          <div className={styles["strip-cell"]}>
            <span className={styles["strip-label"]}>Tasa BCV / Binance</span>
            <span className={styles["strip-value"]}>
              {fmtRate(rate?.bcv_rate)} / {fmtRate(rate?.binance_rate)}
            </span>
          </div>
          <div className={styles["strip-live"]}>
            <span className={styles["live-pill"]}>
              <span className={styles["live-dot"]} />
              En vivo
            </span>
          </div>
        </div>

        {/* KPI grid */}
        <div className={styles["kpi-grid"]}>
          {/* Total Ventas Hoy */}
          <div className={styles.kpi}>
            <div className={styles["kpi-head"]}>
              <div className={`${styles["kpi-icon"]} ${styles.amber}`}>
                <svg
                  className={styles["ico-sm"]}
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="1.5"
                >
                  <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z" />
                  <path d="M14 2v6h6M16 13H8M16 17H8M10 9H8" />
                </svg>
              </div>
              <span className={styles["kpi-label"]}>Total Ventas Hoy</span>
            </div>
            <div className={styles["kpi-value"]}>
              <span className={styles.currency}>Bs.</span>
              {fmtBs(today?.revenue_bs)}
            </div>
            <div className={styles["kpi-foot"]}>
              <span className={`${styles.delta} ${styles[revenueDelta.dir]}`}>
                {firstDeltaIcon(revenueDelta.dir)}
                {revenueDelta.label}
              </span>
              <svg
                className={styles.spark}
                viewBox="0 0 80 22"
                preserveAspectRatio="none"
              >
                <polyline
                  points="0,8 10,12 20,6 30,10 40,4 50,8 60,14 70,16 80,20"
                  fill="none"
                  stroke="#f59e0b"
                  strokeWidth="1.5"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                />
              </svg>
            </div>
          </div>

          {/* Órdenes Hoy */}
          <div className={styles.kpi}>
            <div className={styles["kpi-head"]}>
              <div className={`${styles["kpi-icon"]} ${styles.blue}`}>
                <svg
                  className={styles["ico-sm"]}
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="1.5"
                >
                  <path d="M21 7H3M21 12H3M21 17H3" />
                </svg>
              </div>
              <span className={styles["kpi-label"]}>Órdenes Hoy</span>
            </div>
            <div className={styles["kpi-value"]}>
              {fmtInt(today?.orders_count)}
            </div>
            <div className={styles["kpi-foot"]}>
              <span className={`${styles.delta} ${styles[ordersDelta.dir]}`}>
                {firstDeltaIcon(ordersDelta.dir)}
                {ordersDelta.label}
              </span>
              <svg
                className={styles.spark}
                viewBox="0 0 80 22"
                preserveAspectRatio="none"
              >
                <polyline
                  points="0,4 10,8 20,6 30,2 40,10 50,8 60,14 70,18 80,20"
                  fill="none"
                  stroke="#60a5fa"
                  strokeWidth="1.5"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                />
              </svg>
            </div>
          </div>

          {/* Cobrado Bs */}
          <div className={styles.kpi}>
            <div className={styles["kpi-head"]}>
              <div className={`${styles["kpi-icon"]} ${styles.green}`}>
                <svg
                  className={styles["ico-sm"]}
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="1.5"
                >
                  <path d="M20 6 9 17l-5-5" />
                </svg>
              </div>
              <span className={styles["kpi-label"]}>Cobrado Bs</span>
            </div>
            <div className={styles["kpi-value"]}>
              <span className={styles.currency}>Bs.</span>
              {fmtBs(today?.collected_bs)}
            </div>
            <div className={styles["kpi-foot"]}>
              <span className={`${styles.delta} ${styles.up}`}>
                {firstDeltaIcon("up")}
                {collectedPct}%
              </span>
              <span className={styles["kpi-context"]}>
                Conciliación {collectedPct}%
              </span>
            </div>
          </div>

          {/* Pendiente por Cobrar */}
          <div className={styles.kpi}>
            <div className={styles["kpi-head"]}>
              <div className={`${styles["kpi-icon"]} ${styles.violet}`}>
                <svg
                  className={styles["ico-sm"]}
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="1.5"
                >
                  <circle cx="12" cy="12" r="10" />
                  <path d="M12 6v6l4 2" />
                </svg>
              </div>
              <span className={styles["kpi-label"]}>Pendiente por Cobrar</span>
            </div>
            <div className={styles["kpi-value"]}>
              <span className={styles.currency}>Bs.</span>
              {fmtBs(today?.pending_bs)}
            </div>
            <div className={styles["kpi-foot"]}>
              <span className={`${styles.delta} ${styles.flat}`}>
                {pendingBs > 0 ? "pendientes" : "— sin pendientes"}
              </span>
              <span className={styles["kpi-context"]}>
                {fmtInt(pendingOrders)} órd. en mora
              </span>
            </div>
          </div>
        </div>

        {/* Secondary cards */}
        <div className={styles["sec-grid"]}>
          <div className={styles["sec-card"]}>
            <div className={styles["sec-head"]}>
              <span className={styles["sec-label"]}>Clientes nuevos hoy</span>
              <span className={styles["sec-icon"]}>
                <svg
                  className={styles["ico-sm"]}
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="1.5"
                >
                  <path d="M16 21v-2a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v2" />
                  <circle cx="9" cy="7" r="4" />
                  <path d="M19 8v6M16 11h6" />
                </svg>
              </span>
            </div>
            <div className={styles["sec-value"]}>
              {fmtInt(today?.new_customers)}
            </div>
            <div className={styles["sec-foot"]}>
              <span>Registrados hoy</span>
              <a href="/clientes">Ver todos →</a>
            </div>
          </div>

          <div className={styles["sec-card"]}>
            <div className={styles["sec-head"]}>
              <span className={styles["sec-label"]}>Mensajes recibidos</span>
              <span className={styles["sec-icon"]}>
                <svg
                  className={styles["ico-sm"]}
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="1.5"
                >
                  <path d="M21 11.5a8.4 8.4 0 0 1-.9 3.8 8.5 8.5 0 0 1-7.6 4.7 8.4 8.4 0 0 1-3.8-.9L3 21l1.9-5.7a8.4 8.4 0 0 1-.9-3.8 8.5 8.5 0 0 1 4.7-7.6 8.4 8.4 0 0 1 3.8-.9h.5a8.5 8.5 0 0 1 8 8z" />
                </svg>
              </span>
            </div>
            <div className={styles["sec-value"]}>
              {fmtInt(today?.messages_received)}
            </div>
            <div className={styles["sec-foot"]}>
              <span>WhatsApp · ML · IG</span>
              <a href="/bandeja">Bandeja →</a>
            </div>
          </div>

          <div className={styles["sec-card"]}>
            <div className={styles["sec-head"]}>
              <span className={styles["sec-label"]}>
                Conciliaciones automáticas
              </span>
              <span className={styles["sec-icon"]}>
                <svg
                  className={styles["ico-sm"]}
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="1.5"
                >
                  <path d="M20 6 9 17l-5-5" />
                </svg>
              </span>
            </div>
            <div className={styles["sec-value"]}>
              {fmtInt(today?.auto_reconciled)}
            </div>
            <div className={styles["sec-foot"]}>
              <span>Conciliadas hoy</span>
              <a href="/finanzas">Conciliar →</a>
            </div>
          </div>

          <div className={styles["sec-card"]}>
            <div className={styles["sec-head"]}>
              <span className={styles["sec-label"]}>
                Revisión manual pendiente
              </span>
              <span className={styles["sec-icon"]}>
                <svg
                  className={styles["ico-sm"]}
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="1.5"
                >
                  <circle cx="12" cy="12" r="10" />
                  <path d="M12 8v4M12 16h.01" />
                </svg>
              </span>
            </div>
            <div className={styles["sec-value"]}>
              {fmtInt(today?.manual_pending)}
            </div>
            <div className={styles["sec-foot"]}>
              <span>Requieren atención</span>
              <a href="/observacion">Auditar →</a>
            </div>
          </div>
        </div>

        {/* Chart row */}
        <div className={styles["chart-row"]}>
          {/* Chart panel */}
          <div className={styles.panel}>
            <div className={styles["panel-head"]}>
              <h3 className={styles["panel-title"]}>
                <span className={styles.icon}>
                  <svg
                    className={styles["ico-sm"]}
                    viewBox="0 0 24 24"
                    fill="none"
                    stroke="currentColor"
                    strokeWidth="1.5"
                  >
                    <path d="M3 3v18h18M7 14l3-3 4 4 5-5" />
                  </svg>
                </span>
                Ventas (Histórico)
              </h3>
              <div className={styles.seg}>
                <button type="button">1D</button>
                <button type="button">1S</button>
                <button type="button">1M</button>
                <button type="button" className={styles.on}>
                  1A
                </button>
              </div>
            </div>
            <div className={styles["chart-body"]}>
              <div className={styles["chart-legend"]}>
                <span className={styles.key}>
                  <span
                    className={styles.swatch}
                    style={{ background: "#f59e0b" }}
                  />
                  Total
                </span>
                <span className={styles.key}>
                  <span
                    className={styles.swatch}
                    style={{ background: "#f59e0b40" }}
                  />
                  Pendiente
                </span>
                <span className={styles.total}>
                  Total año ·{" "}
                  <b>
                    Bs. {fmtBs(revenueBs * 12 /* estimado visual */)}
                  </b>
                </span>
              </div>
              <svg
                className={styles.chart}
                viewBox="0 0 720 240"
                preserveAspectRatio="none"
              >
                <g stroke="#1d2127" strokeWidth="1">
                  <line x1="0" y1="40" x2="720" y2="40" />
                  <line x1="0" y1="100" x2="720" y2="100" />
                  <line x1="0" y1="160" x2="720" y2="160" />
                  <line x1="0" y1="220" x2="720" y2="220" />
                </g>
                <g fontFamily="JetBrains Mono" fontSize="9" fill="#6b727c">
                  <text x="0" y="36">100K</text>
                  <text x="0" y="96">75K</text>
                  <text x="0" y="156">50K</text>
                  <text x="0" y="216">25K</text>
                </g>
                <g>
                  <rect x="55" y="160" width="40" height="60" fill="#f59e0b" rx="2" />
                  <rect x="55" y="135" width="40" height="25" fill="#f59e0b" opacity="0.25" rx="2" />
                  <rect x="111" y="150" width="40" height="70" fill="#f59e0b" rx="2" />
                  <rect x="111" y="120" width="40" height="30" fill="#f59e0b" opacity="0.25" rx="2" />
                  <rect x="167" y="170" width="40" height="50" fill="#f59e0b" rx="2" />
                  <rect x="167" y="155" width="40" height="15" fill="#f59e0b" opacity="0.25" rx="2" />
                  <rect x="223" y="120" width="40" height="100" fill="#f59e0b" rx="2" />
                  <rect x="223" y="80" width="40" height="40" fill="#f59e0b" opacity="0.25" rx="2" />
                  <rect x="279" y="130" width="40" height="90" fill="#f59e0b" rx="2" />
                  <rect x="279" y="100" width="40" height="30" fill="#f59e0b" opacity="0.25" rx="2" />
                  <rect x="335" y="125" width="40" height="95" fill="#f59e0b" rx="2" />
                  <rect x="335" y="95" width="40" height="30" fill="#f59e0b" opacity="0.25" rx="2" />
                  <rect x="391" y="175" width="40" height="45" fill="#f59e0b" rx="2" />
                  <rect x="391" y="160" width="40" height="15" fill="#f59e0b" opacity="0.25" rx="2" />
                  <rect x="447" y="100" width="40" height="120" fill="#f59e0b" rx="2" />
                  <rect x="447" y="55" width="40" height="45" fill="#f59e0b" opacity="0.25" rx="2" />
                  <rect x="503" y="80" width="40" height="140" fill="#f59e0b" rx="2" />
                  <rect x="503" y="40" width="40" height="40" fill="#fbbf24" opacity="0.4" rx="2" />
                  <rect x="559" y="180" width="40" height="40" fill="#f59e0b" rx="2" />
                  <rect x="559" y="165" width="40" height="15" fill="#f59e0b" opacity="0.25" rx="2" />
                  <rect x="615" y="115" width="40" height="105" fill="#f59e0b" rx="2" />
                  <rect x="615" y="80" width="40" height="35" fill="#f59e0b" opacity="0.25" rx="2" />
                  <rect x="671" y="160" width="40" height="60" fill="#f59e0b" rx="2" />
                  <rect x="671" y="140" width="40" height="20" fill="#f59e0b" opacity="0.25" rx="2" />
                </g>
                <g>
                  <line
                    x1="523"
                    y1="40"
                    x2="523"
                    y2="220"
                    stroke="#fbbf24"
                    strokeWidth="1"
                    strokeDasharray="3 3"
                    opacity="0.5"
                  />
                  <rect
                    x="495"
                    y="20"
                    width="56"
                    height="16"
                    rx="3"
                    fill="#1c2027"
                    stroke="#353b44"
                  />
                  <text
                    x="523"
                    y="32"
                    textAnchor="middle"
                    fontFamily="JetBrains Mono"
                    fontSize="9"
                    fill="#fbbf24"
                  >
                    87.4K
                  </text>
                </g>
                <g
                  fontFamily="IBM Plex Sans"
                  fontSize="10"
                  fill="#6b727c"
                  textAnchor="middle"
                >
                  <text x="75" y="236">Ene</text>
                  <text x="131" y="236">Feb</text>
                  <text x="187" y="236">Mar</text>
                  <text x="243" y="236">Abr</text>
                  <text x="299" y="236">May</text>
                  <text x="355" y="236">Jun</text>
                  <text x="411" y="236">Jul</text>
                  <text x="467" y="236">Ago</text>
                  <text x="523" y="236" fill="#fbbf24" fontWeight="600">Sep</text>
                  <text x="579" y="236">Oct</text>
                  <text x="635" y="236">Nov</text>
                  <text x="691" y="236">Dic</text>
                </g>
              </svg>
            </div>
          </div>

          {/* Side info panel */}
          <div className={styles.panel}>
            <div className={styles["panel-head"]}>
              <h3 className={styles["panel-title"]}>
                <span className={styles.icon}>
                  <svg
                    className={styles["ico-sm"]}
                    viewBox="0 0 24 24"
                    fill="none"
                    stroke="currentColor"
                    strokeWidth="1.5"
                  >
                    <circle cx="12" cy="12" r="10" />
                    <path d="M12 16v-4M12 8h.01" />
                  </svg>
                </span>
                Información General
              </h3>
            </div>

            <div className={styles["info-grid"]}>
              <div className={styles["info-tile"]}>
                <div className={styles.ic}>
                  <svg
                    className={styles["ico-sm"]}
                    viewBox="0 0 24 24"
                    fill="none"
                    stroke="currentColor"
                    strokeWidth="1.5"
                  >
                    <circle cx="12" cy="12" r="10" />
                    <path d="M12 6v6l4 2" />
                  </svg>
                </div>
                <div className={styles.lab}>Pendientes</div>
                <div className={styles.num}>{fmtInt(pendingOrders)}</div>
              </div>
              <div className={styles["info-tile"]}>
                <div className={styles.ic}>
                  <svg
                    className={styles["ico-sm"]}
                    viewBox="0 0 24 24"
                    fill="none"
                    stroke="currentColor"
                    strokeWidth="1.5"
                  >
                    <path d="M16 21v-2a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v2" />
                    <circle cx="9" cy="7" r="4" />
                  </svg>
                </div>
                <div className={styles.lab}>Clientes Nvos</div>
                <div className={styles.num}>
                  {fmtInt(today?.new_customers)}
                </div>
              </div>
              <div className={styles["info-tile"]}>
                <div className={styles.ic}>
                  <svg
                    className={styles["ico-sm"]}
                    viewBox="0 0 24 24"
                    fill="none"
                    stroke="currentColor"
                    strokeWidth="1.5"
                  >
                    <path d="M3 3h2l3 12h12l2-8H6" />
                    <circle cx="9" cy="20" r="1.5" />
                    <circle cx="18" cy="20" r="1.5" />
                  </svg>
                </div>
                <div className={styles.lab}>Ventas Hoy</div>
                <div className={styles.num}>
                  {fmtInt(today?.orders_count)}
                </div>
              </div>
            </div>

            <div className={styles["info-section"]}>
              <div className={styles["info-title"]}>
                Resumen del día por canal
              </div>
              <div className={styles["donut-wrap"]}>
                <svg width="100" height="100" viewBox="0 0 36 36">
                  <circle
                    cx="18"
                    cy="18"
                    r="14"
                    fill="none"
                    stroke="#1d2127"
                    strokeWidth="5"
                  />
                  <circle
                    cx="18"
                    cy="18"
                    r="14"
                    fill="none"
                    stroke="#f59e0b"
                    strokeWidth="5"
                    strokeDasharray="44 88"
                    strokeDashoffset="0"
                    transform="rotate(-90 18 18)"
                  />
                  <circle
                    cx="18"
                    cy="18"
                    r="14"
                    fill="none"
                    stroke="#60a5fa"
                    strokeWidth="5"
                    strokeDasharray="22 88"
                    strokeDashoffset="-44"
                    transform="rotate(-90 18 18)"
                  />
                  <circle
                    cx="18"
                    cy="18"
                    r="14"
                    fill="none"
                    stroke="#34d399"
                    strokeWidth="5"
                    strokeDasharray="13 88"
                    strokeDashoffset="-66"
                    transform="rotate(-90 18 18)"
                  />
                  <circle
                    cx="18"
                    cy="18"
                    r="14"
                    fill="none"
                    stroke="#a78bfa"
                    strokeWidth="5"
                    strokeDasharray="9 88"
                    strokeDashoffset="-79"
                    transform="rotate(-90 18 18)"
                  />
                  <text
                    x="18"
                    y="18.5"
                    textAnchor="middle"
                    fontSize="6"
                    fontFamily="JetBrains Mono"
                    fill="#ecedef"
                    fontWeight="600"
                  >
                    {today?.orders_count ?? 0}
                  </text>
                  <text
                    x="18"
                    y="23"
                    textAnchor="middle"
                    fontSize="3"
                    fontFamily="IBM Plex Sans"
                    fill="#6b727c"
                  >
                    ventas
                  </text>
                </svg>
                <div className={styles["donut-legend"]}>
                  <div className={styles.row}>
                    <span
                      className={styles.sw}
                      style={{ background: "#f59e0b" }}
                    />
                    <span className={styles.nm}>Mostrador</span>
                    <span className={styles.val}>50%</span>
                  </div>
                  <div className={styles.row}>
                    <span
                      className={styles.sw}
                      style={{ background: "#60a5fa" }}
                    />
                    <span className={styles.nm}>MercadoLibre</span>
                    <span className={styles.val}>25%</span>
                  </div>
                  <div className={styles.row}>
                    <span
                      className={styles.sw}
                      style={{ background: "#34d399" }}
                    />
                    <span className={styles.nm}>WhatsApp</span>
                    <span className={styles.val}>15%</span>
                  </div>
                  <div className={styles.row}>
                    <span
                      className={styles.sw}
                      style={{ background: "#a78bfa" }}
                    />
                    <span className={styles.nm}>Redes Sociales</span>
                    <span className={styles.val}>10%</span>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>

        <div className={styles.dashLegacy}>
          <DreamposDashboardBlocks
            loading={loading}
            today={today}
            changes={changes}
          />
        </div>
      </div>
    </div>
  );
}
