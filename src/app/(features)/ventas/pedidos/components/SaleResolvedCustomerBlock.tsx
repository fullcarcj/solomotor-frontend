"use client";

import Link from "next/link";
import { useCallback, useEffect, useState } from "react";

interface ResolvedCustomer {
  id:         number;
  full_name?: string | null;
  label?:     string | null;
}

function parseCustomer(json: unknown): ResolvedCustomer | null {
  if (!json || typeof json !== "object") return null;
  const o = json as Record<string, unknown>;
  const root = (o.data as Record<string, unknown>) ?? o;
  const c =
    (root.customer as Record<string, unknown>) ??
    (root as Record<string, unknown>);
  if (!c || c.id == null) return null;
  const id = Number(c.id);
  if (!Number.isFinite(id)) return null;
  const full_name =
    c.full_name != null
      ? String(c.full_name)
      : c.name != null
        ? String(c.name)
        : null;
  const label =
    full_name ||
    (c.document_number != null ? String(c.document_number) : null) ||
    (c.id_number != null ? String(c.id_number) : null) ||
    `#${id}`;
  return { id, full_name, label };
}

export default function SaleResolvedCustomerBlock({
  saleId,
}: {
  saleId: string | number;
}) {
  const [loading, setLoading]   = useState(true);
  const [customer, setCustomer] = useState<ResolvedCustomer | null>(null);
  const [missing, setMissing]   = useState(false);
  const [resolving, setResolving] = useState(false);
  const [toast, setToast]       = useState<string | null>(null);

  const sid = String(saleId);

  const load = useCallback(() => {
    setLoading(true);
    setToast(null);
    fetch(`/api/ordenes/${encodeURIComponent(sid)}/cliente-resuelto`, {
      credentials: "include",
      cache: "no-store",
    })
      .then(async (r) => {
        const json: unknown = await r.json().catch(() => ({}));
        return { ok: r.ok, status: r.status, json };
      })
      .then(({ ok, status, json }) => {
        if (!ok && (status === 404 || status === 502)) {
          setCustomer(null);
          setMissing(true);
          return;
        }
        if (json && typeof json === "object") {
          const o = json as Record<string, unknown>;
          if (o.error && !("customer" in o) && !("data" in o)) {
            setMissing(true);
            setCustomer(null);
            return;
          }
        }
        const c = parseCustomer(json);
        if (c) {
          setCustomer(c);
          setMissing(false);
        } else {
          setCustomer(null);
          setMissing(true);
        }
      })
      .catch(() => {
        setCustomer(null);
        setMissing(true);
      })
      .finally(() => setLoading(false));
  }, [sid]);

  useEffect(() => {
    load();
  }, [load]);

  function resolveNow() {
    setResolving(true);
    setToast(null);
    fetch(`/api/ordenes/${encodeURIComponent(sid)}/resolver-cliente`, {
      method: "POST",
      credentials: "include",
      headers: { "Content-Type": "application/json", Accept: "application/json" },
      body: JSON.stringify({}),
      cache: "no-store",
    })
      .then((r) => r.json().catch(() => ({})))
      .then((json: unknown) => {
        if (json && typeof json === "object") {
          const o = json as Record<string, unknown>;
          const err = o.error;
          if (err) {
            setToast(
              typeof err === "string"
                ? err
                : "No se encontró coincidencia — verifique datos del comprador"
            );
            return;
          }
        }
        const c = parseCustomer(json);
        if (c) {
          setCustomer(c);
          setMissing(false);
        } else {
          setToast("No se encontró coincidencia — verifique datos del comprador");
        }
      })
      .catch(() =>
        setToast("No se encontró coincidencia — verifique datos del comprador")
      )
      .finally(() => setResolving(false));
  }

  if (loading) {
    return (
      <div className="placeholder-glow small">
        <span className="placeholder col-10 rounded" style={{ height: 20 }} />
      </div>
    );
  }

  return (
    <div className="border rounded p-2 bg-light small">
      {customer ? (
        <div className="text-success small">
          <i className="ti ti-check me-1" aria-hidden />
          <strong>Cliente unificado</strong>
          <div className="mt-1">
            <Link href={`/clientes/${customer.id}`} className="text-decoration-none">
              {customer.label ?? customer.full_name ?? `#${customer.id}`}
            </Link>
          </div>
        </div>
      ) : (
        <div>
          <div className="mb-2 small" style={{ color: "#fd7e14" }}>
            <i className="ti ti-alert-triangle me-1" aria-hidden />
            Sin cliente unificado
          </div>
          {missing && (
            <button
              type="button"
              className="btn btn-sm btn-outline-warning"
              disabled={resolving}
              onClick={() => void resolveNow()}
            >
              {resolving ? (
                <span className="spinner-border spinner-border-sm me-1" />
              ) : null}
              Resolver ahora
            </button>
          )}
        </div>
      )}
      {toast && (
        <div className="alert alert-danger py-1 px-2 mt-2 mb-0 small" role="alert">
          {toast}
        </div>
      )}
    </div>
  );
}
