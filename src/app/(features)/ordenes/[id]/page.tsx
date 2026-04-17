"use client";

import Link from "next/link";
import { useParams } from "next/navigation";
import { useEffect, useState } from "react";
import CommonFooter from "@/core/common/footer/commonFooter";
import SaleResolvedCustomerBlock from "@/app/(features)/ventas/pedidos/components/SaleResolvedCustomerBlock";
import SaleSourceBadge from "@/app/(features)/ventas/pedidos/components/SaleSourceBadge";
import type { SaleDetail } from "@/types/sales";

function parseSaleDetail(json: unknown): SaleDetail | null {
  if (!json || typeof json !== "object") return null;
  const o = json as Record<string, unknown>;
  const data = (o.data as Record<string, unknown>) ?? o;
  if (!data.id) return null;
  return data as unknown as SaleDetail;
}

export default function OrdenVentaPage() {
  const params = useParams();
  const rawId = params.id;
  const saleId = Array.isArray(rawId) ? rawId[0] : rawId;
  const [detail, setDetail] = useState<SaleDetail | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (saleId == null || saleId === "") {
      setError("ID inválido.");
      setLoading(false);
      return;
    }
    let alive = true;
    setLoading(true);
    setError(null);
    fetch(`/api/ventas/pedidos/${encodeURIComponent(String(saleId))}`, {
      credentials: "include",
      cache: "no-store",
    })
      .then((r) => r.json().catch(() => ({})))
      .then((json: unknown) => {
        if (!alive) return;
        const p = parseSaleDetail(json);
        if (p) setDetail(p);
        else setError("No se pudo cargar la venta.");
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
  }, [saleId]);

  return (
    <div className="page-wrapper">
      <div className="content">
        <div className="page-header">
          <div className="page-title">
            <nav aria-label="breadcrumb" className="mb-2">
              <ol className="breadcrumb mb-0 small">
                <li className="breadcrumb-item">
                  <Link href="/ventas/pedidos">Ventas</Link>
                </li>
                <li className="breadcrumb-item active" aria-current="page">
                  Orden #{String(saleId)}
                </li>
              </ol>
            </nav>
            <h4 className="mb-0 d-flex align-items-center gap-2 flex-wrap">
              {loading ? "Cargando…" : `Venta #${String(saleId)}`}
              {detail ? <SaleSourceBadge source={detail.source} /> : null}
            </h4>
          </div>
        </div>

        {error && (
          <div className="alert alert-danger" role="alert">
            {error}
          </div>
        )}

        {!loading && detail && detail.source === "mercadolibre" && (
          <div className="card border-0 shadow-sm mb-3">
            <div className="card-body">
              <h6 className="card-title small text-uppercase text-muted mb-2">
                Comprador
              </h6>
              <SaleResolvedCustomerBlock saleId={detail.id} />
            </div>
          </div>
        )}

        {!loading && detail && detail.source !== "mercadolibre" && (
          <p className="text-muted small">
            La resolución de identidad ML aplica a ventas con origen MercadoLibre.{" "}
            <Link href="/ventas/pedidos">Volver al listado</Link>
          </p>
        )}

        <CommonFooter />
      </div>
    </div>
  );
}
