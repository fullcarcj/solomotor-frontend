'use client';

import { useCallback, useEffect, useState } from 'react';
import Link from 'next/link';
import AiResponderSubnav from '../AiResponderSubnav';
import AiQuotaAlertsBanner from '../AiQuotaAlertsBanner';
import '../../bandeja/bandeja-theme.scss';
import '../../bandeja/bandeja-definitiva-theme.scss';
import type { AiQuotaAlerts } from '@/types/ai-responder';

type SwitchMeta = { value: boolean; effective?: boolean; [k: string]: unknown };

type SettingsPayload = {
  ok?: boolean;
  schema_ready?: boolean;
  schema_error?: string | null;
  quota_alerts?: AiQuotaAlerts | null;
  switches?: {
    tipo_m?: SwitchMeta;
    transcription_groq?: SwitchMeta;
    wa_name_groq?: SwitchMeta;
    receipt_gemini_vision?: SwitchMeta;
  };
  error?: string;
};

const ROWS: {
  key: 'tipo_m_enabled' | 'transcription_groq' | 'wa_name_groq' | 'receipt_gemini_vision';
  label: string;
  hint: string;
  switchPath: keyof NonNullable<SettingsPayload['switches']>;
}[] = [
  {
    key: 'tipo_m_enabled',
    label: 'Bot respuestas CRM (Tipo M)',
    hint: 'Cola GROQ + plantilla. Requiere AI_RESPONDER_ENABLED=1 en el servidor y GROQ_API_KEY.',
    switchPath: 'tipo_m',
  },
  {
    key: 'transcription_groq',
    label: 'Transcripción audio/video (Groq Whisper)',
    hint: 'Convierte notas de voz en texto antes de guardar en el chat.',
    switchPath: 'transcription_groq',
  },
  {
    key: 'wa_name_groq',
    label: 'Validación nombre onboarding (Groq)',
    hint: 'Para frases de 2–4 palabras en captura de nombre. Si está apagado: rechazo estricto salvo WA_NAME_ALLOW_STATIC_FALLBACK.',
    switchPath: 'wa_name_groq',
  },
  {
    key: 'receipt_gemini_vision',
    label: 'OCR comprobantes (Gemini Vision)',
    hint: 'Extracción de referencia, monto y fecha en imágenes de pago móvil / transferencia.',
    switchPath: 'receipt_gemini_vision',
  },
];

export default function AiConfiguracionPage() {
  const [data, setData] = useState<SettingsPayload | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [savingKey, setSavingKey] = useState<string | null>(null);

  const load = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await fetch('/api/ai-responder/settings', { credentials: 'include', cache: 'no-store' });
      const j = (await res.json().catch(() => ({}))) as SettingsPayload;
      if (!res.ok) {
        throw new Error((j as { error?: string }).error || `HTTP ${res.status}`);
      }
      setData(j);
    } catch (e) {
      setError(e instanceof Error ? e.message : String(e));
      setData(null);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    void load();
  }, [load]);

  const toggle = useCallback(
    async (key: (typeof ROWS)[number]['key'], next: boolean) => {
      setSavingKey(key);
      setError(null);
      try {
        const res = await fetch('/api/ai-responder/settings', {
          method: 'PATCH',
          credentials: 'include',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ [key]: next }),
        });
        const j = (await res.json().catch(() => ({}))) as SettingsPayload;
        if (!res.ok) {
          throw new Error((j as { error?: string; detail?: string }).detail || (j as { error?: string }).error || `HTTP ${res.status}`);
        }
        setData(j);
      } catch (e) {
        setError(e instanceof Error ? e.message : String(e));
      } finally {
        setSavingKey(null);
      }
    },
    []
  );

  return (
    <div className="page-wrapper">
      <div className="content p-0">
        <div className="bandeja-shell" style={{ minHeight: '72vh', border: '1px solid var(--bd-border, #e5e7eb)' }}>
          <div className="bandeja-panel-left" style={{ width: '100%', maxWidth: 920, margin: '0 auto', borderRight: 'none' }}>
            <header className="bandeja-wa-top-header px-3 py-3 border-bottom d-flex flex-wrap align-items-center gap-2">
              <div className="flex-grow-1 min-w-0">
                <nav className="small text-muted mb-1" aria-label="Migas">
                  <Link href="/bandeja" className="text-decoration-none text-muted">
                    Bandeja
                  </Link>
                  <span className="mx-1">/</span>
                  <span className="text-muted">AI Responder</span>
                </nav>
                <h1 className="bandeja-wa-title h5 mb-0">Config AI</h1>
                <p className="small text-muted mb-0 mt-1">
                  Interruptores por actividad (persistidos en BD) y diagnóstico de cuota / rate limit en ventana de 7 días.
                </p>
              </div>
              <AiResponderSubnav />
            </header>

            <div className="p-3">
              {loading && (
                <p className="small text-muted mb-0" role="status">
                  Cargando…
                </p>
              )}
              {error && (
                <div className="alert bandeja-wa-alert py-2 small" role="alert">
                  {error}
                </div>
              )}
              {data?.schema_ready === false && data.schema_error && (
                <div className="alert alert-warning py-2 small">
                  No se pudo preparar la tabla de consola en la base de datos. Los valores mostrados son por defecto
                  (todo activo). Detalle: {data.schema_error}
                </div>
              )}

              {!loading && (
                <>
                  <h2 className="h6 text-uppercase text-muted fw-semibold mb-2 mt-1" style={{ fontSize: 11, letterSpacing: '0.06em' }}>
                    Cuota y rate limit
                  </h2>
                  <AiQuotaAlertsBanner quota={data?.quota_alerts} variant="light" />
                  <details className="mb-4 border rounded-2 px-3 py-2 small bg-light bg-opacity-50">
                    <summary className="fw-semibold" style={{ cursor: 'pointer' }}>
                      Qué revisa el diagnóstico (backend <code>aiQuotaAlertsService</code>)
                    </summary>
                    <ul className="mb-2 mt-2 ps-3">
                      <li>
                        <strong>Ventana:</strong> últimos <strong>7 días</strong>. Se agrupan fallos cuyo mensaje sugiere cuota o throttling
                        (p. ej. <code>429</code>, <code>quota</code>, <code>rate_limit</code>, <code>ResourceExhausted</code>, <code>TPD</code>,{' '}
                        <code>limite_requests_diario</code> / <code>limite_tokens_diario</code> del gateway propio, RPM, etc.).
                      </li>
                      <li>
                        <strong>Fuente <code>ai_usage_log</code>:</strong> por <code>provider_id</code> y <code>function_called</code>, con
                        muestras de los últimos errores.
                      </li>
                      <li>
                        <strong>Fuente <code>payment_attempts</code>:</strong> campo <code>extraction_error</code> (OCR comprobantes / Gemini).
                      </li>
                      <li>
                        <strong>Fuente <code>provider_settings</code>:</strong> <code>last_error</code> con el mismo criterio o{' '}
                        <strong>circuit breaker</strong> abierto para <code>GROQ_LLAMA</code>, <code>GROQ_WHISPER</code>,{' '}
                        <code>GEMINI_FLASH</code>.
                      </li>
                      <li>
                        <strong>API JSON:</strong> el mismo bloque <code>quota_alerts</code> va en{' '}
                        <code>GET /api/ai-responder/stats</code>, <code>GET /api/ai-responder/settings</code> y en la respuesta del{' '}
                        <code>PATCH /api/ai-responder/settings</code> al rearmar el snapshot.
                      </li>
                      <li>
                        <strong>Tablero / overview:</strong> en <code>/api/stats/overview</code> (y realtime) el snapshot{' '}
                        <code>ai_groq</code> incluye <code>quota_alerts_active</code>, <code>quota_alerts_headline</code> y, si hay alerta,{' '}
                        <code>label</code> pasa a <strong>ALERTA CUOTA</strong> con detalle ampliado.
                      </li>
                    </ul>
                  </details>

                  <h2 className="h6 text-uppercase text-muted fw-semibold mb-2" style={{ fontSize: 11, letterSpacing: '0.06em' }}>
                    Actividades IA
                  </h2>
                </>
              )}

              {!loading && data?.switches && (
                <ul className="list-unstyled mb-0 d-flex flex-column gap-0">
                  {ROWS.map((row) => {
                    const block = data.switches?.[row.switchPath] as SwitchMeta | undefined;
                    const on = Boolean(block?.value);
                    const effective =
                      row.switchPath === 'tipo_m' ? Boolean(block?.effective) : Boolean(block?.effective ?? block?.value);
                    const disabled = savingKey !== null || data.schema_ready === false;
                    return (
                      <li
                        key={row.key}
                        className="d-flex align-items-start justify-content-between gap-3 py-3 border-bottom"
                        style={{ borderColor: 'var(--bd-border, #e8eaed)' }}
                      >
                        <div className="min-w-0">
                          <div className="fw-semibold" style={{ fontSize: 14 }}>
                            {row.label}
                          </div>
                          <p className="small text-muted mb-0 mt-1">{row.hint}</p>
                          {row.switchPath === 'tipo_m' && (
                            <p className="small mb-0 mt-1" style={{ color: 'var(--mu-ink-mute, #6b7280)' }}>
                              Estado operativo:{' '}
                              <strong>{effective ? 'activo' : 'inactivo'}</strong>
                              {block && !block.suspended && !block.env_ai_responder_enabled ? ' · falta AI_RESPONDER_ENABLED en el servidor' : ''}
                              {block && block.suspended ? ' · AI_RESPONDER_SUSPENDED' : ''}
                              {block && !block.groq_key_ok ? ' · falta GROQ_API_KEY' : ''}
                            </p>
                          )}
                        </div>
                        <div className="form-check form-switch flex-shrink-0 pt-1">
                          <input
                            className="form-check-input"
                            type="checkbox"
                            role="switch"
                            aria-label={row.label}
                            checked={on}
                            disabled={disabled}
                            onChange={(e) => void toggle(row.key, e.target.checked)}
                          />
                        </div>
                      </li>
                    );
                  })}
                </ul>
              )}

              <p className="small text-muted mt-4 mb-0">
                Logs operativos (nombres, visión, comprobantes):{' '}
                <Link href="/ai-responder/logs">Logs IA</Link>
                {' · '}
                <Link href="/ai-responder/monitor">Monitor bot</Link>
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
