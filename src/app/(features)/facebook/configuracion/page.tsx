"use client";

import { useEffect, useState } from "react";
import Link from "next/link";

interface PageStatus {
  connected: boolean;
  token_configured: boolean;
  verify_token_configured: boolean;
  app_secret_configured: boolean;
  page_id_env: string | null;
  page: { id: string; name: string } | null;
  error: string | null;
}

interface CheckItem { label: string; ok: boolean; detail?: string }

export default function FacebookConfiguracionPage() {
  const [status, setStatus]   = useState<PageStatus | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch("/api/facebook/status", { credentials: "include" })
      .then(async r => setStatus(await r.json().catch(() => null) as PageStatus))
      .finally(() => setLoading(false));
  }, []);

  const checks: CheckItem[] = status ? [
    { label: "FB_PAGE_ACCESS_TOKEN",   ok: status.token_configured,          detail: status.token_configured ? "Configurado" : "Falta en variables de entorno del backend" },
    { label: "FB_APP_SECRET",          ok: status.app_secret_configured,     detail: status.app_secret_configured ? "Configurado" : "Necesario para validar firma HMAC del webhook" },
    { label: "FB_WEBHOOK_VERIFY_TOKEN",ok: status.verify_token_configured,   detail: status.verify_token_configured ? "Configurado" : "Necesario para que Meta verifique el endpoint" },
    { label: "FB_PAGE_ID",             ok: Boolean(status.page_id_env),      detail: status.page_id_env ? `ID: ${status.page_id_env}` : "Opcional pero recomendado para publicaciones" },
    { label: "Conexión con Meta API",  ok: status.connected,                 detail: status.connected ? `Página: ${status.page?.name}` : (status.error ?? "Token inválido o expirado") },
  ] : [];

  return (
    <div className="page-wrapper">
      <div className="content">
        <div className="page-header d-flex align-items-center gap-2 mb-4">
          <Link href="/facebook" className="btn btn-sm btn-outline-secondary">
            <i className="ti ti-arrow-left" />
          </Link>
          <div>
            <h4 className="mb-0">Configuración Facebook Messenger</h4>
            <p className="text-muted small mb-0">Estado de la integración con la API de Páginas de Meta</p>
          </div>
        </div>

        {loading && <div className="spinner-border spinner-border-sm text-primary" />}

        {!loading && status && (
          <>
            {/* Checklist de variables */}
            <div className="card border-0 shadow-sm mb-4">
              <div className="card-header bg-transparent fw-semibold">
                <i className="ti ti-shield-check me-2" />Variables de entorno (backend)
              </div>
              <ul className="list-group list-group-flush">
                {checks.map(c => (
                  <li key={c.label} className="list-group-item d-flex align-items-center gap-3 py-2">
                    <span className={`badge rounded-pill ${c.ok ? "bg-success" : "bg-danger"}`} style={{ minWidth: 24 }}>
                      {c.ok ? "✓" : "✗"}
                    </span>
                    <code className="small flex-shrink-0" style={{ minWidth: 230 }}>{c.label}</code>
                    <span className={`small ${c.ok ? "text-muted" : "text-danger"}`}>{c.detail}</span>
                  </li>
                ))}
              </ul>
            </div>

            {/* Webhook */}
            <div className="card border-0 shadow-sm mb-4">
              <div className="card-header bg-transparent fw-semibold">
                <i className="ti ti-webhook me-2" />Configuración del Webhook en Meta Developers
              </div>
              <div className="card-body">
                <table className="table table-sm mb-0">
                  <tbody>
                    <tr>
                      <td className="text-muted small fw-semibold" style={{ width: 200 }}>Producto</td>
                      <td><code>Page</code> (no "User")</td>
                    </tr>
                    <tr>
                      <td className="text-muted small fw-semibold">URL de devolución de llamada</td>
                      <td><code>https://&lt;tu-servicio&gt;.onrender.com/webhook/facebook</code></td>
                    </tr>
                    <tr>
                      <td className="text-muted small fw-semibold">Token de verificación</td>
                      <td><code>Valor de FB_WEBHOOK_VERIFY_TOKEN</code></td>
                    </tr>
                    <tr>
                      <td className="text-muted small fw-semibold">Campos suscritos</td>
                      <td><code>messages</code></td>
                    </tr>
                  </tbody>
                </table>
              </div>
            </div>

            {/* Permisos necesarios */}
            <div className="card border-0 shadow-sm mb-4">
              <div className="card-header bg-transparent fw-semibold">
                <i className="ti ti-key me-2" />Permisos requeridos en la App de Meta
              </div>
              <ul className="list-group list-group-flush">
                {["pages_messaging", "pages_read_engagement", "pages_manage_metadata"].map(p => (
                  <li key={p} className="list-group-item small py-2">
                    <code>{p}</code>
                  </li>
                ))}
              </ul>
            </div>

            {/* Política 24h */}
            <div className="alert alert-info d-flex gap-2">
              <i className="ti ti-clock fs-5 flex-shrink-0 mt-1" />
              <div>
                <strong>Ventana de 24 horas de Meta.</strong>{" "}
                Solo puedes responder a un cliente dentro de las 24 h siguientes a su último mensaje.
                El ERP bloquea automáticamente el input de respuesta cuando la ventana expira.
              </div>
            </div>
          </>
        )}
      </div>
    </div>
  );
}
