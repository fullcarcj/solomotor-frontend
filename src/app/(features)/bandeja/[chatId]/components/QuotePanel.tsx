"use client";

/**
 * QuotePanel — Panel de cotización integrado en la franja operativa derecha.
 *
 * Diseño: Opción 1 "Stacked · flujo lineal compacto" del mockup
 * cotizacion-modal-2mockups.html, adaptado al ancho del panel (~280 px).
 *
 * Comportamiento:
 *  - Siempre visible en la pestaña Ficha 360° del ChatContextPanel.
 *  - Colapsado por defecto cuando no hay ítems.
 *  - Expandido automáticamente cuando hay ítems o cuando el prop forceOpen=true.
 *  - Cabecera colapsable: mismo layout que comprobantes (`operativeFranjaShared`).
 *  - Pre-llena el cliente desde el chat (no hay paso de búsqueda de cliente).
 *  - Búsqueda de productos con toggle SKU / Nombre y dropdown inline.
 *  - Moneda VES/USD: control segmentado con degradado; SKU/Nombre usa el mismo patrón visual.
 *  - Envío vía POST /api/ventas/cotizaciones.
 */

import Link from "next/link";
import { useCallback, useEffect, useRef, useState, type CSSProperties } from "react";
import type { Product } from "@/hooks/useProducts";
import {
  OP_FRANJA_SECTION,
  opFranjaHeader,
  opFranjaIconBox,
  OP_FRANJA_TITLE,
  OP_FRANJA_SUBTITLE,
  OpFranjaChevron,
  OpFranjaActionButton,
} from "@/app/(features)/bandeja/components/operativeFranjaShared";
import { useTodayRate } from "@/hooks/useTodayRate";
import { useCurrentUser } from "@/hooks/useCurrentUser";

// ── Tipos locales ────────────────────────────────────────────────────────────

interface QuoteLine {
  key: string;
  product: Product;
  cantidad: number;
  precio_unitario: number;
}

/** Fila de `GET /api/delivery/zones` (webhook-receiver). */
interface DeliveryZoneRow {
  id: number;
  zone_name: string;
  client_price_bs?: number | string;
  /** Precio en USD (zonas con currency_pago = 'USD'). */
  base_cost_usd?: number | string | null;
  /** Moneda base de la zona; 'USD' indica que el precio se recalcula con la tasa del día. */
  currency_pago?: string;
}

// ── Helpers ──────────────────────────────────────────────────────────────────

/**
 * Calcula el precio en Bs de una zona de delivery.
 * Zonas USD (currency_pago = 'USD'): multiplica base_cost_usd × tasa activa del día.
 * Zonas Bs: devuelve client_price_bs directamente.
 * Devuelve cadena vacía si no se puede calcular (sin tasa).
 */
function resolveZonePriceBs(zone: DeliveryZoneRow, activeRate: number | null): string {
  const isUsd = String(zone.currency_pago ?? "").toUpperCase() === "USD";
  if (isUsd) {
    const usd = Number(zone.base_cost_usd ?? 0);
    if (!Number.isFinite(usd) || usd <= 0 || !activeRate) return "";
    return String((usd * activeRate).toFixed(2));
  }
  const bs = zone.client_price_bs;
  if (bs == null || String(bs).trim() === "") return "";
  const n = Number(String(bs).replace(",", "."));
  return Number.isFinite(n) && n > 0 ? String(n) : "";
}

/** Texto que se muestra en el option del selector de zona. */
function zoneOptionLabel(zone: DeliveryZoneRow, activeRate: number | null): string {
  const isUsd = String(zone.currency_pago ?? "").toUpperCase() === "USD";
  if (isUsd) {
    const usd = Number(zone.base_cost_usd ?? 0);
    if (Number.isFinite(usd) && usd > 0) {
      const bsStr = activeRate
        ? ` · Bs ${(usd * activeRate).toLocaleString("es-VE", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`
        : "";
      return `${zone.zone_name} · $${usd.toFixed(2)}${bsStr}`;
    }
  }
  const bs = zone.client_price_bs;
  const bsNum = bs != null ? Number(String(bs).replace(",", ".")) : NaN;
  const bsLabel = Number.isFinite(bsNum) && bsNum > 0
    ? ` · Bs ${bsNum.toLocaleString("es-VE", { minimumFractionDigits: 2 })}`
    : "";
  return `${zone.zone_name}${bsLabel}`;
}

function parseProducts(json: unknown): Product[] {
  const o = json as Record<string, unknown> | null;
  if (!o) return [];
  const data = (o.data as Record<string, unknown>) ?? o;
  const raw = data.products;
  if (!Array.isArray(raw)) return [];
  return raw as Product[];
}

function fmtUSD(n: number) {
  return `$${n.toLocaleString("es-VE", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
}

/** Bolívares en cotización (detalle con centavos). */
function fmtVESQuote(n: number) {
  return `Bs ${n.toLocaleString("es-VE", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
}

/** Bs por tasa Binance: ROUND(usd × binance_bs_per_usd, 2) — mismo criterio que envío WhatsApp. */
function bsFromUsdBinance(usd: number, binanceBsPerUsd: number): number {
  if (!(binanceBsPerUsd > 0) || !Number.isFinite(usd)) return 0;
  return Math.round(usd * binanceBsPerUsd * 100) / 100;
}

/**
 * En vista VES: USD mostrado = coherente con ese Bs y la misma tasa (ROUND→inversa).
 * En vista USD no se usa (se muestra el monto USD de línea tal cual).
 */
function usdTieBreakFromBinanceBs(bs: number, binanceBsPerUsd: number): number {
  if (!(binanceBsPerUsd > 0)) return 0;
  return Math.round((bs / binanceBsPerUsd) * 100) / 100;
}

/**
 * Precio USD ajustado para modo VES:
 *   round(unit_price_usd × binance_rate / bcv_rate) − 0.04
 *
 * El cliente paga este valor en USD al tipo BCV, recibiendo
 * una cantidad en Bs equivalente al precio original en Binance.
 */
function vesAdjustedUsd(usd: number, binance: number, bcv: number): number {
  if (!(bcv > 0) || !(binance > 0)) return usd;
  return Math.round(usd * binance / bcv) - 0.04;
}

function stockLabel(qty: number): { text: string; cls: "ok" | "low" | "out" } {
  if (qty > 5) return { text: `Stk ${qty}`, cls: "ok" };
  if (qty > 0) return { text: `Stk ${qty}`, cls: "low" };
  return { text: "Sin stock", cls: "out" };
}

/**
 * Aviso flotante en el viewport: algunos entornos bloquean `window.alert`
 * (iframe, preview, políticas del navegador) y el clic parece “no hacer nada”.
 */
function toastStockNotice(msg: string) {
  if (typeof window === "undefined") return;
  const el = document.createElement("div");
  el.textContent = msg;
  Object.assign(el.style, {
    position: "fixed",
    bottom: "1.25rem",
    left: "50%",
    transform: "translateX(-50%)",
    maxWidth: "min(440px, 94vw)",
    background: "rgba(28,30,26,0.97)",
    color: "#f4f2ea",
    padding: "12px 16px",
    borderRadius: "10px",
    zIndex: "10050",
    fontSize: "12px",
    lineHeight: 1.45,
    whiteSpace: "pre-line",
    boxShadow: "0 10px 32px rgba(0,0,0,0.5)",
    border: "1px solid rgba(248,113,113,0.45)",
    pointerEvents: "none",
    fontFamily: "'JetBrains Mono', ui-monospace, monospace",
  });
  document.body.appendChild(el);
  setTimeout(() => el.remove(), 4500);
}

/** Límite de cantidad por línea = stock_qty del producto (snapshot en UI). */
function alertCantidadSuperaStock(p: Product, cantidadActual: number, cantidadSolicitada: number) {
  const max = Number(p.stock_qty);
  toastStockNotice(
    [
      "Cantidad solicitada > stock_qty — operación rechazada.",
      `sku: ${p.sku} · product_id: ${p.id} · tope: ${max} · actual: ${cantidadActual} · solicitado: ${cantidadSolicitada}`,
    ].join("\n")
  );
  window.alert(
    [
      "Restricción de inventario — la cantidad en línea no puede exceder stock_qty.",
      "",
      `product_id: ${p.id}`,
      `sku: ${p.sku}`,
      `stock_qty (tope): ${max}`,
      `cantidad en línea (actual): ${cantidadActual}`,
      `cantidad solicitada: ${cantidadSolicitada}`,
      "",
      "Invariante: cantidad ≤ stock_qty por ítem en inventario_detallepresupuesto.",
    ].join("\n")
  );
}

const THUMB_GRADS = [
  "linear-gradient(135deg,#3a4556,#1c222b)",
  "linear-gradient(135deg,#4a3a56,#221c2b)",
  "linear-gradient(135deg,#3a5656,#1c2b2b)",
  "linear-gradient(135deg,#56443a,#2b221c)",
];
function thumbGrad(idx: number) { return THUMB_GRADS[idx % THUMB_GRADS.length]; }

const ThumbBox = ({ idx, size = 38 }: { idx: number; size?: number }) => (
  <div style={{
    width: size, height: size, borderRadius: 7, flexShrink: 0,
    background: thumbGrad(idx),
    border: "1px solid rgba(255,255,255,0.04)",
    display: "flex", alignItems: "center", justifyContent: "center",
    color: "rgba(255,255,255,0.3)",
  }}>
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.5}
         style={{ width: "45%", height: "45%" }}>
      <rect x="3" y="8" width="18" height="12" rx="2" />
    </svg>
  </div>
);

// ── Estilos inline (tokens del sistema de diseño oscuro del ERP) ─────────────

const S = {
  /**
   * Columna del panel expandido: altura máxima; el scroll va solo en scrollBody
   * para que el footer (Guardar borrador / Enviar) quede siempre visible.
   */
  expandedWrap: {
    display: "flex",
    flexDirection: "column" as const,
    maxHeight: "min(62vh, 560px)",
    minHeight: 0,
    overflow: "hidden" as const,
    borderBottomLeftRadius: 10,
    borderBottomRightRadius: 10,
  },

  /** Solo esta zona hace scroll; evita que el footer quede fuera de la vista */
  scrollBody: {
    padding: "12px 14px",
    display: "flex",
    flexDirection: "column" as const,
    gap: 12,
    flex: "1 1 auto",
    minHeight: 0,
    overflowY: "auto" as const,
    overflowX: "hidden" as const,
    WebkitOverflowScrolling: "touch" as const,
  },

  secLabel: {
    fontFamily: "'JetBrains Mono', monospace",
    fontSize: 9,
    letterSpacing: "0.12em",
    color: "var(--mu-ink-mute, #8b949e)",
    textTransform: "uppercase" as const,
    fontWeight: 700,
    display: "flex",
    alignItems: "center",
    gap: 8,
    marginBottom: 6,
  },

  line: {
    flex: 1,
    height: 1,
    background: "var(--mu-border, rgba(255,255,255,0.08))",
  } as React.CSSProperties,

  searchWrap: {
    position: "relative" as const,
  },
  searchInput: {
    width: "100%",
    padding: "9px 10px 9px 34px",
    borderRadius: 8,
    background: "var(--mu-panel-3, #232a35)",
    border: "1px solid var(--mu-border, rgba(255,255,255,0.08))",
    color: "var(--mu-text, #e6edf3)",
    fontSize: 12,
    fontFamily: "inherit",
    outline: "none",
  } as React.CSSProperties,
  searchIcon: {
    position: "absolute" as const,
    left: 10,
    top: "50%",
    transform: "translateY(-50%)",
    color: "var(--mu-ink-mute, #6e7681)",
    pointerEvents: "none" as const,
    lineHeight: 0,
  },

  dropdown: {
    background: "var(--mu-panel-3, #232a35)",
    border: "1px solid var(--mu-border, rgba(255,255,255,0.08))",
    borderRadius: 8,
    overflowX: "hidden",
    overflowY: "auto",
    marginTop: 6,
    boxShadow: "0 10px 30px rgba(0,0,0,0.4)",
    maxHeight: 320,
  } as React.CSSProperties,

  resultRow: (highlighted: boolean) => ({
    display: "grid",
    gridTemplateColumns: "38px 1fr",
    gap: 8,
    padding: "8px 10px",
    cursor: "pointer",
    borderBottom: "1px solid var(--mu-border-soft, rgba(255,255,255,0.04))",
    background: highlighted ? "var(--mu-panel-4, #2a313c)" : "transparent",
    alignItems: "flex-start",
    transition: "background 0.1s",
    ...(highlighted ? { borderLeft: "2px solid #c5f24a", paddingLeft: 8 } : {}),
  }),

  stockBadge: (cls: "ok" | "low" | "out") =>
    ({
      fontFamily: "'JetBrains Mono', monospace",
      fontSize: 9,
      fontWeight: 700,
      padding: "2px 5px",
      borderRadius: 4,
      letterSpacing: "0.04em",
      whiteSpace: "nowrap" as const,
      ...(cls === "ok"
        ? { background: "rgba(52,211,153,0.1)", color: "#86efac", border: "1px solid rgba(52,211,153,0.25)" }
        : cls === "low"
        ? { background: "rgba(245,158,11,0.1)", color: "#fcd34d", border: "1px solid rgba(245,158,11,0.25)" }
        : { background: "rgba(239,68,68,0.1)", color: "#fca5a5", border: "1px solid rgba(239,68,68,0.25)" }),
    }),

  itemRow: {
    padding: "9px 10px",
    borderRadius: 8,
    background: "var(--mu-panel-2, #1c222b)",
    border: "1px solid var(--mu-border, rgba(255,255,255,0.08))",
    display: "grid",
    gridTemplateColumns: "36px minmax(0,1fr) auto auto auto",
    gap: 8,
    alignItems: "flex-start",
    transition: "border-color 0.1s",
  } as React.CSSProperties,

  qtyCtrl: {
    display: "inline-flex",
    alignItems: "center",
    background: "var(--mu-panel-4, #2a313c)",
    border: "1px solid var(--mu-border, rgba(255,255,255,0.08))",
    borderRadius: 6,
    overflow: "hidden",
  } as React.CSSProperties,

  qtyBtn: {
    width: 24,
    height: 26,
    background: "transparent",
    border: "none",
    color: "var(--mu-ink-mute, #8b949e)",
    cursor: "pointer",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    fontSize: 12,
  } as React.CSSProperties,

  qtyInput: {
    width: 30,
    background: "transparent",
    border: "none",
    outline: "none",
    fontFamily: "'JetBrains Mono', monospace",
    fontSize: 11,
    color: "var(--mu-text, #e6edf3)",
    fontWeight: 700,
    textAlign: "center" as const,
    padding: 0,
  } as React.CSSProperties,

  rmBtn: {
    width: 24,
    height: 24,
    borderRadius: 5,
    background: "transparent",
    border: "1px solid var(--mu-border, rgba(255,255,255,0.08))",
    color: "var(--mu-ink-mute, #8b949e)",
    cursor: "pointer",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    flexShrink: 0,
  } as React.CSSProperties,

  miniSummary: {
    padding: "9px 12px",
    borderRadius: 8,
    background: "var(--mu-panel-3, #232a35)",
    border: "1px solid var(--mu-border, rgba(255,255,255,0.08))",
  } as React.CSSProperties,

  summaryRow: {
    display: "flex",
    justifyContent: "space-between",
    fontFamily: "'JetBrains Mono', monospace",
    fontSize: 10,
    padding: "3px 0",
  } as React.CSSProperties,

  footer: {
    padding: "10px 14px",
    borderTop: "1px solid var(--mu-border, rgba(255,255,255,0.08))",
    background: "var(--mu-panel-3, #232a35)",
    display: "flex",
    alignItems: "center",
    gap: 8,
    flexShrink: 0,
    borderBottomLeftRadius: 10,
    borderBottomRightRadius: 10,
  } as React.CSSProperties,

  totalBlock: {
    flex: 1,
    minWidth: 0,
  } as React.CSSProperties,
};

/** Carril segmentado: opción izquierda activa → acento ámbar; derecha activa → acento azul. */
function segmentedTrack(leftActive: boolean): CSSProperties {
  return {
    display: "inline-flex",
    borderRadius: 9,
    padding: 2,
    background: leftActive ? "rgba(234,179,8,0.1)" : "rgba(56,189,248,0.1)",
    border: leftActive ? "1px solid rgba(250,204,21,0.4)" : "1px solid rgba(56,189,248,0.38)",
    boxShadow: leftActive
      ? "0 0 0 1px rgba(250,204,21,0.06) inset, 0 2px 8px rgba(234,179,8,0.12)"
      : "0 0 0 1px rgba(56,189,248,0.06) inset, 0 2px 8px rgba(14,165,233,0.12)",
  };
}

const segmentedBtnBase: CSSProperties = {
  border: "none",
  borderRadius: 7,
  padding: "6px 12px",
  fontFamily: "'JetBrains Mono', monospace",
  fontSize: 10,
  fontWeight: 800,
  letterSpacing: "0.06em",
  cursor: "pointer",
  transition: "background 0.15s, color 0.15s, box-shadow 0.15s",
};

function segmentedBtnAmberOn(): CSSProperties {
  return {
    ...segmentedBtnBase,
    background: "linear-gradient(180deg, #fbbf24 0%, #d97706 100%)",
    color: "#1a1408",
    boxShadow: "0 1px 0 rgba(255,255,255,0.25) inset",
  };
}

function segmentedBtnBlueOn(): CSSProperties {
  return {
    ...segmentedBtnBase,
    background: "linear-gradient(180deg, #38bdf8 0%, #0284c7 100%)",
    color: "#f0f9ff",
    boxShadow: "0 1px 0 rgba(255,255,255,0.2) inset",
  };
}

function segmentedBtnOff(): CSSProperties {
  return {
    ...segmentedBtnBase,
    background: "transparent",
    color: "var(--mu-ink-mute, #8b949e)",
  };
}

// ── SVG helpers ──────────────────────────────────────────────────────────────

const SvgSearch = () => (
  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} style={{ width: 13, height: 13 }}>
    <circle cx="11" cy="11" r="7" /><path d="m21 21-4.3-4.3" />
  </svg>
);

const SvgPlus = () => (
  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2.5} style={{ width: 11, height: 11 }}>
    <path d="M12 5v14M5 12h14" />
  </svg>
);

const SvgMinus = () => (
  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2.5} style={{ width: 11, height: 11 }}>
    <path d="M5 12h14" />
  </svg>
);

const SvgTrash = () => (
  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} style={{ width: 11, height: 11 }}>
    <path d="M3 6h18M8 6V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6" />
  </svg>
);

const SvgDoc = () => (
  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} style={{ width: 14, height: 14 }}>
    <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z" />
    <path d="M14 2v6h6M9 13h6M9 17h6" />
  </svg>
);

const SvgSend = () => (
  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2.5} style={{ width: 12, height: 12 }}>
    <path d="M22 2 11 13M22 2l-7 20-4-9-9-4 20-7z" />
  </svg>
);

const SvgSave = () => (
  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} style={{ width: 12, height: 12 }}>
    <path d="M19 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h11l5 5v11a2 2 0 0 1-2 2z" />
  </svg>
);

// ── Componente principal ─────────────────────────────────────────────────────

export interface QuotePanelProps {
  chatId: string;
  customerId: number | null;
  /**
   * Ancla la cotización a la transacción (sales_orders.id).
   * Permite encontrar la cotización cross-chat (preguntas ML, mensajería ML, WA).
   */
  salesOrderId?: number | null;
  /** TRUE cuando el usuario pulsa "Cotizar" en el panel de acciones */
  forceOpen?: boolean;
  /** Callback para que el padre sepa que ya consumió el forceOpen */
  onForceOpenConsumed?: () => void;
  /** Carga líneas de un borrador ya persistido (p. ej. «Llevar a cotización» desde orden ML). */
  bootstrapDraftQuotationId?: number | null;
  onBootstrapDraftConsumed?: () => void;
  /**
   * Resultado de `GET …/quotations/by-sales-order/:id` (items) ya obtenido por el padre.
   * Evita repetir `GET …/quotations/:chatId` al abrir cotización desde Ventas/Pedidos.
   */
  prefetchedInboxQuotationItems?: Array<Record<string, unknown>> | null;
  /** Callback tras crear la cotización con éxito */
  onSuccess?: () => void;
  /** Notifica al padre la cotización activa enviada (id + referencia + total USD) o null si no hay */
  onSentQuoteChange?: (q: { id: number; reference: string; totalUsd: number } | null) => void;
}

/** Línea persistida (GET presupuesto / panel solo lectura). */
interface ReadonlyQuoteLine {
  id: number;
  producto_id: number;
  sku: string | null;
  name: string | null;
  description: string | null;
  cantidad: number;
  precio_unitario: number;
  subtotal: number;
  stock_qty: number;
}

function normalizeReadonlyLine(r: Record<string, unknown>): ReadonlyQuoteLine {
  return {
    id: Number(r.id),
    producto_id: Number(r.producto_id),
    sku: r.sku != null ? String(r.sku) : null,
    name: r.name != null ? String(r.name) : null,
    description: r.description != null ? String(r.description) : null,
    cantidad: Number(r.cantidad),
    precio_unitario: Number(r.precio_unitario),
    subtotal: Number(r.subtotal),
    stock_qty: r.stock_qty != null ? Number(r.stock_qty) : 0,
  };
}

function readonlyRowToQuoteLine(row: ReadonlyQuoteLine, idx: number): QuoteLine {
  const p: Product = {
    id: row.producto_id,
    sku: row.sku ?? "",
    name: row.name ?? `(Producto #${row.producto_id})`,
    description: row.description,
    category: "",
    brand: "",
    unit_price_usd: row.precio_unitario,
    source: "presupuesto",
    is_active: true,
    stock_qty: row.stock_qty,
    stock_min: 0,
    stock_max: null,
    stock_alert: false,
    lead_time_days: 0,
    safety_factor: 1,
    supplier_id: null,
  };
  return {
    key: `edit-${row.id}-${idx}`,
    product: p,
    cantidad: row.cantidad,
    precio_unitario: row.precio_unitario,
  };
}

interface SentQuote {
  id: number;
  reference: string;
  status: "sent" | "approved" | "rejected";
  total: number;
  /** 2 = WhatsApp/Redes (CH-2). */
  channelId?: number;
  /** Hay al menos un comprobante matched (legacy) o imputación registrada. */
  paymentVerified?: boolean;
  /** Pago 100 % cerrado: suma cubre total y sin piernas USD pendientes. */
  paymentFullySettled?: boolean;
  /** Equivalente USD ya cubierto (suma de piernas aprobadas). */
  paymentCoveredUsdEq?: number;
  /** Hay piernas USD sin aprobar por caja. */
  paymentPendingUsdCaja?: boolean;
  /** Ya hay parte en Bs conciliada / imputada (base para complemento USD en caja). */
  hasBsReconciledBaseline?: boolean;
  linkedSalesOrderId?: number | null;
  /** ID de zona de delivery ya asociada (de la cabecera del presupuesto). */
  delivery_zone_id?: number | string | null;
}

/** Pierna de pago imputada a la cotización (del listado de imputaciones). */
interface PaymentAllocation {
  id: number;
  source_currency: "VES" | "USD";
  amount_original: number;
  amount_usd_equivalent: number;
  usd_caja_status: "pending" | "approved" | "rejected" | null;
  created_at: string;
}

function productStubFromPresupuestoLine(r: Record<string, unknown>): Product {
  const id = Number(r.producto_id);
  const pu = Number(r.precio_unitario);
  return {
    id: Number.isFinite(id) ? id : 0,
    sku: r.sku != null ? String(r.sku) : "",
    name: r.name != null ? String(r.name) : "Producto",
    description: r.description != null ? String(r.description) : null,
    category: "",
    brand: "",
    unit_price_usd: Number.isFinite(pu) ? pu : null,
    source: "presupuesto",
    is_active: true,
    stock_qty: r.stock_qty != null ? Number(r.stock_qty) : 0,
    stock_min: 0,
    stock_max: null,
    stock_alert: false,
    lead_time_days: 0,
    safety_factor: 1,
    supplier_id: null,
  };
}

export default function QuotePanel({
  chatId,
  customerId,
  salesOrderId,
  forceOpen,
  onForceOpenConsumed,
  bootstrapDraftQuotationId,
  onBootstrapDraftConsumed,
  prefetchedInboxQuotationItems,
  onSuccess,
  onSentQuoteChange,
}: QuotePanelProps) {
  const { user: currentUser } = useCurrentUser();
  const { rate } = useTodayRate();
  const activeRate =
    rate != null &&
    rate.active_rate !== "" &&
    rate.active_rate != null &&
    Number(rate.active_rate) > 0 &&
    Number.isFinite(Number(rate.active_rate))
      ? Number(rate.active_rate)
      : null;
  const binanceNum =
    rate != null &&
    rate.binance_rate !== "" &&
    rate.binance_rate != null &&
    Number(rate.binance_rate) > 0 &&
    Number.isFinite(Number(rate.binance_rate))
      ? Number(rate.binance_rate)
      : null;
  const bcvNum =
    rate != null &&
    rate.bcv_rate !== "" &&
    rate.bcv_rate != null &&
    Number(rate.bcv_rate) > 0 &&
    Number.isFinite(Number(rate.bcv_rate))
      ? Number(rate.bcv_rate)
      : null;
  const hasBinanceQuote = binanceNum != null && binanceNum > 0;

  /** En modal Pedidos (`forceOpen`) el panel debe abrirse ya expandido. */
  const [isOpen, setIsOpen]             = useState(() => Boolean(forceOpen));
  const [searchMode, setSearchMode]     = useState<"sku" | "name">("name");
  /** Vista de precios en el armado de la cotización: VES por defecto. */
  const [displayCurrency, setDisplayCurrency] = useState<"VES" | "USD">("VES");
  const [searchQuery, setSearchQuery]   = useState("");
  const [debSearch, setDebSearch]       = useState("");
  const [results, setResults]           = useState<Product[]>([]);
  const [searching, setSearching]       = useState(false);
  const [highlightIdx, setHighlightIdx] = useState(-1);
  const [lines, setLines]               = useState<QuoteLine[]>([]);
  const [submitting, setSubmitting]     = useState(false);
  const [error, setError]               = useState<string | null>(null);
  const [success, setSuccess]           = useState(false);
  /** Cotización ya enviada al cliente (muestra tarjeta + botones de aprobación) */
  const [sentQuote, setSentQuote]       = useState<SentQuote | null>(null);
  /** Presupuesto persistido como borrador (POST /api/ventas/cotizaciones o bootstrap) — permite add-delivery antes de enviar. */
  const [persistedDraftQuotationId, setPersistedDraftQuotationId] = useState<number | null>(null);
  /** Edición de ítems de la cotización ya enviada (PATCH presupuesto/items). */
  const [quoteEditing, setQuoteEditing] = useState(false);
  /** Pruebas / ajustes rápidos: solo SUPERUSER, con borrador o edición de ítems activa. */
  const canSuperuserEditUnitUsd =
    currentUser?.role === "SUPERUSER" && (!sentQuote || quoteEditing);
  const [readonlyQuoteLines, setReadonlyQuoteLines] = useState<ReadonlyQuoteLine[]>([]);
  const [loadingReadonlyDetail, setLoadingReadonlyDetail] = useState(false);
  const [savingQuoteEdit, setSavingQuoteEdit] = useState(false);
  const [creatingOrder, setCreatingOrder] = useState(false);
  const [orderCreatedId, setOrderCreatedId] = useState<number | null>(null);
  /** Carrera / delivery al crear orden CH-2 desde cotización (opcional). */
  const [deliveryZones, setDeliveryZones] = useState<DeliveryZoneRow[]>([]);
  const [deliveryZonesLoading, setDeliveryZonesLoading] = useState(false);
  const [deliveryZoneId, setDeliveryZoneId] = useState<string>("");
  const [deliveryCostBs, setDeliveryCostBs] = useState<string>("");
  /** Modal "Incluir delivery en cotización" */
  const [dlvModalOpen, setDlvModalOpen]       = useState(false);
  const [dlvZones, setDlvZones]               = useState<DeliveryZoneRow[]>([]);
  const [dlvZonesLoading, setDlvZonesLoading] = useState(false);
  const [dlvZoneId, setDlvZoneId]             = useState<string>("");
  const [dlvCustomBs, setDlvCustomBs]         = useState<string>("");
  const [dlvSubmitting, setDlvSubmitting]     = useState(false);
  const [dlvError, setDlvError]               = useState<string | null>(null);
  /** Piernas de pago de la cotización activa */
  const [allocations, setAllocations]   = useState<PaymentAllocation[]>([]);
  /** Formulario de imputación de pago */
  const [payForm, setPayForm]           = useState<{
    currency: "VES" | "USD";
    amount: string;
    attemptId: string;
    submitting: boolean;
    error: string | null;
  }>({ currency: "VES", amount: "", attemptId: "", submitting: false, error: null });
  /** Aprobación USD caja en progreso */
  const [approvingUsd, setApprovingUsd] = useState<number | null>(null);
  /** Complemento USD directo por caja (sin comprobante WA) */
  const [cajaUsdAmount, setCajaUsdAmount] = useState("");
  const [cajaUsdSubmitting, setCajaUsdSubmitting] = useState(false);
  const [cajaUsdError, setCajaUsdError] = useState<string | null>(null);
  const [cajaUsdOk, setCajaUsdOk] = useState<string | null>(null);
  const searchInputRef                  = useRef<HTMLInputElement>(null);
  const panelRef                        = useRef<HTMLDivElement>(null);
  /** Una sola vez por montaje cuando el padre ya trajo `by-sales-order`. */
  const inboxPrefetchConsumedRef        = useRef(false);

  useEffect(() => {
    inboxPrefetchConsumedRef.current = false;
  }, [chatId, salesOrderId, prefetchedInboxQuotationItems]);

  const loadActiveQuote = useCallback(async () => {
    // Necesitamos al menos un chatId o salesOrderId para buscar.
    if (!chatId && !(salesOrderId != null && salesOrderId > 0)) return;
    try {
      // Lookup primario: por chatId (directo + cross-chat vía sales_order en BD).
      let items: Array<Record<string, unknown>> = [];
      if (
        prefetchedInboxQuotationItems != null &&
        !inboxPrefetchConsumedRef.current
      ) {
        inboxPrefetchConsumedRef.current = true;
        items = prefetchedInboxQuotationItems;
      } else if (chatId && Number.isFinite(Number(chatId)) && Number(chatId) > 0) {
        const r = await fetch(`/api/inbox/quotations/${encodeURIComponent(chatId)}`, {
          credentials: "include",
          cache: "no-store",
        });
        const data = await r.json().catch(() => ({})) as Record<string, unknown>;
        items = (data.items ?? []) as Array<Record<string, unknown>>;
      }
      // Lookup secundario: por salesOrderId cuando chatId no devolvió resultados (cross-chat completo).
      if (!items.length && salesOrderId != null && salesOrderId > 0) {
        const r2 = await fetch(
          `/api/inbox/quotations/by-sales-order/${encodeURIComponent(String(salesOrderId))}`,
          { credentials: "include", cache: "no-store" }
        );
        const data2 = await r2.json().catch(() => ({})) as Record<string, unknown>;
        items = (data2.items ?? []) as Array<Record<string, unknown>>;
      }
      const active = items.find((q) =>
        ["sent", "approved", "rejected"].includes(String(q.status))
      );
      if (active) {
        const qid = Number(active.id);
        setSentQuote({
          id: qid,
          reference: String(active.reference ?? `COT-${active.id}`),
          status: String(active.status) as SentQuote["status"],
          total: Number(active.total ?? 0),
          channelId: active.channel_id != null ? Number(active.channel_id) : undefined,
          paymentVerified: Boolean(active.payment_verified),
          paymentFullySettled: Boolean(active.payment_fully_settled),
          paymentCoveredUsdEq: active.payment_covered_usd_eq != null
            ? Number(active.payment_covered_usd_eq)
            : undefined,
          paymentPendingUsdCaja: Boolean(active.payment_pending_usd_caja),
          hasBsReconciledBaseline: Boolean(active.payment_has_bs_baseline),
          linkedSalesOrderId:
            active.linked_sales_order_id != null && active.linked_sales_order_id !== ""
              ? Number(active.linked_sales_order_id)
              : null,
          delivery_zone_id:
            active.delivery_zone_id != null && active.delivery_zone_id !== ""
              ? Number(active.delivery_zone_id)
              : null,
        });
        setIsOpen(true);
        setPersistedDraftQuotationId(null);
        // Cargar piernas de pago de esta cotización
        try {
          const ar = await fetch(
            `/api/inbox/quotations/${encodeURIComponent(String(qid))}/allocations`,
            { credentials: "include", cache: "no-store" }
          );
          const adata = await ar.json().catch(() => ({})) as Record<string, unknown>;
          setAllocations((adata.items ?? []) as PaymentAllocation[]);
        } catch { setAllocations([]); }
      } else {
        setSentQuote(null);
        setAllocations([]);
      }
    } catch {/* ignore */}
  }, [chatId, salesOrderId, prefetchedInboxQuotationItems]);

  // Debounce
  useEffect(() => {
    const t = setTimeout(() => setDebSearch(searchQuery), 280);
    return () => clearTimeout(t);
  }, [searchQuery]);

  // Fetch resultados
  useEffect(() => {
    if (debSearch.trim().length < 2) { setResults([]); return; }
    let alive = true;
    setSearching(true);
    const params = new URLSearchParams({ search: debSearch.trim(), limit: "12", search_by: searchMode });
    fetch(`/api/inventario/productos?${params}`, { credentials: "include", cache: "no-store" })
      .then((r) => r.json().catch(() => ({})))
      .then((json) => {
        if (alive) {
          const sorted = parseProducts(json).sort((a, b) =>
            a.name.localeCompare(b.name, "es", { sensitivity: "base" })
          );
          setResults(sorted);
          setHighlightIdx(0);
        }
      })
      .catch(() => { if (alive) setResults([]); })
      .finally(() => { if (alive) setSearching(false); });
    return () => { alive = false; };
  }, [debSearch]);

  // Limpiar resultados cuando cambia modo
  useEffect(() => { setSearchQuery(""); setResults([]); }, [searchMode]);

  // Auto-abrir si tiene ítems o si el padre lo pide
  useEffect(() => {
    if (lines.length > 0 && !isOpen) setIsOpen(true);
  }, [lines.length]); // eslint-disable-line react-hooks/exhaustive-deps

  useEffect(() => {
    if (forceOpen && !isOpen) {
      setIsOpen(true);
      onForceOpenConsumed?.();
      setTimeout(() => {
        panelRef.current?.scrollIntoView({ behavior: "smooth", block: "start" });
        searchInputRef.current?.focus();
      }, 80);
    }
  }, [forceOpen]); // eslint-disable-line react-hooks/exhaustive-deps

  useEffect(() => {
    const qid = bootstrapDraftQuotationId;
    if (qid == null || !Number.isFinite(qid) || qid <= 0) return;
    let alive = true;
    void (async () => {
      try {
        const r = await fetch(
          `/api/inbox/quotations/presupuesto/${encodeURIComponent(String(qid))}`,
          { credentials: "include", cache: "no-store" }
        );
        const data = (await r.json().catch(() => ({}))) as Record<string, unknown>;
        if (!alive) return;
        if (!r.ok) {
          onBootstrapDraftConsumed?.();
          window.alert("No se pudo cargar el borrador de cotización en el panel.");
          return;
        }
        const pres = data.presupuesto as Record<string, unknown> | undefined;
        const chatTrim = String(chatId ?? "").trim();
        if (
          chatTrim !== "" &&
          pres?.chat_id != null &&
          Number(pres.chat_id) > 0 &&
          Number(pres.chat_id) !== Number(chatTrim)
        ) {
          onBootstrapDraftConsumed?.();
          return;
        }
        const rawLines = (data.lines ?? []) as Record<string, unknown>[];
        const st = String(pres?.status ?? "").toLowerCase();
        if (["sent", "approved", "rejected"].includes(st)) {
          // Cotización ya enviada: no reemplazar por editor de borrador (mantiene botón Incluir delivery, pagos, etc.)
          setReadonlyQuoteLines(rawLines.map(normalizeReadonlyLine));
          setSentQuote({
            id: Number(pres?.id ?? qid),
            reference: String(pres?.reference ?? `COT-${pres?.id ?? qid}`),
            status: st as SentQuote["status"],
            total: Number(pres?.total ?? 0),
            channelId: pres?.channel_id != null ? Number(pres.channel_id) : undefined,
            paymentVerified: false,
            paymentFullySettled: false,
            paymentCoveredUsdEq: undefined,
            paymentPendingUsdCaja: false,
            hasBsReconciledBaseline: false,
            linkedSalesOrderId:
              pres?.linked_sales_order_id != null && pres.linked_sales_order_id !== ""
                ? Number(pres.linked_sales_order_id)
                : null,
            delivery_zone_id:
              pres?.delivery_zone_id != null && pres.delivery_zone_id !== ""
                ? Number(pres.delivery_zone_id)
                : null,
          });
          setLines([]);
          setQuoteEditing(false);
          setPersistedDraftQuotationId(null);
          setIsOpen(true);
          setError(null);
          await loadActiveQuote();
        } else {
          const nextLines: QuoteLine[] = rawLines
            .map((row, idx) => ({
              key: `boot-${qid}-${row.id ?? idx}`,
              product: productStubFromPresupuestoLine(row),
              cantidad: Number(row.cantidad) > 0 ? Number(row.cantidad) : 1,
              precio_unitario: Number(row.precio_unitario) >= 0 ? Number(row.precio_unitario) : 0,
            }))
            .filter((L) => L.product.id > 0);
          setSentQuote(null);
          setReadonlyQuoteLines([]);
          setQuoteEditing(false);
          setLines(nextLines);
          setPersistedDraftQuotationId(qid);
          setIsOpen(true);
          setError(null);
        }
        setTimeout(() => {
          panelRef.current?.scrollIntoView({ behavior: "smooth", block: "start" });
        }, 80);
      } catch {
        /* ignore */
      } finally {
        if (alive) onBootstrapDraftConsumed?.();
      }
    })();
    return () => {
      alive = false;
    };
  }, [bootstrapDraftQuotationId, chatId, onBootstrapDraftConsumed, loadActiveQuote]);

  // Reset cuando cambia el chat (Pedidos abre el mismo panel con forceOpen → mantener expandido)
  useEffect(() => {
    setLines([]);
    setSearchQuery("");
    setResults([]);
    setError(null);
    setSuccess(false);
    setIsOpen(Boolean(forceOpen));
    setSentQuote(null);
    setQuoteEditing(false);
    setReadonlyQuoteLines([]);
    setLoadingReadonlyDetail(false);
    setSavingQuoteEdit(false);
    setDisplayCurrency("VES");
    setOrderCreatedId(null);
    setCreatingOrder(false);
    setAllocations([]);
    setPayForm({ currency: "VES", amount: "", attemptId: "", submitting: false, error: null });
    setApprovingUsd(null);
    setCajaUsdAmount("");
    setCajaUsdSubmitting(false);
    setCajaUsdError(null);
    setCajaUsdOk(null);
    setPersistedDraftQuotationId(null);
  }, [chatId, salesOrderId, forceOpen]); // eslint-disable-line react-hooks/exhaustive-deps

  // Notificar al padre la cotización activa
  useEffect(() => {
    onSentQuoteChange?.(
      sentQuote ? { id: sentQuote.id, reference: sentQuote.reference, totalUsd: sentQuote.total } : null
    );
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [sentQuote?.id, sentQuote?.reference, sentQuote?.total]);

  // Cargar cotización activa existente para este chat
  useEffect(() => {
    let alive = true;
    void loadActiveQuote().then(() => {
      if (!alive) return;
    });
    return () => { alive = false; };
  }, [loadActiveQuote]);

  // Polling: refrescar hasta que el pago esté completamente cerrado (CH-2)
  useEffect(() => {
    if (!sentQuote || sentQuote.channelId !== 2 || sentQuote.paymentFullySettled) return;
    const t = setInterval(() => { void loadActiveQuote(); }, 14000);
    return () => clearInterval(t);
  }, [sentQuote?.id, sentQuote?.channelId, sentQuote?.paymentFullySettled, loadActiveQuote]);

  // Detalle solo lectura de la cotización enviada (alineado a conciliación / BCV en totales)
  useEffect(() => {
    if (!sentQuote) {
      setReadonlyQuoteLines([]);
      return;
    }
    if (!isOpen || quoteEditing) return;
    let alive = true;
    setLoadingReadonlyDetail(true);
    void (async () => {
      try {
        const r = await fetch(
          `/api/inbox/quotations/presupuesto/${encodeURIComponent(String(sentQuote.id))}`,
          { credentials: "include", cache: "no-store" }
        );
        const data = await r.json().catch(() => ({})) as Record<string, unknown>;
        if (!alive) return;
        const raw = (data.lines ?? []) as Record<string, unknown>[];
        setReadonlyQuoteLines(raw.map(normalizeReadonlyLine));
      } catch {
        if (alive) setReadonlyQuoteLines([]);
      } finally {
        if (alive) setLoadingReadonlyDetail(false);
      }
    })();
    return () => { alive = false; };
  }, [isOpen, sentQuote?.id, quoteEditing]);

  useEffect(() => {
    if (quoteEditing) setIsOpen(true);
  }, [quoteEditing]);

  const vesMode = displayCurrency === "VES";
  /** true cuando tenemos ambas tasas y el switch está en VES → usamos el precio recalculado */
  const hasVesRecalc = vesMode && binanceNum != null && bcvNum != null;

  // Subtotales — sin IVA (despacho con nota de entrega)
  const subtotal = lines.reduce((s, l) => s + l.cantidad * l.precio_unitario, 0);
  /** Subtotal usando el precio VES ajustado (Binance/BCV) cuando aplica */
  const subtotalVes = hasVesRecalc
    ? lines.reduce((s, l) => s + l.cantidad * vesAdjustedUsd(l.precio_unitario, binanceNum!, bcvNum!), 0)
    : subtotal;
  const total = vesMode ? subtotalVes : subtotal;

  // Agregar producto
  const addProduct = useCallback((p: Product) => {
    if (p.stock_qty <= 0) {
      toastStockNotice(
        [
          "Uso de artículo sin stock — no se agrega a la cotización.",
          `sku: ${p.sku} · product_id: ${p.id} · stock_qty: ${p.stock_qty}`,
          "Condición: stock_qty > 0. Revise inventario o elija otro ítem.",
        ].join("\n")
      );
      window.alert(
        [
          "Uso de artículo sin stock — operación rechazada.",
          "No puede incorporarse a la cotización (presupuesto) un producto sin saldo disponible en inventario.",
          "",
          `product_id: ${p.id}`,
          `sku: ${p.sku}`,
          `stock_qty (disponible): ${p.stock_qty}`,
          "",
          "Condición: stock_qty > 0 para agregar línea en inventario_detallepresupuesto.",
          "Acción: cargue existencias (movimiento de stock, compra o liberación de reserva) y reintente.",
        ].join("\n")
      );
      return;
    }
    const precio = Number.isFinite(Number(p.unit_price_usd)) ? Number(p.unit_price_usd) : 0;
    const maxQty = Number(p.stock_qty);
    setLines((prev) => {
      const existing = prev.findIndex((l) => l.product.id === p.id);
      if (existing >= 0) {
        const cur = prev[existing];
        const next = cur.cantidad + 1;
        if (next > maxQty) {
          alertCantidadSuperaStock(p, cur.cantidad, next);
          return prev;
        }
        return prev.map((l, i) => (i === existing ? { ...l, cantidad: next } : l));
      }
      return [...prev, { key: `${p.id}-${Date.now()}`, product: p, cantidad: 1, precio_unitario: precio }];
    });
    setSearchQuery("");
    setResults([]);
    setHighlightIdx(-1);
    if (!isOpen) setIsOpen(true);
  }, [isOpen]);

  // Navegación por teclado en el dropdown
  const handleSearchKeyDown = (e: React.KeyboardEvent) => {
    if (!results.length) return;
    if (e.key === "ArrowDown") { e.preventDefault(); setHighlightIdx((i) => Math.min(i + 1, results.length - 1)); }
    if (e.key === "ArrowUp")   { e.preventDefault(); setHighlightIdx((i) => Math.max(i - 1, 0)); }
    if (e.key === "Enter") {
      e.preventDefault();
      const p = results[highlightIdx >= 0 ? highlightIdx : 0];
      if (p) addProduct(p);
    }
    if (e.key === "Escape") { setSearchQuery(""); setResults([]); }
  };

  // Enviar cotización
  // El backend siempre crea como 'draft'; si no es borrador se llama /send después para
  // enviar el mensaje WhatsApp al cliente y actualizar status → 'sent'.
  const submit = async (asDraft?: boolean) => {
    if (!customerId || lines.length === 0 || submitting) return;
    const chatIdNum =
      chatId != null && String(chatId).trim() !== "" && Number.isFinite(Number(chatId)) && Number(chatId) > 0
        ? Number(chatId)
        : null;
    const itemsPayload = lines.map((l) => ({
      producto_id: l.product.id,
      cantidad: l.cantidad,
      precio_unitario: hasVesRecalc
        ? vesAdjustedUsd(l.precio_unitario, binanceNum!, bcvNum!)
        : l.precio_unitario,
    }));
    /** Borrador ya persistido: actualizar líneas en el mismo presupuesto (evita duplicados y vaciado del formulario). */
    const patchExistingDraft =
      Boolean(asDraft) &&
      persistedDraftQuotationId != null &&
      Number.isFinite(Number(persistedDraftQuotationId)) &&
      Number(persistedDraftQuotationId) > 0 &&
      chatIdNum != null;

    setSubmitting(true);
    setError(null);
    const d = new Date();
    d.setTime(d.getTime() + 48 * 60 * 60 * 1000);
    try {
      if (patchExistingDraft) {
        const pid = Number(persistedDraftQuotationId);
        const patchRes = await fetch(
          `/api/inbox/quotations/presupuesto/${encodeURIComponent(String(pid))}/items`,
          {
            method: "PATCH",
            credentials: "include",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
              chat_id: chatIdNum,
              company_id: 1,
              items: itemsPayload,
            }),
            cache: "no-store",
          }
        );
        const pj = await patchRes.json().catch(() => ({})) as Record<string, unknown>;
        if (!patchRes.ok) {
          setError(String(pj.message ?? pj.error ?? "No se pudo guardar el borrador."));
          return;
        }
        setSuccess(true);
        setTimeout(() => { setSuccess(false); }, 1500);
        onSuccess?.();
        return;
      }

      const body = {
        cliente_id: customerId,
        chat_id: chatIdNum ?? undefined,
        items: itemsPayload,
        fecha_vencimiento: d.toISOString().slice(0, 10),
      };
      // 1. Crear la cotización (siempre queda en draft en el backend)
      const createRes = await fetch("/api/ventas/cotizaciones", {
        method: "POST",
        credentials: "include",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(body),
        cache: "no-store",
      });
      if (!createRes.ok) {
        const json = await createRes.json().catch(() => ({})) as Record<string, unknown>;
        setError(String(json.message ?? json.error ?? "No se pudo crear la cotización."));
        return;
      }
      const created = await createRes.json().catch(() => ({})) as Record<string, unknown>;
      const presupuesto = created.presupuesto as Record<string, unknown> | undefined;
      const rawId = presupuesto?.id ?? created.id;
      const newId = typeof rawId === "number" ? rawId : Number(rawId);

      // 2. Si no es borrador, enviar por WhatsApp al cliente
      if (!asDraft && Number.isFinite(newId) && newId > 0) {
        const sendRes = await fetch(`/api/inbox/quotations/${encodeURIComponent(String(newId))}/send`, {
          method: "POST",
          credentials: "include",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({}),
          cache: "no-store",
        });
        if (!sendRes.ok) {
          const json = await sendRes.json().catch(() => ({})) as Record<string, unknown>;
          const msg = String(json.message ?? json.error ?? "");
          let hint = "Cotización guardada pero no se pudo enviar al cliente.";
          if (msg.includes("wasender_throttled") || msg.includes("daily_cap")) {
            hint = "Cotización guardada. Wasender bloqueó el envío por límite diario o política; revisa WA_DAILY_CAP o intenta desde el chat.";
          } else if (msg.includes("quiet_hours")) {
            hint = "Cotización guardada. Envío bloqueado por horario silencioso (quiet hours).";
          } else if (msg.includes("wasender_not_configured")) {
            hint = "Wasender no está configurado en el servidor (WASENDER_API_KEY).";
          } else if (msg) {
            hint = msg;
          }
          setError(hint);
          return;
        }
      }

      if (!asDraft) {
        setLines([]);
        setSearchQuery("");
        setResults([]);
        const ref = String(
          (created.presupuesto as Record<string, unknown> | undefined)?.reference ??
          `COT-${newId}`
        );
        setSentQuote({ id: newId, reference: ref, status: "sent", total: vesMode ? subtotalVes : subtotal });
        setPersistedDraftQuotationId(null);
        setSuccess(false);
      } else {
        if (Number.isFinite(newId) && newId > 0) setPersistedDraftQuotationId(newId);
        setSuccess(true);
        setTimeout(() => { setSuccess(false); }, 1500);
      }
      onSuccess?.();
    } catch {
      setError(patchExistingDraft ? "Error de red al guardar el borrador." : "Error de red al crear la cotización.");
    } finally {
      setSubmitting(false);
    }
  };

  const cancelQuoteEdit = useCallback(() => {
    setQuoteEditing(false);
    setLines([]);
    setSearchQuery("");
    setResults([]);
    setError(null);
  }, []);

  const beginEditQuote = useCallback(async () => {
    if (!sentQuote || sentQuote.paymentFullySettled) return;
    let rows = readonlyQuoteLines;
    if (!rows.length) {
      try {
        const r = await fetch(
          `/api/inbox/quotations/presupuesto/${encodeURIComponent(String(sentQuote.id))}`,
          { credentials: "include", cache: "no-store" }
        );
        const data = await r.json().catch(() => ({})) as Record<string, unknown>;
        const raw = (data.lines ?? []) as Record<string, unknown>[];
        rows = raw.map(normalizeReadonlyLine);
        setReadonlyQuoteLines(rows);
      } catch {
        setError("No se pudieron cargar las líneas para editar.");
        return;
      }
    }
    if (!rows.length) {
      setError("La cotización no tiene líneas para editar.");
      return;
    }
    setDisplayCurrency("USD");
    setLines(rows.map((row, idx) => readonlyRowToQuoteLine(row, idx)));
    setQuoteEditing(true);
    setError(null);
  }, [sentQuote, readonlyQuoteLines]);

  const saveQuoteEdit = useCallback(async () => {
    if (!sentQuote || !chatId || lines.length === 0 || savingQuoteEdit) return;
    setSavingQuoteEdit(true);
    setError(null);
    const body = {
      chat_id: Number(chatId),
      company_id: 1,
      items: lines.map((l) => ({
        producto_id: l.product.id,
        cantidad: l.cantidad,
        precio_unitario: l.precio_unitario,
      })),
    };
    try {
      const res = await fetch(
        `/api/inbox/quotations/presupuesto/${encodeURIComponent(String(sentQuote.id))}/items`,
        {
          method: "PATCH",
          credentials: "include",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(body),
          cache: "no-store",
        }
      );
      const json = await res.json().catch(() => ({})) as Record<string, unknown>;
      if (!res.ok) {
        setError(String(json.message ?? json.error ?? "No se pudo guardar la cotización."));
        return;
      }
      const pres = json.presupuesto as Record<string, unknown> | undefined;
      const newTotal = pres?.total != null ? Number(pres.total) : NaN;
      setSentQuote((prev) =>
        prev && Number.isFinite(newTotal) ? { ...prev, total: newTotal } : prev
      );
      const rawLines = (json.lines ?? []) as Record<string, unknown>[];
      setReadonlyQuoteLines(rawLines.map(normalizeReadonlyLine));
      setQuoteEditing(false);
      setLines([]);
      setSearchQuery("");
      setResults([]);
      onSuccess?.();
      await loadActiveQuote();
    } catch {
      setError("Error de red al guardar la cotización.");
    } finally {
      setSavingQuoteEdit(false);
    }
  }, [sentQuote, chatId, lines, savingQuoteEdit, loadActiveQuote, onSuccess]);

  /** Imputar un comprobante a la cotización activa (VES o USD). */
  const submitPaymentAllocation = async () => {
    if (!sentQuote || payForm.submitting) return;
    const attemptId = payForm.attemptId.trim();
    if (!attemptId) {
      setPayForm((f) => ({ ...f, error: "Indicá el ID del comprobante a imputar." }));
      return;
    }
    const amt = parseFloat(payForm.amount.replace(",", "."));
    if (!Number.isFinite(amt) || amt <= 0) {
      setPayForm((f) => ({ ...f, error: "Indicá un monto válido (mayor a cero)." }));
      return;
    }
    setPayForm((f) => ({ ...f, submitting: true, error: null }));
    try {
      const body: Record<string, unknown> = {
        quotation_id: sentQuote.id,
        source_currency: payForm.currency,
      };
      if (payForm.currency === "VES") body.allocated_amount_bs = amt;
      else body.allocated_amount_usd = amt;
      const res = await fetch(
        `/api/inbox/payment-attempts/${encodeURIComponent(attemptId)}/link-quotation`,
        {
          method: "POST",
          credentials: "include",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(body),
          cache: "no-store",
        }
      );
      const json = await res.json().catch(() => ({})) as Record<string, unknown>;
      if (!res.ok) {
        setPayForm((f) => ({
          ...f,
          error: String(json.message ?? json.error ?? "No se pudo imputar el comprobante."),
        }));
        return;
      }
      setPayForm({ currency: "VES", amount: "", attemptId: "", submitting: false, error: null });
      await loadActiveQuote();
    } catch {
      setPayForm((f) => ({ ...f, error: "Error de red al imputar." }));
    } finally {
      setPayForm((f) => ({ ...f, submitting: false }));
    }
  };

  /** Aprobar pierna USD como caja (rol fiscal o crm:write). */
  const approveUsdAllocation = async (allocId: number) => {
    if (approvingUsd != null) return;
    setApprovingUsd(allocId);
    try {
      const res = await fetch(
        `/api/inbox/payment-allocations/${encodeURIComponent(String(allocId))}/approve-usd`,
        { method: "POST", credentials: "include", cache: "no-store" }
      );
      if (res.ok) await loadActiveQuote();
    } catch {/* ignore */}
    finally { setApprovingUsd(null); }
  };

  /** Caja: complemento en USD (efectivo/transferencia sin WA) ya aprobado — libera el cierre del pago. */
  const submitCajaUsdComplement = async () => {
    if (!sentQuote || cajaUsdSubmitting) return;
    const n = parseFloat(cajaUsdAmount.replace(",", "."));
    if (!Number.isFinite(n) || n <= 0) {
      setCajaUsdError("Indicá un monto en USD mayor a cero.");
      return;
    }
    setCajaUsdSubmitting(true);
    setCajaUsdError(null);
    setCajaUsdOk(null);
    try {
      const res = await fetch(
        `/api/inbox/quotations/${encodeURIComponent(String(sentQuote.id))}/caja-usd-complement`,
        {
          method: "POST",
          credentials: "include",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ amount_usd: n }),
          cache: "no-store",
        }
      );
      const json = (await res.json().catch(() => ({}))) as Record<string, unknown>;
      if (!res.ok) {
        setCajaUsdError(String(json.message ?? json.error ?? "No se pudo registrar el complemento."));
        return;
      }
      setCajaUsdAmount("");
      setCajaUsdOk(String(json.message ?? "Complemento USD registrado."));
      await loadActiveQuote();
    } catch {
      setCajaUsdError("Error de red al registrar el complemento.");
    } finally {
      setCajaUsdSubmitting(false);
    }
  };

  /** Orden ERP CH-2 desde cotización con pago totalmente cerrado. */
  const createOrderFromVerifiedQuote = async () => {
    if (!sentQuote || creatingOrder) return;
    if (sentQuote.channelId !== 2 || !sentQuote.paymentFullySettled || Boolean(sentQuote.linkedSalesOrderId)) return;
    setCreatingOrder(true);
    setError(null);
    try {
      const body: Record<string, unknown> = chatId ? { chat_id: Number(chatId) } : {};
      const zid = deliveryZoneId.trim() !== "" ? Number(deliveryZoneId) : NaN;
      if (Number.isFinite(zid) && zid > 0) {
        body.zone_id = zid;
        const cost = parseFloat(String(deliveryCostBs).replace(",", "."));
        if (Number.isFinite(cost) && cost > 0) {
          body.delivery_client_price_bs = cost;
        }
      }
      const res = await fetch(
        `/api/inbox/quotations/${encodeURIComponent(String(sentQuote.id))}/create-sales-order`,
        {
          method: "POST",
          credentials: "include",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(body),
          cache: "no-store",
        }
      );
      const json = (await res.json().catch(() => ({}))) as Record<string, unknown>;
      if (!res.ok) {
        setError(String(json.message ?? json.error ?? "No se pudo crear la orden."));
        return;
      }
      const oid = json.sales_order_id != null ? Number(json.sales_order_id) : NaN;
      if (Number.isFinite(oid)) setOrderCreatedId(oid);
      await loadActiveQuote();
      onSuccess?.();
    } catch {
      setError("Error de red al crear la orden.");
    } finally {
      setCreatingOrder(false);
    }
  };

  /** Abre el modal de delivery: carga zonas si hace falta, pre-carga zona ya guardada. */
  const openDeliveryModal = () => {
    setDlvError(null);
    setDlvSubmitting(false);
    setDlvModalOpen(true);

    const qTarget =
      sentQuote != null && Number(sentQuote.id) > 0
        ? Number(sentQuote.id)
        : persistedDraftQuotationId != null && Number(persistedDraftQuotationId) > 0
          ? Number(persistedDraftQuotationId)
          : null;

    const populateZone = async (zones: DeliveryZoneRow[]) => {
      let zoneId: number | null =
        sentQuote?.delivery_zone_id != null && String(sentQuote.delivery_zone_id).trim() !== ""
          ? Number(sentQuote.delivery_zone_id)
          : null;
      if (zoneId == null && qTarget != null) {
        try {
          const r = await fetch(
            `/api/inbox/quotations/presupuesto/${encodeURIComponent(String(qTarget))}`,
            { credentials: "include", cache: "no-store" }
          );
          const data = (await r.json().catch(() => ({}))) as Record<string, unknown>;
          const pres = data.presupuesto as Record<string, unknown> | undefined;
          if (pres?.delivery_zone_id != null && String(pres.delivery_zone_id).trim() !== "") {
            zoneId = Number(pres.delivery_zone_id);
          }
        } catch {
          /* ignore */
        }
      }
      if (zoneId != null && zoneId > 0) {
        const row = zones.find((z) => String(z.id) === String(zoneId));
        if (row) {
          setDlvZoneId(String(row.id));
          const preBs = resolveZonePriceBs(row, activeRate);
          if (preBs) setDlvCustomBs(preBs);
          return;
        }
      }
      const lineDlv = lines.find((l) => String(l.product?.sku ?? "") === "SVC-DELIVERY");
      if (
        lineDlv &&
        activeRate != null &&
        Number(activeRate) > 0 &&
        Number(lineDlv.precio_unitario) > 0
      ) {
        const bs = Number(lineDlv.precio_unitario) * Number(activeRate);
        if (Number.isFinite(bs) && bs > 0) setDlvCustomBs(bs.toFixed(2));
        setDlvZoneId("");
        return;
      }
      setDlvZoneId("");
      setDlvCustomBs("");
    };

    if (dlvZones.length > 0) {
      void populateZone(dlvZones);
      return;
    }
    setDlvZonesLoading(true);
    void fetch("/api/delivery/zones", { credentials: "include", cache: "no-store" })
      .then((r) => r.json())
      .then(async (j) => {
        const raw = (j as { data?: unknown }).data;
        const zones = Array.isArray(raw) ? (raw as DeliveryZoneRow[]) : [];
        setDlvZones(zones);
        await populateZone(zones);
      })
      .catch(() => setDlvZones([]))
      .finally(() => setDlvZonesLoading(false));
  };

  /** Envía POST /api/inbox/quotations/:id/add-delivery y recarga la cotización. */
  const confirmDelivery = async () => {
    const qid =
      sentQuote != null && Number(sentQuote.id) > 0
        ? Number(sentQuote.id)
        : persistedDraftQuotationId != null && Number(persistedDraftQuotationId) > 0
          ? Number(persistedDraftQuotationId)
          : null;
    if (qid == null || dlvSubmitting) return;
    const zid = Number(dlvZoneId);
    if (!Number.isFinite(zid) || zid <= 0) {
      setDlvError("Seleccioná una zona de delivery.");
      return;
    }
    setDlvSubmitting(true);
    setDlvError(null);
    try {
      const body: Record<string, unknown> = { zone_id: zid };
      const customBs = parseFloat(String(dlvCustomBs).replace(",", "."));
      if (Number.isFinite(customBs) && customBs > 0) body.delivery_client_price_bs = customBs;
      const res = await fetch(
        `/api/inbox/quotations/${encodeURIComponent(String(qid))}/add-delivery`,
        {
          method: "POST",
          credentials: "include",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(body),
          cache: "no-store",
        }
      );
      const json = (await res.json().catch(() => ({}))) as Record<string, unknown>;
      if (!res.ok) {
        setDlvError(String(json.message ?? json.error ?? "No se pudo agregar el delivery."));
        return;
      }
      setDlvModalOpen(false);
      setDlvZoneId("");
      setDlvCustomBs("");
      if (!sentQuote) {
        try {
          const r2 = await fetch(
            `/api/inbox/quotations/presupuesto/${encodeURIComponent(String(qid))}`,
            { credentials: "include", cache: "no-store" }
          );
          const data2 = (await r2.json().catch(() => ({}))) as Record<string, unknown>;
          const rawLines = (data2.lines ?? []) as Record<string, unknown>[];
          const nextLines: QuoteLine[] = rawLines
            .map((row, idx) => ({
              key: `boot-${qid}-${row.id ?? idx}`,
              product: productStubFromPresupuestoLine(row),
              cantidad: Number(row.cantidad) > 0 ? Number(row.cantidad) : 1,
              precio_unitario: Number(row.precio_unitario) >= 0 ? Number(row.precio_unitario) : 0,
            }))
            .filter((L) => L.product.id > 0);
          setLines(nextLines);
        } catch {
          /* ignore */
        }
      }
      await loadActiveQuote();
    } catch {
      setDlvError("Error de red al agregar el delivery.");
    } finally {
      setDlvSubmitting(false);
    }
  };

  const noCustomer = !customerId;

  const deliveryTargetQuotationId =
    sentQuote != null && Number(sentQuote.id) > 0
      ? Number(sentQuote.id)
      : persistedDraftQuotationId != null && Number(persistedDraftQuotationId) > 0
        ? Number(persistedDraftQuotationId)
        : null;
  /** Delivery forma parte del presupuesto: visible con borrador persistido o cotización enviada, sin orden ERP vinculada. */
  const showDeliveryCta =
    deliveryTargetQuotationId != null && !Boolean(sentQuote?.linkedSalesOrderId);

  const showPaymentGateway =
    Boolean(sentQuote) &&
    sentQuote!.channelId === 2 &&
    !sentQuote!.linkedSalesOrderId &&
    !quoteEditing;

  const showCreateOrderCta =
    Boolean(sentQuote) &&
    sentQuote!.channelId === 2 &&
    Boolean(sentQuote!.paymentFullySettled) &&
    !sentQuote!.linkedSalesOrderId &&
    !quoteEditing;

  useEffect(() => {
    if (!showCreateOrderCta) return;
    let alive = true;
    setDeliveryZonesLoading(true);
    void (async () => {
      try {
        const r = await fetch("/api/delivery/zones", {
          credentials: "include",
          cache: "no-store",
        });
        const j = (await r.json().catch(() => ({}))) as { data?: unknown };
        const raw = j.data;
        const rows = Array.isArray(raw) ? (raw as DeliveryZoneRow[]) : [];
        if (alive) setDeliveryZones(rows);
      } catch {
        if (alive) setDeliveryZones([]);
      } finally {
        if (alive) setDeliveryZonesLoading(false);
      }
    })();
    return () => {
      alive = false;
    };
  }, [showCreateOrderCta]);

  return (
    <>
    <div ref={panelRef} style={OP_FRANJA_SECTION}>

      {orderCreatedId != null && (
        <div
          style={{
            margin: "10px 12px 0",
            padding: "9px 12px",
            borderRadius: 8,
            background: "rgba(52,211,153,0.1)",
            border: "1px solid rgba(52,211,153,0.35)",
            fontSize: 11,
            color: "#86efac",
            display: "flex",
            alignItems: "center",
            justifyContent: "space-between",
            gap: 8,
            flexWrap: "wrap" as const,
          }}
        >
          <span>
            <i className="ti ti-receipt-2" style={{ marginRight: 6, verticalAlign: "middle" }} />
            Orden <strong style={{ fontFamily: "'JetBrains Mono', monospace" }}>#{orderCreatedId}</strong> creada
            (WhatsApp/Redes).
          </span>
          <Link
            href="/ventas/pedidos"
            className="mu-ficha-link"
            style={{ fontSize: 10, fontWeight: 700, whiteSpace: "nowrap" }}
          >
            Ver pedidos →
          </Link>
        </div>
      )}

      {/* ── Header toggle (mismo layout que PaymentLinkPanel / comprobantes) ─ */}
      <div
        style={opFranjaHeader(isOpen)}
        onClick={() => setIsOpen((v) => !v)}
        role="button"
        aria-expanded={isOpen}
        tabIndex={0}
        onKeyDown={(e) => { if (e.key === "Enter" || e.key === " ") setIsOpen((v) => !v); }}
      >
        <div style={opFranjaIconBox("lime")}><SvgDoc /></div>
        <div style={{ flex: 1, minWidth: 0 }}>
          <div style={{ display: "flex", alignItems: "center", gap: 6 }}>
            <span style={OP_FRANJA_TITLE}>
              Cotización
            </span>
            {lines.length > 0 && (
              <span style={{
                fontFamily: "'JetBrains Mono', monospace",
                fontSize: 9,
                fontWeight: 800,
                padding: "1px 6px",
                borderRadius: 4,
                background: quoteEditing ? "rgba(45,212,191,0.12)" : "rgba(197,242,74,0.12)",
                color: quoteEditing ? "#5eead4" : "#c5f24a",
                border: quoteEditing ? "1px solid rgba(45,212,191,0.35)" : "1px solid rgba(197,242,74,0.3)",
                letterSpacing: "0.04em",
              }}>
                {quoteEditing ? "Editando · " : ""}{lines.length} {lines.length === 1 ? "ítem" : "ítems"}
              </span>
            )}
          </div>
          {lines.length > 0 && (
            <div style={{ marginTop: 1 }}>
              {!vesMode ? (
                <div style={{
                  fontFamily: "'JetBrains Mono', monospace",
                  fontSize: 11,
                  color: "#c5f24a",
                  fontWeight: 800,
                }}>
                  {fmtUSD(total)}
                </div>
              ) : hasVesRecalc ? (
                <>
                  <div style={{
                    fontFamily: "'JetBrains Mono', monospace",
                    fontSize: 11,
                    color: "#c5f24a",
                    fontWeight: 800,
                    letterSpacing: "-0.02em",
                  }}>
                    {fmtUSD(total)}
                  </div>
                  <div style={{
                    fontFamily: "'JetBrains Mono', monospace",
                    fontSize: 8,
                    color: "#fbbf24",
                    fontWeight: 600,
                  }}>
                    {fmtVESQuote(total * bcvNum!)}
                  </div>
                </>
              ) : hasBinanceQuote ? (
                <>
                  <div style={{
                    fontFamily: "'JetBrains Mono', monospace",
                    fontSize: 11,
                    color: "#c5f24a",
                    fontWeight: 800,
                    letterSpacing: "-0.02em",
                  }}>
                    {fmtUSD(usdTieBreakFromBinanceBs(bsFromUsdBinance(total, binanceNum!), binanceNum!))}
                  </div>
                  <div style={{
                    fontFamily: "'JetBrains Mono', monospace",
                    fontSize: 8,
                    color: "#fbbf24",
                    fontWeight: 600,
                  }}>
                    {fmtVESQuote(bsFromUsdBinance(total, binanceNum!))}
                  </div>
                </>
              ) : (
                <div style={{
                  fontFamily: "'JetBrains Mono', monospace",
                  fontSize: 10,
                  color: "#c5f24a",
                  fontWeight: 700,
                }}>
                  {fmtUSD(total)}
                  <span style={{ display: "block", fontSize: 8, color: "#fca5a5", fontWeight: 600 }}>Sin tasa</span>
                </div>
              )}
            </div>
          )}
          {sentQuote && (
            <div style={{ fontFamily: "'JetBrains Mono', monospace", fontSize: 9, letterSpacing: "0.06em", marginTop: 1,
              color: sentQuote.status === "approved" ? "#86efac"
                   : sentQuote.status === "rejected" ? "#fca5a5"
                   : "#fcd34d" }}>
              {sentQuote.status === "approved" ? "✓ Aprobada"
               : sentQuote.status === "rejected" ? "✗ Rechazada"
               : "⏳ Enviada · esperando respuesta"}
            </div>
          )}
          {!sentQuote && lines.length === 0 && (
            <div
              aria-hidden={isOpen}
              style={{
                ...OP_FRANJA_SUBTITLE,
                minHeight: "1.35em",
                lineHeight: 1.35,
                visibility: isOpen ? "hidden" : "visible",
              }}
            >
              Sin ítems · click para abrir
            </div>
          )}
        </div>
        <div style={{ color: "var(--mu-ink-mute, #6e7681)" }}>
          <OpFranjaChevron open={isOpen} />
        </div>
      </div>

      {/* ── Tarjeta de cotización enviada + botones de aprobación ───── */}
      {isOpen && sentQuote && (
        <div style={{
          padding: "12px 14px",
          borderBottom:
            quoteEditing && lines.length > 0
              ? "1px solid var(--mu-border, rgba(255,255,255,0.08))"
              : undefined,
        }}>
          {/* Fila referencia + total (Bs con tasa activa BCV = misma base que conciliación / mensaje al cliente) */}
          <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 10, gap: 8 }}>
            <div style={{ minWidth: 0 }}>
              <div style={{ fontFamily: "'JetBrains Mono', monospace", fontSize: 10, fontWeight: 800, color: "#c5f24a", letterSpacing: "0.04em" }}>
                {sentQuote.reference}
              </div>
              <div style={{ fontFamily: "'JetBrains Mono', monospace", fontSize: 9, color: "var(--mu-ink-mute, #6e7681)", marginTop: 2, lineHeight: 1.35 }}>
                Total · {fmtUSD(sentQuote.total)}
                {activeRate != null
                  ? ` · ${fmtVESQuote(sentQuote.total * activeRate)} (BCV · tasa activa)`
                  : ""}
              </div>
            </div>
            <div style={{ display: "flex", flexDirection: "column" as const, alignItems: "flex-end", gap: 6, flexShrink: 0 }}>
              <OpFranjaActionButton
                type="button"
                variant="neutral"
                style={{ whiteSpace: "nowrap" }}
                onClick={() => {
                  setQuoteEditing(false);
                  setReadonlyQuoteLines([]);
                  setSentQuote(null);
                  setPersistedDraftQuotationId(null);
                  setLines([]);
                }}
                title="Crear una cotización nueva para este chat"
              >
                + Nueva
              </OpFranjaActionButton>
              <OpFranjaActionButton
                type="button"
                variant="accent"
                disabled={Boolean(sentQuote.paymentFullySettled)}
                title={sentQuote.paymentFullySettled ? "Pago cerrado: no se puede editar" : "Editar ítems y total"}
                onClick={() => void beginEditQuote()}
              >
                Editar
              </OpFranjaActionButton>
              {showDeliveryCta && (
                <OpFranjaActionButton
                  type="button"
                  variant="neutral"
                  style={{ whiteSpace: "nowrap", borderColor: "rgba(251,191,36,0.4)", color: "#fbbf24" }}
                  title={
                    readonlyQuoteLines.some((l) => String(l.sku ?? "") === "SVC-DELIVERY")
                      ? "Cambiar el monto de delivery incluido en la cotización"
                      : "Agregar delivery como línea a la cotización para que el total coincida con el pago del cliente"
                  }
                  onClick={openDeliveryModal}
                >
                  {readonlyQuoteLines.some((l) => String(l.sku ?? "") === "SVC-DELIVERY")
                    ? "Cambiar delivery"
                    : "Incluir delivery"}
                </OpFranjaActionButton>
              )}
            </div>
          </div>

          {/* Vista ítems enviada (solo lectura; tonos fríos distintos del armado editable) */}
          {!quoteEditing && (
            <div style={{
              marginBottom: 12,
              padding: "10px 10px",
              borderRadius: 9,
              background: "linear-gradient(160deg, rgba(15,118,110,0.12), rgba(30,41,59,0.55))",
              border: "1px solid rgba(45,212,191,0.22)",
            }}>
              <div style={{ fontFamily: "'JetBrains Mono', monospace", fontSize: 8, fontWeight: 800, letterSpacing: "0.14em", color: "#5eead4", marginBottom: 8, textTransform: "uppercase" as const }}>
                Cotización enviada · solo lectura
              </div>
              {loadingReadonlyDetail ? (
                <div style={{ fontSize: 10, color: "#94a3b8" }}>Cargando detalle…</div>
              ) : readonlyQuoteLines.length === 0 ? (
                <div style={{ fontSize: 10, color: "#94a3b8" }}>Sin líneas en detalle.</div>
              ) : (
                <div style={{ display: "flex", flexDirection: "column" as const, gap: 6 }}>
                  {readonlyQuoteLines.map((row) => {
                    const title = row.description?.trim() || row.name || `Producto #${row.producto_id}`;
                    const bsLine = activeRate != null ? row.subtotal * activeRate : null;
                    return (
                      <div
                        key={row.id}
                        style={{
                          display: "grid",
                          gridTemplateColumns: "1fr auto",
                          gap: "6px 10px",
                          padding: "8px 8px",
                          borderRadius: 7,
                          background: "rgba(15,23,42,0.45)",
                          border: "1px solid rgba(148,163,184,0.15)",
                        }}
                      >
                        <div style={{ minWidth: 0 }}>
                          <div style={{ fontSize: 10, fontWeight: 700, color: "#e2e8f0", lineHeight: 1.35, wordBreak: "break-word" as const }}>
                            {title}
                          </div>
                          <div style={{ fontFamily: "'JetBrains Mono', monospace", fontSize: 8, color: "#64748b", marginTop: 3 }}>
                            {row.sku ? `${row.sku} · ` : ""}×{row.cantidad} @ {fmtUSD(row.precio_unitario)}
                          </div>
                        </div>
                        <div style={{ textAlign: "right" as const, alignSelf: "center" }}>
                          <div style={{ fontFamily: "'JetBrains Mono', monospace", fontSize: 11, fontWeight: 800, color: "#99f6e4" }}>
                            {fmtUSD(row.subtotal)}
                          </div>
                          {bsLine != null && (
                            <div style={{ fontFamily: "'JetBrains Mono', monospace", fontSize: 8, fontWeight: 600, color: "#7dd3fc", marginTop: 2 }}>
                              {fmtVESQuote(bsLine)}
                            </div>
                          )}
                        </div>
                      </div>
                    );
                  })}
                  <div style={{
                    display: "flex",
                    justifyContent: "space-between",
                    marginTop: 4,
                    paddingTop: 8,
                    borderTop: "1px solid rgba(45,212,191,0.2)",
                    fontFamily: "'JetBrains Mono', monospace",
                    fontSize: 10,
                    fontWeight: 800,
                    color: "#ccfbf1",
                  }}>
                    <span>Total</span>
                    <span style={{ textAlign: "right" as const }}>
                      <span style={{ display: "block" }}>{fmtUSD(sentQuote.total)}</span>
                      {activeRate != null && (
                        <span style={{ display: "block", fontSize: 9, fontWeight: 700, color: "#7dd3fc", marginTop: 2 }}>
                          {fmtVESQuote(sentQuote.total * activeRate)}
                        </span>
                      )}
                    </span>
                  </div>
                </div>
              )}
            </div>
          )}

          {/* ── Módulo de pago bimoneda ──────────────────────────── */}
          {showPaymentGateway && (
            <div style={{
              marginTop: 12,
              paddingTop: 12,
              borderTop: "1px solid var(--mu-border, rgba(255,255,255,0.08))",
            }}>
              {/* Cabecera con estado de cobertura */}
              <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 8 }}>
                <div style={{ ...S.secLabel, marginBottom: 0 }}>
                  <span>Pago</span>
                  <div style={S.line} />
                </div>
                {sentQuote!.paymentFullySettled ? (
                  <span style={{ fontFamily: "'JetBrains Mono', monospace", fontSize: 9, fontWeight: 800, color: "#86efac", background: "rgba(52,211,153,0.12)", border: "1px solid rgba(52,211,153,0.35)", borderRadius: 5, padding: "2px 6px" }}>
                    CERRADO
                  </span>
                ) : sentQuote!.paymentPendingUsdCaja ? (
                  <span style={{ fontFamily: "'JetBrains Mono', monospace", fontSize: 9, fontWeight: 800, color: "#fcd34d", background: "rgba(245,158,11,0.1)", border: "1px solid rgba(245,158,11,0.35)", borderRadius: 5, padding: "2px 6px" }}>
                    USD · CAJA PENDIENTE
                  </span>
                ) : sentQuote!.hasBsReconciledBaseline && !sentQuote!.paymentFullySettled ? (
                  <span style={{ fontFamily: "'JetBrains Mono', monospace", fontSize: 9, fontWeight: 800, color: "#a5b4fc", background: "rgba(129,140,248,0.12)", border: "1px solid rgba(129,140,248,0.35)", borderRadius: 5, padding: "2px 6px" }}>
                    ESPERANDO USD (CAJA)
                  </span>
                ) : sentQuote!.paymentVerified ? (
                  <span style={{ fontFamily: "'JetBrains Mono', monospace", fontSize: 9, fontWeight: 800, color: "#93c5fd", background: "rgba(56,189,248,0.1)", border: "1px solid rgba(56,189,248,0.35)", borderRadius: 5, padding: "2px 6px" }}>
                    PARCIAL
                  </span>
                ) : (
                  <span style={{ fontFamily: "'JetBrains Mono', monospace", fontSize: 9, fontWeight: 700, color: "var(--mu-ink-mute,#8b949e)" }}>
                    SIN PAGO
                  </span>
                )}
              </div>

              {/* Barra de cobertura */}
              {sentQuote!.paymentVerified && sentQuote!.paymentCoveredUsdEq != null && sentQuote!.total > 0 && (
                <div style={{ marginBottom: 10 }}>
                  <div style={{ height: 5, borderRadius: 3, background: "rgba(255,255,255,0.06)", overflow: "hidden", marginBottom: 3 }}>
                    <div style={{
                      height: "100%",
                      borderRadius: 3,
                      background: sentQuote!.paymentFullySettled ? "#86efac" : sentQuote!.paymentPendingUsdCaja ? "#fcd34d" : "#93c5fd",
                      width: `${Math.min(100, (sentQuote!.paymentCoveredUsdEq / sentQuote!.total) * 100).toFixed(1)}%`,
                      transition: "width 0.4s",
                    }} />
                  </div>
                  <div style={{ fontFamily: "'JetBrains Mono', monospace", fontSize: 9, color: "var(--mu-ink-mute,#8b949e)" }}>
                    {fmtUSD(sentQuote!.paymentCoveredUsdEq)} cobrados de {fmtUSD(sentQuote!.total)}
                  </div>
                </div>
              )}

              {/* Complemento USD por caja (libera pago cuando suma con el Bs ya conciliado) */}
              {sentQuote!.channelId === 2 &&
                Boolean(sentQuote!.hasBsReconciledBaseline) &&
                !sentQuote!.paymentFullySettled &&
                !sentQuote!.paymentPendingUsdCaja &&
                !sentQuote!.linkedSalesOrderId && (
                <div style={{
                  marginBottom: 10,
                  padding: "10px 10px",
                  borderRadius: 8,
                  background: "linear-gradient(145deg, rgba(99,102,241,0.08), rgba(30,27,60,0.35))",
                  border: "1px solid rgba(129,140,248,0.35)",
                }}>
                  <div style={{ fontFamily: "'JetBrains Mono', monospace", fontSize: 9, fontWeight: 800, letterSpacing: "0.08em", color: "#a5b4fc", marginBottom: 6 }}>
                    CAJA · PAGO EN DÓLARES
                  </div>
                  <div style={{ fontSize: 10, color: "var(--mu-text,#e6edf3)", lineHeight: 1.4, marginBottom: 8 }}>
                    La parte en bolívares ya quedó conciliada. Ingresá el monto en dólares que completa el pago de esta cotización y pulsá{" "}
                    <strong>Asociar pago en dólares</strong>. Queda registrado y aprobado por caja de inmediato; se libera el cierre para el vendedor (crear orden y despacho).
                  </div>
                  <div style={{ display: "flex", flexDirection: "column" as const, gap: 8 }}>
                    <input
                      type="text"
                      inputMode="decimal"
                      placeholder="Monto en USD a asociar"
                      value={cajaUsdAmount}
                      onChange={(e) => { setCajaUsdAmount(e.target.value); setCajaUsdError(null); setCajaUsdOk(null); }}
                      style={{
                        width: "100%",
                        boxSizing: "border-box" as const,
                        padding: "8px 10px",
                        borderRadius: 7,
                        border: "1px solid rgba(129,140,248,0.35)",
                        background: "var(--mu-panel-2,#1c222b)",
                        color: "var(--mu-text,#e6edf3)",
                        fontFamily: "'JetBrains Mono', monospace",
                        fontSize: 11,
                        outline: "none",
                      }}
                    />
                    <OpFranjaActionButton
                      type="button"
                      variant="accent"
                      block
                      disabled={cajaUsdSubmitting}
                      loading={cajaUsdSubmitting}
                      loadingLabel="Asociando…"
                      onClick={() => void submitCajaUsdComplement()}
                    >
                      Asociar pago en dólares
                    </OpFranjaActionButton>
                  </div>
                  {cajaUsdError && (
                    <div style={{ marginTop: 6, fontSize: 10, color: "#fca5a5" }}>{cajaUsdError}</div>
                  )}
                  {cajaUsdOk && (
                    <div style={{ marginTop: 6, fontSize: 10, color: "#86efac" }}>{cajaUsdOk}</div>
                  )}
                </div>
              )}

              {/* Lista de piernas registradas */}
              {allocations.length > 0 && (
                <div style={{ marginBottom: 10, display: "flex", flexDirection: "column", gap: 4 }}>
                  {allocations.map((al) => (
                    <div key={al.id} style={{
                      display: "flex",
                      alignItems: "center",
                      justifyContent: "space-between",
                      padding: "6px 10px",
                      borderRadius: 7,
                      background: "var(--mu-panel-3,#232a35)",
                      border: "1px solid var(--mu-border,rgba(255,255,255,0.08))",
                      gap: 8,
                    }}>
                      <div style={{ display: "flex", alignItems: "center", gap: 6 }}>
                        <span style={{
                          fontFamily: "'JetBrains Mono', monospace",
                          fontSize: 9,
                          fontWeight: 800,
                          letterSpacing: "0.04em",
                          padding: "2px 5px",
                          borderRadius: 4,
                          ...(al.source_currency === "VES"
                            ? { color: "#fbbf24", background: "rgba(234,179,8,0.12)", border: "1px solid rgba(234,179,8,0.3)" }
                            : { color: "#93c5fd", background: "rgba(56,189,248,0.1)", border: "1px solid rgba(56,189,248,0.3)" }),
                        }}>
                          {al.source_currency}
                        </span>
                        <span style={{ fontFamily: "'JetBrains Mono', monospace", fontSize: 10, color: "var(--mu-text,#e6edf3)" }}>
                          {al.source_currency === "VES"
                            ? fmtVESQuote(Number(al.amount_original))
                            : fmtUSD(Number(al.amount_original))}
                        </span>
                        <span style={{ fontFamily: "'JetBrains Mono', monospace", fontSize: 9, color: "var(--mu-ink-mute,#8b949e)" }}>
                          ≈ {fmtUSD(Number(al.amount_usd_equivalent))}
                        </span>
                      </div>
                      {al.source_currency === "USD" && (
                        <div>
                          {al.usd_caja_status === "approved" ? (
                            <span style={{ fontFamily: "'JetBrains Mono', monospace", fontSize: 9, fontWeight: 800, color: "#86efac" }}>
                              ✓ CAJA
                            </span>
                          ) : al.usd_caja_status === "rejected" ? (
                            <span style={{ fontFamily: "'JetBrains Mono', monospace", fontSize: 9, fontWeight: 800, color: "#fca5a5" }}>
                              ✗ RECH.
                            </span>
                          ) : (
                            <OpFranjaActionButton
                              type="button"
                              variant="accent"
                              disabled={approvingUsd != null}
                              loading={approvingUsd === al.id}
                              loadingLabel="…"
                              onClick={() => void approveUsdAllocation(al.id)}
                              style={{ fontSize: 10, padding: "2px 8px" }}
                            >
                              Aprobar · Caja
                            </OpFranjaActionButton>
                          )}
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              )}

              {/* Formulario de imputación (solo si el pago no está cerrado) */}
              {!sentQuote!.paymentFullySettled && (
                <div style={{
                  padding: "10px 10px",
                  borderRadius: 8,
                  background: "var(--mu-panel-3,#232a35)",
                  border: "1px solid var(--mu-border,rgba(255,255,255,0.08))",
                  display: "flex",
                  flexDirection: "column",
                  gap: 8,
                }}>
                  {/* Toggle moneda */}
                  <div style={{ display: "flex", gap: 4 }}>
                    {(["VES", "USD"] as const).map((cur) => (
                      <OpFranjaActionButton
                        key={cur}
                        type="button"
                        variant="neutral"
                        active={payForm.currency === cur}
                        onClick={() => setPayForm((f) => ({ ...f, currency: cur, amount: "" }))}
                        style={{
                          flex: 1,
                          justifyContent: "center",
                          fontFamily: "'JetBrains Mono', monospace",
                          fontSize: 9,
                          fontWeight: 800,
                          letterSpacing: "0.06em",
                          padding: "4px 6px",
                        }}
                      >
                        {cur === "VES" ? "Bs (Pago Móvil)" : "USD (Transferencia)"}
                      </OpFranjaActionButton>
                    ))}
                  </div>

                  {/* Fila: ID comprobante + monto */}
                  <div style={{ display: "flex", gap: 6 }}>
                    <input
                      type="text"
                      placeholder="ID comprobante"
                      value={payForm.attemptId}
                      onChange={(e) => setPayForm((f) => ({ ...f, attemptId: e.target.value }))}
                      style={{
                        flex: "0 0 80px",
                        padding: "6px 8px",
                        borderRadius: 6,
                        border: "1px solid var(--mu-border,rgba(255,255,255,0.1))",
                        background: "var(--mu-panel-2,#1c222b)",
                        color: "var(--mu-text,#e6edf3)",
                        fontFamily: "'JetBrains Mono', monospace",
                        fontSize: 11,
                        outline: "none",
                        minWidth: 0,
                      }}
                    />
                    <input
                      type="text"
                      inputMode="decimal"
                      placeholder={payForm.currency === "VES" ? "Monto Bs" : "Monto USD"}
                      value={payForm.amount}
                      onChange={(e) => setPayForm((f) => ({ ...f, amount: e.target.value }))}
                      style={{
                        flex: 1,
                        padding: "6px 8px",
                        borderRadius: 6,
                        border: "1px solid var(--mu-border,rgba(255,255,255,0.1))",
                        background: "var(--mu-panel-2,#1c222b)",
                        color: "var(--mu-text,#e6edf3)",
                        fontFamily: "'JetBrains Mono', monospace",
                        fontSize: 11,
                        outline: "none",
                        minWidth: 0,
                      }}
                    />
                    <OpFranjaActionButton
                      type="button"
                      variant="accent"
                      disabled={payForm.submitting}
                      loading={payForm.submitting}
                      loadingLabel="…"
                      onClick={() => void submitPaymentAllocation()}
                      style={{
                        flexShrink: 0,
                        fontFamily: "'JetBrains Mono', monospace",
                        fontSize: 10,
                        fontWeight: 800,
                      }}
                    >
                      Imputar
                    </OpFranjaActionButton>
                  </div>

                  {payForm.currency === "USD" && (
                    <div style={{ fontSize: 9, color: "#fcd34d", lineHeight: 1.35 }}>
                      <i className="ti ti-info-circle" style={{ marginRight: 4 }} />
                      Las piernas en USD requieren aprobación de Caja antes de cerrar el pago.
                    </div>
                  )}

                  {payForm.error && (
                    <div style={{ fontSize: 10, color: "#fca5a5", padding: "4px 6px", borderRadius: 5, background: "rgba(239,68,68,0.08)", border: "1px solid rgba(239,68,68,0.2)" }}>
                      {payForm.error}
                    </div>
                  )}
                </div>
              )}
            </div>
          )}

          {showCreateOrderCta && (
            <div
              style={{
                marginTop: 12,
                paddingTop: 12,
                borderTop: "1px solid var(--mu-border, rgba(255,255,255,0.08))",
              }}
            >
              <div
                style={{
                  fontSize: 10,
                  color: "#86efac",
                  marginBottom: 8,
                  display: "flex",
                  alignItems: "flex-start",
                  gap: 6,
                  lineHeight: 1.35,
                }}
              >
                <i className="ti ti-photo-check" style={{ flexShrink: 0, marginTop: 1 }} />
                <span>
                  Pago totalmente cerrado. Puede generarse la{" "}
                  <strong>orden de compra</strong> (CH-2); el pedido continúa hacia <strong>despacho</strong> según el flujo de ventas.
                </span>
              </div>
              <div
                style={{
                  marginBottom: 10,
                  padding: "8px 10px",
                  borderRadius: 8,
                  background: "var(--mu-panel-2, rgba(255,255,255,0.04))",
                  border: "1px solid var(--mu-border, rgba(255,255,255,0.08))",
                }}
              >
                <div
                  style={{
                    fontSize: 9,
                    fontWeight: 700,
                    letterSpacing: "0.08em",
                    color: "var(--mu-ink-mute, #8b949e)",
                    marginBottom: 6,
                  }}
                >
                  CARRERA / DELIVERY (OPCIONAL)
                </div>
                <select
                  className="form-select form-select-sm"
                  value={deliveryZoneId}
                  disabled={creatingOrder || deliveryZonesLoading}
                  onChange={(e) => {
                    const v = e.target.value;
                    setDeliveryZoneId(v);
                    if (v) {
                      const row = deliveryZones.find((z) => String(z.id) === v);
                      const preBs = row ? resolveZonePriceBs(row, activeRate) : "";
                      if (preBs) setDeliveryCostBs(preBs);
                    } else {
                      setDeliveryCostBs("");
                    }
                  }}
                  style={{
                    width: "100%",
                    fontSize: 11,
                    marginBottom: 6,
                    background: "var(--mu-panel-3, #232a35)",
                    border: "1px solid var(--mu-border, rgba(255,255,255,0.1))",
                    color: "var(--mu-text, #e6edf3)",
                  }}
                >
                  <option value="">Sin carrera</option>
                  {deliveryZones.map((z) => (
                    <option key={z.id} value={String(z.id)}>
                      {zoneOptionLabel(z, activeRate)}
                    </option>
                  ))}
                </select>
                {deliveryZoneId !== "" && (
                  <div style={{ display: "flex", flexDirection: "column" as const, gap: 4 }}>
                    <label style={{ fontSize: 9, color: "var(--mu-ink-mute, #8b949e)" }}>
                      Costo carrera (Bs.) — editable
                    </label>
                    <input
                      type="text"
                      inputMode="decimal"
                      className="form-control form-control-sm"
                      value={deliveryCostBs}
                      disabled={creatingOrder}
                      onChange={(e) => setDeliveryCostBs(e.target.value)}
                      placeholder="Ej. 25,00"
                      style={{
                        fontFamily: "'JetBrains Mono', monospace",
                        fontSize: 11,
                        background: "var(--mu-panel-3, #232a35)",
                        border: "1px solid var(--mu-border, rgba(255,255,255,0.12))",
                        color: "var(--mu-text, #e6edf3)",
                      }}
                    />
                  </div>
                )}
                {deliveryZonesLoading && (
                  <div style={{ fontSize: 9, color: "var(--mu-ink-mute, #6e7681)", marginTop: 4 }}>
                    Cargando zonas…
                  </div>
                )}
              </div>
              <OpFranjaActionButton
                type="button"
                variant="accent"
                block
                disabled={creatingOrder}
                loading={creatingOrder}
                loadingLabel="Creando orden…"
                iconClass={creatingOrder ? undefined : "ti ti-shopping-cart-plus"}
                onClick={() => void createOrderFromVerifiedQuote()}
                style={{
                  fontFamily: "'JetBrains Mono', monospace",
                  fontSize: 10,
                  fontWeight: 800,
                  letterSpacing: "0.06em",
                  gap: 8,
                }}
              >
                Crear orden de compra · CH-2
              </OpFranjaActionButton>
            </div>
          )}
        </div>
      )}

      {/* ── Panel expandido (body + footer en un solo scroll) ───────── */}
      {isOpen && (!sentQuote || quoteEditing) && (
      <div style={S.expandedWrap}>
        <div style={S.scrollBody}>

          {/* Buscar productos — fila: MONEDA + switch (izq.) · Agregar productos + SKU/Nombre (der.) */}
          <div>
            <div
              style={{
                display: "flex",
                alignItems: "flex-end",
                justifyContent: "space-between",
                gap: 10,
                marginBottom: 8,
                flexWrap: "wrap" as const,
              }}
            >
              <div style={{ flexShrink: 0 }}>
                <div
                  style={{
                    fontFamily: "'JetBrains Mono', monospace",
                    fontSize: 8,
                    letterSpacing: "0.12em",
                    color: "var(--mu-ink-mute, #8b949e)",
                    textTransform: "uppercase" as const,
                    fontWeight: 800,
                    marginBottom: 5,
                  }}
                >
                  Moneda
                </div>
                <div role="group" aria-label="Moneda de visualización de precios" style={segmentedTrack(displayCurrency === "VES")}>
                  <button
                    type="button"
                    onClick={(e) => {
                      e.stopPropagation();
                      setDisplayCurrency("VES");
                    }}
                    style={displayCurrency === "VES" ? segmentedBtnAmberOn() : segmentedBtnOff()}
                  >
                    VES
                  </button>
                  <button
                    type="button"
                    onClick={(e) => {
                      e.stopPropagation();
                      setDisplayCurrency("USD");
                    }}
                    style={displayCurrency === "USD" ? segmentedBtnBlueOn() : segmentedBtnOff()}
                  >
                    USD
                  </button>
                </div>
              </div>

              <div style={{ flex: 1, minWidth: 0, display: "flex", flexDirection: "column", alignItems: "flex-end" }}>
                <div
                  style={{
                    display: "flex",
                    alignItems: "center",
                    gap: 8,
                    flexWrap: "wrap" as const,
                    justifyContent: "flex-end",
                    marginBottom: 5,
                  }}
                >
                  <span
                    style={{
                      fontFamily: "'JetBrains Mono', monospace",
                      fontSize: 8,
                      letterSpacing: "0.12em",
                      color: "var(--mu-ink-mute, #8b949e)",
                      textTransform: "uppercase" as const,
                      fontWeight: 800,
                    }}
                  >
                    Agregar productos
                  </span>
                  <div role="group" aria-label="Modo de búsqueda de producto" style={segmentedTrack(searchMode === "sku")}>
                    <button
                      type="button"
                      onClick={(e) => {
                        e.stopPropagation();
                        setSearchMode("sku");
                      }}
                      style={searchMode === "sku" ? segmentedBtnAmberOn() : segmentedBtnOff()}
                    >
                      SKU
                    </button>
                    <button
                      type="button"
                      onClick={(e) => {
                        e.stopPropagation();
                        setSearchMode("name");
                      }}
                      style={searchMode === "name" ? segmentedBtnBlueOn() : segmentedBtnOff()}
                    >
                      Nombre
                    </button>
                  </div>
                </div>
                <div style={{ ...S.line, width: "100%", maxWidth: 220 }} />
              </div>
            </div>

            <div style={S.searchWrap}>
              <div style={S.searchIcon}><SvgSearch /></div>
              <input
                ref={searchInputRef}
                type="text"
                style={S.searchInput}
                placeholder={searchMode === "sku" ? "Código SKU…" : "Nombre del producto…"}
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                onKeyDown={handleSearchKeyDown}
                autoComplete="off"
                disabled={noCustomer}
              />
            </div>

            {/* Dropdown */}
            {(results.length > 0 || searching) && (
              <div style={S.dropdown}>
                {searching && (
                  <div style={{ padding: "7px 10px", fontFamily: "'JetBrains Mono', monospace", fontSize: 9, color: "var(--mu-ink-mute, #6e7681)", letterSpacing: "0.1em" }}>
                    Buscando…
                  </div>
                )}
                {results.map((p, i) => {
                  const st = stockLabel(p.stock_qty);
                  const price = Number(p.unit_price_usd) || 0;
                  const desc = (p.description && p.description.trim()) ? p.description.trim() : p.name;
                  const sinStock = p.stock_qty <= 0;
                  const rowBase = S.resultRow(i === highlightIdx);
                  return (
                    <div
                      key={p.id}
                      style={{
                        ...rowBase,
                        ...(sinStock
                          ? {
                            opacity: 0.55,
                            cursor: "not-allowed",
                            filter: "grayscale(0.35)",
                          }
                          : {}),
                      }}
                      onMouseEnter={() => setHighlightIdx(i)}
                      onClick={() => addProduct(p)}
                    >
                      <ThumbBox idx={i} size={38} />
                      <div style={{ minWidth: 0, flex: 1 }}>
                        {/* Línea 1: descripción completa */}
                        <div style={{ fontSize: 11, fontWeight: 600, color: "var(--mu-text, #e6edf3)", lineHeight: 1.35, whiteSpace: "normal", wordBreak: "break-word" }}>
                          {desc}
                        </div>
                        {/* Línea 2: brand · stock · precios */}
                        <div style={{ display: "flex", gap: 5, alignItems: "center", marginTop: 4, flexWrap: "wrap" as const }}>
                          {p.brand && (
                            <span style={{ fontFamily: "'JetBrains Mono', monospace", fontSize: 8, color: "var(--mu-ink-mute, #8b949e)", letterSpacing: "0.06em", textTransform: "uppercase" as const, fontWeight: 700 }}>
                              {p.brand}
                            </span>
                          )}
                          <span style={S.stockBadge(st.cls)}>{st.text}</span>
                          <span style={{ marginLeft: "auto", display: "flex", flexDirection: "column" as const, alignItems: "flex-end", gap: 2, flexShrink: 0 }}>
                            {!vesMode ? (
                              <span style={{ fontFamily: "'JetBrains Mono', monospace", fontSize: 13, fontWeight: 800, color: "#c5f24a", letterSpacing: "-0.01em", whiteSpace: "nowrap" as const }}>
                                {fmtUSD(price)}
                              </span>
                            ) : hasVesRecalc ? (
                              <>
                                <span style={{ fontFamily: "'JetBrains Mono', monospace", fontSize: 13, fontWeight: 800, color: "#c5f24a", letterSpacing: "-0.01em", whiteSpace: "nowrap" as const }}>
                                  {fmtUSD(vesAdjustedUsd(price, binanceNum!, bcvNum!))}
                                </span>
                                <span style={{ fontFamily: "'JetBrains Mono', monospace", fontSize: 9, fontWeight: 600, color: "#fbbf24", whiteSpace: "nowrap" as const }}>
                                  {fmtVESQuote(vesAdjustedUsd(price, binanceNum!, bcvNum!) * bcvNum!)}
                                </span>
                              </>
                            ) : hasBinanceQuote ? (
                              <>
                                <span style={{ fontFamily: "'JetBrains Mono', monospace", fontSize: 13, fontWeight: 800, color: "#c5f24a", letterSpacing: "-0.01em", whiteSpace: "nowrap" as const }}>
                                  {fmtUSD(usdTieBreakFromBinanceBs(bsFromUsdBinance(price, binanceNum!), binanceNum!))}
                                </span>
                                <span style={{ fontFamily: "'JetBrains Mono', monospace", fontSize: 9, fontWeight: 600, color: "#fbbf24", whiteSpace: "nowrap" as const }}>
                                  {fmtVESQuote(bsFromUsdBinance(price, binanceNum!))}
                                </span>
                              </>
                            ) : (
                              <>
                                <span style={{ fontFamily: "'JetBrains Mono', monospace", fontSize: 13, fontWeight: 800, color: "#c5f24a", whiteSpace: "nowrap" as const }}>
                                  {fmtUSD(price)}
                                </span>
                                <span style={{ fontFamily: "'JetBrains Mono', monospace", fontSize: 8, fontWeight: 600, color: "#fca5a5" }}>Sin tasa</span>
                              </>
                            )}
                          </span>
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>

          {/* Lista de ítems */}
          <div>
            <div style={S.secLabel}>
              <span>Ítems en cotización</span>
              {lines.length > 0 && (
                <span style={{
                  fontFamily: "'JetBrains Mono', monospace",
                  fontSize: 9,
                  padding: "1px 5px",
                  borderRadius: 4,
                  background: "var(--mu-panel-4, #2a313c)",
                  color: "var(--mu-ink-mute, #8b949e)",
                }}>
                  {lines.length}
                </span>
              )}
              <div style={S.line} />
            </div>

            {lines.length === 0 ? (
              <div style={{
                padding: "18px 12px",
                textAlign: "center",
                background: "var(--mu-panel-3, #232a35)",
                border: "1px dashed var(--mu-border, rgba(255,255,255,0.08))",
                borderRadius: 8,
              }}>
                <i className="ti ti-package" style={{ fontSize: 18, color: "var(--mu-ink-mute, #6e7681)", display: "block", marginBottom: 4 }} />
                <div style={{ fontSize: 11, color: "var(--mu-text, #e6edf3)", fontWeight: 700, marginBottom: 2 }}>Sin ítems aún</div>
                <div style={{ fontSize: 10, color: "var(--mu-ink-mute, #8b949e)" }}>Buscá un producto arriba</div>
              </div>
            ) : (
              <div style={{ display: "flex", flexDirection: "column", gap: 6 }}>
                  {lines.map((l, idx) => {
                  const lineTotal = l.cantidad * l.precio_unitario;
                  const lineTotalVes = hasVesRecalc
                    ? l.cantidad * vesAdjustedUsd(l.precio_unitario, binanceNum!, bcvNum!)
                    : lineTotal;
                  const lineDisplay = vesMode ? lineTotalVes : lineTotal;
                  const stockMax = Math.max(0, Number(l.product.stock_qty) || 0);
                  const atStockCeiling = stockMax > 0 && l.cantidad >= stockMax;
                  const stLine = stockLabel(l.product.stock_qty);
                  const descLine =
                    l.product.description && String(l.product.description).trim()
                      ? String(l.product.description).trim()
                      : l.product.name;
                  return (
                    /* Grid: [thumb][info][qty][total][rm] */
                    <div key={l.key} style={S.itemRow}>
                      <ThumbBox idx={idx} size={36} />
                      <div style={{ minWidth: 0 }}>
                        <div style={{ fontSize: 11, fontWeight: 600, lineHeight: 1.35, color: "var(--mu-text, #e6edf3)", whiteSpace: "normal", wordBreak: "break-word" }}>
                          {descLine}
                        </div>
                        <div style={{ marginTop: 5, display: "flex", flexWrap: "wrap" as const, gap: 6, alignItems: "center" }}>
                          {l.product.brand ? (
                            <span style={{ fontFamily: "'JetBrains Mono', monospace", fontSize: 8, color: "var(--mu-ink-mute, #8b949e)", letterSpacing: "0.06em", textTransform: "uppercase" as const, fontWeight: 700 }}>
                              {l.product.brand}
                            </span>
                          ) : null}
                          <span style={S.stockBadge(stLine.cls)} title="stock_qty disponible (snapshot)">{stLine.text}</span>
                        </div>
                      </div>
                      {/* Qty control */}
                      <div style={S.qtyCtrl}>
                        <button
                          type="button"
                          style={S.qtyBtn}
                          onClick={() => setLines((prev) => prev.map((x) => x.key === l.key ? { ...x, cantidad: Math.max(1, x.cantidad - 1) } : x))}
                        >
                          <SvgMinus />
                        </button>
                        <input
                          type="number"
                          min={1}
                          max={stockMax > 0 ? stockMax : undefined}
                          style={S.qtyInput}
                          value={l.cantidad}
                          onChange={(e) => {
                            const raw = Number(e.target.value);
                            const v = Math.max(1, Number.isFinite(raw) ? raw : 1);
                            setLines((prev) =>
                              prev.map((x) => {
                                if (x.key !== l.key) return x;
                                const cap = Math.max(0, Number(x.product.stock_qty) || 0);
                                if (cap > 0 && v > cap) {
                                  alertCantidadSuperaStock(x.product, x.cantidad, v);
                                  return { ...x, cantidad: cap };
                                }
                                return { ...x, cantidad: v };
                              })
                            );
                          }}
                        />
                        <button
                          type="button"
                          style={{
                            ...S.qtyBtn,
                            opacity: atStockCeiling ? 0.35 : 1,
                            cursor: atStockCeiling ? "not-allowed" : "pointer",
                          }}
                          disabled={atStockCeiling}
                          onClick={() =>
                            setLines((prev) =>
                              prev.map((x) => {
                                if (x.key !== l.key) return x;
                                const cap = Math.max(0, Number(x.product.stock_qty) || 0);
                                if (cap <= 0 || x.cantidad >= cap) {
                                  alertCantidadSuperaStock(x.product, x.cantidad, x.cantidad + 1);
                                  return x;
                                }
                                return { ...x, cantidad: x.cantidad + 1 };
                              })
                            )
                          }
                        >
                          <SvgPlus />
                        </button>
                      </div>
                      {/* Line total: USD primario (VES = ajustado Binance/BCV); Bs secundario solo en VES */}
                      <div style={{ textAlign: "right", display: "flex", flexDirection: "column", gap: 2, minWidth: 0 }}>
                        {!vesMode ? (
                          <div style={{ fontFamily: "'JetBrains Mono', monospace", fontSize: 14, fontWeight: 800, color: "#c5f24a", letterSpacing: "-0.01em", lineHeight: 1.1, textShadow: "0 0 12px rgba(197,242,74,0.12)" }}>
                            {fmtUSD(lineDisplay)}
                          </div>
                        ) : hasVesRecalc ? (
                          <>
                            <div style={{ fontFamily: "'JetBrains Mono', monospace", fontSize: 14, fontWeight: 800, color: "#c5f24a", letterSpacing: "-0.01em", lineHeight: 1.1, textShadow: "0 0 12px rgba(197,242,74,0.12)" }}>
                              {fmtUSD(lineDisplay)}
                            </div>
                            <div style={{ fontFamily: "'JetBrains Mono', monospace", fontSize: 9, fontWeight: 600, color: "#fbbf24", letterSpacing: "0.02em" }}>
                              {fmtVESQuote(lineDisplay * bcvNum!)}
                            </div>
                          </>
                        ) : hasBinanceQuote ? (
                          <>
                            <div style={{ fontFamily: "'JetBrains Mono', monospace", fontSize: 14, fontWeight: 800, color: "#c5f24a", letterSpacing: "-0.01em", lineHeight: 1.1, textShadow: "0 0 12px rgba(197,242,74,0.12)" }}>
                              {fmtUSD(usdTieBreakFromBinanceBs(bsFromUsdBinance(lineTotal, binanceNum!), binanceNum!))}
                            </div>
                            <div style={{ fontFamily: "'JetBrains Mono', monospace", fontSize: 9, fontWeight: 600, color: "#fbbf24", letterSpacing: "0.02em" }}>
                              {fmtVESQuote(bsFromUsdBinance(lineTotal, binanceNum!))}
                            </div>
                          </>
                        ) : (
                          <>
                            <div style={{ fontFamily: "'JetBrains Mono', monospace", fontSize: 14, fontWeight: 800, color: "#c5f24a", letterSpacing: "-0.01em", lineHeight: 1.1 }}>
                              {fmtUSD(lineTotal)}
                            </div>
                            <div style={{ fontFamily: "'JetBrains Mono', monospace", fontSize: 8, color: "#fca5a5" }}>Sin tasa</div>
                          </>
                        )}
                        {canSuperuserEditUnitUsd ? (
                          <div
                            style={{
                              marginTop: 6,
                              display: "flex",
                              flexDirection: "column",
                              alignItems: "flex-end",
                              gap: 4,
                              width: "100%",
                            }}
                          >
                            <span
                              style={{
                                fontFamily: "'JetBrains Mono', monospace",
                                fontSize: 7,
                                fontWeight: 800,
                                letterSpacing: "0.08em",
                                color: "var(--mu-ink-mute, #8b949e)",
                                textTransform: "uppercase" as const,
                              }}
                            >
                              P. unit. USD · SU
                            </span>
                            <input
                              type="number"
                              min={0}
                              step={0.01}
                              value={l.precio_unitario}
                              onChange={(e) => {
                                const n = parseFloat(e.target.value);
                                setLines((prev) =>
                                  prev.map((x) =>
                                    x.key === l.key
                                      ? {
                                          ...x,
                                          precio_unitario:
                                            Number.isFinite(n) && n >= 0 ? n : x.precio_unitario,
                                        }
                                      : x
                                  )
                                );
                              }}
                              onClick={(e) => e.stopPropagation()}
                              title="Precio unitario USD de la línea (prueba · SUPERUSER). Con vista VES los totales usan la fórmula del panel sobre este valor."
                              style={{
                                width: 80,
                                boxSizing: "border-box",
                                padding: "4px 6px",
                                borderRadius: 6,
                                border: "1px solid var(--mu-border, rgba(255,255,255,0.15))",
                                background: "var(--mu-panel-2, #1c222b)",
                                color: "var(--mu-text, #e6edf3)",
                                fontFamily: "'JetBrains Mono', monospace",
                                fontSize: 11,
                                fontWeight: 700,
                                textAlign: "right" as const,
                              }}
                            />
                          </div>
                        ) : null}
                      </div>
                      {/* Remove */}
                      <button
                        type="button"
                        style={S.rmBtn}
                        onClick={() => setLines((prev) => prev.filter((x) => x.key !== l.key))}
                        title="Eliminar ítem"
                      >
                        <SvgTrash />
                      </button>
                    </div>
                  );
                })}
              </div>
            )}
          </div>

          {/* Mini resumen */}
          {lines.length > 0 && (
            <div style={S.miniSummary}>
              <div style={S.summaryRow}>
                <span style={{ color: "var(--mu-ink-mute, #8b949e)" }}>Total ({lines.length} {lines.length === 1 ? "ítem" : "ítems"})</span>
                <span style={{ textAlign: "right" as const }}>
                  {!vesMode ? (
                    <span style={{ fontFamily: "'JetBrains Mono', monospace", fontSize: 13, fontWeight: 800, color: "#c5f24a" }}>
                      {fmtUSD(subtotal)}
                    </span>
                  ) : hasVesRecalc ? (
                    <>
                      <span style={{ fontFamily: "'JetBrains Mono', monospace", fontSize: 13, fontWeight: 800, color: "#c5f24a", display: "block" }}>
                        {fmtUSD(subtotalVes)}
                      </span>
                      <span style={{ fontFamily: "'JetBrains Mono', monospace", fontSize: 9, fontWeight: 600, color: "#fbbf24", display: "block", marginTop: 2 }}>
                        {fmtVESQuote(subtotalVes * bcvNum!)}
                      </span>
                    </>
                  ) : hasBinanceQuote ? (
                    <>
                      <span style={{ fontFamily: "'JetBrains Mono', monospace", fontSize: 13, fontWeight: 800, color: "#c5f24a", display: "block" }}>
                        {fmtUSD(usdTieBreakFromBinanceBs(bsFromUsdBinance(subtotal, binanceNum!), binanceNum!))}
                      </span>
                      <span style={{ fontFamily: "'JetBrains Mono', monospace", fontSize: 9, fontWeight: 600, color: "#fbbf24", display: "block", marginTop: 2 }}>
                        {fmtVESQuote(bsFromUsdBinance(subtotal, binanceNum!))}
                      </span>
                    </>
                  ) : (
                    <>
                      <span style={{ fontFamily: "'JetBrains Mono', monospace", fontSize: 13, fontWeight: 800, color: "#c5f24a", display: "block" }}>
                        {fmtUSD(subtotal)}
                      </span>
                      <span style={{ fontSize: 8, color: "#fca5a5", display: "block", marginTop: 2 }}>Sin tasa</span>
                    </>
                  )}
                </span>
              </div>
              {hasVesRecalc ? (
                <div style={S.summaryRow}>
                  <span style={{ color: "var(--mu-ink-mute, #8b949e)" }}>BCV / Binance</span>
                  <span style={{ color: "var(--mu-ink-mute, #8b949e)", fontFamily: "'JetBrains Mono', monospace", fontSize: 10 }}>
                    {bcvNum!.toLocaleString("es-VE", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                    {" / "}
                    {binanceNum!.toLocaleString("es-VE", { minimumFractionDigits: 2, maximumFractionDigits: 2 })} Bs/USD
                  </span>
                </div>
              ) : hasBinanceQuote ? (
                <div style={S.summaryRow}>
                  <span style={{ color: "var(--mu-ink-mute, #8b949e)" }}>Tasa Binance</span>
                  <span style={{ color: "var(--mu-ink-mute, #8b949e)", fontFamily: "'JetBrains Mono', monospace", fontSize: 10 }}>
                    {binanceNum!.toLocaleString("es-VE", { minimumFractionDigits: 2, maximumFractionDigits: 2 })} Bs/USD
                  </span>
                </div>
              ) : null}
            </div>
          )}

          {/* Error */}
          {error && (
            <div style={{ padding: "7px 10px", borderRadius: 7, background: "rgba(239,68,68,0.1)", border: "1px solid rgba(239,68,68,0.3)", fontSize: 11, color: "#fca5a5" }}>
              {error}
            </div>
          )}

          {/* Éxito */}
          {success && (
            <div style={{ padding: "7px 10px", borderRadius: 7, background: "rgba(52,211,153,0.1)", border: "1px solid rgba(52,211,153,0.3)", fontSize: 11, color: "#86efac", display: "flex", alignItems: "center", gap: 6 }}>
              <i className="ti ti-circle-check" />
              Cotización creada
            </div>
          )}

        </div>

        {/* Footer fijo bajo el área con scroll — siempre visible */}
        {lines.length > 0 && (
        <div style={S.footer}>
          <div style={S.totalBlock}>
            <div style={{ fontFamily: "'JetBrains Mono', monospace", fontSize: 8, color: "var(--mu-ink-mute, #6e7681)", letterSpacing: "0.12em", textTransform: "uppercase", fontWeight: 700 }}>
              {quoteEditing && sentQuote ? "Total (edición · USD)" : "Total cotización"}
            </div>
            {!vesMode ? (
              <div style={{ fontFamily: "'JetBrains Mono', monospace", fontSize: 18, fontWeight: 800, lineHeight: 1, letterSpacing: "-0.01em", color: "#c5f24a", textShadow: "0 0 14px rgba(197,242,74,0.15)" }}>
                {fmtUSD(total)}
              </div>
            ) : hasVesRecalc ? (
              <>
                <div style={{ fontFamily: "'JetBrains Mono', monospace", fontSize: 18, fontWeight: 800, lineHeight: 1, letterSpacing: "-0.01em", color: "#c5f24a", textShadow: "0 0 14px rgba(197,242,74,0.15)" }}>
                  {fmtUSD(total)}
                </div>
                <div style={{ fontFamily: "'JetBrains Mono', monospace", fontSize: 10, fontWeight: 600, color: "#fbbf24", marginTop: 4 }}>
                  {fmtVESQuote(total * bcvNum!)}
                </div>
              </>
            ) : hasBinanceQuote ? (
              <>
                <div style={{ fontFamily: "'JetBrains Mono', monospace", fontSize: 18, fontWeight: 800, lineHeight: 1, letterSpacing: "-0.01em", color: "#c5f24a", textShadow: "0 0 14px rgba(197,242,74,0.15)" }}>
                  {fmtUSD(usdTieBreakFromBinanceBs(bsFromUsdBinance(total, binanceNum!), binanceNum!))}
                </div>
                <div style={{ fontFamily: "'JetBrains Mono', monospace", fontSize: 10, fontWeight: 600, color: "#fbbf24", marginTop: 4 }}>
                  {fmtVESQuote(bsFromUsdBinance(total, binanceNum!))}
                </div>
              </>
            ) : (
              <>
                <div style={{ fontFamily: "'JetBrains Mono', monospace", fontSize: 18, fontWeight: 800, lineHeight: 1, color: "#c5f24a" }}>
                  {fmtUSD(total)}
                </div>
                <div style={{ fontFamily: "'JetBrains Mono', monospace", fontSize: 9, color: "#fca5a5", marginTop: 4 }}>Sin tasa</div>
              </>
            )}
          </div>
          {quoteEditing && sentQuote ? (
            <>
              <OpFranjaActionButton
                type="button"
                variant="neutral"
                disabled={savingQuoteEdit}
                onClick={cancelQuoteEdit}
              >
                Cancelar
              </OpFranjaActionButton>
              <OpFranjaActionButton
                type="button"
                variant="accent"
                disabled={savingQuoteEdit || noCustomer}
                loading={savingQuoteEdit}
                loadingLabel="…"
                onClick={() => void saveQuoteEdit()}
                title="Guardar cambios en la cotización enviada"
              >
                Guardar
              </OpFranjaActionButton>
            </>
          ) : (
            <>
              <OpFranjaActionButton
                type="button"
                variant="neutral"
                disabled={submitting || noCustomer}
                onClick={() => void submit(true)}
                title="Guardar la cotización como borrador en el ERP (no envía el mensaje por WhatsApp al cliente)."
                aria-label="Guardar borrador sin enviar"
              >
                <SvgSave />
                {submitting ? "…" : "Guardar"}
              </OpFranjaActionButton>
              {showDeliveryCta && (
                <OpFranjaActionButton
                  type="button"
                  variant="neutral"
                  disabled={submitting || dlvSubmitting}
                  style={{ whiteSpace: "nowrap", borderColor: "rgba(251,191,36,0.4)", color: "#fbbf24" }}
                  title={
                    lines.some((l) => String(l.product?.sku ?? "") === "SVC-DELIVERY")
                      ? "Cambiar el monto de delivery en el presupuesto"
                      : "Agregar delivery como línea del presupuesto (borrador o enviada)"
                  }
                  onClick={openDeliveryModal}
                >
                  {lines.some((l) => String(l.product?.sku ?? "") === "SVC-DELIVERY")
                    ? "Cambiar delivery"
                    : "Incluir delivery"}
                </OpFranjaActionButton>
              )}
              <OpFranjaActionButton
                type="button"
                variant="accent"
                disabled={submitting || noCustomer}
                onClick={() => void submit(false)}
                title="Crear y enviar cotización al cliente"
              >
                <SvgSend />
                {submitting ? "…" : "Enviar"}
              </OpFranjaActionButton>
            </>
          )}
        </div>
        )}
      </div>
      )}
    </div>

    {/* ── Modal: Incluir / Cambiar delivery en cotización ──────────────────── */}
    {dlvModalOpen && (
      <div
        role="dialog"
        aria-modal="true"
        aria-label="Delivery en cotización"
        style={{
          position: "fixed",
          inset: 0,
          zIndex: 1200,
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          background: "rgba(0,0,0,0.60)",
          backdropFilter: "blur(3px)",
        }}
        onClick={(e) => { if (e.target === e.currentTarget && !dlvSubmitting) setDlvModalOpen(false); }}
      >
        <div
          style={{
            width: "min(380px, 92vw)",
            background: "var(--mu-panel-2, #1a2233)",
            border: "1px solid rgba(251,191,36,0.35)",
            borderRadius: 12,
            padding: "20px 20px 16px",
            display: "flex",
            flexDirection: "column",
            gap: 14,
          }}
        >
          {/* Cabecera */}
          <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between" }}>
            <div>
              <div style={{ fontFamily: "'JetBrains Mono', monospace", fontSize: 11, fontWeight: 800, color: "#fbbf24", letterSpacing: "0.06em" }}>
                DELIVERY EN COTIZACIÓN
              </div>
              <div style={{ fontSize: 10, color: "var(--mu-ink-mute, #8b949e)", marginTop: 2 }}>
                Agrega el envío como línea; el total cotizado quedará alineado con el pago del cliente.
              </div>
            </div>
            <button
              type="button"
              onClick={() => { if (!dlvSubmitting) setDlvModalOpen(false); }}
              style={{ background: "none", border: "none", cursor: "pointer", color: "var(--mu-ink-mute, #8b949e)", fontSize: 18, lineHeight: 1, padding: 4 }}
              aria-label="Cerrar"
            >
              ×
            </button>
          </div>

          {/* Zona */}
          <div>
            <label style={{ display: "block", fontSize: 9, fontWeight: 700, letterSpacing: "0.08em", color: "var(--mu-ink-mute, #8b949e)", marginBottom: 5 }}>
              ZONA DE DELIVERY
            </label>
            {dlvZonesLoading ? (
              <div style={{ fontSize: 10, color: "var(--mu-ink-mute, #8b949e)" }}>Cargando zonas…</div>
            ) : (
              <select
                className="form-select form-select-sm"
                value={dlvZoneId}
                disabled={dlvSubmitting}
                onChange={(e) => {
                  const v = e.target.value;
                  setDlvZoneId(v);
                  if (v) {
                    const row = dlvZones.find((z) => String(z.id) === v);
                    const preBs = row ? resolveZonePriceBs(row, activeRate) : "";
                    setDlvCustomBs(preBs);
                  } else {
                    setDlvCustomBs("");
                  }
                }}
                style={{
                  width: "100%",
                  fontSize: 12,
                  background: "var(--mu-panel-3, #232a35)",
                  border: "1px solid var(--mu-border, rgba(255,255,255,0.12))",
                  color: "var(--mu-text, #e6edf3)",
                  borderRadius: 6,
                  padding: "6px 10px",
                }}
              >
                <option value="">— Seleccioná una zona —</option>
                {dlvZones.map((z) => (
                  <option key={z.id} value={String(z.id)}>
                    {zoneOptionLabel(z, activeRate)}
                  </option>
                ))}
              </select>
            )}
          </div>

          {/* Monto personalizado */}
          {dlvZoneId !== "" && (
            <div>
              <label style={{ display: "block", fontSize: 9, fontWeight: 700, letterSpacing: "0.08em", color: "var(--mu-ink-mute, #8b949e)", marginBottom: 5 }}>
                MONTO AL CLIENTE (Bs.) — editable
              </label>
              <input
                type="text"
                inputMode="decimal"
                className="form-control form-control-sm"
                value={dlvCustomBs}
                disabled={dlvSubmitting}
                onChange={(e) => setDlvCustomBs(e.target.value)}
                placeholder="Ej. 25,00"
                style={{
                  fontFamily: "'JetBrains Mono', monospace",
                  fontSize: 13,
                  fontWeight: 700,
                  background: "var(--mu-panel-3, #232a35)",
                  border: "1px solid rgba(251,191,36,0.35)",
                  color: "#fbbf24",
                  borderRadius: 6,
                  padding: "6px 10px",
                  width: "100%",
                }}
              />
              <div style={{ fontSize: 9, color: "var(--mu-ink-mute, #8b949e)", marginTop: 4 }}>
                El monto se convierte a USD con la tasa del día (BCV) y queda como línea "Servicio de Delivery" en la cotización.
              </div>
            </div>
          )}

          {/* Error */}
          {dlvError && (
            <div style={{ fontSize: 10, color: "#fca5a5", background: "rgba(239,68,68,0.08)", border: "1px solid rgba(239,68,68,0.25)", borderRadius: 6, padding: "7px 10px" }}>
              {dlvError}
            </div>
          )}

          {/* Acciones */}
          <div style={{ display: "flex", gap: 8, justifyContent: "flex-end", paddingTop: 4 }}>
            <OpFranjaActionButton
              type="button"
              variant="neutral"
              disabled={dlvSubmitting}
              onClick={() => setDlvModalOpen(false)}
            >
              Cancelar
            </OpFranjaActionButton>
            <OpFranjaActionButton
              type="button"
              variant="accent"
              disabled={dlvSubmitting || dlvZoneId === ""}
              loading={dlvSubmitting}
              loadingLabel="Agregando…"
              onClick={() => void confirmDelivery()}
              style={{ background: "rgba(251,191,36,0.15)", borderColor: "rgba(251,191,36,0.5)", color: "#fbbf24" }}
            >
              Agregar delivery
            </OpFranjaActionButton>
          </div>
        </div>
      </div>
    )}
    </>
  );
}

