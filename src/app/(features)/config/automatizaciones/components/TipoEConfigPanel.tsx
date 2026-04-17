"use client";
import { useCallback, useEffect, useState } from "react";

function parseFields(json: unknown): { key: string; value: string }[] {
  if (!json || typeof json !== "object") return [];
  const o = json as Record<string, unknown>;
  const data = (o.data ?? o) as Record<string, unknown>;
  return Object.entries(data)
    .filter(([, v]) => v !== null && v !== undefined && typeof v !== "object")
    .map(([k, v]) => ({ key: k, value: String(v) }));
}

export default function TipoEConfigPanel() {
  const [fields,  setFields]  = useState<{ key: string; value: string }[]>([]);
  const [loading, setLoading] = useState(true);
  const [error,   setError]   = useState<string | null>(null);

  const load = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await fetch("/api/automatizaciones/config/tipo-e", {
        credentials: "include",
        cache: "no-store",
      });
      const json: unknown = await res.json().catch(() => ({}));
      if (!res.ok) {
        setError((json as Record<string, string>)?.error ?? "Error al cargar");
        return;
      }
      setFields(parseFields(json));
    } catch {
      setError("Error de red.");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { void load(); }, [load]);

  if (loading) {
    return <div className="placeholder-glow"><div className="placeholder col-12 rounded" style={{ height: 120 }} /></div>;
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

      <div className="alert alert-info small mb-3">
        <i className="ti ti-lock me-1" />
        Para modificar la configuración de Tipo E, contactar al administrador del sistema.
      </div>

      <div className="card border-0 shadow-sm">
        <div className="table-responsive">
          <table className="table table-sm mb-0">
            <thead className="table-light">
              <tr>
                <th>Campo</th>
                <th>Valor</th>
              </tr>
            </thead>
            <tbody>
              {fields.length === 0 ? (
                <tr><td colSpan={2} className="text-muted text-center py-3">Sin configuración disponible</td></tr>
              ) : fields.map((f) => (
                <tr key={f.key}>
                  <td className="font-monospace small text-muted">{f.key}</td>
                  <td className="small">{f.value}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
