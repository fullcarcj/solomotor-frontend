'use client';

import Link from 'next/link';
import type { AiQuotaAlerts } from '@/types/ai-responder';

type Props = {
  quota: AiQuotaAlerts | null | undefined;
  /** Monitor oscuro vs Configuración IA (bandeja claro). */
  variant?: 'dark' | 'light';
};

export default function AiQuotaAlertsBanner({ quota, variant = 'dark' }: Props) {
  if (!quota) return null;
  const visible = quota.active || quota.unavailable || Boolean(quota.headline);
  if (!visible) return null;

  const isUrgent = quota.active || (quota.headline && !quota.unavailable);

  if (variant === 'light') {
    return (
      <div
        className={`rounded-2 border mb-3 overflow-hidden ${
          isUrgent ? 'border-danger-subtle' : 'border-warning-subtle'
        }`}
        style={{ background: isUrgent ? 'rgba(220, 53, 69, 0.07)' : 'rgba(245, 158, 11, 0.08)' }}
      >
        <div className={`px-3 py-2 small fw-semibold ${isUrgent ? 'text-danger' : 'text-warning-emphasis'}`}>
          {quota.active ? 'Cuota o rate limit detectados' : quota.unavailable ? 'Diagnóstico de cuota' : 'Aviso'}
        </div>
        <div className="px-3 pb-3 small">
          {quota.headline && <p className="mb-2">{quota.headline}</p>}
          {quota.action_hint && (
            <p className="text-muted mb-2 mb-md-3" style={{ fontSize: 12 }}>
              <strong>Acción sugerida:</strong> {quota.action_hint}
            </p>
          )}
          {quota.by_provider.length > 0 && (
            <div className="table-responsive mb-2">
              <table className="table table-sm table-borderless mb-0" style={{ fontSize: 12 }}>
                <thead>
                  <tr className="text-muted">
                    <th>Proveedor</th>
                    <th>Función</th>
                    <th className="text-end">Fallos</th>
                    <th>Último</th>
                  </tr>
                </thead>
                <tbody>
                  {quota.by_provider.map((r, i) => (
                    <tr key={`${r.provider_id}-${r.function_called}-${i}`}>
                      <td><code>{r.provider_id}</code></td>
                      <td><code>{r.function_called}</code></td>
                      <td className="text-end fw-semibold">{r.n}</td>
                      <td className="text-muted">{r.last_at ? new Date(r.last_at).toLocaleString() : '—'}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
          {quota.provider_row_hints.length > 0 && (
            <ul className="mb-2 ps-3" style={{ fontSize: 12 }}>
              {quota.provider_row_hints.map((h) => (
                <li key={h.provider_id} className="mb-1">
                  <code>{h.provider_id}</code>
                  {h.circuit_open ? ' · circuito abierto' : ''}
                  {h.last_error ? (
                    <span className="text-muted d-block mt-1" style={{ wordBreak: 'break-word' }}>
                      {h.last_error.slice(0, 280)}
                      {h.last_error.length > 280 ? '…' : ''}
                    </span>
                  ) : null}
                </li>
              ))}
            </ul>
          )}
          {quota.recent_errors.length > 0 && (
            <details className="mt-1">
              <summary className="text-muted" style={{ cursor: 'pointer', fontSize: 12 }}>
                Últimos mensajes de error ({quota.recent_errors.length})
              </summary>
              <ul className="mt-2 mb-0 ps-3" style={{ fontSize: 11, wordBreak: 'break-word' }}>
                {quota.recent_errors.map((e, idx) => (
                  <li key={idx} className="mb-2">
                    <span className="text-muted">{e.created_at}</span> · <code>{e.function_called}</code>
                    <div className="font-monospace mt-1">{e.error_message}</div>
                  </li>
                ))}
              </ul>
            </details>
          )}
          <p className="mb-0 mt-2" style={{ fontSize: 11 }}>
            <Link href="/ai-responder/logs">Ver Logs IA</Link> · Ventana: últimos {quota.window_days} días
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className={`am-quota-banner ${isUrgent ? 'am-quota-banner--urgent' : 'am-quota-banner--info'}`}>
      <div className="am-quota-banner__title">
        {quota.active ? 'Cuota o rate limit (Groq / Gemini / límites propios)' : 'Diagnóstico de cuota'}
      </div>
      {quota.headline && <p className="am-quota-banner__lead">{quota.headline}</p>}
      {quota.action_hint && (
        <p className="am-quota-banner__hint">
          <strong>Acción:</strong> {quota.action_hint}
        </p>
      )}
      {quota.by_provider.length > 0 && (
        <div className="am-quota-table-wrap">
          <table className="am-quota-table">
            <thead>
              <tr>
                <th>Proveedor</th>
                <th>Función</th>
                <th className="num">Fallos</th>
                <th>Último</th>
              </tr>
            </thead>
            <tbody>
              {quota.by_provider.map((r, i) => (
                <tr key={`${r.provider_id}-${r.function_called}-${i}`}>
                  <td><code>{r.provider_id}</code></td>
                  <td><code>{r.function_called}</code></td>
                  <td className="num">{r.n}</td>
                  <td className="dim">{r.last_at ? new Date(r.last_at).toLocaleString() : '—'}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
      {quota.provider_row_hints.length > 0 && (
        <ul className="am-quota-hints">
          {quota.provider_row_hints.map((h) => (
            <li key={h.provider_id}>
              <code>{h.provider_id}</code>
              {h.circuit_open ? ' · circuit breaker activo' : ''}
              {h.last_error ? <span className="hint-err">{h.last_error.slice(0, 240)}{h.last_error.length > 240 ? '…' : ''}</span> : null}
            </li>
          ))}
        </ul>
      )}
      {quota.recent_errors.length > 0 && (
        <details className="am-quota-details">
          <summary>Últimos errores ({quota.recent_errors.length})</summary>
          <ul>
            {quota.recent_errors.map((e, idx) => (
              <li key={idx}>
                <span className="dim">{e.created_at}</span> · <code>{e.function_called}</code>
                <pre>{e.error_message}</pre>
              </li>
            ))}
          </ul>
        </details>
      )}
      <p className="am-quota-footer">
        <Link href="/ai-responder/logs">Logs IA</Link>
        {' · '}
        <Link href="/ai-responder/configuracion">Config AI</Link>
        {' · '}
        ventana {quota.window_days}d
      </p>
    </div>
  );
}
