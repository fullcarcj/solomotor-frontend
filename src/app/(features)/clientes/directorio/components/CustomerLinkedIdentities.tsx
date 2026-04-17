"use client";

import { useEffect, useState } from "react";
import type {
  CustomerIdentitiesResponse,
  CustomerIdentityRow,
} from "@/types/customerIdentities";

function parsePayload(json: unknown): CustomerIdentitiesResponse {
  if (!json || typeof json !== "object") return {};
  const o = json as Record<string, unknown>;
  const d = (o.data as Record<string, unknown>) ?? o;
  const identities = Array.isArray(d.identities)
    ? (d.identities as CustomerIdentityRow[])
    : [];
  const ml_buyers = Array.isArray(d.ml_buyers)
    ? (d.ml_buyers as CustomerIdentitiesResponse["ml_buyers"])
    : [];
  return { identities, ml_buyers };
}

function badgeClass(source: string): string {
  const s = source.toLowerCase();
  if (s === "whatsapp") return "bg-success";
  if (s === "mercadolibre") return "bg-warning text-dark";
  if (s === "mostrador") return "bg-primary";
  return "bg-secondary";
}

function icon(source: string): string {
  const s = source.toLowerCase();
  if (s === "whatsapp") return "🟢";
  if (s === "mercadolibre") return "🟡";
  if (s === "mostrador") return "🔵";
  return "⚪";
}

function labelSource(source: string): string {
  const s = source.toLowerCase();
  if (s === "whatsapp") return "WhatsApp";
  if (s === "mercadolibre") return "MercadoLibre";
  if (s === "mostrador") return "Mostrador";
  return source;
}

export default function CustomerLinkedIdentities({ customerId }: { customerId: number }) {
  const [data, setData]     = useState<CustomerIdentitiesResponse | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError]   = useState<string | null>(null);

  useEffect(() => {
    let alive = true;
    setLoading(true);
    setError(null);
    fetch(`/api/clientes/${customerId}/identidades`, {
      credentials: "include",
      cache: "no-store",
    })
      .then((r) => r.json().catch(() => ({})))
      .then((json: unknown) => {
        if (!alive) return;
        if (json && typeof json === "object" && "error" in (json as object) && !(json as { identities?: unknown }).identities) {
          setError("No se pudieron cargar las identidades vinculadas.");
          setData(null);
          return;
        }
        setData(parsePayload(json));
      })
      .catch(() => {
        if (alive) setError("Error de red al cargar identidades.");
      })
      .finally(() => {
        if (alive) setLoading(false);
      });
    return () => {
      alive = false;
    };
  }, [customerId]);

  return (
    <div className="mb-4">
      <h6 className="fw-semibold text-muted text-uppercase small mb-2">
        Identidad vinculada
      </h6>
      {loading && (
        <div className="placeholder-glow">
          <span className="placeholder col-8 rounded" style={{ height: 24 }} />
        </div>
      )}
      {!loading && error && (
        <div className="alert alert-warning py-2 small mb-0">{error}</div>
      )}
      {!loading && !error && data && (!data.identities || data.identities.length === 0) && (
        <p className="text-muted small mb-0 border rounded p-2 bg-light">
          Sin canales vinculados — este cliente no tiene identidad registrada en ningún
          canal
        </p>
      )}
      {!loading && !error && data && data.identities && data.identities.length > 0 && (
        <div className="d-flex flex-wrap gap-2 align-items-center">
          {data.identities.map((row, i) => (
            <span
              key={`${row.source}-${row.external_id}-${i}`}
              className={`badge rounded-pill ${badgeClass(row.source)}`}
              title={`${row.source}: ${row.external_id}`}
            >
              {icon(row.source)} {labelSource(row.source)}{" "}
              <span className="font-monospace">{row.external_id}</span>
            </span>
          ))}
        </div>
      )}
    </div>
  );
}
