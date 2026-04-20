'use client';

import { useState, useCallback } from 'react';
import { useAiResponderStats } from '@/hooks/useAiResponderStats';
import { useAiResponderLog }   from '@/hooks/useAiResponderLog';
import type { AiResponderStats }  from '@/types/ai-responder';
import type { AiResponderLogAction, AiResponderLogProvider } from '@/types/ai-responder';
import './ai-monitor-theme.scss';

// ── Tipos de salud ────────────────────────────────────────────────────────

type Health = 'green' | 'amber' | 'red';

const HEALTH_CFG = {
  green: {
    color:      'var(--bot-green)',
    label:      'Sano',
    offset:     37,
    em:         'orden',
    title:      'Todo en orden. Procesando normalmente.',
    gradient:   ['#86efac', '#34d399'] as [string, string],
  },
  amber: {
    color:      'var(--bot-amber)',
    label:      'Alerta',
    offset:     150,
    em:         'Atención',
    title:      'Atención · worker lento o con errores.',
    gradient:   ['#fcd34d', '#f59e0b'] as [string, string],
  },
  red: {
    color:      'var(--bot-red)',
    label:      'Caído',
    offset:     280,
    em:         'caído',
    title:      'Bot caído · revisar configuración.',
    gradient:   ['#fca5a5', '#ef4444'] as [string, string],
  },
};

function computeHealth(stats: AiResponderStats | null): Health {
  if (!stats) return 'red';
  // TODO(backend): 'enabled' no disponible · asume true si no presente
  if (stats.enabled === false) return 'red';
  // TODO(backend): 'worker_running' no disponible · inferido de last_cycle_at
  const workerOk = stats.worker_running ?? (stats.last_cycle_at != null);
  if (!workerOk) return 'red';
  // TODO(backend): 'last_cycle_at' no disponible · lastCycleAgoSec será Infinity
  const lastCycleAgoSec = stats.last_cycle_at
    ? (Date.now() - new Date(stats.last_cycle_at).getTime()) / 1000
    : Infinity;
  // TODO(backend): 'today_messages.errors' no disponible · derivado de today_log_by_action
  const errorsToday = stats.today_messages?.errors ?? getLogActionCount(stats, 'error');
  if (lastCycleAgoSec > 60 || errorsToday > 0) return 'amber';
  return 'green';
}

// ── Helpers de derivación desde el shape actual del backend ───────────────

function getLogActionCount(stats: AiResponderStats, action: string): number {
  return stats.today_log_by_action.find(e => e.action_taken === action)?.n ?? 0;
}

/** Derivar today_messages.total desde today_by_status (TODO backend). */
function getTodayTotal(stats: AiResponderStats): number {
  if (stats.today_messages?.total !== undefined) return stats.today_messages.total;
  // TODO(backend): today_messages.total no disponible · se suma today_by_status
  const s = stats.today_by_status;
  return s.ai_replied + s.needs_human_review + s.skipped + s.processing + s.pending;
}

function getTodayAiReplied(stats: AiResponderStats): number {
  return stats.today_messages?.ai_replied ?? stats.today_by_status.ai_replied;
}

function getTodayHumanReplied(stats: AiResponderStats): number {
  // TODO(backend): today_messages.human_replied no disponible · derivado de today_log_by_action
  return stats.today_messages?.human_replied ?? getLogActionCount(stats, 'human_replied');
}

function getTodayHumanRejected(stats: AiResponderStats): number {
  // TODO(backend): today_messages.human_rejected no disponible · derivado de today_log_by_action 'rejected'
  return stats.today_messages?.human_rejected ?? getLogActionCount(stats, 'rejected');
}

function getTodayErrors(stats: AiResponderStats): number {
  // TODO(backend): today_messages.errors no disponible · derivado de today_log_by_action 'error'
  return stats.today_messages?.errors ?? getLogActionCount(stats, 'error');
}

function formatLastCycle(iso: string | null | undefined): string {
  // TODO(backend): last_cycle_at no disponible · muestra "—"
  if (!iso) return '— · info no disponible';
  const t = new Date(iso).getTime();
  if (!Number.isFinite(t)) return '—';
  const secs = Math.floor((Date.now() - t) / 1000);
  if (secs < 60)   return `hace ${secs}s`;
  if (secs < 3600) return `hace ${Math.floor(secs / 60)}m`;
  return `hace ${Math.floor(secs / 3600)}h`;
}

function formatTime(iso: string): string {
  try {
    return new Date(iso).toLocaleTimeString('es-VE', {
      hour:   '2-digit',
      minute: '2-digit',
      second: '2-digit',
    });
  } catch {
    return '—';
  }
}

// ── Tipos de filtro de log ────────────────────────────────────────────────

type LogFilter = 'all' | 'sent' | 'human' | 'rejected' | 'error';

const LOG_FILTER_DEFS: { key: LogFilter; label: string; color: string }[] = [
  { key: 'all',      label: 'Todo',     color: 'var(--text-dim)' },
  { key: 'sent',     label: 'sent',     color: '#86efac' },
  { key: 'human',    label: 'human',    color: '#93c5fd' },
  { key: 'rejected', label: 'rejected', color: '#9ca3af' },
  { key: 'error',    label: 'error',    color: '#fca5a5' },
];

function matchesFilter(action: AiResponderLogAction, filter: LogFilter): boolean {
  if (filter === 'all') return true;
  if (filter === 'sent')     return action === 'sent';
  if (filter === 'human')    return action === 'human_replied' || action === 'draft_saved';
  if (filter === 'rejected') return action === 'rejected' || action === 'legacy_archived' || action === 'legacy_archived_block_attempt';
  if (filter === 'error')    return action === 'error';
  return true;
}

// ── Sub-componentes ───────────────────────────────────────────────────────

function HealthRing({ health }: { health: Health }) {
  const cfg = HEALTH_CFG[health];
  return (
    <div className="am-ring-wrap">
      <svg
        className="am-ring-svg"
        width="130"
        height="130"
        viewBox="0 0 140 140"
        fill="none"
        xmlns="http://www.w3.org/2000/svg"
      >
        <circle cx="70" cy="70" r="60" stroke="var(--panel-3)" strokeWidth="8" />
        <circle
          cx="70"
          cy="70"
          r="60"
          stroke={cfg.color}
          strokeWidth="8"
          strokeLinecap="round"
          strokeDasharray="377"
          strokeDashoffset={cfg.offset}
          style={{ filter: `drop-shadow(0 0 8px ${cfg.color}40)` }}
        />
      </svg>
      <div className="am-ring-center">
        <span className="am-ring-emoji">🤖</span>
        <span className={`am-ring-pill health-${health}`}>{cfg.label}</span>
      </div>
    </div>
  );
}

function ActionChip({ action }: { action: AiResponderLogAction }) {
  const cls = `log-action-chip chip-${action.replace(/_/g, '_')}`;
  const label = action.replace(/_/g, ' ');
  return (
    <span className={cls}>
      <span className="chip-dot" />
      {label}
    </span>
  );
}

function ProviderTag({ provider }: { provider: AiResponderLogProvider }) {
  return (
    <span className={`log-provider-tag prov-${provider}`}>{provider}</span>
  );
}

// ── Skeletons ─────────────────────────────────────────────────────────────

function SkeletonHero() {
  return (
    <div className="am-hero" style={{ alignItems: 'flex-start' }}>
      <div className="am-skeleton am-skeleton-ring" />
      <div style={{ flex: 1 }}>
        <div className="am-skeleton am-skeleton-text" style={{ width: '60%' }} />
        <div className="am-skeleton am-skeleton-text" style={{ width: '80%', height: 28, marginBottom: 12 }} />
        <div className="am-skeleton am-skeleton-text" style={{ width: '50%' }} />
      </div>
      <div style={{ display: 'flex', flexDirection: 'column', gap: 8, minWidth: 220 }}>
        <div className="am-skeleton" style={{ height: 62, borderRadius: 10 }} />
        <div className="am-skeleton" style={{ height: 62, borderRadius: 10 }} />
      </div>
    </div>
  );
}

function SkeletonKpi() {
  return (
    <div className="am-kpi-grid">
      {Array.from({ length: 7 }).map((_, i) => (
        <div key={i} className="am-skeleton am-skeleton-kpi" />
      ))}
    </div>
  );
}

function SkeletonLog() {
  return (
    <div className="am-log-section">
      <div style={{ display: 'flex', gap: 8, marginBottom: 4 }}>
        <div className="am-skeleton" style={{ width: 90, height: 20, borderRadius: 6 }} />
        <div className="am-skeleton" style={{ width: 60, height: 20, borderRadius: 20 }} />
      </div>
      <div className="am-log-table-wrap" style={{ padding: 12 }}>
        {Array.from({ length: 5 }).map((_, i) => (
          <div key={i} className="am-skeleton am-skeleton-row" />
        ))}
      </div>
    </div>
  );
}

// ── KPI card ──────────────────────────────────────────────────────────────

interface KpiCardProps {
  label:      string;
  value:      number | string;
  sub:        string;
  accentVar:  string;
  valueColor: string;
  iconClass:  string;
}

function KpiCard({ label, value, sub, accentVar, valueColor, iconClass }: KpiCardProps) {
  return (
    <div
      className="am-kpi-card"
      style={{
        '--kpi-accent':      `var(${accentVar})`,
        '--kpi-icon-bg':     `color-mix(in srgb, var(${accentVar}) 12%, transparent)`,
        '--kpi-value-color': valueColor,
      } as React.CSSProperties}
    >
      <div className="am-kpi-icon-row">
        <div className="am-kpi-icon">
          <i className={`ti ${iconClass}`} />
        </div>
      </div>
      <div className="am-kpi-value">{value}</div>
      <div className="am-kpi-label">{label}</div>
      <div className="am-kpi-sub">{sub}</div>
    </div>
  );
}

// ── Página principal ──────────────────────────────────────────────────────

export default function AiResponderMonitorPage() {
  const {
    stats,
    loading:     statsLoading,
    error:       statsError,
    refetch:     statsRefetch,
  } = useAiResponderStats();

  const {
    data:        logRows,
    loading:     logLoading,
    error:       logError,
    refresh:     logRefresh,
  } = useAiResponderLog(50);

  const [logFilter, setLogFilter] = useState<LogFilter>('all');

  const handleRefresh = useCallback(async () => {
    await Promise.all([statsRefetch(), logRefresh()]);
  }, [statsRefetch, logRefresh]);

  const health = computeHealth(stats);
  const hcfg   = HEALTH_CFG[health];

  const isLoading   = statsLoading && logLoading;
  const isAuthError = logError?.kind === 'auth';
  const isNetError  = statsError && !isAuthError;

  const filteredLog = logRows.filter(r => matchesFilter(r.action_taken, logFilter));

  // ── Render: loading inicial ──────────────────────────────────────────
  if (isLoading) {
    return (
      <div className="ai-monitor">
        <div className="am-topbar">
          <div className="am-topbar-left">
            <span className="am-breadcrumb am-breadcrumb-text">AI Responder · Monitor</span>
            <h1 className="am-title">Salud del bot</h1>
          </div>
          <div className="am-topbar-right">
            <div className="am-live-chip">
              <span className="am-live-dot" />
              <span>En vivo · 30s</span>
            </div>
          </div>
        </div>
        <SkeletonHero />
        <SkeletonKpi />
        <SkeletonLog />
      </div>
    );
  }

  // ── Render: error de red ─────────────────────────────────────────────
  if (isNetError && !stats) {
    return (
      <div className="ai-monitor">
        <div className="am-topbar">
          <div className="am-topbar-left">
            <span className="am-breadcrumb am-breadcrumb-text">AI Responder · Monitor</span>
            <h1 className="am-title">Salud del bot</h1>
          </div>
        </div>
        <div className="am-error-state">
          <p className="am-error-title">
            No se pudo cargar el estado del bot · {statsError}
          </p>
          <button className="am-error-btn" onClick={() => void handleRefresh()}>
            Reintentar
          </button>
        </div>
      </div>
    );
  }

  // ── Valores derivados del stats ──────────────────────────────────────
  const todayTotal        = stats ? getTodayTotal(stats)         : 0;
  const todayAiReplied    = stats ? getTodayAiReplied(stats)     : 0;
  const todayHumanReplied = stats ? getTodayHumanReplied(stats)  : 0;
  const todayRejected     = stats ? getTodayHumanRejected(stats) : 0;
  const todayErrors       = stats ? getTodayErrors(stats)        : 0;
  const totalPending      = stats?.total_pending_count  ?? 0;
  const legacyArchived    = stats?.legacy_archived_count ?? 0;

  const forceSend         = stats?.force_send      ?? false;
  // TODO(backend): worker_running no disponible · inferido de last_cycle_at
  const workerRunning     = stats?.worker_running ?? (stats?.last_cycle_at != null);
  const lastCycleText     = formatLastCycle(stats?.last_cycle_at);

  const errorsValue  = todayErrors;
  const errorsColor  = errorsValue > 0 ? '#fca5a5' : '#86efac';

  // ── Render: página completa ──────────────────────────────────────────
  return (
    <div className="ai-monitor">

      {/* Auth error banner (no bloquea la página) */}
      {isAuthError && (
        <div className="am-auth-banner">
          <span>Sesión expirada · recargá la página para continuar</span>
          <button onClick={() => window.location.reload()}>Recargar</button>
        </div>
      )}

      {/* ── Topbar ─────────────────────────────────────────────────── */}
      <div className="am-topbar">
        <div className="am-topbar-left">
          <span className="am-breadcrumb am-breadcrumb-text">AI Responder · Monitor</span>
          <h1 className="am-title">Salud del bot</h1>
        </div>
        <div className="am-topbar-right">
          <div className="am-live-chip">
            <span className="am-live-dot" />
            <span>En vivo · 30s</span>
          </div>
          <button
            className="am-btn-refresh"
            onClick={() => void handleRefresh()}
            aria-label="Refrescar datos"
          >
            <i className="ti ti-refresh" style={{ fontSize: 13 }} />
            <span className="am-btn-refresh-label">Refrescar</span>
          </button>
        </div>
      </div>

      {/* ── Hero ───────────────────────────────────────────────────── */}
      <div className="am-hero">
        {/* Col 1 · Ring */}
        <HealthRing health={health} />

        {/* Col 2 · Body */}
        <div className="am-hero-body">
          <div className="am-hero-kicker">
            <span className="am-kicker-dot" />
            Bot AI Responder · Producción
          </div>
          <h1
            className="am-hero-title"
            style={{
              '--_em-gradient': `linear-gradient(135deg, ${hcfg.gradient[0]}, ${hcfg.gradient[1]})`,
            } as React.CSSProperties}
          >
            {hcfg.title.replace(hcfg.em, '')}
            <em>{hcfg.em}</em>
            {hcfg.title.endsWith(hcfg.em) ? '' : hcfg.title.slice(hcfg.title.lastIndexOf(hcfg.em) + hcfg.em.length)}
          </h1>
          <p className="am-hero-sub">
            Último ciclo: <code>{lastCycleText}</code>
            {todayTotal > 0 && (
              <> · <code>{todayTotal}</code> mensajes procesados hoy</>
            )}
          </p>
        </div>

        {/* Col 3 · Mode cards */}
        <div className="am-hero-cards">
          <div className="am-mode-card">
            <div className="am-mode-label">Modo actual</div>
            <div className="am-mode-row">
              <span className="am-mode-value">
                {forceSend ? 'Auto-envío' : 'Revisión humana'}
              </span>
              <span className={`am-mode-badge ${forceSend ? 'badge-auto' : 'badge-human'}`}>
                {forceSend ? 'AUTO' : 'HUMAN'}
              </span>
            </div>
          </div>
          <div className="am-mode-card">
            <div className="am-mode-label">Worker</div>
            <div className="am-mode-row">
              <span className="am-mode-value">
                {workerRunning ? 'Corriendo' : 'Detenido'}
              </span>
              <span className={`am-mode-badge ${workerRunning ? 'badge-run' : 'badge-off'}`}>
                {workerRunning ? 'RUN' : 'OFF'}
              </span>
            </div>
          </div>
        </div>
      </div>

      {/* ── KPI grid ───────────────────────────────────────────────── */}
      <div className="am-kpi-grid">
        <KpiCard
          label="En cola"
          value={totalPending}
          sub="needs_human_review"
          accentVar="--s04"
          valueColor="#fcd34d"
          iconClass="ti-clock-hour-3"
        />
        <KpiCard
          label="Archivados hist."
          value={legacyArchived}
          sub="legacy_archived"
          accentVar="--s07"
          valueColor="var(--text)"
          iconClass="ti-archive"
        />
        <KpiCard
          label="Mensajes hoy"
          value={todayTotal}
          sub="total procesados"
          accentVar="--s02"
          valueColor="#93c5fd"
          iconClass="ti-messages"
        />
        <KpiCard
          label="AI respondió"
          value={todayAiReplied}
          sub="ai_replied"
          accentVar="--bot-green"
          valueColor="#86efac"
          iconClass="ti-robot"
        />
        <KpiCard
          label="Humano respondió"
          value={todayHumanReplied}
          sub="human_replied"
          accentVar="--s05"
          valueColor="#c4b5fd"
          iconClass="ti-user-check"
        />
        <KpiCard
          label="Rechazados"
          value={todayRejected}
          sub="human_rejected"
          accentVar="--s07"
          valueColor="var(--text)"
          iconClass="ti-x"
        />
        <KpiCard
          label="Errores hoy"
          value={errorsValue === 0 ? '0' : errorsValue}
          sub={errorsValue === 0 ? 'ok' : 'warn · revisar log'}
          accentVar={errorsValue > 0 ? '--bot-red' : '--bot-green'}
          valueColor={errorsColor}
          iconClass={errorsValue > 0 ? 'ti-alert-triangle' : 'ti-circle-check'}
        />
      </div>

      {/* ── Log section ────────────────────────────────────────────── */}
      <div className="am-log-section">
        <div className="am-log-header">
          <span className="am-log-title">Log en vivo</span>
          <span className="am-log-count-badge">últimos 50</span>
          <div className="am-log-filters">
            {LOG_FILTER_DEFS.map(f => (
              <button
                key={f.key}
                className={`am-filter-pill ${logFilter === f.key ? 'active' : ''}`}
                onClick={() => setLogFilter(f.key)}
              >
                <span className="am-filter-dot" style={{ background: f.color }} />
                {f.label}
              </button>
            ))}
          </div>
        </div>

        {logError && logError.kind === 'network' && (
          <div className="am-error-state" style={{ padding: 24 }}>
            <p className="am-error-title">Error al cargar log · {logError.message}</p>
            <button className="am-error-btn" onClick={() => void logRefresh()}>Reintentar</button>
          </div>
        )}

        {!logError && (
          <div className="am-log-table-wrap">
            {logLoading ? (
              <div style={{ padding: 12 }}>
                {Array.from({ length: 5 }).map((_, i) => (
                  <div key={i} className="am-skeleton am-skeleton-row" />
                ))}
              </div>
            ) : (
              <table className="log-table">
                <thead>
                  <tr>
                    <th>Hora</th>
                    <th>Acción</th>
                    <th>Proveedor</th>
                    <th>Msg ID</th>
                    <th>Reasoning</th>
                  </tr>
                </thead>
                <tbody>
                  {filteredLog.length === 0 ? (
                    <tr>
                      <td
                        colSpan={5}
                        style={{
                          textAlign: 'center',
                          padding: '28px',
                          color: 'var(--text-faint)',
                          fontFamily: 'var(--font-mono)',
                          fontSize: 11,
                        }}
                      >
                        Sin entradas para este filtro
                      </td>
                    </tr>
                  ) : (
                    filteredLog.map(row => (
                      <tr key={row.id}>
                        <td className="log-time" data-label="Hora">
                          {formatTime(row.created_at)}
                        </td>
                        <td data-label="Acción">
                          <ActionChip action={row.action_taken} />
                        </td>
                        <td data-label="Proveedor">
                          <ProviderTag provider={row.provider_used} />
                        </td>
                        <td className="log-msg-id" data-label="Msg ID">
                          {row.message_id != null ? (
                            <>
                              <span className="hash">#</span>
                              {row.message_id}
                            </>
                          ) : (
                            <span style={{ opacity: .4 }}>—</span>
                          )}
                        </td>
                        <td
                          className="reasoning-cell"
                          data-label="Reasoning"
                          title={row.reasoning ?? ''}
                        >
                          <span className="log-reasoning">
                            {row.reasoning ?? <span style={{ opacity: .4 }}>—</span>}
                          </span>
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
