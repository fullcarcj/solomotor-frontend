"use client";

import { useEffect, useState, useCallback } from "react";
import Link from "next/link";

/* ─── Tipos ──────────────────────────────────────────────────────────────── */
interface PageStatus {
  connected: boolean;
  token_configured: boolean;
  page_id_env: string | null;
  verify_token_configured: boolean;
  app_secret_configured: boolean;
  page: {
    id: string;
    name: string;
    fan_count?: number;
    about?: string;
    category?: string;
    link?: string;
    verification_status?: string;
    picture?: { data?: { url?: string } };
  } | null;
  crm: { total_chats: number; unread_chats: number };
  error: string | null;
}

interface FbStats {
  period_days: number;
  total_chats: number;
  unread_chats: number;
  attended_chats: number;
  total_messages: number;
  inbound_messages: number;
  outbound_messages: number;
  response_rate_pct: number | null;
  new_chats_period: number;
  messages_period: number;
}

/* ─── Helpers ────────────────────────────────────────────────────────────── */
function StatCard({ label, value, sub, color = "primary" }: { label: string; value: string | number; sub?: string; color?: string }) {
  return (
    <div className="col-6 col-md-3">
      <div className="card h-100 border-0 shadow-sm">
        <div className="card-body py-3 px-3">
          <p className="text-muted small mb-1">{label}</p>
          <p className={`fw-bold fs-4 mb-0 text-${color}`}>{value}</p>
          {sub && <p className="text-muted small mb-0">{sub}</p>}
        </div>
      </div>
    </div>
  );
}

const FB_BLUE = "#0866ff";

const QUICK_LINKS = [
  { href: "/bandeja?src=fb_page", icon: "ti-messages",      label: "Mensajes",       color: FB_BLUE },
  { href: "/facebook/publicaciones", icon: "ti-news",       label: "Publicaciones",  color: "#6366f1" },
  { href: "/facebook/configuracion", icon: "ti-settings",   label: "Configuración",  color: "#64748b" },
];

/* ─── Componentes ─────────────────────────────────────────────────────────── */
function ConnectionCard({ status }: { status: PageStatus | null; loading: boolean }) {
  if (!status) return null;
  const p = status.page;
  const picUrl = p?.picture?.data?.url;
  const verified = p?.verification_status === "blue_verified" || p?.verification_status === "gray_verified";

  return (
    <div className="card border-0 shadow-sm mb-4">
      <div className="card-body d-flex align-items-center gap-3">
        {picUrl && (
          <img src={picUrl} alt={p?.name ?? "Página"} className="rounded-circle flex-shrink-0"
            width={56} height={56} style={{ objectFit: "cover" }} />
        )}
        {!picUrl && (
          <span className="rounded-circle d-flex align-items-center justify-content-center flex-shrink-0"
            style={{ width: 56, height: 56, background: FB_BLUE, color: "#fff", fontSize: 24 }}>
            <i className="ti ti-brand-facebook" />
          </span>
        )}
        <div className="flex-grow-1 min-w-0">
          <div className="d-flex align-items-center gap-2 flex-wrap">
            <span className="fw-bold fs-5">{p?.name ?? "Página no conectada"}</span>
            {verified && <span className="badge" style={{ background: FB_BLUE, fontSize: "0.65rem" }}>Verificada</span>}
            {status.connected
              ? <span className="badge bg-success" style={{ fontSize: "0.65rem" }}>Conectada</span>
              : <span className="badge bg-danger"  style={{ fontSize: "0.65rem" }}>Sin conexión</span>}
          </div>
          {p?.category && <p className="text-muted small mb-0">{p.category}</p>}
          {p?.about    && <p className="text-muted small mb-0 text-truncate" style={{ maxWidth: 400 }}>{p.about}</p>}
          {!status.connected && status.error && (
            <p className="text-danger small mb-0">⚠ {status.error}</p>
          )}
        </div>
        <div className="flex-shrink-0 text-end">
          {p?.fan_count != null && (
            <div>
              <span className="fw-bold fs-5">{p.fan_count.toLocaleString()}</span>
              <span className="text-muted small ms-1">seguidores</span>
            </div>
          )}
          {p?.link && (
            <a href={p.link} target="_blank" rel="noopener noreferrer"
               className="btn btn-sm mt-1" style={{ background: FB_BLUE, color: "#fff", borderColor: FB_BLUE }}>
              <i className="ti ti-external-link me-1" />Ver página
            </a>
          )}
        </div>
      </div>
    </div>
  );
}

function StatsSection({ stats, days, onChangeDays }: { stats: FbStats | null; days: number; onChangeDays: (d: number) => void }) {
  if (!stats) return null;
  return (
    <div className="mb-4">
      <div className="d-flex align-items-center justify-content-between mb-3">
        <h6 className="mb-0 fw-semibold">Actividad de conversaciones</h6>
        <select className="form-select form-select-sm" style={{ width: "auto" }}
          value={days} onChange={e => onChangeDays(Number(e.target.value))}>
          <option value={7}>Últimos 7 días</option>
          <option value={30}>Últimos 30 días</option>
          <option value={90}>Últimos 90 días</option>
        </select>
      </div>
      <div className="row g-3">
        <StatCard label="Conversaciones totales" value={stats.total_chats} />
        <StatCard label="Sin atender"            value={stats.unread_chats}    color="danger" />
        <StatCard label="Nuevas (período)"       value={stats.new_chats_period} color="info" sub={`${days} días`} />
        <StatCard label="Tasa de respuesta"
          value={stats.response_rate_pct != null ? `${stats.response_rate_pct}%` : "—"}
          color={stats.response_rate_pct != null && stats.response_rate_pct >= 80 ? "success" : "warning"} />
        <StatCard label="Mensajes entrantes"    value={stats.inbound_messages} />
        <StatCard label="Mensajes enviados"     value={stats.outbound_messages} color="success" />
        <StatCard label="Mensajes (período)"    value={stats.messages_period}   color="secondary" sub={`${days} días`} />
        <StatCard label="Atendidas"             value={stats.attended_chats}    color="success" />
      </div>
    </div>
  );
}

/* ─── Página principal ───────────────────────────────────────────────────── */
export default function CentralFacebookPage() {
  const [status, setStatus]   = useState<PageStatus | null>(null);
  const [stats,  setStats]    = useState<FbStats | null>(null);
  const [days,   setDays]     = useState(7);
  const [loading, setLoading] = useState(true);
  const [error,   setError]   = useState<string | null>(null);

  const loadStatus = useCallback(async () => {
    try {
      const r = await fetch("/api/facebook/status", { credentials: "include" });
      const d = await r.json().catch(() => ({})) as PageStatus;
      setStatus(d);
    } catch (e) {
      setError(e instanceof Error ? e.message : "Error al cargar estado.");
    }
  }, []);

  const loadStats = useCallback(async (d: number) => {
    try {
      const r = await fetch(`/api/facebook/stats?days=${d}`, { credentials: "include" });
      const data = await r.json().catch(() => ({})) as FbStats;
      setStats(data);
    } catch (_) {}
  }, []);

  useEffect(() => {
    void Promise.all([loadStatus(), loadStats(days)]).finally(() => setLoading(false));
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  useEffect(() => {
    void loadStats(days);
  }, [days, loadStats]);

  return (
    <div className="page-wrapper">
      <div className="content">
        {/* Header */}
        <div className="page-header d-flex justify-content-between align-items-center mb-4">
          <div>
            <h4 className="mb-0 d-flex align-items-center gap-2">
              <span className="rounded d-inline-flex align-items-center justify-content-center"
                style={{ width: 32, height: 32, background: FB_BLUE, color: "#fff" }}>
                <i className="ti ti-brand-facebook" style={{ fontSize: "1.1rem" }} />
              </span>
              Central Facebook
            </h4>
            <p className="text-muted small mb-0">Mensajería y gestión de tu Fan Page</p>
          </div>
          <button type="button" className="btn btn-sm btn-outline-secondary"
            onClick={() => { void loadStatus(); void loadStats(days); }}>
            <i className="ti ti-refresh me-1" />Actualizar
          </button>
        </div>

        {loading && (
          <div className="placeholder-glow">
            {Array.from({ length: 4 }).map((_, i) => (
              <div key={i} className="placeholder col-12 rounded mb-3" style={{ height: 80 }} />
            ))}
          </div>
        )}

        {!loading && error && (
          <div className="alert alert-danger">{error}</div>
        )}

        {!loading && (
          <>
            {/* Tarjeta de conexión */}
            <ConnectionCard status={status} loading={loading} />

            {/* Accesos rápidos */}
            <div className="d-flex flex-wrap gap-2 mb-4">
              {QUICK_LINKS.map(l => (
                <Link key={l.href} href={l.href}
                  className="btn btn-sm d-flex align-items-center gap-1"
                  style={{ background: l.color, color: "#fff", borderColor: l.color }}>
                  <i className={`ti ${l.icon}`} />
                  {l.label}
                </Link>
              ))}
              <Link href="/bandeja?src=fb_page&filter=unread"
                className="btn btn-sm btn-outline-danger d-flex align-items-center gap-1">
                <i className="ti ti-bell-ringing" />
                Sin atender
                {status && status.crm.unread_chats > 0 && (
                  <span className="badge bg-danger ms-1">{status.crm.unread_chats}</span>
                )}
              </Link>
            </div>

            {/* Estadísticas */}
            <StatsSection stats={stats} days={days} onChangeDays={setDays} />

            {/* Aviso si no conectado */}
            {status && !status.connected && (
              <div className="alert alert-warning d-flex align-items-start gap-2">
                <i className="ti ti-alert-triangle fs-5 flex-shrink-0 mt-1" />
                <div>
                  <strong>Facebook no está conectado.</strong>{" "}
                  Configura las variables de entorno en el backend y registra el webhook en Meta Developers.
                  <div className="mt-2">
                    <Link href="/facebook/configuracion" className="btn btn-sm btn-warning">
                      Ir a Configuración
                    </Link>
                  </div>
                </div>
              </div>
            )}
          </>
        )}
      </div>
    </div>
  );
}
