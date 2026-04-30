"use client";

import {
  useEffect,
  useId,
  useMemo,
  useRef,
  useState,
  type KeyboardEvent,
  type ReactNode,
} from "react";
import type { Sale, ItemPreview, QuotePreview } from "@/types/sales";
import {
  usePedidosCustomerContact,
  PedidosCustomerContactView,
} from "./PedidosCustomerBlock";
import {
  paymentOptionsForSale,
  effectivePaymentSelectValue,
  DEFAULT_VES_PAYMENT,
} from "../paymentMethodCatalog";
import {
  saleCanOpenQuoteModal,
  saleHasActiveQuotePreview,
} from "@/lib/saleQuoteAccess";

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

function OrderPaymentMethodSelect({
  sale,
  viewerRole,
  disabled,
  onCommitted,
}: {
  sale: Sale;
  viewerRole: string | null | undefined;
  disabled: boolean;
  onCommitted: () => void | Promise<void>;
}) {
  const options = useMemo(
    () => paymentOptionsForSale(sale, viewerRole),
    [sale, viewerRole],
  );
  /** Tras «Sin definir» en VES, no volver a forzar Banesco hasta que haya valor en BD. */
  const skipVesDefaultRef = useRef(false);
  const [v, setV] = useState(() => effectivePaymentSelectValue(sale));
  const [saving, setSaving] = useState(false);
  useEffect(() => {
    const raw = sale.payment_method?.trim().toLowerCase() ?? "";
    if (raw) {
      skipVesDefaultRef.current = false;
      setV(raw);
      return;
    }
    if (sale.rate_type === "NATIVE_VES" && !skipVesDefaultRef.current) {
      setV(DEFAULT_VES_PAYMENT);
      return;
    }
    setV("");
  }, [sale.id, sale.payment_method, sale.rate_type]);

  /** POS-only: mostrar catálogo completo pero sin editar. */
  if (disabled) {
    return (
      <select
        className="logi-ft-select logi-ft-select--readonly-row"
        value={v}
        disabled
        aria-label="Forma de pago"
        title="Solo lectura en ventas POS."
        onClick={(e) => e.stopPropagation()}
        onMouseDown={(e) => e.stopPropagation()}
        onKeyDown={(e) => e.stopPropagation()}
      >
        {options.map((o) => (
          <option key={o.value || "__empty"} value={o.value}>
            {o.label}
          </option>
        ))}
      </select>
    );
  }

  return (
    <select
      className="logi-ft-select"
      value={v}
      disabled={saving}
      aria-label="Forma de pago"
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
            next === "" ? { payment_method: null } : { payment_method: next };
          const res = await fetch(
            `/api/ventas/pedidos/${encodeURIComponent(String(sale.id))}/payment-method`,
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
          if (next === "" && sale.rate_type === "NATIVE_VES") {
            skipVesDefaultRef.current = true;
          } else if (next !== "") {
            skipVesDefaultRef.current = false;
          }
          await onCommitted();
        } catch {
          setV(prev);
        } finally {
          setSaving(false);
        }
      }}
    >
      {options.map((o) => (
        <option key={o.value || "__empty"} value={o.value}>
          {o.label}
        </option>
      ))}
    </select>
  );
}

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

/** Cotización con varios ítems: resumen en botón (contraído por defecto) y lista al expandir. */
function ExpandableQuotePreview({
  quotePreview,
  displayItems,
  totalStr,
}: {
  quotePreview: QuotePreview;
  displayItems: ItemPreview[];
  totalStr: string;
}) {
  const listRegionId = useId();
  const [open, setOpen] = useState(false);
  const n = Math.max(
    quotePreview.items_count > 0 ? quotePreview.items_count : 0,
    displayItems.length
  );
  const firstQuote = displayItems.length > 0 ? displayItems[0] : null;
  const stackLabel = [
    "Cotización",
    quotePreview.status,
    totalStr || undefined,
  ]
    .filter((x) => x != null && String(x).trim() !== "")
    .join(" · ");

  return (
    <div className={`prod-quote-expandable${open ? " prod-quote-expandable--open" : ""}`}>
      <button
        type="button"
        className="prod-quote-toggle"
        aria-expanded={open}
        aria-controls={listRegionId}
        title={open ? "Contraer líneas de cotización" : "Ver cotización completa"}
        onClick={(e) => {
          e.stopPropagation();
          e.preventDefault();
          setOpen((v) => !v);
        }}
        onMouseDown={(e) => e.stopPropagation()}
      >
        {firstQuote ? (
          <>
            <div className="prod-quote-toggle__hero">
              <div className="prod-thumb-wrap prod-thumb-wrap--quote prod-thumb-wrap--hero">
                <ProductThumb url={firstQuote.image_url} name={firstQuote.name} />
              </div>
              <div className="prod-quote-toggle__body">
                <div
                  className="prod-quote-toggle__title"
                  title={String(firstQuote.name || firstQuote.sku || "").trim() || undefined}
                >
                  {String(firstQuote.name || firstQuote.sku || "—").trim() || "—"}
                </div>
                <div className="prod-quote-toggle__meta">
                  <span className="prod-quote-toggle__count">
                    {n} {n === 1 ? "ítem" : "ítems"} en cotización
                  </span>
                  {totalStr ? (
                    <span className="prod-quote-toggle__tot">{totalStr}</span>
                  ) : null}
                </div>
              </div>
            </div>
            <span className="prod-quote-toggle__chev" aria-hidden="true">
              <i className="ti ti-chevron-down" />
            </span>
          </>
        ) : (
          <>
            <div className="prod-quote-toggle__body prod-quote-toggle__body--solo">
              <div className="prod-quote-toggle__title">
                {n > 0
                  ? `${n} ${n === 1 ? "ítem" : "ítems"} en cotización`
                  : "Cotización"}
              </div>
              {totalStr ? (
                <div className="prod-quote-toggle__meta">
                  <span className="prod-quote-toggle__tot">{totalStr}</span>
                </div>
              ) : null}
            </div>
            <span className="prod-quote-toggle__chev" aria-hidden="true">
              <i className="ti ti-chevron-down" />
            </span>
          </>
        )}
      </button>
      {open ? (
        <div
          id={listRegionId}
          className="prod-quote-expand"
          role="region"
          aria-label={stackLabel}
          onClick={(e) => e.stopPropagation()}
          onMouseDown={(e) => e.stopPropagation()}
        >
          {displayItems.map((it, idx) => (
            <div key={idx} className="prod-quote-expand-row">
              <div className="prod-thumb-wrap prod-thumb-wrap--quote prod-thumb-wrap--expand">
                <ProductThumb url={it.image_url} name={it.name} />
              </div>
              <div className="prod-quote-expand-row__main">
                <div
                  className="prod-quote-expand-row__title"
                  title={String(it.name || it.sku || "").trim() || undefined}
                >
                  {String(it.name || it.sku || "—").trim() || "—"}
                </div>
                <div className="prod-quote-expand-row__meta">
                  {it.sku &&
                  String(it.sku).trim() !== "" &&
                  String(it.sku).trim() !== String(it.name ?? "").trim() ? (
                    <span className="prod-quote-expand-row__sku">{String(it.sku).trim()}</span>
                  ) : null}
                  <span className="prod-quote-expand-row__qty">×{it.qty}</span>
                  {it.unit_price_usd != null && Number.isFinite(Number(it.unit_price_usd)) ? (
                    <span className="prod-quote-expand-row__pu">${fmtUsd(it.unit_price_usd)}</span>
                  ) : null}
                </div>
              </div>
            </div>
          ))}
        </div>
      ) : null}
    </div>
  );
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
    const displayItems = quoteItems.length > 0 ? quoteItems : [];
    const totalStr = quotePreview.total != null ? `$${fmtUsd(quotePreview.total)}` : "";
    const hasOrderPreview = orderItems.length > 0;
    const firstOrder = hasOrderPreview ? orderItems[0] : null;
    const orderMoreCount = hasOrderPreview ? orderItems.length - 1 : 0;
    const firstQuote = displayItems.length > 0 ? displayItems[0] : null;
    const quoteMoreCount =
      firstQuote != null && quotePreview.items_count > 1
        ? quotePreview.items_count - 1
        : 0;
    const multiQuote =
      quotePreview.items_count > 1 ||
      (Array.isArray(quoteItems) && quoteItems.length > 1);

    return (
      <div
        className={`c-products c-products--quote${hasOrderPreview ? " c-products--quote-with-order" : ""}${compact ? " c-products--compact" : ""}`}
      >
        {firstOrder ? (
          <div className="prod-order-stack">
            <div className="prod-order-hero">
              <div className="prod-order-hero__thumb">
                <div className="prod-thumb-wrap prod-thumb-wrap--order prod-thumb-wrap--hero">
                  <ProductThumb
                    url={firstOrder.image_url}
                    name={firstOrder.name}
                  />
                </div>
              </div>
              <div className="prod-order-hero__body">
                <div
                  className="prod-order-hero__title"
                  title={String(firstOrder.name || firstOrder.sku || "").trim() || undefined}
                >
                  {String(firstOrder.name || firstOrder.sku || "—").trim() || "—"}
                </div>
                <div className="prod-order-hero__row2">
                  <div className="prod-order-hero__row2-left">
                    {orderMoreCount > 0 ? (
                      <span className="prod-order-hero__more" title="Ítems adicionales en la orden">
                        +{orderMoreCount}
                      </span>
                    ) : null}
                  </div>
                  <div className="prod-order-hero__skuqty">
                    {firstOrder.sku &&
                    String(firstOrder.sku).trim() !== "" &&
                    String(firstOrder.sku).trim() !== String(firstOrder.name ?? "").trim() ? (
                      <span className="prod-order-hero__sku">{String(firstOrder.sku).trim()}</span>
                    ) : null}
                    <span className="prod-order-hero__qty">×{firstOrder.qty}</span>
                  </div>
                </div>
              </div>
            </div>
          </div>
        ) : null}

        <div
          className="prod-quote-stack"
          aria-label={[
            "Cotización",
            quotePreview.status,
            totalStr || undefined,
          ]
            .filter((x) => x != null && String(x).trim() !== "")
            .join(" · ")}
        >
          {multiQuote ? (
            <ExpandableQuotePreview
              quotePreview={quotePreview}
              displayItems={displayItems}
              totalStr={totalStr}
            />
          ) : firstQuote ? (
            <div className="prod-quote-hero">
              <div className="prod-quote-hero__thumb">
                <div className="prod-thumb-wrap prod-thumb-wrap--quote prod-thumb-wrap--hero">
                  <ProductThumb
                    url={firstQuote.image_url}
                    name={firstQuote.name}
                  />
                </div>
              </div>
              <div className="prod-quote-hero__body">
                <div
                  className="prod-quote-hero__title"
                  title={String(firstQuote.name || firstQuote.sku || "").trim() || undefined}
                >
                  {String(firstQuote.name || firstQuote.sku || "—").trim() || "—"}
                </div>
                <div className="prod-quote-hero__row2">
                  <div className="prod-quote-hero__row2-left">
                    {quoteMoreCount > 0 ? (
                      <span className="prod-quote-hero__more" title="Ítems adicionales en el presupuesto">
                        +{quoteMoreCount}
                      </span>
                    ) : null}
                  </div>
                  <div className="prod-quote-hero__skuqty">
                    {firstQuote.sku &&
                    String(firstQuote.sku).trim() !== "" &&
                    String(firstQuote.sku).trim() !== String(firstQuote.name ?? "").trim() ? (
                      <span className="prod-quote-hero__sku">{String(firstQuote.sku).trim()}</span>
                    ) : null}
                    <span className="prod-quote-hero__qty">×{firstQuote.qty}</span>
                    {totalStr ? (
                      <span className="prod-quote-hero__tot">{totalStr}</span>
                    ) : null}
                  </div>
                </div>
              </div>
            </div>
          ) : (
            <div className="prod-quote-hero prod-quote-hero--empty">
              <div className="prod-quote-hero__body prod-quote-hero__body--no-thumb">
                <div className="prod-quote-hero__title">
                  {quotePreview.items_count > 0
                    ? `${quotePreview.items_count} ítem(es) en cotización`
                    : "Cotización"}
                </div>
                <div className="prod-quote-hero__row2">
                  <div className="prod-quote-hero__row2-left" />
                  <div className="prod-quote-hero__skuqty">
                    {totalStr ? <span className="prod-quote-hero__tot">{totalStr}</span> : null}
                  </div>
                </div>
              </div>
            </div>
          )}
        </div>

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

function saleHasPaymentLink(sale: Sale): boolean {
  if (
    sale.reconciled_statement_id != null &&
    Number(sale.reconciled_statement_id) > 0
  ) {
    return true;
  }
  const r = sale.payment_reconciliation;
  if (!r) return false;
  if (r.bank && (r.bank.amount != null || r.bank.tx_date)) return true;
  if (
    r.payment_attempt &&
    (Boolean(r.payment_attempt.firebase_url?.trim()) ||
      r.payment_attempt.extracted_amount_bs != null)
  ) {
    return true;
  }
  if (r.bank_statement_id != null && Number(r.bank_statement_id) > 0) return true;
  if (r.payment_attempt_id != null && Number(r.payment_attempt_id) > 0) return true;
  return false;
}

function fmtReconDateTime(raw: string | null | undefined): string {
  if (raw == null || String(raw).trim() === "") return "—";
  const d = new Date(raw);
  if (!Number.isNaN(d.getTime())) {
    return d.toLocaleString("es-VE", {
      day: "2-digit",
      month: "2-digit",
      year: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    });
  }
  return String(raw);
}

function fmtReconMoneyBs(v: number | string | null | undefined): string {
  if (v == null || v === "") return "—";
  const n = Number(v);
  if (!Number.isFinite(n)) return "—";
  return `${n.toLocaleString("es-VE", {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  })} Bs`;
}

function isSoOmnichannelId(id: string | number | null | undefined): boolean {
  return /^so-\d+$/i.test(String(id ?? "").trim());
}

/** Línea de detalle de conciliación: solo valor (sin etiqueta). */
function ReconValLine({ children }: { children: ReactNode }) {
  return (
    <div className="c-pago-recon__ln c-pago-recon__ln--val-only">
      <span className="c-pago-recon__mono">{children}</span>
    </div>
  );
}

function PedidosPaymentReconcileBlock({
  sale,
  onReconcile,
}: {
  sale: Sale;
  onReconcile?: (s: Sale) => void;
}) {
  const soOmnichannel = isSoOmnichannelId(sale.id);
  const canBankReconcile = Boolean(onReconcile && soOmnichannel);
  const pr = sale.payment_reconciliation;
  const linked = saleHasPaymentLink(sale);
  const manual =
    pr?.resolved_by === "manual_ui" ||
    (pr?.match_level != null && Number(pr.match_level) >= 3);
  const auto = linked && !manual;
  const b = pr?.bank;
  const pa = pr?.payment_attempt;
  const fu = pa?.firebase_url?.trim() ?? "";

  /** Monto + referencia visibles fuera del acordeón (prioridad extracto bancario, luego comprobante WA). */
  let prominentAmount: string | null = null;
  let prominentRef: string | null = null;
  if (linked) {
    if (b && b.amount != null && String(b.amount).trim() !== "") {
      prominentAmount = fmtReconMoneyBs(b.amount);
      if (b.reference_number != null && String(b.reference_number).trim() !== "") {
        prominentRef = String(b.reference_number).trim();
      }
    } else if (pa?.extracted_amount_bs != null && String(pa.extracted_amount_bs).trim() !== "") {
      prominentAmount = fmtReconMoneyBs(pa.extracted_amount_bs);
      if (pa.extracted_reference != null && String(pa.extracted_reference).trim() !== "") {
        prominentRef = String(pa.extracted_reference).trim();
      }
    }
    if (!prominentRef && !pr && sale.reconciled_statement_id != null) {
      prominentRef = `#${sale.reconciled_statement_id}`;
    }
  }

  const reconWhenVal =
    pr?.created_at != null && String(pr.created_at).trim() !== "" ? (
      <ReconValLine>{fmtReconDateTime(pr.created_at)}</ReconValLine>
    ) : null;

  const reconFallbackExtract =
    !pr && sale.reconciled_statement_id != null ? (
      <ReconValLine>#{sale.reconciled_statement_id}</ReconValLine>
    ) : null;

  const reconBankBlock = b ? (
    <div className="c-pago-recon__bank">
      {b.tx_date != null && String(b.tx_date).trim() !== "" ? (
        <ReconValLine>{fmtReconDateTime(String(b.tx_date))}</ReconValLine>
      ) : null}
      {b.amount != null && String(b.amount).trim() !== "" ? (
        <ReconValLine>{fmtReconMoneyBs(b.amount)}</ReconValLine>
      ) : null}
      {b.reference_number != null && String(b.reference_number).trim() !== "" ? (
        <ReconValLine>{String(b.reference_number)}</ReconValLine>
      ) : null}
      {b.payment_type != null && String(b.payment_type).trim() !== "" ? (
        <ReconValLine>{String(b.payment_type)}</ReconValLine>
      ) : null}
      {b.description != null && String(b.description).trim() !== "" ? (
        <div className="c-pago-recon__desc" title={String(b.description)}>
          {String(b.description).length > 140
            ? `${String(b.description).slice(0, 137)}…`
            : String(b.description)}
        </div>
      ) : null}
    </div>
  ) : null;

  const reconWaBlock =
    pa &&
    (fu ||
      pa.extracted_amount_bs != null ||
      (pa.extracted_date != null && String(pa.extracted_date).trim() !== "") ||
      (pa.extracted_reference != null && String(pa.extracted_reference).trim() !== "")) ? (
      <div className="c-pago-recon__wa">
        {pa.extracted_amount_bs != null ? (
          <ReconValLine>{fmtReconMoneyBs(pa.extracted_amount_bs)}</ReconValLine>
        ) : null}
        {pa.extracted_date != null && String(pa.extracted_date).trim() !== "" ? (
          <ReconValLine>{fmtReconDateTime(String(pa.extracted_date))}</ReconValLine>
        ) : null}
        {pa.extracted_reference != null && String(pa.extracted_reference).trim() !== "" ? (
          <ReconValLine>{String(pa.extracted_reference)}</ReconValLine>
        ) : null}
        {pa.extracted_bank != null && String(pa.extracted_bank).trim() !== "" ? (
          <ReconValLine>{String(pa.extracted_bank)}</ReconValLine>
        ) : null}
        {pa.extracted_payment_type != null && String(pa.extracted_payment_type).trim() !== "" ? (
          <ReconValLine>{String(pa.extracted_payment_type)}</ReconValLine>
        ) : null}
        {fu && linked ? (
          <a
            href={fu}
            target="_blank"
            rel="noopener noreferrer"
            className="c-pago-recon__img-a"
            onClick={(e) => e.stopPropagation()}
          >
            <img
              src={fu}
              alt={auto ? "Comprobante (conciliación automática)" : "Comprobante (conciliación manual)"}
              className="c-pago-recon__thumb"
            />
          </a>
        ) : null}
      </div>
    ) : null;

  const reconDetailPanel = (
    <>
      {reconWhenVal}
      {reconFallbackExtract}
      {reconBankBlock}
      {reconWaBlock}
    </>
  );

  const detailsCls =
    `c-pago-recon-details${auto ? " c-pago-recon-details--auto" : " c-pago-recon-details--manual"}`;

  return (
    <div
      className="c-pago-recon"
      onClick={(e) => e.stopPropagation()}
      onMouseDown={(e) => e.stopPropagation()}
    >
      {linked && (prominentAmount != null || prominentRef != null) ? (
        <div
          className="c-pago-recon-prominent"
          onClick={(e) => e.stopPropagation()}
          onMouseDown={(e) => e.stopPropagation()}
        >
          {prominentAmount != null ? (
            <div className="c-pago-recon-prominent__amt">{prominentAmount}</div>
          ) : null}
          {prominentRef != null ? (
            <div className="c-pago-recon-prominent__ref" title={prominentRef}>
              {prominentRef}
            </div>
          ) : null}
        </div>
      ) : null}
      {linked ? (
        <details
          className={detailsCls}
          onClick={(e) => e.stopPropagation()}
          onMouseDown={(e) => e.stopPropagation()}
        >
          <summary
            className="c-pago-recon-details__summary"
            onClick={(e) => e.stopPropagation()}
            aria-label={auto ? "Ver más datos de conciliación automática" : "Ver más datos de conciliación manual"}
          >
            <span className="c-pago-recon-details__sum-lb">
              {auto ? "Automática" : "Manual"}
            </span>
            <i className="ti ti-chevron-down c-pago-recon-details__chev" aria-hidden="true" />
          </summary>
          <div className="c-pago-recon-details__panel">{reconDetailPanel}</div>
        </details>
      ) : null}
      <div className="pd-col-act-row pd-col-act-row--start c-pago-recon__btn-row">
        <button
          type="button"
          className="c-client-edit-btn"
          disabled={!canBankReconcile}
          aria-label={
            linked
              ? `Asociar otro pago o extracto a la orden #${sale.id}`
              : `Vincular pago para orden #${sale.id}`
          }
          title={
            !canBankReconcile
              ? !soOmnichannel
                ? "Solo pedidos omnicanal (so-*)."
                : "Sin acción de conciliación disponible."
              : linked
                ? "Vincular otro extracto o ajuste de conciliación."
                : "Vincular pago bancario a esta orden"
          }
          onClick={(e) => {
            e.stopPropagation();
            if (!canBankReconcile) return;
            onReconcile!(sale);
          }}
        >
          <i className="ti ti-credit-card" aria-hidden="true" />
          {linked ? "Asociar otro" : "Vincular pago"}
        </button>
      </div>
    </div>
  );
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

/** ML con cotización: totales de presupuesto (mismo formato que columna Total) dentro de details. */
function MlQuoteTotalsDetails({
  saleForEquiv,
  quoteTotUsdNum,
  bcvRate,
  binanceRate,
  variant = "table",
}: {
  saleForEquiv: Sale;
  quoteTotUsdNum: number;
  bcvRate: number | null;
  binanceRate: number | null;
  variant?: "table" | "card";
}) {
  const quoteVes =
    bcvRate != null && Number(bcvRate) > 0
      ? quoteTotUsdNum * Number(bcvRate)
      : 0;
  const showQuoteVes = quoteVes > 0;
  const cls =
    variant === "card"
      ? "c-total-q-details c-total-q-details--card"
      : "c-total-q-details";
  return (
    <details
      className={cls}
      onClick={(e) => e.stopPropagation()}
      onMouseDown={(e) => e.stopPropagation()}
    >
      <summary
        className="c-total-q-details__sum"
        onClick={(e) => e.stopPropagation()}
        onMouseDown={(e) => e.stopPropagation()}
        aria-label="Ver totales de cotización (presupuesto CRM)"
      >
        <span className="c-total-q-details__sum-lb">Cotización</span>
        <i className="ti ti-chevron-down c-total-q-details__chev" aria-hidden="true" />
      </summary>
      <div
        className="c-total-q-details__panel"
        onClick={(e) => e.stopPropagation()}
        onMouseDown={(e) => e.stopPropagation()}
      >
        <div className="c-total-q-details__hint small text-muted">Total cotización</div>
        {quoteTotUsdNum > 0 ? (
          <div className="total-usd">
            <span className="c">USD</span>
            {quoteTotUsdNum.toLocaleString("es-VE", {
              minimumFractionDigits: 2,
              maximumFractionDigits: 2,
            })}
          </div>
        ) : null}
        <div className="total-ves total-ves--in-quote-details">
          <span className="c">{showQuoteVes ? "Bs." : "USD"}</span>
          {showQuoteVes
            ? quoteVes.toLocaleString("es-VE", {
                minimumFractionDigits: 2,
                maximumFractionDigits: 2,
              })
            : quoteTotUsdNum > 0
              ? quoteTotUsdNum.toLocaleString("es-VE", {
                  minimumFractionDigits: 2,
                  maximumFractionDigits: 2,
                })
              : "—"}
        </div>
        <TotalUsdEquivLines
          sale={saleForEquiv}
          bcvRate={bcvRate}
          binanceRate={binanceRate}
        />
      </div>
    </details>
  );
}

interface RowProps {
  sale: Sale;
  viewerRole: string | null | undefined;
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
  viewerRole,
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

  /**
   * ML + cotización: totales visibles = orden ML (Bs verde grande como antes).
   * Montos del presupuesto CRM en `MlQuoteTotalsDetails` (expandible).
   */
  const useMlQuoteTotals =
    isMl &&
    sale.quote_preview != null &&
    Number(sale.quote_preview.id) > 0 &&
    sale.quote_preview.total != null &&
    Number.isFinite(Number(sale.quote_preview.total)) &&
    Number(sale.quote_preview.total) > 0;
  const quoteTotUsdNum = useMlQuoteTotals ? Number(sale.quote_preview!.total) : null;
  const saleForEquivQuote: Sale =
    useMlQuoteTotals && quoteTotUsdNum != null && bcvRate != null && Number(bcvRate) > 0
      ? {
          ...sale,
          total_amount_bs: quoteTotUsdNum * Number(bcvRate),
          order_total_amount: quoteTotUsdNum,
          rate_type: undefined as unknown as Sale["rate_type"],
        }
      : sale;

  const canSubmitMlSellerFeedback =
    Boolean(onOpenMlSellerFeedback) &&
    !isClosed &&
    statusNorm !== "cancelled" &&
    isMlSellerFeedbackPending(sale);
  const showMlSellerFeedbackActions =
    isMl &&
    sale.ml_user_id != null &&
    sale.ml_api_order_id != null &&
    canSubmitMlSellerFeedback;

  const canOpenQuote =
    Boolean(onOpenQuote) && saleCanOpenQuoteModal(sale);
  const hasActiveQuotePreview = saleHasActiveQuotePreview(sale);

  /** Listado omnicanal: ids `so-<n>` editan pago y logística; `pos-*` y otros quedan solo lectura. */
  const canEditFulfillment = isSoOmnichannelId(sale.id);

  const handleRowKey = (e: KeyboardEvent) => {
    if (e.key === "Enter" || e.key === " ") {
      e.preventDefault();
      onRowClick(sale.id);
    }
  };

  /** Sin botón “Cliente” a bandeja; se mantiene Editar + Mensajería ML. */
  const clientActionsRow =
    custContact.editClientButton != null || (isMl && onOpenMlMessaging) ? (
      <div
        className="pd-col-act-row pd-col-act-row--start pd-col-act-row--client-line"
        onClick={(e) => e.stopPropagation()}
        onMouseDown={(e) => e.stopPropagation()}
      >
        {custContact.editClientButton}
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
      </div>
    ) : null;

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
            </div>
            <div className="c-order-id-line">
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
                  aria-label={
                    hasActiveQuotePreview
                      ? `Editar cotización de la orden #${sale.id}`
                      : `Cotización orden #${sale.id}`
                  }
                  title={
                    sale.chat_id != null && String(sale.chat_id).trim() !== ""
                      ? hasActiveQuotePreview
                        ? "Editar el presupuesto en CRM (mismo que en Bandeja)."
                        : "Abrir cotización CRM (mismo presupuesto que en Bandeja)."
                      : hasActiveQuotePreview
                        ? "Editar cotización: se abre el presupuesto vinculado a este pedido."
                        : "Mercado Libre: abrí la cotización. Si falta chat CRM, vinculá la conversación en Bandeja."
                  }
                  onClick={(e) => {
                    e.stopPropagation();
                    onOpenQuote!(sale);
                  }}
                >
                  <i className="ti ti-file-invoice" aria-hidden="true" />
                  {hasActiveQuotePreview ? "Editar cotización" : "Cotización"}
                </button>
              ) : null
            }
          />
        </td>

        {/* Col 3 · Cliente */}
        <td data-label="Cliente" className="ord-col-cliente">
          <>
            <PedidosCustomerContactView
              variant="table"
              sale={sale}
              custLabel={custLabel}
              custIni={custIni}
              custAv={custAv}
              phonesBlock={custContact.phonesBlock}
              clientActions={clientActionsRow}
            />
            {custContact.editModal}
          </>
        </td>

        {/* Col 4 · Total */}
        <td data-label="Total" style={{ textAlign: "left" }}>
          <div className="c-total">
            {useMlQuoteTotals ? (
              <div className="small text-muted mb-1" style={{ fontSize: "0.7rem" }}>
                Orden ML
              </div>
            ) : null}
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
            {useMlQuoteTotals && quoteTotUsdNum != null && quoteTotUsdNum > 0 ? (
              <MlQuoteTotalsDetails
                saleForEquiv={saleForEquivQuote}
                quoteTotUsdNum={quoteTotUsdNum}
                bcvRate={bcvRate}
                binanceRate={binanceRate}
                variant="table"
              />
            ) : null}
          </div>
        </td>

        {/* Col 5 · Pago — mismo contenedor/fila que Logística (`c-logistics` + `logi-ft-row--select-only`) */}
        <td data-label="Pago">
          <div className="c-logistics pedidos-pago-col">
            <div className="logi-row logi-ft-row logi-ft-row--select-only">
              <OrderPaymentMethodSelect
                sale={sale}
                viewerRole={viewerRole}
                disabled={!canEditFulfillment}
                onCommitted={async () => {
                  await onFulfillmentUpdated?.();
                }}
              />
            </div>
            <PedidosPaymentReconcileBlock sale={sale} onReconcile={onReconcile} />
          </div>
        </td>

        {/* Col 6 · Logística — forma de entrega editable; almacén/stock pendiente backend */}
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
              className="logi-stock-dispatch-row logi-stock-dispatch-row--forced-row"
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

        {/* Col 7 · Estado */}
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
            {showMlSellerFeedbackActions ? (
              <div
                className="ml-seller-fb-block"
                onClick={(e) => e.stopPropagation()}
                onMouseDown={(e) => e.stopPropagation()}
              >
                <div className="pd-col-act-row">
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
                </div>
              </div>
            ) : null}
          </div>
        </td>
      </tr>

      {/* ── Mobile card row ───────────────────────────── */}
      <tr
        className="ord-card-row"
        aria-hidden="true"
        onClick={() => onRowClick(sale.id)}
      >
        <td className="ord-card" colSpan={7}>
          <div className="ord-card-inner">
            <div className="ord-card-header">
              <div className="ord-card-source-line">
                <div className={`origin-chip origin-chip--inline ${ch.key}`}>
                  <span className="dt" />
                  {ch.label}
                </div>
              </div>
              <div className="ord-card-order-line">
                <span className="ord-card-id">#{sale.id}</span>
                <span className="ord-card-date">{fmtDate(sale.created_at)}</span>
              </div>
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
                      aria-label={
                        hasActiveQuotePreview
                          ? `Editar cotización orden #${sale.id}`
                          : `Cotización orden #${sale.id}`
                      }
                      title={
                        sale.chat_id != null &&
                        String(sale.chat_id).trim() !== ""
                          ? hasActiveQuotePreview
                            ? "Editar presupuesto CRM (Bandeja)."
                            : "Cotización CRM (Bandeja)."
                          : hasActiveQuotePreview
                            ? "Editar cotización vinculada a este pedido."
                            : "Cotización ML — vinculá el chat en Bandeja si falta."
                      }
                      onClick={(e) => {
                        e.stopPropagation();
                        onOpenQuote!(sale);
                      }}
                    >
                      <i className="ti ti-file-invoice" aria-hidden="true" />
                      {hasActiveQuotePreview ? "Editar c." : "Cotiz."}
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
                clientActions={clientActionsRow}
              />
            </div>

            <div className="ord-card-totals" onClick={(e) => e.stopPropagation()}>
              <div className="ord-card-total-stack">
                {useMlQuoteTotals ? (
                  <span className="small text-muted d-block mb-1" style={{ fontSize: "0.65rem" }}>
                    Orden ML
                  </span>
                ) : null}
                <span className="ord-card-ves">
                  {usd > 0
                    ? `$${usd.toLocaleString("es-VE", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`
                    : "—"}
                </span>
                {showVes && (
                  <span className="ord-card-ves d-block" style={{ fontSize: "0.85rem", marginTop: 4 }}>
                    Bs.{" "}
                    {vesAmt.toLocaleString("es-VE", {
                      minimumFractionDigits: 2,
                      maximumFractionDigits: 2,
                    })}
                  </span>
                )}
                <TotalUsdEquivLines
                  sale={sale}
                  bcvRate={bcvRate}
                  binanceRate={binanceRate}
                />
                {useMlQuoteTotals && quoteTotUsdNum != null && quoteTotUsdNum > 0 ? (
                  <MlQuoteTotalsDetails
                    saleForEquiv={saleForEquivQuote}
                    quoteTotUsdNum={quoteTotUsdNum}
                    bcvRate={bcvRate}
                    binanceRate={binanceRate}
                    variant="card"
                  />
                ) : null}
              </div>
            </div>

            <div className="ord-card-pago" onClick={(e) => e.stopPropagation()}>
              <span className="ord-card-pago-lb">Pago</span>
              <div className="logi-row logi-ft-row logi-ft-row--select-only ord-card-pago-select-wrap">
                <OrderPaymentMethodSelect
                  sale={sale}
                  viewerRole={viewerRole}
                  disabled={!canEditFulfillment}
                  onCommitted={async () => {
                    await onFulfillmentUpdated?.();
                  }}
                />
              </div>
              <PedidosPaymentReconcileBlock sale={sale} onReconcile={onReconcile} />
            </div>

            <div className="ord-card-logi" onClick={(e) => e.stopPropagation()}>
              <span className="ord-card-logi-lb">Logística</span>
              <div className="ord-card-logi-inner">
                <LogisticsFulfillmentSelect
                  saleId={sale.id}
                  value={sale.fulfillment_type}
                  disabled={!canEditFulfillment}
                  onCommitted={async () => {
                    await onFulfillmentUpdated?.();
                  }}
                />
                <div className="logi-stock-dispatch-row logi-stock-dispatch-row--forced-row ord-card-logi-stock">
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
                      Despacho
                    </button>
                  ) : null}
                </div>
              </div>
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
              {showMlSellerFeedbackActions ? (
                <div
                  className="ml-seller-fb-block ml-seller-fb-block--card"
                  onClick={(e) => e.stopPropagation()}
                  onMouseDown={(e) => e.stopPropagation()}
                >
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
                </div>
              ) : null}
            </div>
          </div>
        </td>
      </tr>
    </>
  );
}

// ─── Skeleton rows ─────────────────────────────────────────────────────────────

const SK_WIDTHS = [64, 78, 64, 68, 56, 72, 82];

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
          {i < 5 && (
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
  /** Rol JWT (catálogo VES extendido para admin/supervisor/contador). */
  viewerRole?: string | null;
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
  viewerRole = null,
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
          <th scope="col">
            Total <span className="sort" aria-hidden="true">↕</span>
          </th>
          <th scope="col">Pago</th>
          <th scope="col">Logística</th>
          <th scope="col" className="right">
            Estado <span className="sort" aria-hidden="true">↕</span>
          </th>
        </tr>
      </thead>
      <tbody>
        {loading ? (
          Array.from({ length: 7 }, (_, i) => <SkeletonRow key={i} idx={i} />)
        ) : sales.length === 0 ? (
          <tr className="ord-row" style={{ cursor: "default" }}>
            <td colSpan={7} style={{ padding: 0, border: "none" }}>
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
              viewerRole={viewerRole}
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
