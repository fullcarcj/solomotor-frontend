"use client";

/**
 * SaleCustomerPanel — sección cliente para la vista Pedidos.
 * Las tres líneas de resumen salen **solo** de `customers.id` = `sales_orders.customer_id`
 * (GET /api/clientes/directorio/:id). Tras fusión en vínculo ML↔chat, `customer_id` de la
 * orden y el chat apuntan al mismo registro: aquí y en Bandeja se ve el mismo cliente fusionado.
 * Detalle extendido debajo del resumen (misma ficha).
 */

import Link from "next/link";
import { useEffect, useMemo, useState } from "react";
import type { CustomerDetail } from "@/types/customers";
import EditCustomerModal from "@/app/(features)/bandeja/[chatId]/components/EditCustomerModal";
import { OpFranjaActionButton } from "@/app/(features)/bandeja/components/operativeFranjaShared";

function initials(name: string | null | undefined): string {
  if (!name?.trim()) return "?";
  return name
    .trim()
    .split(/\s+/)
    .slice(0, 2)
    .map((w) => w[0]?.toUpperCase() ?? "")
    .join("");
}

function fmtDate(iso: string | null | undefined): string {
  if (!iso) return "—";
  try {
    return new Date(iso).toLocaleDateString("es-VE", {
      day: "2-digit",
      month: "short",
      year: "numeric",
    });
  } catch {
    return iso;
  }
}

function trimCustomerStr(v: string | null | undefined): string {
  return v != null && String(v).trim() !== "" ? String(v).trim() : "";
}

function formatCustomerPhonesLine(p1: string, p2: string): string {
  if (p1 && p2) return `${p1} / ${p2}`;
  if (p1) return p1;
  if (p2) return p2;
  return "";
}

function truncateCustomerSummaryName(name: string, max: number): string {
  const t = name.replace(/\s+/g, " ").trim();
  if (t.length <= max) return t;
  return `${t.slice(0, Math.max(0, max - 1))}…`;
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

function mlBuyerLine(id: number | null | undefined): string {
  if (id != null && String(id).trim() !== "" && Number(id) > 0) {
    return `ID MERCADOLIBRE: ${String(id).trim()}`;
  }
  return "ID MERCADOLIBRE: —";
}

interface Props {
  customerId: number | null;
  chatId?: number | string | null;
  onCustomerMutated?: () => void;
}

export default function SaleCustomerPanel({
  customerId,
  chatId,
  onCustomerMutated,
}: Props) {
  const [customer, setCustomer] = useState<CustomerDetail | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [editOpen, setEditOpen] = useState(false);

  useEffect(() => {
    if (!customerId || customerId <= 0) {
      setCustomer(null);
      setLoading(false);
      setError(null);
      return;
    }
    let cancelled = false;
    setCustomer(null);
    setLoading(true);
    setError(null);
    void (async () => {
      try {
        const res = await fetch(
          `/api/clientes/directorio/${encodeURIComponent(String(customerId))}`,
          { credentials: "include", cache: "no-store" }
        );
        if (cancelled) return;
        if (!res.ok) {
          setError("No se pudo cargar el cliente.");
          return;
        }
        const j = (await res.json().catch(() => null)) as Record<string, unknown> | null;
        const data = (j?.data ?? j) as CustomerDetail | null;
        setCustomer(data);
      } catch {
        if (!cancelled) setError("Error de red.");
      } finally {
        if (!cancelled) setLoading(false);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [customerId]);

  function refetchCustomerFromDirectory() {
    if (!customerId || customerId <= 0) return;
    setLoading(true);
    setError(null);
    void (async () => {
      try {
        const res = await fetch(
          `/api/clientes/directorio/${encodeURIComponent(String(customerId))}`,
          { credentials: "include", cache: "no-store" }
        );
        if (!res.ok) {
          setError("No se pudo cargar el cliente.");
          return;
        }
        const j = (await res.json().catch(() => null)) as Record<string, unknown> | null;
        const data = (j?.data ?? j) as CustomerDetail | null;
        setCustomer(data);
      } catch {
        setError("Error de red.");
      } finally {
        setLoading(false);
      }
    })();
  }

  const summaryBlock = useMemo(() => {
    if (loading) {
      const nameLoading =
        customer?.full_name != null && String(customer.full_name).trim() !== ""
          ? String(customer.full_name).trim()
          : "Cargando datos…";
      const nameLine = truncateCustomerSummaryName(nameLoading, 110);
      const p1 = trimCustomerStr(customer?.phone ?? undefined);
      const p2 = trimCustomerStr(customer?.phone_2 ?? undefined);
      const p2b = !p2 ? trimCustomerStr(customer?.alternative_phone ?? undefined) : "";
      const phones = formatCustomerPhonesLine(p1, p2 || p2b);
      return (
        <>
          <div>{nameLine}</div>
          <div style={{ marginTop: 3 }}>
            <span
              style={{
                fontVariantNumeric: "tabular-nums",
                wordBreak: "break-all",
              }}
            >
              {phones || "—"}
            </span>
          </div>
          <div
            style={{
              marginTop: 3,
              display: "flex",
              alignItems: "center",
              gap: 8,
              justifyContent: "space-between",
              flexWrap: "wrap",
            }}
          >
            <span style={{ minWidth: 0, flex: "1 1 auto", wordBreak: "break-word" }}>
              {mlBuyerLine(customer?.primary_ml_buyer_id ?? null)}
            </span>
          </div>
        </>
      );
    }

    if (!customer) {
      const nameC =
        customerId != null && Number(customerId) > 0
          ? `Cliente #${customerId}`
          : "Cliente";
      return (
        <>
          <div>{truncateCustomerSummaryName(nameC, 110)}</div>
          <div style={{ marginTop: 3 }}>
            <span style={{ fontVariantNumeric: "tabular-nums", wordBreak: "break-all" }}>
              —
            </span>
          </div>
          <div
            style={{
              marginTop: 3,
              display: "flex",
              alignItems: "center",
              gap: 8,
              justifyContent: "space-between",
              flexWrap: "wrap",
            }}
          >
            <span style={{ minWidth: 0, flex: "1 1 auto", wordBreak: "break-word" }}>
              {mlBuyerLine(null)}
            </span>
            <OpFranjaActionButton
              type="button"
              variant="neutral"
              iconClass="ti ti-pencil"
              onClick={() => setEditOpen(true)}
            >
              Editar cliente
            </OpFranjaActionButton>
          </div>
        </>
      );
    }

    const name =
      customer.full_name != null && String(customer.full_name).trim() !== ""
        ? String(customer.full_name).trim()
        : "—";
    const nameLine = truncateCustomerSummaryName(name, 110);
    const phone1 = trimCustomerStr(customer.phone);
    const phone2 =
      trimCustomerStr(customer.phone_2) || trimCustomerStr(customer.alternative_phone);
    const phones = formatCustomerPhonesLine(phone1, phone2);

    return (
      <>
        <div>{nameLine}</div>
        <div style={{ marginTop: 3 }}>
          <span style={{ fontVariantNumeric: "tabular-nums", wordBreak: "break-all" }}>
            {phones || "—"}
          </span>
        </div>
        <div
          style={{
            marginTop: 3,
            display: "flex",
            alignItems: "center",
            gap: 8,
            justifyContent: "space-between",
            flexWrap: "wrap",
          }}
        >
          <span style={{ minWidth: 0, flex: "1 1 auto", wordBreak: "break-word" }}>
            {mlBuyerLine(customer.primary_ml_buyer_id)}
          </span>
          <OpFranjaActionButton
            type="button"
            variant="neutral"
            iconClass="ti ti-pencil"
            onClick={() => setEditOpen(true)}
          >
            Editar cliente
          </OpFranjaActionButton>
        </div>
      </>
    );
  }, [loading, customer, customerId]);

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
        <div className="sc-summary-3">{summaryBlock}</div>
        <div className="placeholder-glow d-flex flex-column gap-2">
          <span className="placeholder col-8 rounded" style={{ height: 18 }} />
          <span className="placeholder col-6 rounded" style={{ height: 14 }} />
        </div>
      </div>
    );
  }

  if (error || !customer) {
    return (
      <div className="sc-panel sc-panel--empty">
        <div className="sc-summary-3">{summaryBlock}</div>
        <i className="ti ti-alert-circle sc-panel__icon" style={{ color: "#f87171" }} aria-hidden />
        <span style={{ color: "#f87171" }}>{error ?? "No se encontró el cliente"}</span>
        {customerId > 0 ? (
          <EditCustomerModal
            open={editOpen}
            customerId={customerId}
            chatId={chatId != null && String(chatId).trim() !== "" ? String(chatId) : null}
            sourceType={null}
            overlayZIndex={2060}
            dialogZIndex={2061}
            onClose={() => setEditOpen(false)}
            onSuccess={() => {
              setEditOpen(false);
              refetchCustomerFromDirectory();
              onCustomerMutated?.();
            }}
          />
        ) : null}
      </div>
    );
  }

  const av = avColor(customer.full_name);
  const ini = initials(customer.full_name);

  return (
    <div className="sc-panel">
      <div className="sc-summary-3">{summaryBlock}</div>

      <hr className="border-secondary opacity-25 my-2" />

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

      <dl className="sc-kv">
        {customer.city && (
          <>
            <dt>Ciudad</dt>
            <dd>{customer.city}</dd>
          </>
        )}

        {customer.id_number && (
          <>
            <dt>C.I. / RIF</dt>
            <dd className="font-monospace">
              {customer.id_type ? `${customer.id_type}-` : ""}
              {customer.id_number}
            </dd>
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
            <dd>{customer.vehicles.map((v) => v.label).join(", ")}</dd>
          </>
        )}
      </dl>

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

      <EditCustomerModal
        open={editOpen}
        customerId={customerId}
        chatId={chatId != null && String(chatId).trim() !== "" ? String(chatId) : null}
        sourceType={null}
        overlayZIndex={2060}
        dialogZIndex={2061}
        onClose={() => setEditOpen(false)}
        onSuccess={() => {
          setEditOpen(false);
          refetchCustomerFromDirectory();
          onCustomerMutated?.();
        }}
      />
    </div>
  );
}
