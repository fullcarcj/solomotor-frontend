"use client";
import { useCallback, useEffect, useId, useState } from "react";
import type { AutomationStats } from "@/types/automatizaciones";
import AutomationStatsCards from "@/app/(features)/automatizaciones/components/AutomationStatsCards";
import ActiveConfigsBadges from "@/app/(features)/automatizaciones/components/ActiveConfigsBadges";
import WaLogsPanel from "./components/WaLogsPanel";
import TipoEConfigPanel from "./components/TipoEConfigPanel";
import TipoFConfigPanel from "./components/TipoFConfigPanel";
import WasenderStatusPanel from "./components/WasenderStatusPanel";

type TabId = "wa_logs" | "tipo_e" | "tipo_f" | "wasender";

const TABS: { id: TabId; label: string }[] = [
  { id: "wa_logs",  label: "Logs WA (E/F/H)"      },
  { id: "tipo_e",   label: "Config Tipo E"         },
  { id: "tipo_f",   label: "Config Tipo F"         },
  { id: "wasender", label: "Estado Wasender"       },
];

function parseStats(json: unknown): AutomationStats | null {
  if (!json || typeof json !== "object") return null;
  const o = json as Record<string, unknown>;
  return ((o.data ?? o) as AutomationStats) ?? null;
}

export default function ConfigAutomatizacionesPage() {
  const [stats,   setStats]   = useState<AutomationStats | null>(null);
  const [loading, setLoading] = useState(true);
  const [error,   setError]   = useState<string | null>(null);
  const [tab,     setTab]     = useState<TabId>("wa_logs");
  const navId = useId();

  const loadStats = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await fetch("/api/automatizaciones/stats", {
        credentials: "include",
        cache: "no-store",
      });
      const json: unknown = await res.json().catch(() => ({}));
      if (!res.ok) {
        setError((json as Record<string, string>)?.error ?? "Error al cargar estadísticas");
        return;
      }
      setStats(parseStats(json));
    } catch {
      setError("Error de red al conectar con el servidor.");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { void loadStats(); }, [loadStats]);

  return (
    <div className="page-wrapper">
      <div className="content">
        <div className="d-flex align-items-start justify-content-between flex-wrap gap-3 mb-4">
          <div>
            <h1 className="mb-1 custome-heading">Automatizaciones WhatsApp</h1>
            <p className="text-muted small mb-0">
              Logs de mensajes automáticos WA y configuración de integraciones
            </p>
          </div>
          <button className="btn btn-sm btn-outline-secondary" onClick={() => void loadStats()} title="Recargar stats">
            <i className="ti ti-refresh" />
          </button>
        </div>

        {error && (
          <div className="alert alert-danger d-flex align-items-center gap-3 mb-4">
            <i className="ti ti-alert-circle fs-18" />
            <span className="flex-fill">{error}</span>
            <button className="btn btn-sm btn-outline-danger" onClick={() => void loadStats()}>Reintentar</button>
          </div>
        )}

        <AutomationStatsCards stats={loading ? null : stats} />
        <ActiveConfigsBadges configs={stats?.active_configs} />

        {/* Tabs */}
        <ul className="nav nav-tabs mb-4" id={navId} role="tablist">
          {TABS.map((t) => (
            <li className="nav-item" key={t.id} role="presentation">
              <button
                className={`nav-link ${tab === t.id ? "active fw-semibold" : ""}`}
                type="button"
                role="tab"
                onClick={() => setTab(t.id)}
              >
                {t.label}
              </button>
            </li>
          ))}
        </ul>

        {tab === "wa_logs"  && <WaLogsPanel />}
        {tab === "tipo_e"   && <TipoEConfigPanel />}
        {tab === "tipo_f"   && <TipoFConfigPanel />}
        {tab === "wasender" && <WasenderStatusPanel />}
      </div>
    </div>
  );
}
