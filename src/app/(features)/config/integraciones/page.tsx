"use client";
import { useCallback, useEffect, useState } from "react";
import Link from "next/link";
import { all_routes } from "@/data/all_routes";
import IntegrationStatusCard from "../components/IntegrationStatusCard";
import type { Integrations } from "@/types/config";

function normalize(raw: unknown): Partial<Integrations> {
  if (!raw || typeof raw !== "object") return {};
  const r = raw as Record<string, unknown>;
  const root = (r.data ?? r.integrations ?? r) as Record<string, unknown>;
  return root as Partial<Integrations>;
}

export default function ConfigIntegracionesPage() {
  const [data, setData]         = useState<Partial<Integrations> | null>(null);
  const [loading, setLoading]   = useState(true);
  const [error, setError]       = useState<string | null>(null);

  const load = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await fetch("/api/config/integraciones", { credentials: "include", cache: "no-store" });
      const d: unknown = await res.json().catch(() => ({}));
      if (!res.ok) throw new Error(((d as Record<string, unknown>).error as string) ?? `HTTP ${res.status}`);
      setData(normalize(d));
    } catch (e) {
      setError(e instanceof Error ? e.message : "Error.");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { void load(); }, [load]);

  const wa = data?.whatsapp;
  const ml = data?.mercadolibre;
  const bn = data?.banesco;

  return (
    <div className="page-wrapper">
      <div className="content">
        <div className="page-header">
          <h4 className="page-title">Integraciones</h4>
          <p className="text-muted small mb-0">Estado de canales conectados al ERP</p>
        </div>

        {error && (
          <div className="alert alert-danger d-flex justify-content-between align-items-center">
            {error}
            <button type="button" className="btn btn-sm btn-outline-danger" onClick={() => void load()}>Reintentar</button>
          </div>
        )}

        {loading ? (
          <div className="row g-3">
            {Array.from({ length: 3 }).map((_, i) => (
              <div key={i} className="col-md-4">
                <div className="card placeholder-glow h-100"><div className="card-body"><div className="placeholder col-12 rounded" style={{ height: 120 }} /></div></div>
              </div>
            ))}
          </div>
        ) : (
          <div className="row g-3">
            <div className="col-md-4">
              <IntegrationStatusCard
                name="WhatsApp (Wasender)"
                icon="ti-brand-whatsapp"
                status={wa?.status === "connected" || wa?.configured ? "connected" : "not_configured"}
                details={
                  <>
                    <div>Configurado: {wa?.configured ? "Sí" : "No"}</div>
                    {wa?.phone_number && <div>Teléfono: {wa.phone_number}</div>}
                  </>
                }
                actionLabel="Ver configuración"
                actionHref={all_routes.settingsWasender}
              />
            </div>
            <div className="col-md-4">
              <IntegrationStatusCard
                name="MercadoLibre"
                icon="ti-shopping-cart"
                status={ml?.status === "connected" || (ml?.accounts_count ?? 0) > 0 ? "connected" : "not_configured"}
                details={
                  <>
                    <div>Cuentas conectadas: {ml?.accounts_count ?? 0}</div>
                    {ml?.last_connected && <div>Última conexión: {new Date(ml.last_connected).toLocaleString("es-VE")}</div>}
                  </>
                }
                actionLabel="Gestionar cuentas ML"
                actionHref={all_routes.mercadolibreMapeo}
              />
            </div>
            <div className="col-md-4">
              <IntegrationStatusCard
                name="Banesco"
                icon="ti-building-bank"
                status={bn?.status === "connected" || bn?.configured ? "connected" : "not_configured"}
                details={
                  <>
                    <div>Estado: {bn?.status ?? "—"}</div>
                    {bn?.last_sync_at && <div>Última sincronización: {new Date(bn.last_sync_at).toLocaleString("es-VE")}</div>}
                  </>
                }
                actionLabel="Ver movimientos"
                actionHref={all_routes.finanzasBanesco}
              />
            </div>
          </div>
        )}

        <div className="alert alert-info mt-4 small mb-0">
          Para configurar nuevas integraciones contactar al administrador del sistema.
        </div>
        <p className="small text-muted mt-2 mb-0">
          <Link href={all_routes.settingsMlConnect}>Conexión ML (OAuth)</Link>
          {" · "}
          <Link href={all_routes.settingsWasender}>Wasender</Link>
        </p>
      </div>
    </div>
  );
}
