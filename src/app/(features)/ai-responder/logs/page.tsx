'use client';

import { Fragment, useCallback, useState, type ReactNode } from 'react';
import Link from 'next/link';
import AiResponderSubnav from '../AiResponderSubnav';
import { useAiResponderOpsLogs } from '@/hooks/useAiResponderOpsLogs';
import type { AiUsageLogRow, AiReceiptAttemptRow } from '@/types/ai-responder';
import '../monitor/ai-monitor-theme.scss';

const RECEIPT_KNOWN_KEYS = new Set<string>([
  'id',
  'chat_id',
  'customer_id',
  'firebase_url',
  'is_receipt',
  'prefiler_score',
  'prefiler_reason',
  'extracted_reference',
  'extracted_amount_bs',
  'extracted_date',
  'extraction_confidence',
  'reconciliation_status',
  'reconciled_order_id',
  'created_at',
  'pipeline_error_type',
  'extraction_status',
  'extraction_error',
  'extraction_raw_snippet',
]);

/** Explicación del `pipeline_error_type` para operadores (no sustituye al JSON del backend). */
const PIPELINE_EXPLAIN: Record<string, { short: string; long: string }> = {
  extraction_empty: {
    short: 'Extracción vacía',
    long: 'El modelo respondió pero sin datos útiles (parsed_empty) o filas antiguas sin campos extraídos.',
  },
  extraction_failed: {
    short: 'Fallo extracción',
    long: 'Error al descargar la imagen, API Gemini, respuesta vacía, JSON inválido u otro fallo antes de tener estructura válida. Ver columna «Fallo» y snippet en detalle.',
  },
  reconciliation_pending: {
    short: 'Conciliación pendiente',
    long: 'Hay datos de comprobante; el motor de conciliación aún no cerró match o no_match.',
  },
  reconciled_matched: {
    short: 'Conciliado',
    long: 'Se asoció a una orden de venta (matched).',
  },
  reconciled_no_match: {
    short: 'Sin match',
    long: 'Extracción presente pero no hubo coincidencia con movimientos u órdenes esperadas.',
  },
  manual_review: {
    short: 'Revisión manual',
    long: 'El pipeline solicitó intervención humana (datos ambiguos o reglas de negocio).',
  },
  rejected: {
    short: 'Rechazado',
    long: 'El intento quedó marcado como rechazado en conciliación.',
  },
  legacy_not_receipt: {
    short: 'Legacy',
    long: 'Fila histórica o is_receipt en falso.',
  },
  pending: {
    short: 'Pendiente',
    long: 'Alias legacy de pendiente de conciliación.',
  },
  matched: {
    short: 'Conciliado',
    long: 'Alias legacy de conciliación exitosa.',
  },
  vision_error: {
    short: 'Error visión',
    long: 'Falló la llamada a modelo de visión (red, cuota, JSON inválido, etc.). Ver tabla Gemini / correlación temporal.',
  },
  reconciliation_no_match: {
    short: 'Sin match',
    long: 'Extracción presente pero no hubo coincidencia con pedidos o montos esperados.',
  },
};

function pipelineExplain(t: string): { short: string; long: string } {
  const k = (t || '').trim();
  return PIPELINE_EXPLAIN[k] ?? {
    short: k || '—',
    long: `Estado derivado del pipeline: ${k || 'desconocido'}.`,
  };
}

function chipClassForPipeline(t: string): string {
  const safe = String(t).replace(/[^a-z0-9_]/gi, '_');
  return `am-pipe-chip am-pipe-${safe}`;
}

/** Heurística: última fila callVision fallida cercana en tiempo al intento (±6 min). */
function nearestVisionFailure(
  attempt: AiReceiptAttemptRow,
  visionRows: AiUsageLogRow[],
  windowMs = 6 * 60 * 1000
): { row: AiUsageLogRow; deltaMs: number } | null {
  const t0 = new Date(attempt.created_at).getTime();
  if (!Number.isFinite(t0)) return null;

  let best: { row: AiUsageLogRow; deltaMs: number } | null = null;
  for (const v of visionRows) {
    const fn = String(v.function_called || '').toLowerCase();
    if (fn !== 'callvision') continue;
    if (v.success) continue;
    const tv = new Date(v.created_at).getTime();
    if (!Number.isFinite(tv)) continue;
    const d = Math.abs(tv - t0);
    if (d > windowMs) continue;
    if (!best || d < best.deltaMs) best = { row: v, deltaMs: d };
  }
  return best;
}

function formatDeltaSec(ms: number): string {
  const s = Math.round(ms / 1000);
  if (s < 60) return `${s}s`;
  return `${Math.round(s / 60)}min`;
}

function extraAttemptFields(row: AiReceiptAttemptRow): Array<{ k: string; v: string }> {
  const o = row as unknown as Record<string, unknown>;
  const out: Array<{ k: string; v: string }> = [];
  for (const [k, val] of Object.entries(o)) {
    if (RECEIPT_KNOWN_KEYS.has(k)) continue;
    if (val == null || val === '') continue;
    const s = typeof val === 'object' ? JSON.stringify(val) : String(val);
    if (!s.trim()) continue;
    out.push({ k, v: s.length > 800 ? `${s.slice(0, 800)}…` : s });
  }
  out.sort((a, b) => a.k.localeCompare(b.k));
  return out;
}

function iaFailureSummary(
  row: AiReceiptAttemptRow,
  visionMatch: { row: AiUsageLogRow; deltaMs: number } | null
): string | null {
  const parts: string[] = [];
  const st = row.extraction_status?.trim();
  if (st && st !== 'ok') {
    parts.push(`Estado: ${st}`);
  }
  const em = row.extraction_error?.trim();
  if (em) parts.push(em);
  if (visionMatch?.row.error_message?.trim()) {
    parts.push(`callVision: ${visionMatch.row.error_message.trim()}`);
  }
  if (parts.length === 0) return null;
  return parts.join(' · ');
}

function FeatureLayout({ children }: { children: ReactNode }) {
  return (
    <div className="page-wrapper">
      <div className="content p-0">{children}</div>
    </div>
  );
}

function fmtTime(iso: string | null | undefined): string {
  if (!iso) return '—';
  try {
    return new Date(iso).toLocaleString('es-VE', {
      day: '2-digit',
      month: 'short',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    });
  } catch {
    return iso;
  }
}

function truncate(s: string | null | undefined, n: number): string {
  if (s == null) return '—';
  const t = String(s);
  return t.length <= n ? t : `${t.slice(0, n)}…`;
}

function NameLogsTable({ rows }: { rows: AiUsageLogRow[] }) {
  if (rows.length === 0) {
    return <p className="am-muted">Sin registros en el período (heurística sin IA o validación Groq).</p>;
  }
  return (
    <div className="am-log-table-wrap am-ops-scroll">
      <table className="am-ops-table">
        <thead>
          <tr>
            <th>Fecha</th>
            <th>Función</th>
            <th>OK</th>
            <th>Lat. ms</th>
            <th>Tokens in/out</th>
            <th>Detalle / motivo</th>
          </tr>
        </thead>
        <tbody>
          {rows.map((r) => (
            <tr key={r.id}>
              <td className="mono">{fmtTime(r.created_at)}</td>
              <td><code>{r.function_called}</code></td>
              <td>{r.success ? '✓' : '✗'}</td>
              <td className="mono">{r.latency_ms ?? '—'}</td>
              <td className="mono">
                {r.tokens_input ?? '—'} / {r.tokens_output ?? '—'}
              </td>
              <td className="am-cell-detail">{truncate(r.error_message, 220)}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

function VisionLogsTable({ rows }: { rows: AiUsageLogRow[] }) {
  if (rows.length === 0) {
    return <p className="am-muted">Sin llamadas a Gemini Vision en el período.</p>;
  }
  return (
    <div className="am-log-table-wrap am-ops-scroll">
      <table className="am-ops-table">
        <thead>
          <tr>
            <th>Fecha</th>
            <th>Proveedor</th>
            <th>OK</th>
            <th>Lat. ms</th>
            <th>Tipo de error API / parseo</th>
          </tr>
        </thead>
        <tbody>
          {rows.map((r) => (
            <tr key={r.id}>
              <td className="mono">{fmtTime(r.created_at)}</td>
              <td><code>{r.provider_id}</code></td>
              <td>{r.success ? '✓' : '✗'}</td>
              <td className="mono">{r.latency_ms ?? '—'}</td>
              <td className="am-cell-detail">{truncate(r.error_message, 400)}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

function ReceiptAttemptsTable({
  rows,
  visionLogs,
}: {
  rows: AiReceiptAttemptRow[];
  visionLogs: AiUsageLogRow[];
}) {
  if (rows.length === 0) {
    return <p className="am-muted">Sin filas en payment_attempts (o tabla no disponible).</p>;
  }

  return (
    <div className="am-log-table-wrap am-ops-scroll" style={{ maxHeight: 560 }}>
      <table className="am-ops-table">
        <thead>
          <tr>
            <th>Fecha · ID</th>
            <th>Chat</th>
            <th>Pipeline</th>
            <th>Extracción IA</th>
            <th>Fallo / correlación</th>
            <th>Concil.</th>
            <th>Prefiltro</th>
            <th>Imagen</th>
          </tr>
        </thead>
        <tbody>
          {rows.map((r) => {
            const px = pipelineExplain(r.pipeline_error_type);
            const visionMatch = nearestVisionFailure(r, visionLogs);
            const failSummary = iaFailureSummary(r, visionMatch);
            const extras = extraAttemptFields(r);

            return (
              <Fragment key={r.id}>
                <tr>
                  <td className="mono">
                    {fmtTime(r.created_at)}
                    <div className="am-pipeline-hint">#{r.id}</div>
                  </td>
                  <td className="mono">{r.chat_id ?? '—'}</td>
                  <td>
                    <div className="am-pipeline-block">
                      <span className={chipClassForPipeline(r.pipeline_error_type)} title={px.long}>
                        {r.pipeline_error_type}
                      </span>
                      <span className="am-pipeline-hint" title={px.long}>
                        {px.short}
                      </span>
                    </div>
                  </td>
                  <td>
                    <div className="am-extract-block">
                      <div>
                        <span className="am-extract-k">Ref</span>{' '}
                        {r.extracted_reference?.trim() ? (
                          <code>{truncate(r.extracted_reference, 40)}</code>
                        ) : (
                          <span className="am-vision-fail">— vacío —</span>
                        )}
                      </div>
                      <div>
                        <span className="am-extract-k">Monto Bs</span>{' '}
                        <span className="mono">{r.extracted_amount_bs ?? '—'}</span>
                      </div>
                      <div>
                        <span className="am-extract-k">Fecha doc.</span>{' '}
                        <span className="mono">{r.extracted_date ?? '—'}</span>
                      </div>
                      <div>
                        <span className="am-extract-k">Conf.</span>{' '}
                        <span className="mono">{r.extraction_confidence ?? '—'}</span>
                        {r.is_receipt != null && (
                          <>
                            {' '}
                            <span className="am-extract-k">Recibo</span>{' '}
                            <span className="mono">{r.is_receipt ? 'sí' : 'no'}</span>
                          </>
                        )}
                      </div>
                      {r.extraction_status != null && String(r.extraction_status).trim() !== '' && (
                        <div>
                          <span className="am-extract-k">Estado extracción</span>{' '}
                          <code className={r.extraction_status !== 'ok' ? 'am-extract-status-warn' : ''}>
                            {r.extraction_status}
                          </code>
                        </div>
                      )}
                      {r.reconciled_order_id != null && (
                        <div>
                          <span className="am-extract-k">Orden</span>{' '}
                          <span className="mono">{r.reconciled_order_id}</span>
                        </div>
                      )}
                    </div>
                  </td>
                  <td className="am-cell-detail">
                    {failSummary ? (
                      <div className="am-vision-fail">{truncate(failSummary, 420)}</div>
                    ) : visionMatch ? (
                      <div className="am-vision-fail" style={{ color: 'var(--bot-green)' }}>
                        Vision OK en ventana ({formatDeltaSec(visionMatch.deltaMs)} de diferencia)
                      </div>
                    ) : (
                      <span className="am-pipeline-hint">
                        {r.extraction_status === 'ok'
                          ? 'Extracción OK según receiver; sin error correlacionado en ±6 min.'
                          : 'Sin mensaje de fallo persistido (fila antigua o migración extraction_* pendiente).'}
                      </span>
                    )}
                    {visionMatch && !visionMatch.row.success && (
                      <div className="am-vision-delta" style={{ marginTop: 6 }}>
                        <span className="am-extract-k">callVision</span>{' '}
                        {fmtTime(visionMatch.row.created_at)} · {visionMatch.row.success ? 'OK' : 'falló'} ·{' '}
                        {visionMatch.row.latency_ms != null ? `${visionMatch.row.latency_ms} ms` : '—'}
                      </div>
                    )}
                  </td>
                  <td>
                    <code>{r.reconciliation_status ?? '—'}</code>
                  </td>
                  <td className="am-cell-detail">
                    {r.prefiler_score != null ? `${r.prefiler_score} · ` : ''}
                    {truncate(r.prefiler_reason, 140)}
                  </td>
                  <td className="mono am-cell-url">
                    {r.firebase_url ? (
                      <a href={r.firebase_url} target="_blank" rel="noopener noreferrer">
                        {truncate(r.firebase_url, 40)}
                      </a>
                    ) : (
                      '—'
                    )}
                  </td>
                </tr>
                <tr className="am-ops-extra-row">
                  <td colSpan={8} style={{ padding: 0, borderBottom: '1px solid var(--border)' }}>
                    <details className="am-ops-row-details">
                      <summary>Detalle técnico · pipeline y campos extra del API</summary>
                      <p className="am-pipeline-hint" style={{ margin: '6px 0 0' }}>
                        {px.long}
                      </p>
                      {extras.length > 0 && (
                        <dl className="am-ops-dl">
                          {extras.map(({ k, v }) => (
                            <Fragment key={k}>
                              <dt>{k}</dt>
                              <dd>{v}</dd>
                            </Fragment>
                          ))}
                        </dl>
                      )}
                      {r.extraction_raw_snippet != null && String(r.extraction_raw_snippet).trim() !== '' && (
                        <div style={{ marginTop: 10 }}>
                          <div className="am-extract-k" style={{ marginBottom: 4 }}>
                            Snippet respuesta modelo (útil si falló el JSON)
                          </div>
                          <pre className="am-ops-pre">{r.extraction_raw_snippet}</pre>
                        </div>
                      )}
                    </details>
                  </td>
                </tr>
              </Fragment>
            );
          })}
        </tbody>
      </table>
    </div>
  );
}

export default function AiResponderLogsPage() {
  const [days, setDays] = useState(7);
  const { data, loading, error, refresh } = useAiResponderOpsLogs({ days });

  const onDaysChange = useCallback((d: number) => {
    setDays(d);
  }, []);

  return (
    <FeatureLayout>
      <div className="ai-monitor">
        <div className="am-topbar">
          <div className="am-topbar-left">
            <span className="am-breadcrumb am-breadcrumb-text">AI Responder</span>
            <AiResponderSubnav />
            <h1 className="am-title">Logs IA · nombre y comprobantes</h1>
            <p className="am-logs-intro">
              Validación de nombre y apellido (onboarding WhatsApp) vía{' '}
              <code>ai_usage_log</code> (<code>name_validation_skipped</code>, <code>wa_name_validation</code>).
              Comprobantes: filas <code>payment_attempts</code> con tipo de situación derivado; errores de API Gemini en{' '}
              <code>callVision</code>.
            </p>
          </div>
          <div className="am-topbar-right am-logs-toolbar">
            <label className="am-days-label">
              Días
              <select
                className="am-days-select"
                value={days}
                onChange={(e) => onDaysChange(Number(e.target.value) || 7)}
              >
                {[1, 3, 7, 14, 30, 90].map((d) => (
                  <option key={d} value={d}>{d}</option>
                ))}
              </select>
            </label>
            <button type="button" className="am-btn-refresh" onClick={() => void refresh()}>
              <i className="ti ti-refresh" style={{ fontSize: 13 }} />
              <span className="am-btn-refresh-label">Refrescar</span>
            </button>
            <a
              className="am-btn-refresh"
              href={`/api/ai-responder/ops-logs?days=${days}&name_limit=200&receipt_limit=200&vision_limit=200`}
              target="_blank"
              rel="noopener noreferrer"
              title="Respuesta JSON del BFF (misma ventana de días)"
            >
              <i className="ti ti-code" style={{ fontSize: 13 }} />
              <span className="am-btn-refresh-label">JSON ops-logs</span>
            </a>
          </div>
        </div>

        {loading && (
          <div className="am-ops-section">
            <p className="am-muted">Cargando…</p>
          </div>
        )}

        {error && !loading && (
          <div className="am-error-state">
            <p className="am-error-title">{error}</p>
            <button type="button" className="am-error-btn" onClick={() => void refresh()}>
              Reintentar
            </button>
          </div>
        )}

        {data && !loading && (
          <>
            <section className="am-ops-section">
              <h2 className="am-ops-h2">
                <i className="ti ti-user-check me-2" />
                Análisis nombre y apellido (clientes CRM)
              </h2>
              <p className="am-muted am-ops-sub">
                Heurísticas que evitaron Groq muestran el motivo en <em>Detalle</em>. Llamadas IA exitosas o fallidas:{' '}
                <code>wa_name_validation</code>.
              </p>
              <NameLogsTable rows={data.name_analysis_logs} />
            </section>

            <section className="am-ops-section">
              <h2 className="am-ops-h2">
                <i className="ti ti-sparkles me-2" />
                Gemini Vision (<code>callVision</code>) — errores de API / JSON
              </h2>
              <p className="am-muted am-ops-sub">
                Registro de uso del gateway (latencia, proveedor, <code>error_message</code>). La tabla de comprobantes
                intenta correlacionar fallos con la marca temporal más cercana (±6 min).
              </p>
              <VisionLogsTable rows={data.receipt_vision_logs} />
            </section>

            <section className="am-ops-section">
              <h2 className="am-ops-h2">
                <i className="ti ti-photo me-2" />
                Comprobantes de pago (imágenes tratadas como recibo)
              </h2>
              <p className="am-muted am-ops-sub">
                <strong>Pipeline</strong>: resumen operativo. <strong>Extracción IA</strong>: campos guardados y{' '}
                <code>extraction_status</code>. <strong>Fallo / correlación</strong>:{' '}
                <code>extraction_error</code> (persistido en BD) y/o error de <code>callVision</code> más cercano en ±6
                min. En detalle: snippet bruto si hubo error de parseo. Prefiltro = heurística local sin API.
              </p>
              {data.receipt_schema_note && (
                <p className="am-auth-banner" style={{ marginBottom: 12 }}>
                  {data.receipt_schema_note}
                </p>
              )}
              <ReceiptAttemptsTable rows={data.receipt_attempts} visionLogs={data.receipt_vision_logs} />
            </section>

            <p className="am-muted am-ops-footer">
              <Link href="/ai-responder/monitor">← Volver al monitor</Link>
            </p>
          </>
        )}
      </div>
    </FeatureLayout>
  );
}
