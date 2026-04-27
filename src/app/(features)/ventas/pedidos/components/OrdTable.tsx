"use client";

import { useEffect, useState, type KeyboardEvent, type ReactNode } from "react";
import Link from "next/link";
import type { Sale, ItemPreview, QuotePreview } from "@/types/sales";
import {
  usePedidosCustomerContact,
  PedidosCustomerContactView,
} from "./PedidosCustomerBlock";
import { mlVentasOrderUrl } from "./mlVentasUrls";

// ─── Helpers ──────────────────────────────────────────────────────────────────

interface ChannelChip {
  key: string;
  label: string;
  extPrefix: string;
}

function getChannel(source: string): ChannelChip {
  const s = source.toLowerCase();
  if (s.includes("mercadolibre") || s.startsWith("ml_"))
    return { key: "ml", label: "Mercado Libre", extPrefix: "ML" };
  if (
    s.includes("social_media") ||
    s.includes("wa_") ||
    s.includes("whatsapp")
  )
    return { key: "wa", label: "WhatsApp", extPrefix: "WA" };
  if (
    s.includes("ecommerce") ||
    s.includes("ecom") ||
    s.includes("shopify")
  )
    return { key: "ecom", label: "E-commerce", extPrefix: "ECO" };
  if (s.includes("fuerza") || s.includes("field") || s.includes("sales_force"))
    return { key: "fuerza", label: "Fuerza Vtas.", extPrefix: "FV" };
  if (s.includes("mostrador") || s.includes("pos"))
    return { key: "mostrador", label: "Mostrador", extPrefix: "MOST" };
  return { key: "mostrador", label: source || "—", extPrefix: "—" };
}

interface CycleInfo {
  num: string;
  label: string;
  cls: string;
  next: string;
}

/**
 * Unifica variantes de API/BD (español, ML `confirmed`, etc.) con el switch de ciclo UI.
 */
function normalizeOrderStatusForCycle(raw: string): string {
  const s = String(raw ?? "")
    .trim()
    .toLowerCase()
    .replace(/\s+/g, "_")
    .replace(/-+/g, "_");
  const aliases: Record<string, string> = {
    pagada: "paid",
    anulada: "cancelled",
    cancelada: "cancelled",
    pendiente: "pending",
    cerrada: "completed",
    entregada: "delivered",
    enviada: "shipped",
    despachada: "dispatched",
    /** ML: orden cobrada; en listados a veces llega antes de normalizar a `paid`. */
    confirmed: "paid",
  };
  return aliases[s] ?? s;
}

function getCycle(statusRaw: string): CycleInfo {
  const status = normalizeOrderStatusForCycle(statusRaw);
  switch (status) {
    case "pending":
      return { num: "01", label: "Captura", cls: "st-01", next: "02 Cotizar" };
    case "pending_payment":
      return { num: "02", label: "Cotizada", cls: "st-02", next: "03 Aprob." };
    case "approved":
      return { num: "03", label: "Aprobada", cls: "st-03", next: "04 Pago" };
    case "pending_cash_approval":
      return {
        num: "04",
        label: "Pago (caja)",
        cls: "st-02",
        next: "Aprueba caja",
      };
    case "payment_overdue":
      return {
        num: "02",
        label: "Cobro vencido",
        cls: "st-02",
        next: "Regularizar",
      };
    case "paid":
      return { num: "04", label: "Pagada", cls: "st-04", next: "05 Picking" };
    case "ready_to_ship":
      return {
        num: "05",
        label: "Picking",
        cls: "st-03",
        next: "06 Tránsito",
      };
    case "shipped":
    case "dispatched":
      return {
        num: "06",
        label: "Tránsito",
        cls: "st-06",
        next: "07 Entrega",
      };
    case "completed":
    case "delivered":
      return {
        num: "07",
        label: "Cerrada",
        cls: "st-07",
        next: "✓ Completada",
      };
    case "cancelled":
    case "canceled":
    case "refunded":
      return { num: "—", label: "Anulada", cls: "st-07", next: "—" };
    default:
      return {
        num: "?",
        label: status || "—",
        cls: "st-07",
        next: "—",
      };
  }
}

const AV_PALETTE = [
  { bg: "#1e5a3a", color: "#86efac" },
  { bg: "#1e4a7a", color: "#93c5fd" },
  { bg: "#7a3a1e", color: "#fdba74" },
  { bg: "#7a1e1e", color: "#fca5a5" },
  { bg: "#5a2e7a", color: "#c4b5fd" },
  { bg: "#2d5a5a", color: "#67e8f9" },
  { bg: "#5a4a1e", color: "#fde047" },
];

function avColor(str: string): { bg: string; color: string } {
  let h = 0;
  for (let i = 0; i < str.length; i++)
    h = ((h * 31 + str.charCodeAt(i)) >>> 0) % AV_PALETTE.length;
  return AV_PALETTE[h];
}

function initials(name: string): string {
  if (!name?.trim()) return "?";
  const parts = name.trim().split(/\s+/);
  if (parts.length >= 2)
    return (parts[0][0] + parts[parts.length - 1][0]).toUpperCase();
  return name.substring(0, 2).toUpperCase();
}

function fmtDate(iso: string): string {
  if (!iso) return "—";
  const d = new Date(iso);
  if (isNaN(d.getTime())) return "—";
  const now = new Date();
  const yest = new Date(now);
  yest.setDate(yest.getDate() - 1);
  const t = d.toLocaleTimeString("es-VE", {
    hour: "2-digit",
    minute: "2-digit",
  });
  if (d.toDateString() === now.toDateString()) return `Hoy ${t}`;
  if (d.toDateString() === yest.toDateString()) return `Ayer ${t}`;
  return (
    d.toLocaleDateString("es-VE", { day: "2-digit", month: "2-digit" }) +
    " " +
    t
  );
}

function fmtElapsed(iso: string): string {
  if (!iso) return "—";
  const ms = Date.now() - new Date(iso).getTime();
  if (ms < 0) return "—";
  const days = ms / 86_400_000;
  const hours = ms / 3_600_000;
  const mins = ms / 60_000;
  if (days >= 1) return `${Math.floor(days)}d`;
  if (hours >= 1) return `${Math.floor(hours)}h`;
  return `${Math.floor(mins)}m`;
}

/** Alineado a `sales_orders.fulfillment_type` (CHECK en BD). Por defecto UI: retiro en tienda. */
const DEFAULT_FULFILLMENT = "retiro_tienda";

const FULFILLMENT_OPTIONS: { value: string; label: string }[] = [
  { value: "retiro_tienda", label: "Retiro en tienda" },
  { value: "envio_propio", label: "Envío propio" },
  { value: "mercado_envios", label: "Mercado Envíos" },
  { value: "entrega_vendedor", label: "Entrega vendedor" },
  { value: "retiro_acordado", label: "Retiro acordado" },
  { value: "desde_bodega", label: "Desde bodega" },
  { value: "", label: "Sin definir" },
];

function LogisticsFulfillmentSelect({
  saleId,
  value,
  disabled,
  onCommitted,
}: {
  saleId: string | number;
  value: string | null | undefined;
  disabled: boolean;
  onCommitted: () => void | Promise<void>;
}) {
  const effective = value && String(value).trim() !== "" ? String(value).trim() : DEFAULT_FULFILLMENT;
  const [v, setV] = useState(effective);
  const [saving, setSaving] = useState(false);
  useEffect(() => {
    setV(value && String(value).trim() !== "" ? String(value).trim() : DEFAULT_FULFILLMENT);
  }, [value]);

  if (disabled) {
    return (
      <span className="logi-ft-readonly" title="Solo órdenes omnicanal (so-*)">
        —
      </span>
    );
  }

  return (
    <select
      className="logi-ft-select"
      value={v}
      disabled={saving}
      aria-label="Forma de entrega"
      onClick={(e) => e.stopPropagation()}
      onMouseDown={(e) => e.stopPropagation()}
      onKeyDown={(e) => e.stopPropagation()}
      onChange={async (e) => {
        e.stopPropagation();
        const next = e.target.value;
        const prev = v;
        setV(next);
        setSaving(true);
        try {
          const payload =
            next === "" ? { fulfillment_type: null } : { fulfillment_type: next };
          const res = await fetch(
            `/api/ventas/pedidos/${encodeURIComponent(String(saleId))}/fulfillment`,
            {
              method: "PATCH",
              credentials: "include",
              headers: { "Content-Type": "application/json" },
              body: JSON.stringify(payload),
            }
          );
          if (!res.ok) {
            const j = (await res.json().catch(() => ({}))) as {
              error?: string | { message?: string };
              message?: string;
            };
            const msg =
              (typeof j.error === "object" && j.error?.message) ||
              (typeof j.error === "string" ? j.error : null) ||
              j.message ||
              res.statusText;
            throw new Error(String(msg));
          }
          await onCommitted();
        } catch {
          setV(prev);
        } finally {
          setSaving(false);
        }
      }}
    >
      {FULFILLMENT_OPTIONS.map((o) => (
        <option key={o.value || "__empty"} value={o.value}>
          {o.label}
        </option>
      ))}
    </select>
  );
}

function elapsedBucket(
  iso: string,
  status: string
): "hot" | "warn" | "cold" | "ok" {
  const s = normalizeOrderStatusForCycle(status);
  if (
    ["completed", "delivered", "cancelled", "canceled", "refunded"].includes(s)
  )
    return "ok";
  const h = (Date.now() - new Date(iso).getTime()) / 3_600_000;
  if (h > 48) return "hot";
  if (h > 12) return "warn";
  return "cold";
}

// ─── Inline SVG icons ─────────────────────────────────────────────────────────

const ClockIcon = () => (
  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" aria-hidden="true">
    <circle cx="12" cy="12" r="9" />
    <path d="M12 7v5l3 2" />
  </svg>
);
const ChatIcon = () => (
  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" aria-hidden="true">
    <path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z" />
  </svg>
);
const PkgIcon = () => (
  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" aria-hidden="true">
    <rect x="3" y="8" width="18" height="12" rx="2" />
    <path d="M7 8V5a5 5 0 0 1 10 0v3" />
  </svg>
);
const UpIcon = () => (
  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" aria-hidden="true">
    <path d="m7 14 5-5 5 5" />
  </svg>
);

// ─── ProductsCell ─────────────────────────────────────────────────────────────

function ProductThumb({
  url,
  name,
}: {
  url: string | null | undefined;
  name: string;
}) {
  const [imgErr, setImgErr] = useState(false);
  if (url && !imgErr) {
    return (
      <img
        src={url}
        alt={name}
        className="prod-thumb-img"
        onError={() => setImgErr(true)}
        loading="lazy"
      />
    );
  }
  return (
    <div className="prod-thumb-fallback" aria-hidden="true">
      <PkgIcon />
    </div>
  );
}

function fmtUsd(v: number | null | undefined): string {
  if (v == null || !Number.isFinite(v)) return "";
  return v.toLocaleString("es-VE", {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  });
}

interface ProductsCellProps {
  items: ItemPreview[] | null | undefined;
  quotePreview: QuotePreview | null | undefined;
  compact?: boolean;
  /** Última línea (p. ej. botón Cotización), alineada en columna Productos. */
  footerActions?: ReactNode;
}

function ProductsCellFooter({ children }: { children: ReactNode }) {
  return (
    <div
      className="pd-col-act-row pd-col-act-row--start"
      onClick={(e) => e.stopPropagation()}
      onMouseDown={(e) => e.stopPropagation()}
    >
      {children}
    </div>
  );
}

function ProductsCell({ items, quotePreview, compact = false, footerActions }: ProductsCellProps) {
  const hasQuote = quotePreview != null && quotePreview.id > 0;
  const quoteItems = hasQuote ? (quotePreview.items_preview ?? []) : [];
  const orderItems = items ?? [];

  if (hasQuote) {
    const displayItems = quoteItems.length > 0 ? quoteItems : orderItems;
    const totalStr = quotePreview.total != null ? `$${fmtUsd(quotePreview.total)}` : "";
    const countExtra =
      quotePreview.items_count > displayItems.length
        ? quotePreview.items_count - displayItems.length
        : 0;

    return (
      <div className={`c-products c-products--quote${compact ? " c-products--compact" : ""}`}>
        <div className="prod-quote-badge">
          <i className="ti ti-file-check" aria-hidden="true" />
          <span className="prod-quote-badge__lbl">Cotización</span>
          {quotePreview.status && (
            <span className={`prod-quote-badge__status qs-${quotePreview.status}`}>
              {quotePreview.status}
            </span>
          )}
          {totalStr && <span className="prod-quote-badge__total">{totalStr}</span>}
        </div>

        <div className="prod-thumbs-row">
          {displayItems.slice(0, 3).map((item, idx) => (
            <div key={idx} className="prod-thumb-wrap" title={`${item.name} × ${item.qty}`}>
              <ProductThumb url={item.image_url} name={item.name} />
              {item.qty > 1 && (
                <span className="prod-thumb-qty">×{item.qty}</span>
              )}
            </div>
          ))}
          {countExtra > 0 && (
            <div className="prod-thumb-more">+{countExtra}</div>
          )}
        </div>

        {!compact && displayItems.length > 0 && (
          <div className="prod-list">
            {displayItems.slice(0, 2).map((item, idx) => (
              <div key={idx} className="prod-item">
                <span className="qt">×{item.qty}</span>
                <div className="body">
                  <div className="n">{item.name || item.sku}</div>
                  {item.sku && <div className="s">{item.sku}</div>}
                </div>
                {item.unit_price_usd != null && (
                  <span className="pr">${fmtUsd(item.unit_price_usd)}</span>
                )}
              </div>
            ))}
          </div>
        )}
        {footerActions ? <ProductsCellFooter>{footerActions}</ProductsCellFooter> : null}
      </div>
    );
  }

  if (orderItems.length > 0) {
    return (
      <div className={`c-products c-products--v${compact ? " c-products--compact" : ""}`}>
        <div className="prod-list-v">
          {orderItems.map((item, idx) => (
            <div key={idx} className={`prod-item-v${idx === 0 ? " main" : ""}`}>
              <div className="prod-item-v__desc">{item.name || item.sku}</div>
              <div className="prod-item-v__meta">
                <span className="qt">×{item.qty}</span>
                {item.sku && item.sku !== item.name && (
                  <span className="s">{item.sku}</span>
                )}
                {item.unit_price_usd != null && (
                  <span className="pr">${fmtUsd(item.unit_price_usd)}</span>
                )}
              </div>
            </div>
          ))}
        </div>
        {!compact && (
          <div className="prod-thumbs-row prod-thumbs-row--below">
            {orderItems.slice(0, 3).map((item, idx) => (
              <div key={idx} className="prod-thumb-wrap" title={item.name}>
                <ProductThumb url={item.image_url} name={item.name} />
                {item.qty > 1 && <span className="prod-thumb-qty">×{item.qty}</span>}
              </div>
            ))}
          </div>
        )}
        {footerActions ? <ProductsCellFooter>{footerActions}</ProductsCellFooter> : null}
      </div>
    );
  }

  return (
    <div className={`c-products c-products--v${compact ? " c-products--compact" : ""}`}>
      <div className="prod-list-v">
        <div className="prod-item-v main">
          <div className="prod-item-v__desc" style={{ color: "var(--pd-text-faint)", fontStyle: "italic" }}>
            Ver detalle de orden
          </div>
          <div className="prod-item-v__meta">
            <span className="s">Click para expandir</span>
          </div>
        </div>
      </div>
      {footerActions ? <ProductsCellFooter>{footerActions}</ProductsCellFooter> : null}
    </div>
  );
}

// ─── Single row ───────────────────────────────────────────────────────────────

function isMercadoLibreSale(source: string): boolean {
  const s = String(source || "").toLowerCase();
  return s.includes("mercadolibre") || s.startsWith("ml_");
}

/** `feedback.sale`: calificación del vendedor hacia el comprador. */
function sellerFeedbackToClientLabel(raw: string | null | undefined): string {
  if (raw == null || String(raw).trim() === "") return "Pendiente";
  const s = String(raw).trim().toLowerCase();
  if (s === "pending") return "Pendiente";
  if (s === "positive") return "Positiva";
  if (s === "neutral") return "Neutra";
  if (s === "negative") return "Negativa";
  return String(raw).trim();
}

function isMlSellerFeedbackPending(sale: Sale): boolean {
  const fs = sale.ml_feedback_sale;
  if (fs == null || String(fs).trim() === "") return true;
  return String(fs).trim().toLowerCase() === "pending";
}

/** Bolívares de la fila para equivalentes USD (alineado a la columna Total). */
function getSaleBsForEquiv(sale: Sale): number {
  const isNativeVes = sale.rate_type === "NATIVE_VES";
  const fromBs = Number(sale.total_amount_bs) || 0;
  if (isNativeVes) {
    return fromBs || Number(sale.order_total_amount) || 0;
  }
  return fromBs;
}

function TotalUsdEquivLines({
  sale,
  bcvRate,
  binanceRate,
}: {
  sale: Sale;
  bcvRate: number | null;
  binanceRate: number | null;
}) {
  const bs = getSaleBsForEquiv(sale);
  if (!(bs > 0)) return null;
  const bcvR = bcvRate != null && bcvRate > 0 ? bcvRate : 0;
  const binR = binanceRate != null && binanceRate > 0 ? binanceRate : 0;
  if (bcvR <= 0 && binR <= 0) return null;
  const fmt = (n: number) =>
    n.toLocaleString("es-VE", { minimumFractionDigits: 2, maximumFractionDigits: 2 });
  return (
    <div className="total-equiv" aria-label="Equivalente en dólares según tasas BCV y Binance del día">
      {bcvR > 0 && (
        <div className="total-equiv__row total-equiv__row--bcv">
          ≈ {fmt(bs / bcvR)} USD <span className="total-equiv__tag">BCV</span>
        </div>
      )}
      {binR > 0 && (
        <div className="total-equiv__row total-equiv__row--bin">
          ≈ {fmt(bs / binR)} USD <span className="total-equiv__tag">Binance</span>
        </div>
      )}
    </div>
  );
}

interface RowProps {
  sale: Sale;
  selected: boolean;
  bcvRate: number | null;
  binanceRate: number | null;
  onRowClick: (id: string | number) => void;
  onRequestDispatch?: (sale: Sale) => void;
  onOpenMlMessaging?: (sale: Sale) => void;
  /** Misma cotización que bandeja (`chat_id` de la venta). */
  onOpenQuote?: (sale: Sale) => void;
  onReconcile?: (sale: Sale) => void;
  /** Modal: calificación del vendedor hacia el comprador (API ML). */
  onOpenMlSellerFeedback?: (sale: Sale) => void;
  onFulfillmentUpdated?: () => void | Promise<void>;
  onCustomerDirectoryChanged?: () => void | Promise<void>;
}

function OrdRow({
  sale,
  selected,
  bcvRate,
  binanceRate,
  onRowClick,
  onRequestDispatch,
  onOpenMlMessaging,
  onOpenQuote,
  onReconcile,
  onOpenMlSellerFeedback,
  onFulfillmentUpdated,
  onCustomerDirectoryChanged,
}: RowProps) {
  const custContact = usePedidosCustomerContact(sale, () => {
    const p = onCustomerDirectoryChanged?.();
    return p ?? Promise.resolve();
  });

  const ch = getChannel(sale.source);
  const isMl = isMercadoLibreSale(sale.source);
  const statusNorm = normalizeOrderStatusForCycle(sale.status);
  const cycle = getCycle(sale.status);
  const isClosed = [
    "completed",
    "delivered",
    "cancelled",
    "canceled",
    "refunded",
  ].includes(statusNorm);
  const isPaidForDispatch = statusNorm === "paid";
  const elapsed = fmtElapsed(sale.created_at);
  const bucket = elapsedBucket(sale.created_at, sale.status);

  // Vendor
  const vendor = sale.sold_by?.trim() ?? "";
  const vendorIni = vendor ? initials(vendor) : "—";
  const vendorAv = avColor(vendor || String(sale.id));

  // Customer
  const custLabel =
    sale.customer_name && sale.customer_name.trim() !== ""
      ? sale.customer_name.trim()
      : sale.customer_id != null
        ? `Cliente #${sale.customer_id}`
        : "Consumidor final";
  const custIni = (() => {
    if (sale.customer_name && sale.customer_name.trim() !== "") {
      const parts = sale.customer_name.trim().split(/\s+/);
      return parts.length >= 2
        ? (parts[0][0] + parts[1][0]).toUpperCase()
        : parts[0].slice(0, 2).toUpperCase();
    }
    return sale.customer_id != null ? `C${String(sale.customer_id).slice(-2)}` : "CF";
  })();
  const custAv = avColor(custLabel);

  // Totals — distinguir órdenes nativas VES (ML Venezuela) de órdenes en USD
  const isNativeVes = sale.rate_type === "NATIVE_VES";
  const vesAmt = isNativeVes
    ? (Number(sale.total_amount_bs) || Number(sale.order_total_amount) || 0)
    : (Number(sale.order_total_amount) > Number(sale.total_usd) * 5
        ? Number(sale.order_total_amount)
        : 0);
  const usd = isNativeVes ? 0 : (Number(sale.total_usd) || 0);
  const showVes = vesAmt > 0;

  const chatHref =
    sale.chat_id != null ? `/bandeja/${sale.chat_id}` : null;

  const mlVentasHref =
    isMl && sale.ml_api_order_id != null
      ? mlVentasOrderUrl(sale.ml_site_id ?? null, sale.ml_api_order_id)
      : null;
  const showMlSellerFeedbackRow =
    isMl && sale.ml_user_id != null && sale.ml_api_order_id != null;
  const canSubmitMlSellerFeedback =
    Boolean(onOpenMlSellerFeedback) &&
    !isClosed &&
    statusNorm !== "cancelled" &&
    isMlSellerFeedbackPending(sale);

  const hasCustomerPhone = Boolean(sale.customer_phones_line?.trim());
  const canOpenQuote =
    Boolean(onOpenQuote) &&
    (isMl ||
      (sale.chat_id != null && String(sale.chat_id).trim() !== ""));

  const canEditFulfillment = String(sale.id).toLowerCase().startsWith("so-");

  const handleRowKey = (e: KeyboardEvent) => {
    if (e.key === "Enter" || e.key === " ") {
      e.preventDefault();
      onRowClick(sale.id);
    }
  };

  return (
    <>
      {/* ── Desktop table row ─────────────────────────── */}
      <tr
        className={`ord-row${selected ? " selected" : ""}`}
        onClick={() => onRowClick(sale.id)}
        onKeyDown={handleRowKey}
        tabIndex={0}
        role="button"
        aria-label={`Abrir detalle de orden #${sale.id}`}
      >
        {/* Col 1 · Orden */}
        <td data-label="Orden">
          <div className="c-order c-order--compact">
            <div className="c-order-head">
              <div className={`origin-chip origin-chip--inline ${ch.key}`}>
                <span className="dt" />
                {ch.label}
              </div>
              <span className="ord-id">#{sale.id}</span>
            </div>
            <div className="c-order-meta">
              {sale.external_order_id ? (
                <span className="ord-ext">
                  <span className="lb">{ch.extPrefix} </span>
                  {sale.external_order_id}
                </span>
              ) : null}
              <span className="ord-date">
                <ClockIcon />
                {fmtDate(sale.created_at)}
              </span>
            </div>
            {isMl &&
            (sale.ml_account_nickname != null || sale.ml_user_id != null) ? (
              <div
                className="ord-ext ord-ml-seller"
                title={
                  sale.ml_user_id != null
                    ? `Cuenta ML (user_id): ${sale.ml_user_id}`
                    : undefined
                }
              >
                <span className="lb">Cuenta </span>
                {sale.ml_account_nickname ??
                  (sale.ml_user_id != null ? `#${sale.ml_user_id}` : "—")}
              </div>
            ) : null}
          </div>
        </td>

        {/* Col 2 · Productos */}
        <td data-label="Productos">
          <ProductsCell
            items={sale.items_preview}
            quotePreview={sale.quote_preview}
            footerActions={
              canOpenQuote ? (
                <button
                  type="button"
                  className="c-client-edit-btn"
                  aria-label={`Cotización orden #${sale.id}`}
                  title={
                    sale.chat_id != null && String(sale.chat_id).trim() !== ""
                      ? "Abrir cotización CRM (mismo presupuesto que en Bandeja)."
                      : "Mercado Libre: abrí la cotización. Si falta chat CRM, vinculá la conversación en Bandeja."
                  }
                  onClick={(e) => {
                    e.stopPropagation();
                    onOpenQuote!(sale);
                  }}
                >
                  <i className="ti ti-file-invoice" aria-hidden="true" />
                  Cotización
                </button>
              ) : null
            }
          />
        </td>

        {/* Col 3 · Cliente — tres líneas como Bandeja (nombre / teléfonos / ID MERCADOLIBRE) */}
        <td data-label="Cliente">
          <>
            <PedidosCustomerContactView
              variant="table"
              sale={sale}
              custLabel={custLabel}
              custIni={custIni}
              custAv={custAv}
              phonesBlock={custContact.phonesBlock}
            />
            <div
              className="pd-col-act-row pd-col-act-row--start"
              onClick={(e) => e.stopPropagation()}
              onMouseDown={(e) => e.stopPropagation()}
            >
              {isMl && onOpenMlMessaging ? (
                <button
                  type="button"
                  className="c-client-edit-btn c-ml-msg-btn"
                  aria-label={`Mensajería Mercado Libre orden #${sale.id}`}
                  title="Mensajería interna Mercado Libre (post-venta)"
                  onClick={(e) => {
                    e.stopPropagation();
                    onOpenMlMessaging(sale);
                  }}
                >
                  Mensajería
                </button>
              ) : null}
              {hasCustomerPhone ? (
                chatHref && !isClosed ? (
                  <Link
                    href={chatHref}
                    className="c-client-edit-btn"
                    aria-label={`Abrir cliente / chat de la orden #${sale.id}`}
                    onClick={(e) => e.stopPropagation()}
                  >
                    Cliente
                  </Link>
                ) : (
                  <button
                    type="button"
                    className="c-client-edit-btn"
                    disabled={isClosed || !chatHref}
                    aria-label={
                      !chatHref
                        ? "Sin conversación vinculada"
                        : "Cliente (orden cerrada)"
                    }
                    title={
                      !chatHref
                        ? "Agregá o vinculá un chat en Bandeja para abrir la conversación."
                        : undefined
                    }
                    onClick={(e) => e.stopPropagation()}
                  >
                    Cliente
                  </button>
                )
              ) : null}
            </div>
            {custContact.editModal}
          </>
        </td>

        {/* Col 4 · Logística — forma de entrega editable; almacén/stock pendiente backend */}
        <td data-label="Logística">
          <div className="c-logistics">
            <div className="logi-row logi-ft-row logi-ft-row--select-only">
              <LogisticsFulfillmentSelect
                saleId={sale.id}
                value={sale.fulfillment_type}
                disabled={!canEditFulfillment}
                onCommitted={async () => {
                  await onFulfillmentUpdated?.();
                }}
              />
            </div>
            <div
              className="logi-stock-dispatch-row"
              onClick={(e) => e.stopPropagation()}
              onMouseDown={(e) => e.stopPropagation()}
            >
              <span className="logi-stock ok">
                <span className="d" />
                Stock —
              </span>
              {onRequestDispatch && isPaidForDispatch ? (
                <button
                  type="button"
                  className="c-client-edit-btn logi-dispatch-inline"
                  aria-label={`Solicitar despacho orden #${sale.id}`}
                  title="Solicitar despacho"
                  onClick={(e) => {
                    e.stopPropagation();
                    onRequestDispatch(sale);
                  }}
                >
                  Solicitar despacho
                </button>
              ) : null}
            </div>
            {vendor && (
              <div className="vend-chip">
                <div
                  className="v-av"
                  style={{ background: vendorAv.bg, color: vendorAv.color }}
                  aria-hidden="true"
                >
                  {vendorIni}
                </div>
                <span className="vn">{vendor.split(" ")[0]}</span>
              </div>
            )}
          </div>
        </td>

        {/* Col 5 · Estado */}
        <td data-label="Estado">
          <div className="c-state">
            <span className={`status ${cycle.cls}`}>
              <span className="num">{cycle.num} </span>
              {cycle.label}
            </span>
            <span className="next-step">
              <span className="ar">→</span>
              {cycle.next}
            </span>
            <div className="state-row">
              <span className={`elapsed ${bucket}`}>
                <ClockIcon />
                {elapsed}
              </span>
              {sale.chat_id != null && (
                <span className="chat-chip">
                  <span className="dot-g" />
                  <ChatIcon />
                </span>
              )}
            </div>
            {showMlSellerFeedbackRow ? (
              <div
                className="ml-seller-fb-block"
                onClick={(e) => e.stopPropagation()}
                onMouseDown={(e) => e.stopPropagation()}
              >
                <div className="ml-seller-fb-line" title="Calificación del vendedor hacia el comprador en Mercado Libre">
                  <span className="ml-seller-fb-lb">Tu calif. al cliente</span>
                  <span className="ml-seller-fb-val">{sellerFeedbackToClientLabel(sale.ml_feedback_sale)}</span>
                </div>
                <div className="pd-col-act-row pd-col-act-row--start">
                  {canSubmitMlSellerFeedback ? (
                    <button
                      type="button"
                      className="c-client-edit-btn"
                      aria-label={`Calificar al comprador en Mercado Libre, orden ${sale.ml_api_order_id}`}
                      title="Enviar calificación positiva cumplida vía API de Mercado Libre"
                      onClick={(e) => {
                        e.stopPropagation();
                        onOpenMlSellerFeedback!(sale);
                      }}
                    >
                      <i className="ti ti-star" aria-hidden="true" />
                      Calificar en ML
                    </button>
                  ) : null}
                  {mlVentasHref ? (
                    <a
                      href={mlVentasHref}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="c-client-edit-btn"
                      style={{ textDecoration: "none" }}
                      title="Abrir la venta en el sitio de Mercado Libre"
                      onClick={(e) => e.stopPropagation()}
                    >
                      Sitio ML ↗
                    </a>
                  ) : null}
                </div>
              </div>
            ) : null}
          </div>
        </td>

        {/* Col 6 · Total */}
        <td data-label="Total" style={{ textAlign: "right" }}>
          <div className="c-total">
            {usd > 0 && (
              <div className="total-usd">
                <span className="c">USD</span>
                {usd.toLocaleString("es-VE", {
                  minimumFractionDigits: 2,
                  maximumFractionDigits: 2,
                })}
              </div>
            )}
            <div className="total-ves">
              <span className="c">{showVes ? "Bs." : "USD"}</span>
              {showVes
                ? vesAmt.toLocaleString("es-VE", {
                    minimumFractionDigits: 2,
                    maximumFractionDigits: 2,
                  })
                : usd > 0
                  ? usd.toLocaleString("es-VE", {
                      minimumFractionDigits: 2,
                      maximumFractionDigits: 2,
                    })
                  : "—"}
            </div>
            {/* TODO(backend): subtotal, IVA y margin_pct no disponibles en el listado */}
            <span className="margin-tag">
              <UpIcon />—
            </span>
            <TotalUsdEquivLines
              sale={sale}
              bcvRate={bcvRate}
              binanceRate={binanceRate}
            />
            <div
              className="pd-col-act-row"
              onClick={(e) => e.stopPropagation()}
              onMouseDown={(e) => e.stopPropagation()}
            >
              {onReconcile ? (
                <button
                  type="button"
                  className="c-client-edit-btn"
                  aria-label={`Vincular pago para orden #${sale.id}`}
                  title={
                    sale.reconciled_statement_id != null
                      ? "Pago ya conciliado. Vincular otro extracto."
                      : "Vincular pago bancario a esta orden"
                  }
                  onClick={(e) => {
                    e.stopPropagation();
                    onReconcile(sale);
                  }}
                >
                  <i className="ti ti-credit-card" aria-hidden="true" />
                  {sale.reconciled_statement_id != null
                    ? "Conciliado"
                    : "Vincular pago"}
                </button>
              ) : null}
            </div>
          </div>
        </td>
      </tr>

      {/* ── Mobile card row ───────────────────────────── */}
      <tr
        className="ord-card-row"
        aria-hidden="true"
        onClick={() => onRowClick(sale.id)}
      >
        <td className="ord-card" colSpan={6}>
          <div className="ord-card-inner">
            <div className="ord-card-header">
              <div className={`origin-chip origin-chip--inline ${ch.key}`}>
                <span className="dt" />
                {ch.label}
              </div>
              <span className="ord-card-id">#{sale.id}</span>
              <span className="ord-card-date">{fmtDate(sale.created_at)}</span>
              {isMl &&
                (sale.ml_account_nickname != null ||
                  sale.ml_user_id != null) && (
                <span
                  className="ord-card-ml-seller"
                  title={
                    sale.ml_user_id != null
                      ? `Cuenta ML (user_id): ${sale.ml_user_id}`
                      : undefined
                  }
                >
                  {sale.ml_account_nickname ??
                    (sale.ml_user_id != null ? `ML #${sale.ml_user_id}` : "")}
                </span>
              )}
            </div>

            <div className="ord-card-body">
              <ProductsCell
                items={sale.items_preview}
                quotePreview={sale.quote_preview}
                compact
                footerActions={
                  canOpenQuote ? (
                    <button
                      type="button"
                      className="c-client-edit-btn"
                      aria-label={`Cotización orden #${sale.id}`}
                      title={
                        sale.chat_id != null &&
                        String(sale.chat_id).trim() !== ""
                          ? "Cotización CRM (Bandeja)."
                          : "Cotización ML — vinculá el chat en Bandeja si falta."
                      }
                      onClick={(e) => {
                        e.stopPropagation();
                        onOpenQuote!(sale);
                      }}
                    >
                      <i className="ti ti-file-invoice" aria-hidden="true" />
                      Cotiz.
                    </button>
                  ) : null
                }
              />
              <PedidosCustomerContactView
                variant="card"
                sale={sale}
                custLabel={custLabel}
                custIni={custIni}
                custAv={custAv}
                phonesBlock={custContact.phonesBlock}
              />
              {(isMl && onOpenMlMessaging) || hasCustomerPhone ? (
                <div
                  className="pd-card-client-actions"
                  onClick={(e) => e.stopPropagation()}
                  onMouseDown={(e) => e.stopPropagation()}
                >
                  {isMl && onOpenMlMessaging ? (
                    <button
                      type="button"
                      className="c-client-edit-btn c-ml-msg-btn"
                      aria-label={`Mensajería Mercado Libre orden #${sale.id}`}
                      title="Mensajería interna Mercado Libre (post-venta)"
                      onClick={(e) => {
                        e.stopPropagation();
                        onOpenMlMessaging(sale);
                      }}
                    >
                      Mensajería
                    </button>
                  ) : null}
                  {hasCustomerPhone ? (
                    chatHref && !isClosed ? (
                      <Link
                        href={chatHref}
                        className="c-client-edit-btn"
                        aria-label={`Abrir cliente / chat de la orden #${sale.id}`}
                        onClick={(e) => e.stopPropagation()}
                      >
                        Cliente
                      </Link>
                    ) : (
                      <button
                        type="button"
                        className="c-client-edit-btn"
                        disabled={isClosed || !chatHref}
                        title={
                          !chatHref
                            ? "Agregá o vinculá un chat en Bandeja para abrir la conversación."
                            : undefined
                        }
                        onClick={(e) => e.stopPropagation()}
                      >
                        Cliente
                      </button>
                    )
                  ) : null}
                </div>
              ) : null}
            </div>

            <div className="ord-card-footer">
              <span className={`status ${cycle.cls}`}>
                <span className="num">{cycle.num} </span>
                {cycle.label}
              </span>
              <span className={`elapsed ${bucket}`}>
                <ClockIcon />
                {elapsed}
              </span>
              {showMlSellerFeedbackRow ? (
                <div
                  className="ml-seller-fb-block ml-seller-fb-block--card"
                  onClick={(e) => e.stopPropagation()}
                  onMouseDown={(e) => e.stopPropagation()}
                >
                  <span className="ml-seller-fb-lb">Tu calif. cliente:</span>{" "}
                  <span className="ml-seller-fb-val">{sellerFeedbackToClientLabel(sale.ml_feedback_sale)}</span>
                  {canSubmitMlSellerFeedback ? (
                    <button
                      type="button"
                      className="c-client-edit-btn"
                      aria-label="Calificar en Mercado Libre"
                      onClick={(e) => {
                        e.stopPropagation();
                        onOpenMlSellerFeedback!(sale);
                      }}
                    >
                      Calificar
                    </button>
                  ) : null}
                  {mlVentasHref ? (
                    <a
                      href={mlVentasHref}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="c-client-edit-btn"
                      style={{ textDecoration: "none" }}
                      onClick={(e) => e.stopPropagation()}
                    >
                      ML ↗
                    </a>
                  ) : null}
                </div>
              ) : null}
              {onReconcile ? (
                <button
                  type="button"
                  className="c-client-edit-btn"
                  aria-label={`Vincular pago orden #${sale.id}`}
                  title={
                    sale.reconciled_statement_id != null
                      ? "Pago ya conciliado."
                      : "Vincular pago bancario"
                  }
                  onClick={(e) => {
                    e.stopPropagation();
                    onReconcile(sale);
                  }}
                >
                  <i className="ti ti-credit-card" aria-hidden="true" />
                  {sale.reconciled_statement_id != null ? "Concil." : "Pago"}
                </button>
              ) : null}
              {onRequestDispatch && isPaidForDispatch ? (
                <button
                  type="button"
                  className="c-client-edit-btn"
                  aria-label={`Solicitar despacho orden #${sale.id}`}
                  title="Solicitar despacho"
                  onClick={(e) => {
                    e.stopPropagation();
                    onRequestDispatch(sale);
                  }}
                >
                  Despacho
                </button>
              ) : null}
              <div className="ord-card-total-stack">
                <span className="ord-card-ves">
                  {usd > 0
                    ? `$${usd.toLocaleString("es-VE", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`
                    : "—"}
                </span>
                <TotalUsdEquivLines
                  sale={sale}
                  bcvRate={bcvRate}
                  binanceRate={binanceRate}
                />
              </div>
            </div>
          </div>
        </td>
      </tr>
    </>
  );
}

// ─── Skeleton rows ─────────────────────────────────────────────────────────────

const SK_WIDTHS = [68, 82, 68, 72, 62, 88];

function SkeletonRow({ idx }: { idx: number }) {
  const offset = idx % 3;
  return (
    <tr className="ord-row" style={{ cursor: "default" }}>
      {SK_WIDTHS.map((w, i) => (
        <td key={i} style={{ padding: "20px 14px" }}>
          <span
            className="pd-skeleton"
            style={{ width: `${w - offset * 5}%`, height: 14 }}
          />
          {i < 4 && (
            <span
              className="pd-skeleton"
              style={{
                width: `${w - 20 - offset * 3}%`,
                height: 10,
                marginTop: 6,
                display: "block",
              }}
            />
          )}
        </td>
      ))}
    </tr>
  );
}

// ─── Main export ───────────────────────────────────────────────────────────────

interface OrdTableProps {
  sales: Sale[];
  loading: boolean;
  /** Tasas Bs/USD del día (misma fuente que el KPI ribbon). */
  bcvRate?: number | null;
  binanceRate?: number | null;
  onRowClick: (id: string | number) => void;
  selectedId: string | number | null;
  onRequestDispatch?: (sale: Sale) => void;
  /** Abre modal de mensajería pack ML (solo filas Mercado Libre). */
  onOpenMlMessaging?: (sale: Sale) => void;
  /** Abre modal de cotización reutilizando el chat CRM de la venta. */
  onOpenQuote?: (sale: Sale) => void;
  /** Abre modal de conciliación bancaria para la venta. */
  onReconcile?: (sale: Sale) => void;
  onOpenMlSellerFeedback?: (sale: Sale) => void;
  /** Tras PATCH de forma de entrega (refetch listado). */
  onFulfillmentUpdated?: () => void | Promise<void>;
  /** Tras guardar teléfono / fusionar chat (refetch listado). */
  onCustomerDirectoryChanged?: () => void | Promise<void>;
  onClearFilters: () => void;
}

export default function OrdTable({
  sales,
  loading,
  bcvRate = null,
  binanceRate = null,
  onRowClick,
  selectedId,
  onRequestDispatch,
  onOpenMlMessaging,
  onOpenQuote,
  onReconcile,
  onOpenMlSellerFeedback,
  onFulfillmentUpdated,
  onCustomerDirectoryChanged,
  onClearFilters,
}: OrdTableProps) {
  return (
    <table className="ord-table" role="grid">
      <thead>
        <tr>
          <th scope="col">
            Orden <span className="sort" aria-hidden="true">↕</span>
          </th>
          <th scope="col">Productos</th>
          <th scope="col">Cliente</th>
          <th scope="col">Logística</th>
          <th scope="col">
            Estado <span className="sort" aria-hidden="true">↕</span>
          </th>
          <th scope="col" className="right">
            Total <span className="sort" aria-hidden="true">↕</span>
          </th>
        </tr>
      </thead>
      <tbody>
        {loading ? (
          Array.from({ length: 7 }, (_, i) => <SkeletonRow key={i} idx={i} />)
        ) : sales.length === 0 ? (
          <tr className="ord-row" style={{ cursor: "default" }}>
            <td colSpan={6} style={{ padding: 0, border: "none" }}>
              <div className="pd-empty" role="status">
                <div className="pd-empty-icon" aria-hidden="true">
                  📋
                </div>
                <p className="pd-empty-msg">
                  No hay órdenes que coincidan con los filtros activos
                </p>
                <button
                  className="pd-empty-btn"
                  onClick={onClearFilters}
                  type="button"
                >
                  Limpiar filtros
                </button>
              </div>
            </td>
          </tr>
        ) : (
          sales.map((s) => (
            <OrdRow
              key={s.id}
              sale={s}
              selected={selectedId === s.id}
              bcvRate={bcvRate}
              binanceRate={binanceRate}
              onRowClick={onRowClick}
              onRequestDispatch={onRequestDispatch}
              onOpenMlMessaging={onOpenMlMessaging}
              onOpenQuote={onOpenQuote}
              onReconcile={onReconcile}
              onOpenMlSellerFeedback={onOpenMlSellerFeedback}
              onFulfillmentUpdated={onFulfillmentUpdated}
              onCustomerDirectoryChanged={onCustomerDirectoryChanged}
            />
          ))
        )}
      </tbody>
    </table>
  );
}
