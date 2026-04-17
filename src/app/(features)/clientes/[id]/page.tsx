"use client";

import Link from "next/link";
import { useParams } from "next/navigation";
import { useEffect, useState } from "react";
import CommonFooter from "@/core/common/footer/commonFooter";
import CustomerLinkedIdentities from "@/app/(features)/clientes/directorio/components/CustomerLinkedIdentities";
import CustomerTypeBadge from "@/app/(features)/clientes/directorio/components/CustomerTypeBadge";
import type { CustomerDetail } from "@/types/customers";

function parseDetail(json: unknown): CustomerDetail | null {
  if (!json || typeof json !== "object") return null;
  const o = json as Record<string, unknown>;
  const d = (o.data as Record<string, unknown>) ?? o;
  if (!d.full_name) return null;
  return d as unknown as CustomerDetail;
}

export default function ClienteFichaPage() {
  const params = useParams();
  const rawId = params.id;
  const customerId = Number(Array.isArray(rawId) ? rawId[0] : rawId);
  const [detail, setDetail] = useState<CustomerDetail | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!Number.isFinite(customerId)) {
      setError("ID inválido.");
      setLoading(false);
      return;
    }
    let alive = true;
    setLoading(true);
    setError(null);
    fetch(`/api/clientes/directorio/${customerId}`, {
      credentials: "include",
      cache: "no-store",
    })
      .then((r) => r.json().catch(() => ({})))
      .then((json: unknown) => {
        if (!alive) return;
        const p = parseDetail(json);
        if (p) setDetail(p);
        else setError("No se pudo cargar el cliente.");
      })
      .catch(() => {
        if (alive) setError("Error de red.");
      })
      .finally(() => {
        if (alive) setLoading(false);
      });
    return () => {
      alive = false;
    };
  }, [customerId]);

  return (
    <div className="page-wrapper">
      <div className="content">
        <div className="page-header">
          <div className="page-title">
            <nav aria-label="breadcrumb" className="mb-2">
              <ol className="breadcrumb mb-0 small">
                <li className="breadcrumb-item">
                  <Link href="/clientes/directorio">Directorio</Link>
                </li>
                <li className="breadcrumb-item active" aria-current="page">
                  Ficha cliente
                </li>
              </ol>
            </nav>
            {loading ? (
              <h4 className="mb-0">Cargando…</h4>
            ) : detail ? (
              <h4 className="mb-0 d-flex align-items-center gap-2 flex-wrap">
                {detail.full_name}
                <CustomerTypeBadge type={detail.customer_type} />
              </h4>
            ) : (
              <h4 className="mb-0 text-muted">Cliente</h4>
            )}
          </div>
        </div>

        {error && (
          <div className="alert alert-danger" role="alert">
            {error}
          </div>
        )}

        {!loading && detail && Number.isFinite(customerId) && (
          <div className="card border-0 shadow-sm">
            <div className="card-body">
              <CustomerLinkedIdentities customerId={customerId} />
              <p className="text-muted small mb-0">
                Teléfono: {detail.phone ?? "—"} · Email: {detail.email ?? "—"}
              </p>
            </div>
          </div>
        )}

        <CommonFooter />
      </div>
    </div>
  );
}
