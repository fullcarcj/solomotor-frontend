"use client"
/* eslint-disable @next/next/no-img-element */
import PredefinedDateRanges from "@/core/common/daterangepicker/datePicker";
import CommonFooter from "@/core/common/footer/commonFooter";
import { all_routes } from "@/data/all_routes";
import { useDashboard } from "@/hooks/useDashboard";
import { useAppSelector } from "@/store/hooks";
import Link from "next/link";
import SalesDayChart from "../charts/salesdaychart";
import CustomerChart from "../charts/customerchart";
import DreamposDashboardBlocks from "./DreamposDashboardBlocks";

/* ── Helpers de formato ─────────────────────────────────────────────────── */

function fmtUsd(v: number | string | null | undefined): string {
  if (v == null || v === "") return "—";
  const n = Number(String(v).replace(",", "."));
  if (!Number.isFinite(n)) return "—";
  return `$${n.toLocaleString("es-VE", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
}

function fmtBs(v: number | string | null | undefined): string {
  if (v == null || v === "") return "—";
  const n = Number(String(v).replace(",", "."));
  if (!Number.isFinite(n)) return "—";
  return `Bs. ${n.toLocaleString("es-VE", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
}

function fmtInt(v: number | null | undefined): string {
  if (v == null) return "—";
  return v.toLocaleString("es-VE");
}

function pctBadge(pct: number | null | undefined): React.ReactNode {
  if (pct == null) return null;
  const abs = Math.abs(pct).toFixed(1);
  if (pct > 0) {
    return (
      <span className="badge badge-soft-success ms-1">
        <i className="ti ti-arrow-up me-1" />+{abs}%
      </span>
    );
  }
  if (pct < 0) {
    return (
      <span className="badge badge-soft-danger ms-1">
        <i className="ti ti-arrow-down me-1" />{abs}%
      </span>
    );
  }
  return (
    <span className="badge badge-soft-primary ms-1">= 0%</span>
  );
}

function alertText(type: string, count: number): string {
  switch (type) {
    case "unjustified_debits":
      return `⚠ ${count} débitos bancarios sin justificar`;
    case "payment_overdue":
      return `⚠ ${count} órdenes con pago vencido`;
    case "manual_review":
      return `ℹ ${count} conciliaciones requieren revisión manual`;
    default:
      return `${type}: ${count}`;
  }
}

/* ── Skeleton de card ───────────────────────────────────────────────────── */

function SkeletonValue() {
  return (
    <span className="placeholder-glow">
      <span className="placeholder col-8 rounded" />
    </span>
  );
}

/* ── Componente principal ───────────────────────────────────────────────── */

export default function NewDashboard() {
  const route = all_routes;
  const { overview, realtime, loading, error, lastUpdated, refetch } = useDashboard();
  const authRole = useAppSelector((s) => s.auth.role);
  const authCanal = useAppSelector((s) => s.auth.canal);
  const username = authRole ?? authCanal ?? null;

  const today = overview?.today;
  const changes = overview?.changes;
  const alerts = overview?.alerts ?? [];

  const todayDate = new Date().toLocaleDateString("es-VE", {
    day: "2-digit",
    month: "2-digit",
    year: "numeric",
  });

  return (
    <div className="page-wrapper">
      <div className="content">

        {/* ── Header ────────────────────────────────────────────────────── */}
        <div className="d-flex align-items-center justify-content-between flex-wrap gap-3 mb-2">
          <div className="mb-3">
            <h1 className="mb-1 custome-heading">
              {username ? `Bienvenido, ${username}` : "Panel de Control"}
              {!loading && (
                <span className="badge badge-live ms-2">● En vivo</span>
              )}
              {!loading && overview?.ai_groq && (
                <span
                  className={`ms-2 badge ${
                    overview.ai_groq.error || overview.ai_groq.label === "?"
                      ? "badge-soft-warning"
                      : overview.ai_groq.active
                        ? "badge-soft-primary"
                        : "badge-soft-danger"
                  }`}
                  title={overview.ai_groq.detail}
                  style={{ fontSize: "0.7rem", verticalAlign: "middle" }}
                >
                  IA GROQ · {overview.ai_groq.label}
                </span>
              )}
            </h1>
            <p className="fw-medium">
              {loading ? (
                <SkeletonValue />
              ) : (
                <>
                  Hoy:{" "}
                  <span className="text-primary fw-bold">
                    {fmtInt(today?.orders_count ?? 0)}
                  </span>{" "}
                  ventas
                </>
              )}
            </p>
          </div>
          <div className="input-icon-start position-relative mb-3 d-flex align-items-center gap-3">
            <span className="text-muted small">{todayDate}</span>
            {lastUpdated && (
              <span className="text-muted small">
                Actualizado: {lastUpdated.toLocaleTimeString("es-VE")}
              </span>
            )}
            <PredefinedDateRanges />
          </div>
        </div>

        {/* ── Error global ─────────────────────────────────────────────── */}
        {error && (
          <div className="alert alert-danger d-flex align-items-center gap-3 mb-4" role="alert">
            <span>{error}</span>
            <button
              type="button"
              className="btn btn-sm btn-outline-danger ms-auto"
              onClick={() => void refetch()}
            >
              Reintentar
            </button>
          </div>
        )}

        {/* ── Alertas reales del receiver ────────────────────────────── */}
        {alerts.map((a, i) => (
          <div
            key={`${a.type}-${i}`}
            className={`alert alert-dismissible fade show mb-3 ${
              a.severity === "high"
                ? "alert-danger"
                : a.severity === "medium"
                  ? "bg-orange-transparent"
                  : "alert-info"
            }`}
            role="alert"
          >
            <i className="ti ti-info-circle fs-14 me-2" />
            {alertText(a.type, a.count)}
            <button
              type="button"
              className="btn-close fs-14"
              data-bs-dismiss="alert"
              aria-label="Cerrar"
            >
              <i className="ti ti-x" />
            </button>
          </div>
        ))}

        {/* ── Widget tiempo real ─────────────────────────────────────── */}
        {(realtime || loading) && (
          <div className="row mb-3">
            <div className="col-12">
              <div className="card border-info py-2">
                <div className="card-body py-2">
                  <div className="d-flex align-items-center flex-wrap gap-4">
                    <span className="fw-semibold text-info small">
                      Últimos 60 min:
                    </span>
                    <span className="small">
                      Órdenes:{" "}
                      <strong>
                        {loading ? <SkeletonValue /> : (realtime?.last_60min.orders ?? "—")}
                      </strong>
                    </span>
                    <span className="small">
                      Ingresos:{" "}
                      <strong>
                        {loading ? <SkeletonValue /> : fmtBs(realtime?.last_60min.revenue_bs)}
                      </strong>
                    </span>
                    <span className="small">
                      Chats:{" "}
                      <strong>
                        {loading ? <SkeletonValue /> : (realtime?.last_60min.chats ?? "—")}
                      </strong>
                    </span>
                    <span className="ms-auto small text-muted">
                      <span className="badge badge-live">● En vivo</span>
                    </span>
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* ── 4 cards superiores: métricas principales ──────────────── */}
        <div className="row">
          <div className="col-xl-3 col-sm-6 col-12 d-flex">
            <div className="card bg-primary sale-widget flex-fill">
              <div className="card-body d-flex align-items-center">
                <span className="sale-icon bg-white text-primary">
                  <i className="ti ti-file-text fs-24" />
                </span>
                <div className="ms-2">
                  <p className="text-white mb-1">Total Ventas Hoy</p>
                  <div className="d-inline-flex align-items-center flex-wrap gap-2">
                    <h4 className="text-white custome-heading">
                      {loading ? <SkeletonValue /> : fmtUsd(today?.revenue_usd)}
                    </h4>
                    {!loading && pctBadge(changes?.revenue_pct)}
                  </div>
                </div>
              </div>
            </div>
          </div>

          <div className="col-xl-3 col-sm-6 col-12 d-flex">
            <div className="card bg-secondary sale-widget flex-fill">
              <div className="card-body d-flex align-items-center">
                <span className="sale-icon bg-white text-secondary">
                  <i className="ti ti-repeat fs-24" />
                </span>
                <div className="ms-2">
                  <p className="text-white mb-1">Órdenes Hoy</p>
                  <div className="d-inline-flex align-items-center flex-wrap gap-2">
                    <h4 className="text-white custome-heading">
                      {loading ? <SkeletonValue /> : fmtInt(today?.orders_count)}
                    </h4>
                    {!loading && pctBadge(changes?.orders_pct)}
                  </div>
                </div>
              </div>
            </div>
          </div>

          <div className="col-xl-3 col-sm-6 col-12 d-flex">
            <div className="card bg-teal sale-widget flex-fill">
              <div className="card-body d-flex align-items-center">
                <span className="sale-icon bg-white text-teal">
                  <i className="ti ti-gift fs-24" />
                </span>
                <div className="ms-2">
                  <p className="text-white mb-1">Cobrado Bs</p>
                  <div className="d-inline-flex align-items-center flex-wrap gap-2">
                    <h4 className="text-white custome-heading">
                      {loading ? <SkeletonValue /> : fmtBs(today?.collected_bs)}
                    </h4>
                  </div>
                </div>
              </div>
            </div>
          </div>

          <div className="col-xl-3 col-sm-6 col-12 d-flex">
            <div className="card bg-info sale-widget flex-fill">
              <div className="card-body d-flex align-items-center">
                <span className="sale-icon bg-white text-info">
                  <i className="ti ti-brand-pocket fs-24" />
                </span>
                <div className="ms-2">
                  <p className="text-white mb-1">Pendiente por Cobrar</p>
                  <div className="d-inline-flex align-items-center flex-wrap gap-2">
                    <h4 className="text-white custome-heading">
                      {loading ? <SkeletonValue /> : fmtBs(today?.pending_bs)}
                    </h4>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* ── 4 cards secundarias: operaciones ─────────────────────── */}
        <div className="row">
          <div className="col-xl-3 col-sm-6 col-12 d-flex">
            <div className="card revenue-widget flex-fill">
              <div className="card-body">
                <div className="d-flex align-items-center justify-content-between mb-3 pb-3 border-bottom">
                  <div>
                    <h4 className="mb-1 custome-heading">
                      {loading ? <SkeletonValue /> : fmtInt(today?.new_customers)}
                    </h4>
                    <p>Clientes nuevos hoy</p>
                  </div>
                  <span className="revenue-icon bg-cyan-transparent text-cyan">
                    <i className="fa-solid fa-user-plus fs-16" />
                  </span>
                </div>
                <div className="d-flex align-items-center justify-content-between">
                  <p className="mb-0 text-muted small">Registrados hoy</p>
                  <Link href={route.customers} className="text-decoration-underline fs-13 fw-medium">
                    Ver todos
                  </Link>
                </div>
              </div>
            </div>
          </div>

          <div className="col-xl-3 col-sm-6 col-12 d-flex">
            <div className="card revenue-widget flex-fill">
              <div className="card-body">
                <div className="d-flex align-items-center justify-content-between mb-3 pb-3 border-bottom">
                  <div>
                    <h4 className="mb-1 custome-heading">
                      {loading ? <SkeletonValue /> : fmtInt(today?.messages_received)}
                    </h4>
                    <p>Mensajes recibidos</p>
                  </div>
                  <span className="revenue-icon bg-teal-transparent text-teal">
                    <i className="ti ti-message-circle fs-16" />
                  </span>
                </div>
                <div className="d-flex align-items-center justify-content-between">
                  <p className="mb-0 text-muted small">WhatsApp hoy</p>
                  <Link href={route.bandeja} className="text-decoration-underline fs-13 fw-medium">
                    Spacework
                  </Link>
                </div>
              </div>
            </div>
          </div>

          <div className="col-xl-3 col-sm-6 col-12 d-flex">
            <div className="card revenue-widget flex-fill">
              <div className="card-body">
                <div className="d-flex align-items-center justify-content-between mb-3 pb-3 border-bottom">
                  <div>
                    <h4 className="mb-1 custome-heading">
                      {loading ? <SkeletonValue /> : fmtInt(today?.auto_reconciled)}
                    </h4>
                    <p>Conciliaciones automáticas</p>
                  </div>
                  <span className="revenue-icon bg-orange-transparent text-orange">
                    <i className="ti ti-check fs-16" />
                  </span>
                </div>
                <div className="d-flex align-items-center justify-content-between">
                  <p className="mb-0 text-muted small">Conciliadas hoy</p>
                </div>
              </div>
            </div>
          </div>

          <div className="col-xl-3 col-sm-6 col-12 d-flex">
            <div
              className={`card revenue-widget flex-fill${
                (today?.manual_pending ?? 0) > 0 ? " border-warning" : ""
              }`}
            >
              <div className="card-body">
                <div className="d-flex align-items-center justify-content-between mb-3 pb-3 border-bottom">
                  <div>
                    <h4
                      className={`mb-1 custome-heading${
                        (today?.manual_pending ?? 0) > 0 ? " text-warning" : ""
                      }`}
                    >
                      {loading ? <SkeletonValue /> : fmtInt(today?.manual_pending)}
                    </h4>
                    <p>Revisión manual pendiente</p>
                  </div>
                  <span className="revenue-icon bg-indigo-transparent text-indigo">
                    <i className="ti ti-alert-circle fs-16" />
                  </span>
                </div>
                <div className="d-flex align-items-center justify-content-between">
                  <p className="mb-0 text-muted small">Requieren atención</p>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* ── Gráfico Sales & Purchase + Overall Information ─────────── */}
        <div className="row">
          <>
            <div className="col-xxl-8 col-xl-7 col-sm-12 col-12 d-flex">
              <div className="card flex-fill">
                <div className="card-header d-flex justify-content-between align-items-center">
                  <div className="d-inline-flex align-items-center">
                    <span className="title-icon bg-soft-primary fs-16 me-2">
                      <i className="ti ti-shopping-cart" />
                    </span>
                    <h5 className="card-title mb-0">Ventas (histórico)</h5>
                  </div>
                  <ul className="nav btn-group custom-btn-group">
                    <Link className="btn btn-outline-light" href="#">1D</Link>
                    <Link className="btn btn-outline-light" href="#">1W</Link>
                    <Link className="btn btn-outline-light" href="#">1M</Link>
                    <Link className="btn btn-outline-light active" href="#">1Y</Link>
                  </ul>
                </div>
                <div className="card-body pb-0">
                  <div>
                    <div className="d-flex align-items-center gap-2">
                      <div className="border p-2 br-8">
                        <p className="d-inline-flex align-items-center mb-1">
                          <i className="ti ti-circle-filled fs-8 text-primary-300 me-1" />
                          Órdenes pendientes
                        </p>
                        <h4>
                          {loading ? <SkeletonValue /> : fmtInt(today?.pending_orders)}
                        </h4>
                      </div>
                      <div className="border p-2 br-8">
                        <p className="d-inline-flex align-items-center mb-1">
                          <i className="ti ti-circle-filled fs-8 text-primary me-1" />
                          Total hoy
                        </p>
                        <h4>
                          {loading ? <SkeletonValue /> : fmtInt(today?.orders_count)}
                        </h4>
                      </div>
                    </div>
                    {/* TODO: conectar a GET /api/stats/sales en el siguiente sprint */}
                    <div id="sales-daychart">
                      <SalesDayChart />
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </>

          <div className="col-xxl-4 col-xl-5 d-flex">
            <div className="card flex-fill">
              <div className="card-header">
                <div className="d-inline-flex align-items-center">
                  <span className="title-icon bg-soft-info fs-16 me-2">
                    <i className="ti ti-info-circle" />
                  </span>
                  <h5 className="card-title mb-0">Información General</h5>
                </div>
              </div>
              <div className="card-body">
                <div className="row g-3">
                  <div className="col-md-4">
                    <div className="info-item border bg-light p-3 text-center">
                      <div className="mb-3 text-info fs-24">
                        <i className="ti ti-clock" />
                      </div>
                      <p className="mb-1">Órdenes Pendientes</p>
                      <h5>
                        {loading ? <SkeletonValue /> : fmtInt(today?.pending_orders)}
                      </h5>
                    </div>
                  </div>
                  <div className="col-md-4">
                    <div className="info-item border bg-light p-3 text-center">
                      <div className="mb-3 text-orange fs-24">
                        <i className="ti ti-users" />
                      </div>
                      <p className="mb-1">Clientes Nuevos</p>
                      <h5>
                        {loading ? <SkeletonValue /> : fmtInt(today?.new_customers)}
                      </h5>
                    </div>
                  </div>
                  <div className="col-md-4">
                    <div className="info-item border bg-light p-3 text-center">
                      <div className="mb-3 text-teal fs-24">
                        <i className="ti ti-shopping-cart" />
                      </div>
                      <p className="mb-1">Ventas Hoy</p>
                      <h5>
                        {loading ? <SkeletonValue /> : fmtInt(today?.orders_count)}
                      </h5>
                    </div>
                  </div>
                </div>
              </div>
              <div className="card-footer pb-sm-0">
                <div className="d-flex align-items-center justify-content-between flex-wrap gap-3">
                  <h6>Resumen del día</h6>
                </div>
                <div className="row align-items-center">
                  <div className="col-sm-5">
                    <div id="customer-chart">
                      <CustomerChart />
                    </div>
                  </div>
                  <div className="col-sm-7">
                    <div className="row gx-0">
                      <div className="col-sm-6">
                        <div className="text-center border-end">
                          <h2 className="mb-1">
                            {loading ? <SkeletonValue /> : fmtInt(today?.messages_received)}
                          </h2>
                          <p className="text-orange mb-2">Mensajes WA</p>
                        </div>
                      </div>
                      <div className="col-sm-6">
                        <div className="text-center">
                          <h2 className="mb-1">
                            {loading ? <SkeletonValue /> : fmtInt(today?.auto_reconciled)}
                          </h2>
                          <p className="text-teal mb-2">Conciliadas</p>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>

        <DreamposDashboardBlocks
          loading={loading}
          today={today}
          changes={changes}
        />

      </div>
      <CommonFooter />
    </div>
  );
}
