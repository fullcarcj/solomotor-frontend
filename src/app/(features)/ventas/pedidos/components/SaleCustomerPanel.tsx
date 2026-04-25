"use client";

/**
 * SaleCustomerPanel — sección cliente para la vista Pedidos.
 * Replica la información y botones de la franja operativa de Bandeja (sección Cliente).
 * Usa GET /api/clientes/directorio/:id para cargar el CustomerDetail.
 */

import Link from "next/link";
import { useEffect, useState } from "react";
import type { CustomerDetail } from "@/types/customers";

function initials(name: string | null | undefined): string {
  if (!name?.trim()) return "?";
  return name.trim().split(/\s+/).slice(0, 2).map(w => w[0]?.toUpperCase() ?? "").join("");
}

function fmtDate(iso: string | null | undefined): string {
  if (!iso) return "—";
  try {
    return new Date(iso).toLocaleDateString("es-VE", { day: "2-digit", month: "short", year: "numeric" });
  } catch { return iso; }
}

function phonesLine(c: CustomerDetail): string {
  const p1 = c.phone?.trim() ?? "";
  const p2 = c.phone_2?.trim() ?? c.alternative_phone?.trim() ?? "";
  if (p1 && p2) return `${p1} / ${p2}`;
  return p1 || p2 || "—";
}

const AV_PALETTE = [
  { bg: "#1e5a3a", color: "#86efac" },
  { bg: "#1e4a7a", color: "#93c5fd" },
  { bg: "#7a3a1e", color: "#fdba74" },
  { bg: "#5a2e7a", color: "#c4b5fd" },
  { bg: "#2d5a5a", color: "#67e8f9" },
];
function avColor(name: string) {
  let h = 0;
  for (let i = 0; i < name.length; i++) h = ((h * 31 + name.charCodeAt(i)) >>> 0) % AV_PALETTE.length;
  return AV_PALETTE[h];
}

interface Props {
  customerId: number | null;
  chatId?: number | string | null;
}

export default function SaleCustomerPanel({ customerId, chatId }: Props) {
  const [customer, setCustomer] = useState<CustomerDetail | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!customerId || customerId <= 0) { setCustomer(null); return; }
    let alive = true;
    setLoading(true);
    setError(null);
    void (async () => {
      try {
        const res = await fetch(
          `/api/clientes/directorio/${encodeURIComponent(String(customerId))}`,
          { credentials: "include", cache: "no-store" }
        );
        if (!alive) return;
        if (!res.ok) { setError("No se pudo cargar el cliente."); return; }
        const j = (await res.json().catch(() => null)) as Record<string, unknown> | null;
        if (!alive) return;
        const data = (j?.data ?? j) as CustomerDetail | null;
        setCustomer(data);
      } catch { if (alive) setError("Error de red."); }
      finally { if (alive) setLoading(false); }
    })();
    return () => { alive = false; };
  }, [customerId]);

  if (!customerId) {
    return (
      <div className="sc-panel sc-panel--empty">
        <i className="ti ti-user-question sc-panel__icon" aria-hidden />
        <span>Sin cliente asignado</span>
      </div>
    );
  }

  if (loading) {
    return (
      <div className="sc-panel">
        <div className="placeholder-glow d-flex flex-column gap-2">
          <span className="placeholder col-8 rounded" style={{ height: 18 }} />
          <span className="placeholder col-6 rounded" style={{ height: 14 }} />
          <span className="placeholder col-5 rounded" style={{ height: 14 }} />
        </div>
      </div>
    );
  }

  if (error || !customer) {
    return (
      <div className="sc-panel sc-panel--empty">
        <i className="ti ti-alert-circle sc-panel__icon" style={{ color: "#f87171" }} aria-hidden />
        <span style={{ color: "#f87171" }}>{error ?? "No se encontró el cliente"}</span>
      </div>
    );
  }

  const av = avColor(customer.full_name);
  const ini = initials(customer.full_name);

  return (
    <div className="sc-panel">
      {/* Avatar + nombre */}
      <div className="sc-header">
        <div
          className="sc-avatar"
          style={{ background: av.bg, color: av.color }}
          title={customer.full_name}
        >
          {ini}
        </div>
        <div className="sc-header__info">
          <div className="sc-header__name">{customer.full_name}</div>
          {customer.client_segment && (
            <div className="sc-header__segment">{customer.client_segment}</div>
          )}
        </div>
      </div>

      {/* Datos */}
      <dl className="sc-kv">
        <dt>Teléfono</dt>
        <dd className="font-monospace" style={{ fontSize: 11 }}>{phonesLine(customer)}</dd>

        {customer.city && (
          <>
            <dt>Ciudad</dt>
            <dd>{customer.city}</dd>
          </>
        )}

        {customer.id_number && (
          <>
            <dt>C.I. / RIF</dt>
            <dd className="font-monospace">{customer.id_type ? `${customer.id_type}-` : ""}{customer.id_number}</dd>
          </>
        )}

        {customer.email && (
          <>
            <dt>Email</dt>
            <dd style={{ wordBreak: "break-all" }}>{customer.email}</dd>
          </>
        )}

        {customer.first_order_date && (
          <>
            <dt>Cliente desde</dt>
            <dd>{fmtDate(customer.first_order_date)}</dd>
          </>
        )}

        {customer.total_orders != null && customer.total_orders > 0 && (
          <>
            <dt>Órdenes</dt>
            <dd>
              {customer.total_orders}
              {customer.total_spent_usd != null && Number(customer.total_spent_usd) > 0
                ? ` · $${Number(customer.total_spent_usd).toFixed(0)}`
                : ""}
            </dd>
          </>
        )}

        {customer.vehicles && customer.vehicles.length > 0 && (
          <>
            <dt>Vehículos</dt>
            <dd>{customer.vehicles.map(v => v.label).join(", ")}</dd>
          </>
        )}
      </dl>

      {/* Botones de acción */}
      <div className="sc-actions">
        {chatId != null && String(chatId).trim() !== "" && (
          <Link
            href={`/bandeja/${chatId}`}
            className="sc-btn sc-btn--primary"
            title="Abrir conversación en Bandeja"
          >
            <i className="ti ti-message-2" aria-hidden />
            Ver en Bandeja
          </Link>
        )}
        <Link
          href={`/clientes/${customer.id}`}
          className="sc-btn sc-btn--secondary"
          title="Ver ficha completa del cliente"
        >
          <i className="ti ti-user" aria-hidden />
          Ficha cliente
        </Link>
        {customer.phone && (
          <a
            href={`https://wa.me/${customer.phone.replace(/\D/g, "")}`}
            target="_blank"
            rel="noopener noreferrer"
            className="sc-btn sc-btn--wa"
            title={`WhatsApp: ${customer.phone}`}
          >
            <i className="ti ti-brand-whatsapp" aria-hidden />
            WhatsApp
          </a>
        )}
      </div>
    </div>
  );
}
