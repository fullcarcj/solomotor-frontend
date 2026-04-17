"use client";
import { useCallback, useEffect, useState } from "react";

interface WasenderConfig {
  configured:   boolean;
  phone_number: string | null;
  has_api_key:  boolean;
  has_token:    boolean;
  [k: string]:  unknown;
}

function parseConfig(json: unknown): WasenderConfig | null {
  if (!json || typeof json !== "object") return null;
  const o = json as Record<string, unknown>;
  const data = (o.data ?? o) as Record<string, unknown>;
  if (typeof data.configured !== "boolean") return null;
  return {
    configured:   Boolean(data.configured),
    phone_number: typeof data.phone_number === "string" ? data.phone_number : null,
    has_api_key:  Boolean(data.has_api_key ?? data.api_key ?? false),
    has_token:    Boolean(data.has_token   ?? data.token   ?? false),
    ...data,
  };
}

export default function WasenderStatusPanel() {
  const [config,  setConfig]  = useState<WasenderConfig | null>(null);
  const [loading, setLoading] = useState(true);
  const [error,   setError]   = useState<string | null>(null);

  const load = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await fetch("/api/automatizaciones/config/wasender", {
        credentials: "include",
        cache: "no-store",
      });
      const json: unknown = await res.json().catch(() => ({}));
      if (!res.ok) {
        setError((json as Record<string, string>)?.error ?? "Error al cargar");
        return;
      }
      setConfig(parseConfig(json));
    } catch {
      setError("Error de red.");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { void load(); }, [load]);

  if (loading) {
    return <div className="placeholder-glow"><div className="placeholder col-12 rounded" style={{ height: 160 }} /></div>;
  }

  return (
    <div>
      {error && (
        <div className="alert alert-danger d-flex align-items-center gap-2 mb-3">
          <i className="ti ti-alert-circle" />
          <span className="flex-fill">{error}</span>
          <button className="btn btn-sm btn-outline-danger" onClick={() => void load()}>Reintentar</button>
        </div>
      )}

      {config && !config.configured && (
        <div className="alert alert-warning mb-3">
          <i className="ti ti-alert-triangle me-1" />
          <strong>Wasender no está configurado.</strong> Los mensajes WA automáticos no se enviarán.
        </div>
      )}

      <div className="card border-0 shadow-sm" style={{ maxWidth: 480 }}>
        <div className="card-header bg-white border-0">
          <h6 className="mb-0 d-flex align-items-center gap-2">
            <i className="ti ti-brand-whatsapp text-success fs-5" />
            Wasender
          </h6>
        </div>
        <div className="card-body">
          {!config ? (
            <p className="text-muted small">Sin datos de configuración</p>
          ) : (
            <table className="table table-sm mb-0">
              <tbody>
                <tr>
                  <td className="text-muted small">Estado</td>
                  <td>
                    {config.configured ? (
                      <span className="badge bg-success">● Configurado</span>
                    ) : (
                      <span className="badge bg-secondary">○ No configurado</span>
                    )}
                  </td>
                </tr>
                <tr>
                  <td className="text-muted small">Teléfono</td>
                  <td className="small">{config.phone_number ?? <span className="text-muted">—</span>}</td>
                </tr>
                <tr>
                  <td className="text-muted small">API Key</td>
                  <td>
                    <span className="font-monospace small">***</span>
                    {" "}
                    <span className={`badge ${config.has_api_key ? "bg-success" : "bg-danger"}`}>
                      {config.has_api_key ? "Sí" : "No"}
                    </span>
                  </td>
                </tr>
                <tr>
                  <td className="text-muted small">Token</td>
                  <td>
                    <span className="font-monospace small">***</span>
                    {" "}
                    <span className={`badge ${config.has_token ? "bg-success" : "bg-danger"}`}>
                      {config.has_token ? "Sí" : "No"}
                    </span>
                  </td>
                </tr>
              </tbody>
            </table>
          )}
        </div>
      </div>
    </div>
  );
}
