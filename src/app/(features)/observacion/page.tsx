'use client';

import { useEffect, useMemo, useState } from 'react';
import { useSupervisorKPIs } from '@/hooks/useSupervisorKPIs';
import { useSupervisorExceptions } from '@/hooks/useSupervisorExceptions';
import { useInbox } from '@/hooks/useInbox';
import { useAiResponderStats } from '@/hooks/useAiResponderStats';
import type { InboxChat } from '@/types/inbox';
import { CHAT_STAGE_LABELS } from '@/types/inbox';
import { EXCEPTION_KIND_LABELS } from '@/types/supervisor';
import './observacion.scss';

// ── CHANNEL_NAMES exactos del HTML ─────────────────────────────
const CHANNEL_NAMES: Record<number, string> = {
  1: 'MOSTRADOR',
  2: 'WA+REDES',
  3: 'ML',
  4: 'ECO',
  5: 'F.VENTA',
};

const REFRESH_SECONDS = 30;

/** source_type → {label, badgeClass} igual que el HTML */
function channelBadge(chat: InboxChat): { label: string; cls: string } {
  const src = (chat.source_type || '').toLowerCase();
  if (src === 'wa_inbound')    return { label: 'WA+REDES', cls: 'ch2' };
  if (src === 'ml_question')   return { label: 'ML·Q',     cls: 'ch3' };
  if (src === 'ml_message')    return { label: 'ML·M',     cls: 'ch3' };
  if (src === 'wa_ml_linked')  return { label: 'WA+ML',    cls: 'ch4' };
  const fromOrder = chat.order?.channel_id;
  if (fromOrder && CHANNEL_NAMES[fromOrder]) {
    return { label: CHANNEL_NAMES[fromOrder], cls: `ch${fromOrder}` };
  }
  return { label: chat.source_type || '—', cls: 'ch1' };
}

function formatRelTime(iso: string | null | undefined): string {
  if (!iso) return '—';
  const t = new Date(iso).getTime();
  if (!Number.isFinite(t)) return '—';
  const diff = (Date.now() - t) / 1000;
  if (diff < 60) return 'ahora';
  if (diff < 3600) return `${Math.floor(diff / 60)}m`;
  if (diff < 86400) return `${Math.floor(diff / 3600)}h`;
  return `${Math.floor(diff / 86400)}d`;
}

interface RatioBucket {
  total: number;
  linked: number;
  pct: number;
}

/**
 * Calcula ratio conversation_id desde chats.
 * Considera órdenes asociadas (c.order_id || c.order?.id) y mide si el
 * order.conversation_id está populado. Backend actual puede no exponer
 * conversation_id en el JSON — en ese caso el ratio será 0% (documentado).
 */
function computeRatio(chats: InboxChat[], windowMs: number): RatioBucket {
  const now = Date.now();
  let total = 0;
  let linked = 0;
  for (const c of chats) {
    const isoRaw = (c.last_message_at as string | null | undefined) ?? null;
    if (!isoRaw) continue;
    const t = new Date(isoRaw).getTime();
    if (!Number.isFinite(t)) continue;
    if (now - t >= windowMs) continue;
    // @ts-expect-error — deuda: order_id no está tipado en InboxChat todavía
    const orderId = c.order_id ?? c.order?.id ?? null;
    if (!orderId) continue;
    total += 1;
    // @ts-expect-error — conversation_id aún no está en el tipo; el HTML lo espera en c.order o c raíz
    const convId = c.order?.conversation_id ?? c.conversation_id ?? null;
    if (convId) linked += 1;
  }
  const pct = total > 0 ? Math.round((linked / total) * 1000) / 10 : 0;
  return { total, linked, pct };
}

// ── Bloques SQL estáticos ──────────────────────────────────────
const SQL_Q1 = `-- Q1 · Ratio exacto de populate (48h agrupado por día y canal)
SELECT DATE(created_at) AS dia, channel_id,
       COUNT(*) AS total,
       COUNT(conversation_id) AS con_link,
       ROUND((COUNT(conversation_id)::numeric / COUNT(*)) * 100, 1) AS pct
FROM sales_orders
WHERE created_at > NOW() - INTERVAL '48 hours'
GROUP BY DATE(created_at), channel_id
ORDER BY dia DESC, channel_id;`;

const SQL_Q2 = `-- Q2 · Actividad del bot últimas 48h
SELECT action_type, COUNT(*) AS n
FROM bot_actions
WHERE created_at > NOW() - INTERVAL '48 hours'
GROUP BY action_type
ORDER BY n DESC;`;

const SQL_Q3 = `-- Q3 · ai_reply_status en 48h (crm_messages inbound)
SELECT ai_reply_status, COUNT(*) AS n
FROM crm_messages
WHERE direction = 'inbound'
  AND created_at > NOW() - INTERVAL '48 hours'
GROUP BY ai_reply_status
ORDER BY n DESC;`;

const SQL_Q4 = `-- Q4 · Handoffs activos ahora
SELECT id, chat_id, reason, started_at
FROM bot_handoffs
WHERE ended_at IS NULL
ORDER BY started_at DESC;`;

/** Colorear keywords/strings simples (igual que el HTML) para el bloque SQL */
function highlightSql(sql: string): React.ReactNode {
  const tokens = sql.split(/(\b(?:SELECT|FROM|WHERE|AND|OR|GROUP BY|ORDER BY|IS NULL|IS NOT NULL|INTERVAL|NOT|AS|ON|JOIN|LEFT|RIGHT|INNER|DESC|ASC|COUNT|DATE|ROUND|NOW)\b|'[^']*')/gi);
  return tokens.map((tok, i) => {
    if (/^'[^']*'$/.test(tok)) return <span key={i} className="str">{tok}</span>;
    if (/^(SELECT|FROM|WHERE|AND|OR|GROUP BY|ORDER BY|IS NULL|IS NOT NULL|INTERVAL|NOT|AS|ON|JOIN|LEFT|RIGHT|INNER|DESC|ASC|COUNT|DATE|ROUND|NOW)$/i.test(tok)) {
      return <span key={i} className="kw">{tok}</span>;
    }
    return <span key={i}>{tok}</span>;
  });
}

export default function ObservacionPage() {
  // ── Data hooks ─────────────────────────────────────────────
  const kpisState = useSupervisorKPIs();
  const excState = useSupervisorExceptions();
  const inboxRatio = useInbox({ limit: 100 });
  const inboxTable = useInbox({ limit: 15 });
  const aiStats = useAiResponderStats();

  // ── Countdown visual (30 → 0 → 30) ─────────────────────────
  const [countdown, setCountdown] = useState(REFRESH_SECONDS);
  useEffect(() => {
    const iv = setInterval(() => {
      setCountdown(prev => (prev <= 1 ? REFRESH_SECONDS : prev - 1));
    }, 1000);
    return () => clearInterval(iv);
  }, []);

  // ── Ratios conversation_id ─────────────────────────────────
  const ratio1h = useMemo(
    () => computeRatio(inboxRatio.chats, 3_600_000),
    [inboxRatio.chats]
  );
  const ratio24h = useMemo(
    () => computeRatio(inboxRatio.chats, 86_400_000),
    [inboxRatio.chats]
  );

  // ── Status global ──────────────────────────────────────────
  const anyLoading =
    kpisState.loading ||
    excState.loading ||
    inboxRatio.loading ||
    inboxTable.loading ||
    aiStats.loading;
  const anyError =
    kpisState.error ||
    excState.error ||
    inboxRatio.error ||
    inboxTable.error ||
    aiStats.error;

  const statusCls = anyError ? 'error' : anyLoading ? 'loading' : '';
  const statusText = anyError
    ? `Error: ${anyError}`
    : anyLoading
      ? 'Cargando datos…'
      : 'Sistema en línea';

  const kpis = kpisState.kpis;
  const botPct = kpis ? Number(kpis.bot_resolved.percentage) || 0 : 0;

  // ── Render ─────────────────────────────────────────────────
  return (
    <div className="obs-page">
      {/* HEADER */}
      <header className="obs-header">
        <div className="obs-title">
          <h1>Dashboard de <em>observación</em></h1>
          <div className="obs-sub">Solomotorx · Monitoreo 48h · Fix conversation_id</div>
        </div>
        <div className="obs-controls">
          <span className="mono" style={{ fontSize: 11, color: 'var(--ink-mute)' }}>
            {new Date().toLocaleString('es-VE', { hour12: false })}
          </span>
        </div>
      </header>

      {/* STATUS BAR */}
      <div className={`obs-status-bar${statusCls ? ` ${statusCls}` : ''}`}>
        <span className="dot" />
        <span>{statusText}</span>
        <span className="obs-timer">Auto-refresh: {countdown}s</span>
      </div>

      <div className="obs-container">
        {/* 1 · KPIs generales */}
        <section className="obs-section">
          <h2>
            <span>KPIs generales · producción hoy</span>
            <span className="tag">/api/ventas/supervisor/kpis</span>
          </h2>
          <div className="obs-kpis-grid">
            <div className="obs-kpi bot">
              <div className="label">
                <span className="dot" style={{ background: 'var(--bot)' }} />
                Bot resolvió
              </div>
              <div className="value">{botPct.toFixed(0)}%</div>
              <div className="sub">
                {kpis ? `${kpis.bot_resolved.count_today} / ${kpis.bot_resolved.count_total_today} hoy` : '—'}
              </div>
            </div>

            <div className="obs-kpi human">
              <div className="label">
                <span className="dot" style={{ background: 'var(--human)' }} />
                Esperando comprador
              </div>
              <div className="value">{kpis ? kpis.waiting_buyer.count : '—'}</div>
              <div className="sub">
                {kpis
                  ? `apr ${kpis.waiting_buyer.by_stage.approval} · pag ${kpis.waiting_buyer.by_stage.payment} · env ${kpis.waiting_buyer.by_stage.delivery}`
                  : '—'}
              </div>
            </div>

            <div className="obs-kpi warn">
              <div className="label">
                <span className="dot" style={{ background: 'var(--accent-2)' }} />
                Excepciones
              </div>
              <div className="value">{kpis ? kpis.exceptions.count : '—'}</div>
              <div className="sub">abiertas hoy</div>
            </div>

            <div className="obs-kpi ok">
              <div className="label">
                <span className="dot" style={{ background: 'var(--ok)' }} />
                Cerradas hoy
              </div>
              <div className="value">{kpis ? kpis.closed_today.count : '—'}</div>
              <div className="sub">
                {kpis ? `USD ${kpis.closed_today.amount_usd.toFixed(2)}` : '—'}
              </div>
            </div>
          </div>
        </section>

        {/* 2 · Ratio conversation_id */}
        <section className="obs-section">
          <h2>
            <span>Ratio conversation_id · desde el fix</span>
            <span className="tag">estimación visual · /api/inbox</span>
          </h2>
          <div className="obs-ratio-container">
            <div className="obs-ratio-card">
              <div className="obs-ratio-label">Última hora</div>
              <div className="big">{ratio1h.pct.toFixed(1)}%</div>
              <div className="pct-bar">
                <div className="fill" style={{ width: `${Math.min(ratio1h.pct, 100)}%` }} />
              </div>
              <div className="legend">
                <span>{ratio1h.linked} con conversation_id</span>
                <span>{ratio1h.total} órdenes</span>
              </div>
            </div>
            <div className="obs-ratio-card">
              <div className="obs-ratio-label">Últimas 24h</div>
              <div className="big">{ratio24h.pct.toFixed(1)}%</div>
              <div className="pct-bar">
                <div className="fill" style={{ width: `${Math.min(ratio24h.pct, 100)}%` }} />
              </div>
              <div className="legend">
                <span>{ratio24h.linked} con conversation_id</span>
                <span>{ratio24h.total} órdenes</span>
              </div>
            </div>
          </div>
          <p className="obs-note">
            ⚠️ Estimación visual desde <code>/api/inbox?limit=100</code> — filtra por{' '}
            <code>updated_at</code> del chat, no por <code>created_at</code> de la orden,
            y cubre como máximo 100 chats recientes. Puede quedar en 0% aunque en BD el
            ratio esté bien si el JSON de inbox no expone <code>conversation_id</code>.
            Para la cifra exacta, usar <strong>Q1 en DBeaver</strong> (sección SQL abajo).
          </p>
        </section>

        {/* 3 · Actividad del bot */}
        <section className="obs-section">
          <h2>
            <span>Actividad del bot · hoy</span>
            <span className="tag">desde /api/ai-responder/stats</span>
          </h2>
          <div className="obs-bot-activity">
            <div>
              <div className="obs-col-sub">Top acciones registradas · ai_response_log</div>
              {aiStats.stats && aiStats.stats.today_log_by_action.length > 0 ? (
                <ul className="obs-bot-list">
                  {aiStats.stats.today_log_by_action.map((row, i) => (
                    <li key={`${row.action_taken}-${i}`}>
                      <span className="action-type">{row.action_taken}</span>
                      <span className="count">{row.n}</span>
                    </li>
                  ))}
                  <li className={`bot-mode ${aiStats.stats.human_review_gate ? 'gate' : 'auto'}`}>
                    <span className="action-type">
                      {aiStats.stats.human_review_gate ? 'Revisión humana ON' : 'Auto-envío ON (FORCE)'}
                    </span>
                    <span className="count">
                      review: {aiStats.stats.needs_review_count} · pending: {aiStats.stats.pending_count}
                    </span>
                  </li>
                </ul>
              ) : (
                <div className="obs-empty">
                  {aiStats.loading ? 'Cargando…' : 'Sin actividad registrada hoy'}
                </div>
              )}
            </div>

            <div>
              <div className="obs-col-sub">Excepciones abiertas · tabla exceptions</div>
              {excState.exceptions.length > 0 ? (
                <ul className="obs-bot-list">
                  {excState.exceptions.slice(0, 10).map(exc => (
                    <li key={exc.id}>
                      <span className="action-type">
                        {exc.title || EXCEPTION_KIND_LABELS[exc.kind] || exc.kind}
                      </span>
                      <span className="count-small">
                        {EXCEPTION_KIND_LABELS[exc.kind] || exc.kind}
                      </span>
                    </li>
                  ))}
                </ul>
              ) : (
                <div className="obs-empty">
                  {excState.loading ? 'Cargando…' : 'Sin excepciones abiertas'}
                </div>
              )}
            </div>
          </div>
        </section>

        {/* 4 · Últimos 15 chats */}
        <section className="obs-section">
          <h2>
            <span>Últimos 15 chats · producción</span>
            <span className="tag">/api/bandeja?limit=15</span>
          </h2>
          {inboxTable.error ? (
            <div className="obs-error-cell">Error: {inboxTable.error}</div>
          ) : inboxTable.chats.length === 0 ? (
            <div className="obs-empty">
              {inboxTable.loading ? 'Cargando…' : 'Sin chats recientes'}
            </div>
          ) : (
            <table className="obs-table">
              <thead>
                <tr>
                  <th>Chat ID</th>
                  <th>Cliente</th>
                  <th>Canal</th>
                  <th>Stage</th>
                  <th>Order ID</th>
                  <th>Updated</th>
                </tr>
              </thead>
              <tbody>
                {inboxTable.chats.map(chat => {
                  const ch = channelBadge(chat);
                  const stageLabel = chat.chat_stage
                    ? (CHAT_STAGE_LABELS[chat.chat_stage] ?? chat.chat_stage)
                    : '—';
                  const orderId = chat.order?.id ?? null;
                  return (
                    <tr key={String(chat.id)}>
                      <td className="mono">#{chat.id}</td>
                      <td>{chat.customer_name || chat.phone || '—'}</td>
                      <td>
                        <span className={`obs-badge ${ch.cls}`}>{ch.label}</span>
                      </td>
                      <td className="stage">{stageLabel}</td>
                      <td className={orderId ? 'order-yes' : 'order-no'}>
                        {orderId ? `#${orderId}` : '—'}
                      </td>
                      <td className="updated">{formatRelTime(chat.last_message_at)}</td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          )}
        </section>

        {/* 5 · SQL helpers */}
        <section className="obs-section">
          <h2>
            <span>SQL helpers · correr en DBeaver</span>
            <span className="tag">static</span>
          </h2>
          <div className="obs-sql">{highlightSql(SQL_Q1)}</div>
          <div className="obs-sql">{highlightSql(SQL_Q2)}</div>
          <div className="obs-sql">{highlightSql(SQL_Q3)}</div>
          <div className="obs-sql">{highlightSql(SQL_Q4)}</div>
        </section>
      </div>

      <div className="obs-footer">
        DASHBOARD DE OBSERVACIÓN · NO OPERATIVO · SE DESCARTA AL CONSTRUIR MÓDULO UNIFICADO
      </div>
    </div>
  );
}
