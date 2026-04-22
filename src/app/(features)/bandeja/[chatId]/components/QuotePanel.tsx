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
 *  - El header muestra: ícono + "Cotización" + badge(n ítems) + total USD + chevron.
 *  - Pre-llena el cliente desde el chat (no hay paso de búsqueda de cliente).
 *  - Búsqueda de productos con toggle SKU / Nombre y dropdown inline.
 *  - Moneda VES/USD: control segmentado con degradado; SKU/Nombre usa el mismo patrón visual.
 *  - Envío vía POST /api/ventas/cotizaciones.
 */

import Link from "next/link";
import { useCallback, useEffect, useRef, useState, type CSSProperties } from "react";
import type { Product } from "@/hooks/useProducts";
import { useTodayRate } from "@/hooks/useTodayRate";

// ── Tipos locales ────────────────────────────────────────────────────────────

interface QuoteLine {
  key: string;
  product: Product;
  cantidad: number;
  precio_unitario: number;
}

// ── Helpers ──────────────────────────────────────────────────────────────────

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
  // Sección colapsable
  section: {
    borderRadius: 10,
    border: "1px solid var(--mu-border, rgba(255,255,255,0.08))",
    /* Solo el header redondeado arriba; el cuerpo scrollea sin recortar el footer */
    overflow: "visible",
    marginBottom: 6,
    background: "var(--mu-panel-2, #1c222b)",
  } as React.CSSProperties,

  // Header toggle
  header: (open: boolean) => ({
    display: "flex",
    alignItems: "flex-start",
    gap: 8,
    padding: "10px 14px",
    cursor: "pointer",
    userSelect: "none" as const,
    background: open
      ? "linear-gradient(180deg, var(--mu-panel-3, #232a35), var(--mu-panel-2, #1c222b))"
      : "transparent",
    /* Misma altura de borde abierto/cerrado: evita salto vertical de 1px al expandir */
    borderBottom: open
      ? "1px solid var(--mu-border, rgba(255,255,255,0.08))"
      : "1px solid transparent",
    transition: "background 0.15s",
  }),

  icon: {
    width: 28,
    height: 28,
    borderRadius: 8,
    background: "rgba(197,242,74,0.1)",
    border: "1px solid rgba(197,242,74,0.25)",
    color: "#c5f24a",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    flexShrink: 0,
  } as React.CSSProperties,

  /**
   * Columna del panel expandido: altura máxima; el scroll va solo en scrollBody
   * para que el footer (Enviar / Borrador) quede siempre visible.
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

  btn: (variant: "default" | "draft" | "primary" | "ghost") => ({
    display: "inline-flex",
    alignItems: "center",
    gap: 4,
    height: 32,
    padding: "0 11px",
    borderRadius: 7,
    fontSize: 11,
    fontWeight: 600,
    cursor: "pointer",
    flexShrink: 0,
    transition: "background 0.1s",
    ...(variant === "primary"
      ? { background: "#c5f24a", color: "#1a1f14", border: "1px solid #c5f24a", fontWeight: 700 }
      : variant === "draft"
      ? { background: "rgba(245,158,11,0.08)", color: "#fcd34d", border: "1px solid rgba(245,158,11,0.25)" }
      : variant === "ghost"
      ? { background: "transparent", color: "var(--mu-ink-mute, #8b949e)", border: "1px solid var(--mu-border, rgba(255,255,255,0.08))" }
      : { background: "var(--mu-panel-4, #2a313c)", color: "var(--mu-text-dim, #8b949e)", border: "1px solid var(--mu-border, rgba(255,255,255,0.08))" }),
  }) as React.CSSProperties,
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

const SvgChevron = ({ open }: { open: boolean }) => (
  <svg
    viewBox="0 0 24 24"
    fill="none"
    stroke="currentColor"
    strokeWidth={2.5}
    style={{ width: 13, height: 13, transition: "transform 0.2s", transform: open ? "rotate(180deg)" : "rotate(0deg)" }}
  >
    <path d="m6 9 6 6 6-6" />
  </svg>
);

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
  customerName: string | null;
  /** TRUE cuando el usuario pulsa "Cotizar" en el panel de acciones */
  forceOpen?: boolean;
  /** Callback para que el padre sepa que ya consumió el forceOpen */
  onForceOpenConsumed?: () => void;
  /** Callback tras crear la cotización con éxito */
  onSuccess?: () => void;
  /** Notifica al padre la cotización activa enviada (id + referencia + total USD) o null si no hay */
  onSentQuoteChange?: (q: { id: number; reference: string; totalUsd: number } | null) => void;
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

export default function QuotePanel({
  chatId,
  customerId,
  customerName,
  forceOpen,
  onForceOpenConsumed,
  onSuccess,
  onSentQuoteChange,
}: QuotePanelProps) {
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

  const [isOpen, setIsOpen]             = useState(false);
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
  const [approving, setApproving]       = useState(false);
  const [creatingOrder, setCreatingOrder] = useState(false);
  const [orderCreatedId, setOrderCreatedId] = useState<number | null>(null);
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

  const loadActiveQuote = useCallback(async () => {
    if (!chatId) return;
    try {
      const r = await fetch(`/api/inbox/quotations/${encodeURIComponent(chatId)}`, {
        credentials: "include",
        cache: "no-store",
      });
      const data = await r.json().catch(() => ({})) as Record<string, unknown>;
      const items = (data.items ?? []) as Array<Record<string, unknown>>;
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
        });
        setIsOpen(true);
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
  }, [chatId]);

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

  // Reset cuando cambia el chat
  useEffect(() => {
    setLines([]);
    setSearchQuery("");
    setResults([]);
    setError(null);
    setSuccess(false);
    setIsOpen(false);
    setSentQuote(null);
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
  }, [chatId]);

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
    setSubmitting(true);
    setError(null);
    const d = new Date();
    d.setTime(d.getTime() + 48 * 60 * 60 * 1000);
    const body = {
      cliente_id: customerId,
      chat_id: chatId ? Number(chatId) : undefined,
      items: lines.map((l) => ({
        producto_id: l.product.id,
        cantidad: l.cantidad,
        precio_unitario: hasVesRecalc
          ? vesAdjustedUsd(l.precio_unitario, binanceNum!, bcvNum!)
          : l.precio_unitario,
      })),
      fecha_vencimiento: d.toISOString().slice(0, 10),
    };
    try {
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

      // Limpiar el formulario de ítems y mostrar la tarjeta de cotización enviada
      setLines([]);
      setSearchQuery("");
      setResults([]);
      if (!asDraft) {
        const ref = String(
          (created.presupuesto as Record<string, unknown> | undefined)?.reference ??
          `COT-${newId}`
        );
        setSentQuote({ id: newId, reference: ref, status: "sent", total: vesMode ? subtotalVes : subtotal });
        setSuccess(false);
      } else {
        setSuccess(true);
        setTimeout(() => { setSuccess(false); }, 1500);
      }
      onSuccess?.();
    } catch {
      setError("Error de red al crear la cotización.");
    } finally {
      setSubmitting(false);
    }
  };

  /** Actualiza el status de la cotización enviada (approved | rejected | sent) */
  const setQuoteStatus = async (newStatus: SentQuote["status"]) => {
    if (!sentQuote || approving) return;
    setApproving(true);
    try {
      const res = await fetch(
        `/api/inbox/quotations/${encodeURIComponent(String(sentQuote.id))}/status`,
        {
          method: "PATCH",
          credentials: "include",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ status: newStatus }),
          cache: "no-store",
        }
      );
      if (res.ok) {
        setSentQuote((prev) => prev ? { ...prev, status: newStatus } : prev);
        onSuccess?.();
      }
    } catch {/* ignore */} finally {
      setApproving(false);
    }
  };

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
      const res = await fetch(
        `/api/inbox/quotations/${encodeURIComponent(String(sentQuote.id))}/create-sales-order`,
        {
          method: "POST",
          credentials: "include",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(chatId ? { chat_id: Number(chatId) } : {}),
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

  const noCustomer = !customerId;

  const showPaymentGateway =
    Boolean(sentQuote) &&
    sentQuote!.channelId === 2 &&
    !sentQuote!.linkedSalesOrderId;

  const showCreateOrderCta =
    Boolean(sentQuote) &&
    sentQuote!.channelId === 2 &&
    Boolean(sentQuote!.paymentFullySettled) &&
    !sentQuote!.linkedSalesOrderId;

  return (
    <div ref={panelRef} style={S.section}>

      {orderCreatedId != null && (
        <div
          style={{
            margin: "8px 10px 0",
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

      {/* ── Header toggle ───────────────────────────────────────────── */}
      <div
        style={S.header(isOpen)}
        onClick={() => setIsOpen((v) => !v)}
        role="button"
        aria-expanded={isOpen}
        tabIndex={0}
        onKeyDown={(e) => { if (e.key === "Enter" || e.key === " ") setIsOpen((v) => !v); }}
      >
        <div style={{ ...S.icon, marginTop: 2 }}><SvgDoc /></div>
        <div style={{ flex: 1, minWidth: 0 }}>
          <div style={{ display: "flex", alignItems: "center", gap: 6 }}>
            <span style={{ fontSize: 12, fontWeight: 700, color: "var(--mu-text, #e6edf3)" }}>
              Cotización
            </span>
            {lines.length > 0 && (
              <span style={{
                fontFamily: "'JetBrains Mono', monospace",
                fontSize: 9,
                fontWeight: 800,
                padding: "1px 6px",
                borderRadius: 4,
                background: "rgba(197,242,74,0.12)",
                color: "#c5f24a",
                border: "1px solid rgba(197,242,74,0.3)",
                letterSpacing: "0.04em",
              }}>
                {lines.length} {lines.length === 1 ? "ítem" : "ítems"}
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
                fontFamily: "'JetBrains Mono', monospace",
                fontSize: 9,
                color: "var(--mu-ink-mute, #6e7681)",
                letterSpacing: "0.06em",
                marginTop: 1,
                minHeight: "1.35em",
                lineHeight: 1.35,
                visibility: isOpen ? "hidden" : "visible",
              }}
            >
              Sin ítems · click para abrir
            </div>
          )}
        </div>
        <div style={{ color: "var(--mu-ink-mute, #6e7681)", marginTop: 2 }}>
          <SvgChevron open={isOpen} />
        </div>
      </div>

      {/* ── Tarjeta de cotización enviada + botones de aprobación ───── */}
      {isOpen && sentQuote && (
        <div style={{
          padding: "12px 14px",
          borderBottom: lines.length > 0
            ? "1px solid var(--mu-border, rgba(255,255,255,0.08))"
            : undefined,
        }}>
          {/* Fila referencia + total */}
          <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 10 }}>
            <div>
              <div style={{ fontFamily: "'JetBrains Mono', monospace", fontSize: 10, fontWeight: 800, color: "#c5f24a", letterSpacing: "0.04em" }}>
                {sentQuote.reference}
              </div>
              <div style={{ fontFamily: "'JetBrains Mono', monospace", fontSize: 9, color: "var(--mu-ink-mute, #6e7681)", marginTop: 2 }}>
                Total · {fmtUSD(sentQuote.total)}
                {hasBinanceQuote
                  ? ` · ${fmtVESQuote(bsFromUsdBinance(sentQuote.total, binanceNum!))} (Binance)`
                  : activeRate != null
                    ? ` · ${fmtVESQuote(sentQuote.total * activeRate)} (activa)`
                    : ""}
              </div>
            </div>
            {/* Botón nueva cotización */}
            <button
              type="button"
              style={{ ...S.btn("ghost"), height: 26, fontSize: 10, padding: "0 8px" }}
              onClick={() => { setSentQuote(null); setLines([]); }}
              title="Crear nueva cotización"
            >
              + Nueva
            </button>
          </div>

          {/* 3 botones de decisión */}
          <div style={{ display: "flex", gap: 6 }}>
            {(
              [
                { st: "approved" as const, label: "✓ Aprobada",    active: "rgba(52,211,153,0.15)",  border: "rgba(52,211,153,0.5)",  textColor: "#86efac" },
                { st: "rejected" as const, label: "✗ Rechazada",   active: "rgba(239,68,68,0.12)",   border: "rgba(239,68,68,0.4)",   textColor: "#fca5a5" },
                { st: "sent"     as const, label: "⏳ Por aprobar", active: "rgba(245,158,11,0.10)",  border: "rgba(245,158,11,0.35)", textColor: "#fcd34d" },
              ] as const
            ).map(({ st, label, active, border, textColor }) => {
              const isActive = sentQuote.status === st;
              return (
                <button
                  key={st}
                  type="button"
                  disabled={approving}
                  onClick={() => void setQuoteStatus(st)}
                  style={{
                    flex: 1,
                    height: 30,
                    borderRadius: 7,
                    border: `1px solid ${isActive ? border : "var(--mu-border, rgba(255,255,255,0.08))"}`,
                    background: isActive ? active : "transparent",
                    color: isActive ? textColor : "var(--mu-ink-mute, #6e7681)",
                    fontFamily: "'JetBrains Mono', monospace",
                    fontSize: 9,
                    fontWeight: 700,
                    letterSpacing: "0.04em",
                    cursor: approving ? "wait" : "pointer",
                    transition: "all 0.15s",
                    whiteSpace: "nowrap" as const,
                  }}
                >
                  {label}
                </button>
              );
            })}
          </div>

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
                    <button
                      type="button"
                      disabled={cajaUsdSubmitting}
                      onClick={() => void submitCajaUsdComplement()}
                      style={{
                        width: "100%",
                        minHeight: 36,
                        padding: "8px 12px",
                        borderRadius: 7,
                        border: "1px solid rgba(129,140,248,0.55)",
                        background: "linear-gradient(180deg, rgba(129,140,248,0.95) 0%, #6366f1 100%)",
                        color: "#f8fafc",
                        fontFamily: "inherit",
                        fontSize: 11,
                        fontWeight: 700,
                        cursor: cajaUsdSubmitting ? "wait" : "pointer",
                        lineHeight: 1.25,
                        textAlign: "center" as const,
                      }}
                    >
                      {cajaUsdSubmitting ? "Asociando…" : "Asociar pago en dólares"}
                    </button>
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
                            <button
                              type="button"
                              disabled={approvingUsd != null}
                              onClick={() => void approveUsdAllocation(al.id)}
                              style={{
                                height: 22,
                                padding: "0 8px",
                                borderRadius: 5,
                                border: "1px solid rgba(56,189,248,0.45)",
                                background: "rgba(56,189,248,0.1)",
                                color: "#93c5fd",
                                fontFamily: "'JetBrains Mono', monospace",
                                fontSize: 9,
                                fontWeight: 800,
                                cursor: approvingUsd != null ? "wait" : "pointer",
                                letterSpacing: "0.04em",
                              }}
                            >
                              {approvingUsd === al.id ? "…" : "Aprobar · Caja"}
                            </button>
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
                      <button
                        key={cur}
                        type="button"
                        onClick={() => setPayForm((f) => ({ ...f, currency: cur, amount: "" }))}
                        style={{
                          flex: 1,
                          height: 26,
                          borderRadius: 6,
                          border: payForm.currency === cur
                            ? (cur === "VES" ? "1px solid rgba(234,179,8,0.5)" : "1px solid rgba(56,189,248,0.5)")
                            : "1px solid var(--mu-border,rgba(255,255,255,0.08))",
                          background: payForm.currency === cur
                            ? (cur === "VES" ? "rgba(234,179,8,0.15)" : "rgba(56,189,248,0.12)")
                            : "transparent",
                          color: payForm.currency === cur
                            ? (cur === "VES" ? "#fbbf24" : "#93c5fd")
                            : "var(--mu-ink-mute,#8b949e)",
                          fontFamily: "'JetBrains Mono', monospace",
                          fontSize: 9,
                          fontWeight: 800,
                          cursor: "pointer",
                          letterSpacing: "0.06em",
                        }}
                      >
                        {cur === "VES" ? "Bs (Pago Móvil)" : "USD (Transferencia)"}
                      </button>
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
                    <button
                      type="button"
                      disabled={payForm.submitting}
                      onClick={() => void submitPaymentAllocation()}
                      style={{
                        flexShrink: 0,
                        height: 32,
                        padding: "0 12px",
                        borderRadius: 7,
                        border: payForm.currency === "VES"
                          ? "1px solid rgba(234,179,8,0.45)"
                          : "1px solid rgba(56,189,248,0.45)",
                        background: payForm.currency === "VES"
                          ? "rgba(234,179,8,0.15)"
                          : "rgba(56,189,248,0.12)",
                        color: payForm.currency === "VES" ? "#fbbf24" : "#93c5fd",
                        fontFamily: "'JetBrains Mono', monospace",
                        fontSize: 10,
                        fontWeight: 800,
                        cursor: payForm.submitting ? "wait" : "pointer",
                      }}
                    >
                      {payForm.submitting ? "…" : "Imputar"}
                    </button>
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
              <button
                type="button"
                disabled={creatingOrder}
                onClick={() => void createOrderFromVerifiedQuote()}
                style={{
                  width: "100%",
                  minHeight: 36,
                  borderRadius: 8,
                  border: "1px solid rgba(197,242,74,0.45)",
                  background: "linear-gradient(180deg, rgba(197,242,74,0.95) 0%, #a3cb3a 100%)",
                  color: "#141810",
                  fontFamily: "'JetBrains Mono', monospace",
                  fontSize: 10,
                  fontWeight: 800,
                  letterSpacing: "0.06em",
                  cursor: creatingOrder ? "wait" : "pointer",
                  display: "inline-flex",
                  alignItems: "center",
                  justifyContent: "center",
                  gap: 8,
                  boxShadow: "0 1px 0 rgba(255,255,255,0.35) inset",
                }}
              >
                {creatingOrder ? (
                  <>… Creando orden</>
                ) : (
                  <>
                    <i className="ti ti-shopping-cart-plus" style={{ fontSize: 14 }} />
                    Crear orden de compra · CH-2
                  </>
                )}
              </button>
            </div>
          )}
        </div>
      )}

      {/* ── Panel expandido (body + footer en un solo scroll) ───────── */}
      {isOpen && !sentQuote && (
      <div style={S.expandedWrap}>
        <div style={S.scrollBody}>

          {/* Cliente */}
          <div>
            <div style={S.secLabel}>
              <span>Cliente</span>
              <div style={S.line} />
            </div>
            {noCustomer ? (
              <div style={{
                padding: "9px 10px",
                borderRadius: 8,
                border: "1px dashed var(--mu-border, rgba(255,255,255,0.08))",
                display: "flex",
                alignItems: "center",
                gap: 8,
                color: "var(--mu-ink-mute, #8b949e)",
                fontSize: 11,
              }}>
                <i className="ti ti-user-question" style={{ fontSize: 14 }} />
                Identifica al cliente primero
              </div>
            ) : (
              <div style={{
                padding: "8px 10px",
                borderRadius: 8,
                background: "var(--mu-panel-4, #2a313c)",
                border: "1px solid var(--mu-border, rgba(255,255,255,0.08))",
                display: "flex",
                alignItems: "center",
                gap: 8,
              }}>
                <div style={{
                  width: 28,
                  height: 28,
                  borderRadius: "50%",
                  background: "#1e4a7a",
                  color: "#93c5fd",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  fontSize: 10,
                  fontWeight: 700,
                  flexShrink: 0,
                }}>
                  {(customerName ?? "?").slice(0, 2).toUpperCase()}
                </div>
                <div style={{ flex: 1, minWidth: 0 }}>
                  <div style={{ fontSize: 11, fontWeight: 700, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
                    {customerName ?? `Cliente #${customerId}`}
                  </div>
                  <div style={{ fontFamily: "'JetBrains Mono', monospace", fontSize: 9, color: "var(--mu-ink-mute, #6e7681)", letterSpacing: "0.04em" }}>
                    ID {customerId}
                  </div>
                </div>
              </div>
            )}
          </div>

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
              Total cotización
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
          <button
            type="button"
            style={S.btn("draft")}
            disabled={submitting || noCustomer}
            onClick={() => void submit(true)}
            title="Guardar como borrador"
          >
            <SvgSave />
            {submitting ? "…" : "Borrador"}
          </button>
          <button
            type="button"
            style={S.btn("primary")}
            disabled={submitting || noCustomer}
            onClick={() => void submit(false)}
            title="Crear y enviar cotización al cliente"
          >
            <SvgSend />
            {submitting ? "…" : "Enviar"}
          </button>
        </div>
        )}
      </div>
      )}
    </div>
  );
}
