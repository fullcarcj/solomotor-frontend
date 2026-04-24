"use client";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useCallback, useEffect, useMemo, useState, type CSSProperties, type ReactNode } from "react";
import type { InboxChat } from "@/types/inbox";
import { bandejaMlQuestionPipelineStage, isMlQuestionThreadChat } from "@/types/inbox";
import PipelineMini from "@/app/(features)/bandeja/components/PipelineMini";
import type { CustomerDetail } from "@/types/customers";
import type { Sale } from "@/types/sales";
import SaleStatusBadge from "@/app/(features)/ventas/pedidos/components/SaleStatusBadge";
import { IdentifyCustomerSection } from "@/app/(features)/bandeja/components/IdentifyCustomerSection";
import BotActionsTimeline from "@/components/bandeja/BotActionsTimeline";
import ExceptionsPanel from "@/components/bandeja/ExceptionsPanel";
import LinkMlOrderModal from "./LinkMlOrderModal";
import LinkCustomerModal from "./LinkCustomerModal";
import QuotePanel from "./QuotePanel";
import PaymentLinkPanel from "./PaymentLinkPanel";
import PriceAdjustPanel from "./PriceAdjustPanel";
import { useCurrentUser } from "@/hooks/useCurrentUser";
import OperativeFranjaSection from "@/app/(features)/bandeja/components/OperativeFranjaSection";
import {
  OpFranjaActionButton,
  opFranjaActionButtonStyle,
} from "@/app/(features)/bandeja/components/operativeFranjaShared";
import "@/app/(features)/supervisor/supervisor-theme.scss";

type ActionType = "quote" | "pay" | "pos" | "dispatch" | null;

/** Marca/desmarca un chat como interno (NO CLIENTE). */
async function toggleOperational(chatId: string, currentlyOperational: boolean): Promise<boolean> {
  if (currentlyOperational) {
    const res = await fetch(
      `/api/inbox/whitelist/mark-chat/${encodeURIComponent(chatId)}`,
      { method: "DELETE", credentials: "include" }
    );
    return res.ok;
  }
  const res = await fetch("/api/inbox/whitelist/mark-chat", {
    method: "POST",
    credentials: "include",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ chat_id: Number(chatId) }),
  });
  return res.ok;
}

interface Props {
  chatId:            string;
  chat:              InboxChat | null;
  customerId:        number | string | null;
  customer:          CustomerDetail | null;
  recentOrders:      Sale[];
  loadingCustomer:   boolean;
  loadingOrders:     boolean;
  activeAction:      ActionType;
  onSetAction:       (a: ActionType) => void;
  onCustomerLinked?: () => void;
  onOrderLinked?:    () => void;
  /** Abre el modal de edición de cliente (zona Cliente). */
  onEditCustomer?:   () => void;
}

/* ── Utilidades ──────────────────────────────────────────────── */

function initials(name: string | null | undefined): string {
  if (!name) return "?";
  return name.trim().split(/\s+/).slice(0, 2).map(w => w[0]?.toUpperCase() ?? "").join("");
}

function fmtDate(iso: string | null): string {
  if (!iso) return "—";
  try {
    return new Date(iso).toLocaleDateString("es-VE", { day: "2-digit", month: "short", year: "numeric" });
  } catch { return iso; }
}

function fmtUSD(v: number | string | null | undefined): string {
  if (v == null) return "—";
  const n = Number(v);
  return Number.isFinite(n) ? `$${n.toFixed(2)}` : "—";
}

function trimCustomerStr(v: string | null | undefined): string {
  return v != null && String(v).trim() !== "" ? String(v).trim() : "";
}

/** Una línea `tel1 / tel2` para resumen colapsado y ficha expandida. */
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

/* ── Skeleton ──────────────────────────────────────────────────*/
function Skeleton({ rows = 3 }: { rows?: number }) {
  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 6 }}>
      {Array.from({ length: rows }).map((_, i) => (
        <div
          key={i}
          className="mu-skeleton"
          style={{ height: 12, width: i % 2 === 0 ? "100%" : "70%", borderRadius: 4 }}
        />
      ))}
    </div>
  );
}

/* ── Sección Orden ML (ml_message con ml_order_id) ─────────────── */

interface MlOrderItem {
  ml_item_id:     string | null;
  title:          string | null;
  quantity:       number | null;
  unit_price:     number | null;
  currency_id:    string | null;
  seller_sku:     string | null;
  thumbnail:      string | null;
  listing_status: string | null;
  product: {
    sku:         string;
    name:        string;
    description: string | null;
    category:    string | null;
    price_usd:   number | null;
  } | null;
  wms_locations: {
    bin_code:       string;
    aisle_code:     string;
    shelf_code:     string;
    warehouse_code: string;
    qty_available:  number;
    qty_reserved:   number;
  }[];
}

interface MlOrderData {
  ml_order_id:  number | string;
  order_status: string | null;
  total_amount: number | null;
  currency_id:  string | null;
  date_created: string | null;
  items:        MlOrderItem[];
  not_synced?:  boolean;
}

function fmtCurrency(amount: number | null, currency: string | null): string {
  if (amount == null) return "—";
  const sym = currency === "USD" ? "$" : currency === "VES" ? "Bs." : (currency ?? "");
  return `${sym} ${amount.toLocaleString("es-VE", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
}

/** Delay antes de fetches de paneles secundarios: deja pasar los fetches críticos (mensajes + contexto) */
const SECONDARY_FETCH_DELAY_MS = 300;

/** Sub-bloque dentro de «Mercado Libre» (franja única). */
function MlEmbeddedWrap({
  label,
  first,
  children,
}: {
  label: string;
  /** Sin borde superior (primer bloque del acordeón ML). */
  first?: boolean;
  children: ReactNode;
}) {
  return (
    <div
      style={{
        paddingTop: first ? 2 : 12,
        marginTop: first ? 0 : 4,
        borderTop: first ? "none" : "1px solid var(--mu-border, rgba(255,255,255,0.08))",
      }}
    >
      <div
        style={{
          fontSize: 8,
          fontWeight: 800,
          letterSpacing: "0.12em",
          textTransform: "uppercase",
          color: "var(--mu-ink-mute, #8b949e)",
          marginBottom: 8,
        }}
      >
        {label}
      </div>
      {children}
    </div>
  );
}

function MlOrderSection({
  chatId,
  panelTitle,
  embedded,
  embeddedFirst,
}: {
  chatId: string;
  panelTitle?: string | null;
  /** Contenido solo, dentro del acordeón «Mercado Libre». */
  embedded?: boolean;
  /** Primer sub-bloque del padre (sin separador superior). */
  embeddedFirst?: boolean;
}) {
  const [loading, setLoading] = useState(true);
  const [data, setData]       = useState<MlOrderData | null>(null);
  const [error, setError]     = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;
    setLoading(true); setError(null);
    const timer = setTimeout(() => {
      void (async () => {
        try {
          const res = await fetch(`/api/inbox/${encodeURIComponent(chatId)}/ml-order`, {
            credentials: "include", cache: "no-store",
          });
          const j = await res.json().catch(() => null) as MlOrderData | null;
          if (cancelled) return;
          if (!res.ok) { setError("No se pudo cargar la orden"); return; }
          setData(j);
        } catch {
          if (!cancelled) setError("No se pudo cargar la orden");
        } finally {
          if (!cancelled) setLoading(false);
        }
      })();
    }, SECONDARY_FETCH_DELAY_MS);
    return () => { cancelled = true; clearTimeout(timer); };
  }, [chatId]);

  const titleBar = panelTitle != null && String(panelTitle).trim() !== "" ? String(panelTitle).trim() : "Orden ML";

  if (loading) {
    const inner = <Skeleton rows={4} />;
    if (embedded) {
      return (
        <MlEmbeddedWrap label={titleBar} first={embeddedFirst}>
          {inner}
        </MlEmbeddedWrap>
      );
    }
    return (
      <OperativeFranjaSection
        accent="orange"
        iconClass="ti ti-shopping-cart"
        title={titleBar}
        subtitle="Cargando detalle · click para abrir"
        subtitleHighlight={false}
        defaultOpen
        resetKey={chatId}
      >
        {inner}
      </OperativeFranjaSection>
    );
  }
  if (error) {
    const inner = <p style={{ fontSize: 11, color: "var(--mu-bad)", margin: 0 }}>{error}</p>;
    if (embedded) {
      return (
        <MlEmbeddedWrap label={titleBar} first={embeddedFirst}>
          {inner}
        </MlEmbeddedWrap>
      );
    }
    return (
      <OperativeFranjaSection
        accent="orange"
        iconClass="ti ti-shopping-cart"
        title={titleBar}
        subtitle="Error al cargar · click para abrir"
        subtitleHighlight={false}
        defaultOpen
        resetKey={chatId}
      >
        {inner}
      </OperativeFranjaSection>
    );
  }
  if (!data) return null;
  if (data.not_synced) {
    const inner = (
      <p style={{ fontSize: 11, color: "var(--mu-ink-mute)", margin: 0 }}>Orden no sincronizada aún.</p>
    );
    if (embedded) {
      return (
        <MlEmbeddedWrap label={`${titleBar} · #${data.ml_order_id}`} first={embeddedFirst}>
          {inner}
        </MlEmbeddedWrap>
      );
    }
    return (
      <OperativeFranjaSection
        accent="orange"
        iconClass="ti ti-shopping-cart"
        title={`${titleBar} · #${data.ml_order_id}`}
        subtitle="Orden no sincronizada · click para abrir"
        subtitleHighlight
        defaultOpen
        resetKey={chatId}
      >
        {inner}
      </OperativeFranjaSection>
    );
  }

  const orderUrl = `https://www.mercadolibre.com.ve/ventas/${data.ml_order_id}/detalle`;

  const orderBody = (
    <>
      {/* Estado y total */}
      <div style={{
        display: "flex", alignItems: "center", gap: 8, marginBottom: 10,
        fontSize: 10, color: "var(--mu-ink-mute)",
      }}>
        {data.order_status && (
          <span style={{
            fontSize: 9, fontWeight: 700, textTransform: "uppercase",
            padding: "2px 6px", borderRadius: 4,
            background: data.order_status === "paid" ? "rgba(22,163,74,0.12)" : "var(--mu-panel-2)",
            color: data.order_status === "paid" ? "#16a34a" : "var(--mu-ink-mute)",
          }}>
            {data.order_status}
          </span>
        )}
        {data.total_amount != null && (
          <span style={{ marginLeft: "auto", fontWeight: 600, color: "var(--mu-ink)" }}>
            {fmtCurrency(data.total_amount, data.currency_id)}
          </span>
        )}
      </div>

      {/* Ítems */}
      <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
        {data.items.map((it, idx) => (
          <div key={it.ml_item_id ?? idx} style={{
            background: "var(--mu-panel-2)", borderRadius: 8,
            border: "1px solid var(--mu-line)", padding: "8px 10px",
            display: "flex", flexDirection: "column", gap: 6,
          }}>
            {/* Imagen + título */}
            <div style={{ display: "flex", gap: 8, alignItems: "flex-start" }}>
              {it.thumbnail ? (
                /* eslint-disable-next-line @next/next/no-img-element */
                <img src={it.thumbnail} alt={it.title ?? "Producto"}
                     style={{ width: 56, height: 56, objectFit: "cover", borderRadius: 6,
                              border: "1px solid var(--mu-line)", flexShrink: 0 }} />
              ) : (
                <div style={{
                  width: 56, height: 56, borderRadius: 6, flexShrink: 0,
                  background: "var(--mu-panel)", border: "1px solid var(--mu-line)",
                  display: "flex", alignItems: "center", justifyContent: "center",
                  color: "var(--mu-ink-mute)",
                }}>
                  <i className="ti ti-package" style={{ fontSize: 22 }} />
                </div>
              )}
              <div style={{ flex: 1, minWidth: 0 }}>
                <div style={{
                  fontSize: 11, fontWeight: 600, color: "var(--mu-ink)", lineHeight: 1.35,
                  display: "-webkit-box", WebkitLineClamp: 2,
                  WebkitBoxOrient: "vertical", overflow: "hidden",
                }}>
                  {it.product?.name ?? it.title ?? "—"}
                </div>
                {it.seller_sku && (
                  <div style={{ fontSize: 9, fontFamily: "monospace", color: "var(--mu-ink-mute)", marginTop: 2 }}>
                    SKU: {it.seller_sku}
                  </div>
                )}
              </div>
            </div>

            {/* Cantidad + precio */}
            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 4 }}>
              <div style={{ background: "var(--mu-panel)", borderRadius: 6, padding: "4px 8px" }}>
                <div style={{ fontSize: 8, color: "var(--mu-ink-mute)", textTransform: "uppercase" }}>Cantidad</div>
                <div style={{ fontSize: 13, fontWeight: 700, color: "var(--mu-ink)" }}>{it.quantity ?? "—"}</div>
              </div>
              <div style={{ background: "var(--mu-panel)", borderRadius: 6, padding: "4px 8px" }}>
                <div style={{ fontSize: 8, color: "var(--mu-ink-mute)", textTransform: "uppercase" }}>Precio unit.</div>
                <div style={{ fontSize: 13, fontWeight: 700, color: "var(--mu-ink)" }}>
                  {fmtCurrency(it.unit_price, it.currency_id)}
                </div>
              </div>
            </div>

            {/* Producto interno (si resuelto) */}
            {it.product && (
              <div style={{ fontSize: 10, color: "var(--mu-ink-dim)", borderTop: "1px solid var(--mu-line)", paddingTop: 5, display: "flex", gap: 6, alignItems: "center", flexWrap: "wrap" }}>
                <i className="ti ti-box" style={{ fontSize: 11 }} />
                <span style={{ fontFamily: "monospace", fontSize: 9 }}>{it.product.sku}</span>
                {it.product.category && (
                  <span style={{ fontSize: 9, background: "var(--mu-panel)", padding: "1px 5px", borderRadius: 4 }}>
                    {it.product.category}
                  </span>
                )}
                <Link
                  href={`/inventario/productos?search=${encodeURIComponent(it.product.sku)}`}
                  target="_blank"
                  className="mu-ficha-link"
                  style={{ marginLeft: "auto", fontSize: 9 }}
                >
                  VER INVENTARIO →
                </Link>
              </div>
            )}

            {/* Ubicaciones WMS */}
            {it.wms_locations.length > 0 && (
              <div style={{ borderTop: "1px solid var(--mu-line)", paddingTop: 5 }}>
                <div style={{ fontSize: 8, color: "var(--mu-ink-mute)", textTransform: "uppercase", marginBottom: 4, display: "flex", alignItems: "center", gap: 4 }}>
                  <i className="ti ti-map-pin" style={{ fontSize: 10 }} />
                  Ubicaciones en almacén
                </div>
                <div style={{ display: "flex", flexWrap: "wrap", gap: 4 }}>
                  {it.wms_locations.map((loc, i) => (
                    <div key={i} style={{
                      fontSize: 9, fontFamily: "monospace",
                      background: "rgba(22,163,74,0.10)", color: "#16a34a",
                      padding: "2px 6px", borderRadius: 4, fontWeight: 600,
                      display: "flex", gap: 4, alignItems: "center",
                    }}>
                      <i className="ti ti-current-location" style={{ fontSize: 9 }} />
                      {loc.bin_code}
                      <span style={{ fontWeight: 400, color: "#15803d" }}>×{loc.qty_available}</span>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Sin stock en WMS */}
            {it.product && it.wms_locations.length === 0 && (
              <div style={{ fontSize: 9, color: "#d97706", display: "flex", alignItems: "center", gap: 4, paddingTop: 3, borderTop: "1px solid var(--mu-line)" }}>
                <i className="ti ti-alert-triangle" style={{ fontSize: 10 }} />
                Sin stock en almacén
              </div>
            )}
          </div>
        ))}
      </div>
    </>
  );

  if (embedded) {
    return (
      <MlEmbeddedWrap label={titleBar} first={embeddedFirst}>
        <div style={{ display: "flex", justifyContent: "flex-end", marginBottom: 8 }}>
          <a href={orderUrl} target="_blank" rel="noopener noreferrer" className="mu-ficha-link">
            VER ORDEN EN ML →
          </a>
        </div>
        {orderBody}
      </MlEmbeddedWrap>
    );
  }

  return (
    <OperativeFranjaSection
      accent="orange"
      iconClass="ti ti-shopping-cart"
      title={titleBar}
      subtitle={`#${String(data.ml_order_id)} · ítems y totales · click para abrir`}
      subtitleHighlight
      defaultOpen
      resetKey={chatId}
      titleAside={(
        <a href={orderUrl} target="_blank" rel="noopener noreferrer" className="mu-ficha-link">
          VER ORDEN EN ML →
        </a>
      )}
    >
      {orderBody}
    </OperativeFranjaSection>
  );
}

/* ── Contexto ML: publicación + (opcional) texto de pregunta en ficha ── */

interface MlItemListing {
  title:     string | null;
  price:     number | null;
  currency:  string | null;
  status:    string | null;
  stock:     number | null;
  sold:      number | null;
  permalink: string | null;
  thumbnail: string | null;
  category:  string | null;
}

interface MlQuestionData {
  question_id:       number | null;
  item_id:           string | null;
  question_text:     string | null;
  ml_status:         string | null;
  buyer_id:          number | null;
  date_created:      string | null;
  ia_already_answered: boolean;
  item_listing:      MlItemListing | null;
  _sync_debug?:      Record<string, unknown> | null;
}

function mlVeItemUrl(itemIdRaw: string | null | undefined, permalink: string | null | undefined): string | null {
  if (permalink) {
    const p = permalink.trim();
    if (p.startsWith("//")) return `https:${p}`;
    if (p.startsWith("http://") || p.startsWith("https://")) return p;
  }
  if (!itemIdRaw) return null;
  let s = String(itemIdRaw).trim();
  if (s.toUpperCase().startsWith("MLV")) s = s.slice(3).replace(/^[-_]/, "");
  if (!s) return null;
  return `https://articulo.mercadolibre.com.ve/MLV-${s}`;
}

/** Enlace ML: nueva pestaña del navegador (refuerzo para WebView / contenedores que ignoran target=_blank). */
function MlExternalLink({
  href,
  className,
  style,
  children,
}: {
  href: string;
  className?: string;
  style?: CSSProperties;
  children: ReactNode;
}) {
  return (
    <a
      href={href}
      target="_blank"
      rel="noopener noreferrer"
      className={className}
      style={style}
      onClick={(e) => {
        if (e.metaKey || e.ctrlKey || e.shiftKey || e.altKey) return;
        e.preventDefault();
        window.open(href, "_blank", "noopener,noreferrer");
      }}
    >
      {children}
    </a>
  );
}

function fmtPrice(price: number | null, currency: string | null): string {
  if (price == null) return "—";
  const sym = currency === "USD" ? "$" : currency === "VES" ? "Bs." : (currency ?? "$");
  return `${sym} ${price.toLocaleString("es-VE", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
}

function truncateOperativeFranjaText(s: string, max: number): string {
  const t = s.replace(/\s+/g, " ").trim();
  if (!t) return "";
  if (t.length <= max) return t;
  return `${t.slice(0, Math.max(0, max - 1))}…`;
}

/** Resumen cabecera franja «Mercado Libre»: producto, descripción, cantidad y precio por ítem. */
function buildMlOrderOperativeSummary(data: MlOrderData | null): ReactNode {
  if (!data) return null;
  if (data.not_synced) {
    return <>Orden #{String(data.ml_order_id)} · pendiente de sincronizar en catálogo</>;
  }
  const items = data.items ?? [];
  if (items.length === 0) {
    return <>Orden #{String(data.ml_order_id)} · sin ítems en respuesta</>;
  }
  const maxItems = 3;
  const rows: ReactNode[] = [];
  for (let i = 0; i < Math.min(items.length, maxItems); i++) {
    const it = items[i];
    const productName = (it.product?.name ?? it.title ?? "—").trim();
    const descRaw = (it.product?.description ?? "").trim();
    const desc =
      descRaw && descRaw !== productName ? truncateOperativeFranjaText(descRaw, 100) : "";
    const qty = it.quantity ?? "—";
    const price = fmtCurrency(it.unit_price, it.currency_id);
    const line1 = `${truncateOperativeFranjaText(productName, 90)} · ×${qty} · ${price}`;
    rows.push(
      <div key={i} style={{ marginTop: i > 0 ? 6 : 0 }}>{line1}</div>
    );
    if (desc) {
      rows.push(
        <div
          key={`${i}-desc`}
          style={{
            fontSize: 9,
            color: "var(--mu-ink-mute)",
            marginTop: 2,
            lineHeight: 1.35,
          }}
        >
          {desc}
        </div>
      );
    }
  }
  if (items.length > maxItems) {
    rows.push(
      <div key="more" style={{ marginTop: 4, fontSize: 9, color: "var(--mu-ink-mute)" }}>
        +{items.length - maxItems} ítem(s) más
      </div>
    );
  }
  if (data.total_amount != null) {
    rows.push(
      <div key="tot" style={{ marginTop: 6, fontWeight: 600, color: "var(--mu-ink)" }}>
        Total: {fmtCurrency(data.total_amount, data.currency_id)}
      </div>
    );
  }
  return <>{rows}</>;
}

function buildListingOperativeSummary(listing: MlItemListing | null): ReactNode {
  if (!listing) {
    return <>Publicación · sin datos de anuncio aún</>;
  }
  const title = truncateOperativeFranjaText((listing.title ?? "Sin título").trim(), 96);
  const price = fmtPrice(listing.price, listing.currency);
  const stock =
    listing.stock != null ? ` · Stock ${listing.stock}` : "";
  return (
    <>
      {title}
      <div style={{ marginTop: 4, fontWeight: 600, color: "var(--mu-ink)" }}>
        {price}
        {stock}
      </div>
    </>
  );
}

function ItemStatusBadge({ status }: { status: string | null }) {
  if (!status) return null;
  const map: Record<string, { label: string; color: string; bg: string }> = {
    active:  { label: "Activa",   color: "#16a34a", bg: "rgba(22,163,74,0.12)" },
    paused:  { label: "Pausada",  color: "#d97706", bg: "rgba(217,119,6,0.12)" },
    closed:  { label: "Cerrada",  color: "#6b7280", bg: "rgba(107,114,128,0.12)" },
    under_review: { label: "En revisión", color: "#7c3aed", bg: "rgba(124,58,237,0.12)" },
  };
  const s = map[status.toLowerCase()] ?? { label: status, color: "var(--mu-ink-mute)", bg: "var(--mu-panel-2)" };
  return (
    <span style={{
      fontSize: 9, fontWeight: 600, textTransform: "uppercase", letterSpacing: "0.04em",
      padding: "2px 6px", borderRadius: 4, color: s.color, background: s.bg,
    }}>
      {s.label}
    </span>
  );
}

function MlQuestionContextSection({
  chatId,
  chat,
  hideBuyerQuestion = false,
  embedded,
  embeddedFirst,
}: {
  chatId: string;
  chat: InboxChat | null;
  /** En hilos de pregunta ML la pregunta ya está en el chat; no duplicar en la franja operativa. */
  hideBuyerQuestion?: boolean;
  /** Dentro del acordeón «Mercado Libre». */
  embedded?: boolean;
  /** Primer sub-bloque del padre (sin borde superior en el anuncio). */
  embeddedFirst?: boolean;
}) {
  const [loadingQ, setLoadingQ] = useState(true);
  const [qError, setQError]     = useState<string | null>(null);
  const [qData, setQData]       = useState<MlQuestionData | null>(null);

  useEffect(() => {
    let cancelled = false;
    setLoadingQ(true); setQError(null);
    const timer = setTimeout(() => {
      void (async () => {
        try {
          const res = await fetch(`/api/inbox/${encodeURIComponent(chatId)}/ml-question`, {
            credentials: "include", cache: "no-store",
          });
          const j = (await res.json().catch(() => null)) as MlQuestionData | null;
          if (cancelled) return;
          if (!res.ok) { setQError("No se pudo cargar la pregunta"); return; }
          setQData(j);
        } catch {
          if (!cancelled) setQError("No se pudo cargar la pregunta");
        } finally {
          if (!cancelled) setLoadingQ(false);
        }
      })();
    }, SECONDARY_FETCH_DELAY_MS);
    return () => { cancelled = true; clearTimeout(timer); };
  }, [chatId]);

  const mlUrl = useMemo(
    () => mlVeItemUrl(qData?.item_id, qData?.item_listing?.permalink),
    [qData?.item_id, qData?.item_listing?.permalink]
  );
  const listing = qData?.item_listing ?? null;

  const pubSubtitle = loadingQ
    ? "Cargando publicación… · click para abrir"
    : qError
      ? "Error al cargar · click para abrir"
      : listing
        ? "Anuncio y precio · click para abrir"
        : "Sin datos de anuncio · click para abrir";

  const publicationSubtitleHighlight =
    !loadingQ &&
    (Boolean(qError) ||
      listing != null ||
      (qData?.item_id != null && String(qData.item_id).trim() !== ""));

  const publicationMain = loadingQ ? (
          <Skeleton rows={4} />
        ) : qError ? (
          <p style={{ color: "var(--mu-bad)", fontSize: 11, margin: 0 }}>{qError}</p>
        ) : listing ? (
          <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
            {/* Thumbnail + título */}
            <div style={{ display: "flex", gap: 10, alignItems: "flex-start" }}>
              {listing.thumbnail ? (
                /* eslint-disable-next-line @next/next/no-img-element */
                <img
                  src={listing.thumbnail}
                  alt={listing.title ?? "Producto"}
                  style={{
                    width: 64, height: 64, objectFit: "cover",
                    borderRadius: 8, border: "1px solid var(--mu-line)",
                    flexShrink: 0, background: "var(--mu-panel-2)",
                  }}
                />
              ) : (
                <div style={{
                  width: 64, height: 64, borderRadius: 8,
                  background: "var(--mu-panel-2)", border: "1px solid var(--mu-line)",
                  display: "flex", alignItems: "center", justifyContent: "center",
                  flexShrink: 0, color: "var(--mu-ink-mute)",
                }}>
                  <i className="ti ti-photo" style={{ fontSize: 22 }} />
                </div>
              )}
              <div style={{ flex: 1, minWidth: 0 }}>
                <div style={{
                  fontSize: 12, fontWeight: 600, color: "var(--mu-ink)",
                  lineHeight: 1.35, marginBottom: 4,
                  display: "-webkit-box", WebkitLineClamp: 3,
                  WebkitBoxOrient: "vertical", overflow: "hidden",
                }}>
                  {listing.title ?? "Sin título"}
                </div>
                <div style={{ display: "flex", alignItems: "center", gap: 6, flexWrap: "wrap" }}>
                  <ItemStatusBadge status={listing.status} />
                  {qData?.item_id && (
                    <span style={{ fontSize: 9, fontFamily: "monospace", color: "var(--mu-ink-mute)" }}>
                      {qData.item_id}
                    </span>
                  )}
                </div>
              </div>
            </div>

            {/* Precio + stock */}
            <div style={{
              display: "grid", gridTemplateColumns: "1fr 1fr",
              gap: 6,
            }}>
              <div style={{
                background: "var(--mu-panel-2)", borderRadius: 8,
                padding: "8px 10px", border: "1px solid var(--mu-line)",
              }}>
                <div style={{ fontSize: 9, color: "var(--mu-ink-mute)", marginBottom: 2 }}>PRECIO</div>
                <div style={{ fontSize: 15, fontWeight: 700, color: "var(--mu-ink)" }}>
                  {fmtPrice(listing.price, listing.currency)}
                </div>
              </div>
              <div style={{
                background: "var(--mu-panel-2)", borderRadius: 8,
                padding: "8px 10px", border: "1px solid var(--mu-line)",
              }}>
                <div style={{ fontSize: 9, color: "var(--mu-ink-mute)", marginBottom: 2 }}>STOCK</div>
                <div style={{
                  fontSize: 15, fontWeight: 700,
                  color: (listing.stock ?? 0) > 0 ? "var(--mu-ink)" : "var(--mu-bad)",
                }}>
                  {listing.stock ?? 0}
                  {listing.sold != null && listing.sold > 0 && (
                    <span style={{ fontSize: 9, fontWeight: 400, color: "var(--mu-ink-mute)", marginLeft: 4 }}>
                      ({listing.sold} vendidos)
                    </span>
                  )}
                </div>
              </div>
            </div>
          </div>
        ) : (
          /* item_id disponible pero sin fila en ml_listings todavía */
          <div style={{ display: "flex", flexDirection: "column", gap: 6 }}>
            {qData?.item_id && (
              <div style={{ fontSize: 11, fontFamily: "monospace", color: "var(--mu-ink-mute)" }}>
                {qData.item_id}
              </div>
            )}
            <p style={{ fontSize: 11, color: "var(--mu-ink-mute)", margin: 0 }}>
              Publicación no sincronizada aún.
            </p>
            {qData?._sync_debug && (
              <pre style={{
                fontSize: 9, background: "var(--mu-panel-2)", padding: "4px 6px",
                borderRadius: 4, overflowX: "auto", margin: 0,
                color: "var(--mu-ink-mute)", whiteSpace: "pre-wrap", wordBreak: "break-all",
              }}>
                {JSON.stringify(qData._sync_debug, null, 2)}
              </pre>
            )}
            {mlUrl && (
              <MlExternalLink
                href={mlUrl}
                style={{ fontSize: 11, color: "var(--mu-accent)", textDecoration: "underline" }}
              >
                Ver en MercadoLibre →
              </MlExternalLink>
            )}
          </div>
        );

  const questionMain = (
    <>
      {loadingQ ? (
        <Skeleton rows={2} />
      ) : qData?.question_text ? (
        <blockquote style={{
          fontSize: 12, margin: 0, padding: "8px 10px",
          borderLeft: "3px solid var(--mu-accent)", background: "var(--mu-panel-2)",
          borderRadius: "0 6px 6px 0", color: "var(--mu-ink-dim)", lineHeight: 1.5,
        }}>
          {qData.question_text}
        </blockquote>
      ) : (
        <p style={{ fontSize: 11, color: "var(--mu-ink-mute)", margin: 0 }}>Sin texto de pregunta</p>
      )}
      {qData?.ia_already_answered && (
        <div style={{
          marginTop: 6, fontSize: 10, display: "flex", alignItems: "center", gap: 4,
          color: "#16a34a",
        }}>
          <i className="ti ti-robot" style={{ fontSize: 12 }} />
          Respondida automáticamente por IA
        </div>
      )}
      {chat?.ml_question_id != null && (
        <div style={{ marginTop: 4, fontSize: 9, color: "var(--mu-ink-mute)", fontFamily: "monospace" }}>
          #{String(chat.ml_question_id)}
        </div>
      )}
    </>
  );

  if (embedded) {
    return (
      <>
        <MlEmbeddedWrap label="Anuncio · publicación" first={Boolean(embeddedFirst)}>
          {mlUrl ? (
            <div style={{ display: "flex", justifyContent: "flex-end", marginBottom: 8 }}>
              <MlExternalLink href={mlUrl} className="mu-ficha-link">
                VER EN ML →
              </MlExternalLink>
            </div>
          ) : null}
          {publicationMain}
        </MlEmbeddedWrap>
        {!hideBuyerQuestion && (
          <MlEmbeddedWrap label="Pregunta del comprador" first={false}>
            {questionMain}
          </MlEmbeddedWrap>
        )}
      </>
    );
  }

  return (
    <>
      <OperativeFranjaSection
        accent="orange"
        iconClass="ti ti-shopping-bag"
        title="Publicación"
        subtitle={pubSubtitle}
        subtitleHighlight={publicationSubtitleHighlight}
        defaultOpen={publicationSubtitleHighlight}
        resetKey={chatId}
        titleAside={mlUrl ? (
          <MlExternalLink href={mlUrl} className="mu-ficha-link">
            VER EN ML →
          </MlExternalLink>
        ) : undefined}
      >
        {publicationMain}
      </OperativeFranjaSection>

      {/* ── Pregunta del comprador (omitida en hilo pregunta ML: mismo texto en el chat) ── */}
      {!hideBuyerQuestion && (
      <OperativeFranjaSection
        accent="violet"
        iconClass="ti ti-message-question"
        title="Pregunta del comprador"
        subtitle={loadingQ ? "Cargando… · click para abrir" : "Texto del comprador · click para abrir"}
        subtitleHighlight={!loadingQ && Boolean(qData?.question_text)}
        defaultOpen={!loadingQ && Boolean(qData?.question_text && String(qData.question_text).trim() !== "")}
        resetKey={chatId}
      >
        {questionMain}
      </OperativeFranjaSection>
      )}
    </>
  );
}

/** Una sola franja operativa: publicación/pregunta, órdenes de contexto, aviso WA y vínculo. */
function MercadoLibreOperativeSection({
  chatId,
  chat,
  hasCustomer,
  showFullFranja,
  isMlQuestionOrigin,
  isMlMessageOrigin,
  showPublicationMlQuestionOrItem,
  showPublicationMlOrderOnly,
  showPublicationWaMlOrder,
  canLinkMlOrder,
  onOpenLinkOrder,
  onQuoteCreatedFromMl,
}: {
  chatId: string;
  chat: InboxChat;
  hasCustomer: boolean;
  showFullFranja: boolean;
  isMlQuestionOrigin: boolean;
  isMlMessageOrigin: boolean;
  showPublicationMlQuestionOrItem: boolean;
  showPublicationMlOrderOnly: boolean;
  showPublicationWaMlOrder: boolean;
  canLinkMlOrder: boolean;
  onOpenLinkOrder: () => void;
  onQuoteCreatedFromMl: (presupuestoId: number, warnings: unknown[]) => void;
}) {
  const showOuter =
    (!hasCustomer && isMlQuestionOrigin) ||
    (showFullFranja &&
      (showPublicationMlQuestionOrItem ||
        showPublicationMlOrderOnly ||
        showPublicationWaMlOrder ||
        canLinkMlOrder)) ||
    /** WhatsApp (u otro origen con `canLinkMlOrder`) sin cliente: mostrar franja solo para vincular orden ML. */
    (!showFullFranja && canLinkMlOrder);

  const showPublication = showPublicationMlQuestionOrItem;
  const showOrderMlQuestion = isMlQuestionOrigin && chat.order != null;
  const showLinkCta = canLinkMlOrder;

  const needsOrderFetch =
    showOuter &&
    (showPublicationMlOrderOnly || showPublicationWaMlOrder || showOrderMlQuestion);
  const needsListingFetch = showOuter && showPublication && !needsOrderFetch;

  const [ordLoading, setOrdLoading] = useState(false);
  const [ordData, setOrdData] = useState<MlOrderData | null>(null);
  const [ordErr, setOrdErr] = useState<string | null>(null);

  const [listLoading, setListLoading] = useState(false);
  const [listListing, setListListing] = useState<MlItemListing | null>(null);
  const [listErr, setListErr] = useState<string | null>(null);
  const [quotingMl, setQuotingMl] = useState(false);

  useEffect(() => {
    if (!needsOrderFetch) {
      setOrdLoading(false);
      setOrdData(null);
      setOrdErr(null);
      return;
    }
    let cancelled = false;
    setOrdLoading(true);
    setOrdErr(null);
    const timer = setTimeout(() => {
      void (async () => {
        try {
          const res = await fetch(`/api/inbox/${encodeURIComponent(chatId)}/ml-order`, {
            credentials: "include",
            cache: "no-store",
          });
          const j = (await res.json().catch(() => null)) as MlOrderData | null;
          if (cancelled) return;
          if (!res.ok) {
            setOrdErr("No se pudo cargar la orden");
            setOrdData(null);
            return;
          }
          setOrdData(j);
        } catch {
          if (!cancelled) {
            setOrdErr("No se pudo cargar la orden");
            setOrdData(null);
          }
        } finally {
          if (!cancelled) setOrdLoading(false);
        }
      })();
    }, SECONDARY_FETCH_DELAY_MS);
    return () => {
      cancelled = true;
      clearTimeout(timer);
    };
  }, [chatId, needsOrderFetch]);

  useEffect(() => {
    if (!needsListingFetch) {
      setListLoading(false);
      setListListing(null);
      setListErr(null);
      return;
    }
    let cancelled = false;
    setListLoading(true);
    setListErr(null);
    const timer = setTimeout(() => {
      void (async () => {
        try {
          const res = await fetch(`/api/inbox/${encodeURIComponent(chatId)}/ml-question`, {
            credentials: "include",
            cache: "no-store",
          });
          const j = (await res.json().catch(() => null)) as MlQuestionData | null;
          if (cancelled) return;
          if (!res.ok) {
            setListErr("No se pudo cargar la publicación");
            setListListing(null);
            return;
          }
          setListListing(j?.item_listing ?? null);
        } catch {
          if (!cancelled) {
            setListErr("No se pudo cargar la publicación");
            setListListing(null);
          }
        } finally {
          if (!cancelled) setListLoading(false);
        }
      })();
    }, SECONDARY_FETCH_DELAY_MS);
    return () => {
      cancelled = true;
      clearTimeout(timer);
    };
  }, [chatId, needsListingFetch]);

  let mlSubtitleContent: ReactNode = null;
  let mlSubtitleHighlight = false;

  if (showOuter) {
    if (needsOrderFetch) {
      if (ordLoading) {
        mlSubtitleContent = "Cargando ítems de la orden…";
      } else if (ordErr) {
        mlSubtitleContent = ordErr;
      } else {
        mlSubtitleContent = buildMlOrderOperativeSummary(ordData);
        mlSubtitleHighlight =
          Boolean(ordData?.not_synced) ||
          (ordData?.items != null && ordData.items.length > 0);
      }
    } else if (needsListingFetch) {
      if (listLoading) {
        mlSubtitleContent = "Cargando publicación…";
      } else if (listErr) {
        mlSubtitleContent = listErr;
      } else {
        mlSubtitleContent = buildListingOperativeSummary(listListing);
        mlSubtitleHighlight = listListing != null;
      }
    } else if (showLinkCta) {
      mlSubtitleContent = "Sin orden vinculada.";
    }
  }

  if (!showOuter) return null;

  const showQuoteCta =
    hasCustomer &&
    needsOrderFetch &&
    !ordLoading &&
    !ordErr &&
    ordData != null &&
    !ordData.not_synced &&
    Array.isArray(ordData.items) &&
    ordData.items.some((it) => it.product != null);

  const hasMlExpandedBody =
    showPublication ||
    showPublicationMlOrderOnly ||
    showPublicationWaMlOrder ||
    showOrderMlQuestion;

  return (
    <OperativeFranjaSection
      accent="orange"
      iconClass="ti ti-shopping-bag"
      title="Mercadolibre"
      subtitle={mlSubtitleContent != null && mlSubtitleContent !== false ? mlSubtitleContent : false}
      subtitleHighlight={mlSubtitleHighlight}
      defaultOpen={hasMlExpandedBody}
      collapsible={hasMlExpandedBody}
      resetKey={`${chatId}-ml-operative`}
      titleAside={
        showQuoteCta || showLinkCta ? (
          <span
            style={{
              display: "flex",
              alignItems: "center",
              gap: 8,
              flexWrap: "wrap",
              justifyContent: "flex-end",
            }}
          >
            {showQuoteCta ? (
              <OpFranjaActionButton
                type="button"
                variant="accent"
                iconClass="ti ti-file-invoice"
                loading={quotingMl}
                loadingLabel="Llevar a cotización"
                onClick={(e) => {
                  e.stopPropagation();
                  void (async () => {
                    setQuotingMl(true);
                    try {
                      const res = await fetch(
                        `/api/inbox/${encodeURIComponent(chatId)}/quotations/from-ml-order`,
                        {
                          method: "POST",
                          credentials: "include",
                          headers: { "Content-Type": "application/json" },
                          body: JSON.stringify({}),
                          cache: "no-store",
                        }
                      );
                      const j = (await res.json().catch(() => ({}))) as Record<string, unknown>;
                      if (!res.ok) {
                        window.alert(
                          String(j.message ?? j.error ?? "No se pudo crear la cotización desde la orden ML.")
                        );
                        return;
                      }
                      const pres = j.presupuesto as Record<string, unknown> | undefined;
                      const rawId = pres?.id ?? j.id;
                      const newId = typeof rawId === "number" ? rawId : Number(rawId);
                      if (!Number.isFinite(newId) || newId <= 0) {
                        window.alert("Respuesta inválida del servidor al crear la cotización.");
                        return;
                      }
                      const warnings = Array.isArray(j.warnings) ? j.warnings : [];
                      const skipped = Array.isArray(j.skipped) ? j.skipped : [];
                      if (warnings.length || skipped.length) {
                        const parts: string[] = [];
                        if (warnings.length) {
                          parts.push(
                            "Hay avisos de precio (orden vs catálogo con tasa Binance). Revisá las líneas antes de enviar."
                          );
                        }
                        if (skipped.length) {
                          parts.push(
                            `Se omitieron ${skipped.length} ítem(es) (sin mapeo a producto o precio inválido).`
                          );
                        }
                        window.alert(["Cotización en borrador creada.", "", ...parts].join("\n"));
                      }
                      onQuoteCreatedFromMl(newId, warnings);
                    } catch {
                      window.alert("Error de red al crear la cotización.");
                    } finally {
                      setQuotingMl(false);
                    }
                  })();
                }}
              >
                Llevar a cotización
              </OpFranjaActionButton>
            ) : null}
            {showLinkCta ? (
              <OpFranjaActionButton
                type="button"
                variant="accent"
                iconClass="ti ti-link"
                onClick={(e) => {
                  e.stopPropagation();
                  onOpenLinkOrder();
                }}
              >
                Vincular orden ML
              </OpFranjaActionButton>
            ) : null}
          </span>
        ) : undefined
      }
    >
      {(() => {
        let first = true;
        const nextFirst = (): boolean => {
          const v = first;
          first = false;
          return v;
        };
        if (!hasMlExpandedBody) return null;
        return (
          <>
            {showPublication && (
              <MlQuestionContextSection
                chatId={chatId}
                chat={chat}
                hideBuyerQuestion={isMlQuestionOrigin}
                embedded
                embeddedFirst={nextFirst()}
              />
            )}
            {showPublicationMlOrderOnly && (
              <MlOrderSection
                chatId={chatId}
                panelTitle="Publicación e ítems de la orden"
                embedded
                embeddedFirst={nextFirst()}
              />
            )}
            {showPublicationWaMlOrder && (
              <MlOrderSection
                chatId={chatId}
                panelTitle="Publicación"
                embedded
                embeddedFirst={nextFirst()}
              />
            )}
            {showOrderMlQuestion && (
              <MlOrderSection
                chatId={chatId}
                panelTitle="Orden de MercadoLibre"
                embedded
                embeddedFirst={nextFirst()}
              />
            )}
          </>
        );
      })()}
    </OperativeFranjaSection>
  );
}

/* ── (Acciones removidas por punto 3 del sprint — QuotePanel es el punto de entrada) ── */

// Placeholder vacío para mantener compatibilidad de llamada en la vista principal.
// eslint-disable-next-line @typescript-eslint/no-unused-vars
function FichaAccionesSection(_props: {
  activeAction: ActionType;
  onSetAction: (a: ActionType) => void;
  onCotizar: () => void;
  quoteActive: boolean;
}) {
  return null;
}

/* ── Componente principal ─────────────────────────────────────── */

type FichaTab = "ficha" | "bot" | "excepciones" | "precios";

export default function ChatContextPanel({
  chatId, chat, customerId, customer, recentOrders,
  loadingCustomer, loadingOrders, activeAction, onSetAction,
  onCustomerLinked, onOrderLinked, onEditCustomer,
}: Props) {
  const router = useRouter();
  const { user: currentUser } = useCurrentUser();
  const canAdjustPrices = currentUser?.role != null &&
    ["SUPERUSER", "ADMIN", "SUPERVISOR"].includes(currentUser.role);

  const hasCustomer = customerId !== null && customerId !== undefined;
  const [activeTab, setActiveTab]         = useState<FichaTab>("ficha");
  const [linkOrderOpen, setLinkOrderOpen] = useState(false);
  const [linkCustomerOpen, setLinkCustomerOpen] = useState(false);
  const [quoteBootstrapDraftId, setQuoteBootstrapDraftId] = useState<number | null>(null);
  const clearQuoteBootstrapDraft = useCallback(() => {
    setQuoteBootstrapDraftId(null);
  }, []);

  /** Estado del buscador de producto en la pestaña Precios (misma API y criterios que QuotePanel) */
  const [priceSearchMode, setPriceSearchMode] = useState<"sku" | "name">("name");
  const [priceSearch, setPriceSearch]     = useState("");
  const [debPriceSearch, setDebPriceSearch] = useState("");
  const [priceResults, setPriceResults]   = useState<Array<{ id: number; sku: string; name: string; unit_price_usd: number | null }>>([]);
  const [priceSearching, setPriceSearching] = useState(false);
  const [selectedPriceProduct, setSelectedPriceProduct] = useState<{ id: number; sku: string; name: string; unit_price_usd: number | null } | null>(null);

  useEffect(() => {
    const t = setTimeout(() => setDebPriceSearch(priceSearch), 280);
    return () => clearTimeout(t);
  }, [priceSearch]);

  useEffect(() => {
    setPriceSearch("");
    setDebPriceSearch("");
    setPriceResults([]);
  }, [priceSearchMode]);

  useEffect(() => {
    if (!canAdjustPrices) return;
    if (debPriceSearch.trim().length < 2) { setPriceResults([]); return; }
    let alive = true;
    setPriceSearching(true);
    const params = new URLSearchParams({
      search: debPriceSearch.trim(),
      limit: "12",
      search_by: priceSearchMode,
    });
    fetch(`/api/inventario/productos?${params}`, { credentials: "include", cache: "no-store" })
      .then(r => r.json().catch(() => ({})))
      .then((d: Record<string, unknown>) => {
        if (!alive) return;
        const data = (d.data ?? d) as Record<string, unknown>;
        const raw = (data.products ?? []) as Array<Record<string, unknown>>;
        const mapped = raw.map(p => ({
          id: Number(p.id),
          sku: String(p.sku ?? ""),
          name: String(p.name ?? ""),
          unit_price_usd: p.unit_price_usd != null ? Number(p.unit_price_usd) : null,
        }));
        mapped.sort((a, b) => a.name.localeCompare(b.name, "es", { sensitivity: "base" }));
        setPriceResults(mapped);
      })
      .catch(() => { if (alive) setPriceResults([]); })
      .finally(() => { if (alive) setPriceSearching(false); });
    return () => { alive = false; };
  }, [debPriceSearch, priceSearchMode, canAdjustPrices]);

  const [opToggling, setOpToggling]       = useState(false);
  const [opState, setOpState]             = useState<boolean | null>(null);
  const [quoteForceOpen, setQuoteForceOpen] = useState(false);
  const [activeSentQuote, setActiveSentQuote] = useState<{
    id: number;
    reference: string;
    totalUsd: number;
  } | null>(null);
  const [waGoToChatBusy, setWaGoToChatBusy] = useState(false);
  const [waGoToChatErr, setWaGoToChatErr]   = useState<string | null>(null);

  // Estado local sincronizado con la prop del chat
  const isOperational = opState !== null ? opState : Boolean(chat?.is_operational);

  const handleToggleOperational = async () => {
    if (!chat || opToggling) return;
    setOpToggling(true);
    const ok = await toggleOperational(String(chat.id), isOperational);
    if (ok) setOpState(!isOperational);
    setOpToggling(false);
  };

  const displayPhone =
    customer?.phone != null && String(customer.phone).trim() !== ""
      ? String(customer.phone).trim()
      : chat?.phone != null && String(chat.phone).trim() !== ""
        ? String(chat.phone).trim()
        : null;
  const canOpenWaThread = Boolean(displayPhone);

  /** Abre el hilo de bandeja ya existente para este teléfono (sin crear chat ni enviar saludo). */
  const handleGoToWaChatByPhone = async () => {
    if (!canOpenWaThread || waGoToChatBusy || !displayPhone) return;
    setWaGoToChatErr(null);
    setWaGoToChatBusy(true);
    try {
      const res = await fetch(
        `/api/inbox/wa-chat/by-phone?phone=${encodeURIComponent(displayPhone)}`,
        { credentials: "include", cache: "no-store" }
      );
      const data = (await res.json().catch(() => ({}))) as {
        chat_id?: number;
        message?: string;
        error?: string;
      };
      if (!res.ok) {
        setWaGoToChatErr(
          typeof data.message === "string" && data.message
            ? data.message
            : typeof data.error === "string" && data.error
              ? data.error
              : `Error ${res.status}`
        );
        return;
      }
      const cid = data.chat_id;
      if (cid == null || !Number.isFinite(Number(cid))) {
        setWaGoToChatErr("Respuesta sin chat");
        return;
      }
      router.push(`/bandeja/${String(cid)}`);
    } finally {
      setWaGoToChatBusy(false);
    }
  };

  const stageForPanel = useMemo(
    () =>
      bandejaMlQuestionPipelineStage(
        chat?.chat_stage == null ? undefined : String(chat.chat_stage),
        chat ?? undefined
      ),
    [chat]
  );

  const pipelineMiniStage = stageForPanel;

  /** Orígenes con reglas de franja operativa (pregunta ML, mensajería ML, WhatsApp). */
  const inboxSourceType = String(chat?.source_type ?? "").trim();
  const isMlMessageOrigin = inboxSourceType === "ml_message";
  const isMlQuestionOrigin = isMlQuestionThreadChat(chat ?? undefined);
  /**
   * WhatsApp (Wasender): wa_inbound / wa_ml_linked.
   * `page.tsx` convierte `source_type` null de BD en string vacío — tratarlo como WA
   * salvo hilos ML explícitos (evita ocultar «Vincular orden ML» en chats legacy).
   */
  const isWhatsAppOrigin =
    inboxSourceType === "wa_inbound" ||
    inboxSourceType === "wa_ml_linked" ||
    (inboxSourceType === "" && !isMlMessageOrigin && !isMlQuestionOrigin);

  /** Sin cliente CRM: ML o WhatsApp pueden abrir modal (vincular existente o crear con teléfono del chat). */
  const canLinkCustomerManual =
    !hasCustomer &&
    (isMlQuestionOrigin || isMlMessageOrigin || isWhatsAppOrigin);

  const noMlOrderOnChat =
    chat?.ml_order_id == null || String(chat.ml_order_id).trim() === "";
  const canLinkMlOrder = isWhatsAppOrigin && noMlOrderOnChat;

  /**
   * Con cliente CRM: módulos de venta / ML en orden.
   * Sin cliente: solo bloque Cliente (+ pipeline), salvo **pregunta ML**: hace falta Publicación
   * (y orden en contexto) para contestar aunque el pipeline muestre etapa orden vía `chat.order`.
   */
  const showFullFranja = hasCustomer;

  /**
   * En pregunta ML el foco es aprobar/pagar en ML; no listar pedidos ERP aquí.
   * Si hay cliente pero cero pedidos recientes, no mostramos el bloque (evita “Sin órdenes activas”).
   */
  const showRecentOrdersSection =
    hasCustomer &&
    chat?.source_type !== "ml_question" &&
    !isMlQuestionOrigin &&
    (loadingOrders || recentOrders.length > 0);

  const showPublicationMlQuestionOrItem =
    isMlQuestionOrigin || (isMlMessageOrigin && chat?.ml_question_id != null);
  const showPublicationMlOrderOnly =
    isMlMessageOrigin && chat?.ml_question_id == null;
  const showPublicationWaMlOrder =
    isWhatsAppOrigin &&
    !isMlQuestionOrigin &&
    !isMlMessageOrigin &&
    chat?.ml_order_id != null &&
    String(chat.ml_order_id).trim() !== "";

  /**
   * Resumen colapsado: nombre (línea 1); teléfonos (línea 2, «Ir a Chat» a la derecha);
   * ID MERCADOLIBRE (línea 3, «Editar cliente» a la derecha).
   */
  const clienteOperativeSubtitle = useMemo((): ReactNode => {
    const chatName =
      chat?.customer_name != null && String(chat.customer_name).trim() !== ""
        ? String(chat.customer_name).trim()
        : null;

    const mlLine = (id: number | null | undefined) => {
      if (id != null && String(id).trim() !== "" && Number(id) > 0) {
        return `ID MERCADOLIBRE: ${String(id).trim()}`;
      }
      return "ID MERCADOLIBRE: —";
    };

    const showEdit =
      hasCustomer &&
      customerId != null &&
      onEditCustomer != null &&
      !loadingCustomer;

    const editAside = showEdit ? (
      <OpFranjaActionButton
        type="button"
        variant="neutral"
        iconClass="ti ti-pencil"
        onClick={(e) => {
          e.stopPropagation();
          onEditCustomer();
        }}
      >
        Editar cliente
      </OpFranjaActionButton>
    ) : null;

    const chatAside = canOpenWaThread ? (
      <OpFranjaActionButton
        type="button"
        variant="accent"
        style={{ flexShrink: 0 }}
        onClick={(e) => {
          e.stopPropagation();
          void handleGoToWaChatByPhone();
        }}
        disabled={waGoToChatBusy}
        loading={waGoToChatBusy}
        loadingLabel="Abriendo…"
        iconClass={waGoToChatBusy ? undefined : "ti ti-message"}
        title="Ir al hilo de WhatsApp de la bandeja asociado a este número"
      >
        Ir a Chat
      </OpFranjaActionButton>
    ) : null;

    const phoneRow = (phonesLine: string | null) => {
      const left =
        phonesLine != null && String(phonesLine).trim() !== ""
          ? phonesLine
          : "—";
      return (
        <div style={{ marginTop: 3 }}>
          <div
            style={{
              display: "flex",
              alignItems: "center",
              gap: 8,
              justifyContent: "space-between",
              flexWrap: "wrap",
            }}
          >
            <span
              style={{
                fontVariantNumeric: "tabular-nums",
                wordBreak: "break-all",
                minWidth: 0,
                flex: "1 1 auto",
              }}
            >
              {left}
            </span>
            {chatAside}
          </div>
          {waGoToChatErr ? (
            <div style={{ marginTop: 4, fontSize: 10, color: "#ef4444" }}>{waGoToChatErr}</div>
          ) : null}
        </div>
      );
    };

    const mlRow = (ml: string) => (
      <div style={{ marginTop: 3 }}>
        <div
          style={{
            display: "flex",
            alignItems: "center",
            gap: 8,
            justifyContent: "space-between",
            flexWrap: "wrap",
          }}
        >
          <span style={{ minWidth: 0, flex: "1 1 auto", wordBreak: "break-word" }}>{ml}</span>
          {editAside}
        </div>
      </div>
    );

    if (!hasCustomer) {
      return "Cliente no identificado.";
    }

    if (loadingCustomer) {
      const nameLoading =
        chatName ||
        (customer?.full_name != null && String(customer.full_name).trim() !== ""
          ? String(customer.full_name).trim()
          : null) ||
        "Cargando datos…";
      const nameLine = truncateCustomerSummaryName(nameLoading, 110);
      const p1 = trimCustomerStr(customer?.phone ?? undefined);
      const p1b = !p1 ? trimCustomerStr(displayPhone ?? undefined) : "";
      const p2 = trimCustomerStr(customer?.phone_2 ?? undefined);
      const p2b =
        !p2 ? trimCustomerStr(customer?.alternative_phone ?? undefined) : "";
      const phones = formatCustomerPhonesLine(p1 || p1b, p2 || p2b);
      return (
        <>
          <div>{nameLine}</div>
          {phoneRow(phones || null)}
          {mlRow(mlLine(customer?.primary_ml_buyer_id ?? null))}
        </>
      );
    }

    if (!customer) {
      const nameC = chatName || "Cliente";
      const ph = trimCustomerStr(displayPhone ?? undefined);
      return (
        <>
          <div>{nameC}</div>
          {phoneRow(ph || null)}
          {mlRow(mlLine(null))}
        </>
      );
    }

    const name =
      (customer.full_name != null && String(customer.full_name).trim() !== ""
        ? String(customer.full_name).trim()
        : null) ||
      chatName ||
      "—";

    const nameLine = truncateCustomerSummaryName(name, 110);
    const phone1 =
      trimCustomerStr(customer.phone) || trimCustomerStr(displayPhone ?? undefined);
    const phone2 =
      trimCustomerStr(customer.phone_2) || trimCustomerStr(customer.alternative_phone);
    const phones = formatCustomerPhonesLine(phone1, phone2);

    return (
      <>
        <div>{nameLine}</div>
        {phoneRow(phones || null)}
        {mlRow(mlLine(customer.primary_ml_buyer_id))}
      </>
    );
  }, [
    hasCustomer,
    loadingCustomer,
    customer,
    chat?.customer_name,
    displayPhone,
    customerId,
    canOpenWaThread,
    waGoToChatBusy,
    waGoToChatErr,
    onEditCustomer,
    handleGoToWaChatByPhone,
  ]);

  return (
    <>
    <div className="mu-ficha">

      {/* ── Tab bar ──────────────────────────────────────────────── */}
      <div className="mu-ficha-tab-bar">
        <button
          type="button"
          className={`mu-ficha-tab${activeTab === "ficha" ? " mu-ficha-tab--active" : ""}`}
          onClick={() => setActiveTab("ficha")}
        >
          Ficha 360°
        </button>
        <button
          type="button"
          className={`mu-ficha-tab${activeTab === "bot" ? " mu-ficha-tab--active" : ""}`}
          onClick={() => setActiveTab("bot")}
        >
          <i className="ti ti-robot" style={{ fontSize: 11, marginRight: 4 }} />
          Timeline bot
          {/* NEW */}
          <span className="sup-queue-new-tag ms-1">NEW</span>
        </button>
        <button
          type="button"
          className={`mu-ficha-tab${activeTab === "excepciones" ? " mu-ficha-tab--active" : ""}`}
          onClick={() => setActiveTab("excepciones")}
        >
          <i className="ti ti-alert-triangle" style={{ fontSize: 11, marginRight: 4 }} />
          Excepciones
          {chat?.has_active_exception && (
            <span className="ms-1" style={{ background: "#ef4444", borderRadius: "50%", width: 7, height: 7, display: "inline-block" }} />
          )}
          {/* NEW */}
          <span className="sup-queue-new-tag ms-1">NEW</span>
        </button>
        {canAdjustPrices && (
          <button
            type="button"
            className={`mu-ficha-tab${activeTab === "precios" ? " mu-ficha-tab--active" : ""}`}
            onClick={() => setActiveTab("precios")}
          >
            <i className="ti ti-tag" style={{ fontSize: 11, marginRight: 4 }} />
            Precios
          </button>
        )}
      </div>

      {/* ── Tab: Timeline bot ────────────────────────────────── */}
      {activeTab === "bot" && (
        <div style={{ padding: "8px 0" }}>
          <BotActionsTimeline chatId={chatId} />
        </div>
      )}

      {/* ── Tab: Excepciones ─────────────────────────────────── */}
      {activeTab === "excepciones" && (
        <div style={{ padding: "8px 0" }}>
          <ExceptionsPanel chatId={chatId} />
        </div>
      )}

      {/* ── Tab: Precios (SUPERUSER / ADMIN / SUPERVISOR) ────── */}
      {activeTab === "precios" && canAdjustPrices && (
        <div style={{ padding: "8px 0", display: "flex", flexDirection: "column", gap: 10 }}>
          {/* Modo búsqueda — mismo criterio que cotización (search_by + limit 12 + debounce) */}
          <div style={{ display: "flex", alignItems: "center", justifyContent: "flex-end", gap: 6 }}>
            <span style={{
              fontFamily: "'JetBrains Mono', monospace",
              fontSize: 8, letterSpacing: "0.1em", fontWeight: 800,
              color: "var(--mu-ink-mute,#8b949e)", textTransform: "uppercase",
            }}>
              Buscar por
            </span>
            <div style={{
              display: "inline-flex", borderRadius: 8, padding: 2,
              background: priceSearchMode === "sku" ? "rgba(234,179,8,0.1)" : "rgba(56,189,248,0.1)",
              border: priceSearchMode === "sku"
                ? "1px solid rgba(250,204,21,0.35)"
                : "1px solid rgba(56,189,248,0.35)",
            }}>
              <button
                type="button"
                onClick={() => setPriceSearchMode("sku")}
                style={{
                  border: "none", borderRadius: 6, padding: "5px 10px",
                  fontFamily: "'JetBrains Mono', monospace", fontSize: 9, fontWeight: 800,
                  letterSpacing: "0.06em", cursor: "pointer",
                  background: priceSearchMode === "sku"
                    ? "linear-gradient(180deg, #fbbf24 0%, #d97706 100%)"
                    : "transparent",
                  color: priceSearchMode === "sku" ? "#1a1408" : "var(--mu-ink-mute,#8b949e)",
                }}
              >
                SKU
              </button>
              <button
                type="button"
                onClick={() => setPriceSearchMode("name")}
                style={{
                  border: "none", borderRadius: 6, padding: "5px 10px",
                  fontFamily: "'JetBrains Mono', monospace", fontSize: 9, fontWeight: 800,
                  letterSpacing: "0.06em", cursor: "pointer",
                  background: priceSearchMode === "name"
                    ? "linear-gradient(180deg, #38bdf8 0%, #0284c7 100%)"
                    : "transparent",
                  color: priceSearchMode === "name" ? "#f0f9ff" : "var(--mu-ink-mute,#8b949e)",
                }}
              >
                Nombre
              </button>
            </div>
          </div>

          {/* Buscador de producto */}
          <div style={{ position: "relative" }}>
            <div style={{
              position: "absolute", left: 10, top: "50%", transform: "translateY(-50%)",
              color: "#6e7681", pointerEvents: "none", lineHeight: 0,
            }}>
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} style={{ width: 13, height: 13 }}>
                <circle cx="11" cy="11" r="7" /><path d="m21 21-4.3-4.3" />
              </svg>
            </div>
            <input
              type="text"
              placeholder={priceSearchMode === "sku" ? "Código SKU…" : "Nombre del producto…"}
              value={priceSearch}
              onChange={e => {
                setPriceSearch(e.target.value);
                if (selectedPriceProduct) setSelectedPriceProduct(null);
              }}
              style={{
                width: "100%", boxSizing: "border-box",
                padding: "9px 10px 9px 32px",
                borderRadius: 8,
                background: "var(--mu-panel-3,#232a35)",
                border: "1px solid var(--mu-border,rgba(255,255,255,0.08))",
                color: "var(--mu-text,#e6edf3)",
                fontSize: 12, fontFamily: "inherit", outline: "none",
              }}
            />
          </div>

          {/* Resultados de búsqueda (tras debounce, misma API que cotización) */}
          {!selectedPriceProduct && debPriceSearch.trim().length >= 2 && (
            <div style={{
              background: "var(--mu-panel-3,#232a35)",
              border: "1px solid var(--mu-border,rgba(255,255,255,0.08))",
              borderRadius: 8, overflow: "hidden",
              boxShadow: "0 8px 24px rgba(0,0,0,0.35)",
            }}>
              {priceSearching ? (
                <div style={{ padding: "8px 12px", fontFamily: "'JetBrains Mono', monospace", fontSize: 9, color: "#6e7681" }}>
                  Buscando…
                </div>
              ) : priceResults.length === 0 ? (
                <div style={{ padding: "8px 12px", fontFamily: "'JetBrains Mono', monospace", fontSize: 9, color: "#6e7681" }}>
                  Sin resultados.
                </div>
              ) : priceResults.map(p => (
                <div
                  key={p.id}
                  onClick={() => { setSelectedPriceProduct(p); setPriceSearch(p.name); setPriceResults([]); }}
                  style={{
                    display: "flex", alignItems: "center", justifyContent: "space-between",
                    padding: "8px 12px", cursor: "pointer",
                    borderBottom: "1px solid rgba(255,255,255,0.04)",
                    transition: "background 0.1s",
                  }}
                  onMouseEnter={e => (e.currentTarget.style.background = "rgba(255,255,255,0.04)")}
                  onMouseLeave={e => (e.currentTarget.style.background = "transparent")}
                >
                  <div>
                    <div style={{ fontSize: 11, fontWeight: 600, color: "var(--mu-text,#e6edf3)" }}>{p.name}</div>
                    <div style={{ fontFamily: "'JetBrains Mono', monospace", fontSize: 9, color: "#6e7681", marginTop: 2 }}>{p.sku}</div>
                  </div>
                  <div style={{ fontFamily: "'JetBrains Mono', monospace", fontSize: 11, fontWeight: 700, color: "#d8b4fe", flexShrink: 0 }}>
                    {p.unit_price_usd != null ? `$${Number(p.unit_price_usd).toFixed(2)}` : "—"}
                  </div>
                </div>
              ))}
            </div>
          )}

          {/* Panel de ajuste para el producto seleccionado */}
          {selectedPriceProduct && (
            <PriceAdjustPanel
              productId={selectedPriceProduct.id}
              productInfo={selectedPriceProduct}
              onAdjusted={(newPrice) => {
                setSelectedPriceProduct(prev => prev ? { ...prev, unit_price_usd: newPrice } : prev);
              }}
            />
          )}

          {!selectedPriceProduct && priceSearch.trim().length < 2 && (
            <div style={{
              padding: "20px 12px", textAlign: "center",
              background: "rgba(197,130,255,0.04)",
              border: "1px dashed rgba(197,130,255,0.2)",
              borderRadius: 8,
            }}>
              <i className="ti ti-tag" style={{ fontSize: 22, color: "#8b3fc8", display: "block", marginBottom: 6 }} />
              <div style={{ fontSize: 11, fontWeight: 700, color: "var(--mu-text,#e6edf3)", marginBottom: 3 }}>
                Ajuste de precios de catálogo
              </div>
              <div style={{ fontSize: 10, color: "#8b949e" }}>
                Elegí <strong>Nombre</strong> o <strong>SKU</strong> y escribí al menos 2 caracteres; el buscador usa la misma lógica que en cotización.
              </div>
            </div>
          )}
        </div>
      )}

      {/* ── Tab: Ficha 360° — pipeline siempre primero; orden de módulos por origen + cliente ── */}
      {activeTab === "ficha" && <>

      {/* Pipeline: siempre visible (todos los orígenes) */}
      <div style={{ marginBottom: 10 }}>
        <PipelineMini stage={pipelineMiniStage} />
      </div>

      {/* ── Banner NO CLIENTE ───────────────────────────────────── */}
      {isOperational && (
        <OperativeFranjaSection
          accent="slate"
          iconClass="ti ti-building"
          title="No cliente · personal de empresa"
          subtitle="Contacto interno · sin flujo de venta al público"
          subtitleHighlight
          collapsible={false}
          resetKey={chatId}
          titleAside={(
            <OpFranjaActionButton
              type="button"
              variant="neutral"
              onClick={handleToggleOperational}
              disabled={opToggling}
              title="Quitar marca No Cliente"
              loading={opToggling}
              loadingLabel="…"
            >
              Quitar
            </OpFranjaActionButton>
          )}
        >
          <p style={{ fontSize: 11, color: "var(--mu-ink-mute)", margin: 0, lineHeight: 1.45 }}>
            Este número está marcado como contacto interno.
          </p>
        </OperativeFranjaSection>
      )}

      {/* ── Sección: Cliente — siempre primero ── */}
      <OperativeFranjaSection
        accent="slate"
        iconClass="ti ti-user"
        title="Cliente"
        subtitle={clienteOperativeSubtitle}
        subtitleHighlight={hasCustomer && !loadingCustomer}
        defaultOpen
        resetKey={chatId}
        titleAside={
          hasCustomer && customerId ? (
            <Link
              href={`/clientes/historial?id=${customerId}`}
              onClick={(e) => {
                e.stopPropagation();
              }}
              style={{
                ...opFranjaActionButtonStyle({ variant: "accent" }),
                textDecoration: "none",
              }}
            >
              <i className="ti ti-external-link" style={{ fontSize: 13 }} aria-hidden />
              Ver ficha
            </Link>
          ) : !hasCustomer && canLinkCustomerManual ? (
            <OpFranjaActionButton
              type="button"
              variant="accent"
              iconClass="ti ti-user-plus"
              onClick={(e) => {
                e.stopPropagation();
                setLinkCustomerOpen(true);
              }}
            >
              Vincular o crear
            </OpFranjaActionButton>
          ) : undefined
        }
      >

        {!hasCustomer ? (
          <div>
            <IdentifyCustomerSection chatId={chatId} onLinked={onCustomerLinked ?? (() => {})} />
          </div>
        ) : loadingCustomer ? (
          <Skeleton rows={3} />
        ) : customer ? (
          <>
            <div className="mu-ficha-cliente">
              <div className="mu-avatar" style={{ width: 44, height: 44, fontSize: 14, flexShrink: 0 }}>
                {initials(customer.full_name ?? chat?.customer_name)}
              </div>
              <div>
                <div className="mu-ficha-cliente-name">
                  {customer.full_name ?? chat?.customer_name ?? "—"}
                </div>
                {customer.client_segment && (
                  <div className="mu-ficha-cliente-id">{customer.client_segment}</div>
                )}
              </div>
            </div>

            <dl className="mu-kv">
              <dt>Teléfono</dt>
              <dd>
                {(() => {
                  const phone1Ex =
                    trimCustomerStr(customer.phone) || trimCustomerStr(displayPhone ?? "");
                  const phone2Ex =
                    trimCustomerStr(customer.phone_2) || trimCustomerStr(customer.alternative_phone);
                  const phonesExpanded = formatCustomerPhonesLine(phone1Ex, phone2Ex);
                  const phonesLabel = phonesExpanded || "—";
                  return (
                    <span
                      style={{
                        fontVariantNumeric: "tabular-nums",
                        wordBreak: "break-all",
                      }}
                    >
                      {phonesLabel}
                    </span>
                  );
                })()}
              </dd>

              {customer.city && (
                <>
                  <dt>Zona</dt>
                  <dd>{customer.city}</dd>
                </>
              )}

              {customer.first_order_date && (
                <>
                  <dt>Cliente desde</dt>
                  <dd>{fmtDate(customer.first_order_date)}</dd>
                </>
              )}
            </dl>

          </>
        ) : (
          <p style={{ color: "var(--mu-ink-mute)", fontSize: 11, margin: 0 }}>Sin datos del cliente</p>
        )}
      </OperativeFranjaSection>

      {chat && (
        <MercadoLibreOperativeSection
          chatId={chatId}
          chat={chat}
          hasCustomer={hasCustomer}
          showFullFranja={showFullFranja}
          isMlQuestionOrigin={isMlQuestionOrigin}
          isMlMessageOrigin={isMlMessageOrigin}
          showPublicationMlQuestionOrItem={showPublicationMlQuestionOrItem}
          showPublicationMlOrderOnly={showPublicationMlOrderOnly}
          showPublicationWaMlOrder={showPublicationWaMlOrder}
          canLinkMlOrder={canLinkMlOrder}
          onOpenLinkOrder={() => setLinkOrderOpen(true)}
          onQuoteCreatedFromMl={(presupuestoId) => {
            setQuoteBootstrapDraftId(presupuestoId);
            setQuoteForceOpen(true);
            void router.refresh();
          }}
        />
      )}

      {showFullFranja && (
        <>
          {/* Vehículos (después de Cliente) */}
          {customer && customer.vehicles && customer.vehicles.length > 0 && (
            <OperativeFranjaSection
              accent="violet"
              iconClass="ti ti-car"
              title="Vehículos registrados"
              subtitle={`${customer.vehicles.length} registro(s) · click para abrir`}
              subtitleHighlight
              defaultOpen
              resetKey={chatId}
            >
              <div style={{ display: "flex", flexWrap: "wrap", gap: 6 }}>
                {customer.vehicles.map(v => (
                  <span key={v.id} className="mu-vehicle-tag">
                    <i className="ti ti-car" style={{ fontSize: 11 }} />
                    {v.label ?? `${v.brand_name} ${v.model_name} ${v.year_start ?? ""}`}
                  </span>
                ))}
              </div>
            </OperativeFranjaSection>
          )}

          {/* ── 2. Mercado Libre (publicación, orden, vínculos) — bloque unificado arriba de Cotización ── */}

          {/* ── 3. COTIZACIÓN ─────────────────────────────────────────────────── */}
          <QuotePanel
            chatId={chatId}
            customerId={customerId ?? null}
            forceOpen={quoteForceOpen}
            onForceOpenConsumed={() => setQuoteForceOpen(false)}
            bootstrapDraftQuotationId={quoteBootstrapDraftId}
            onBootstrapDraftConsumed={clearQuoteBootstrapDraft}
            onSentQuoteChange={setActiveSentQuote}
          />

          {/* ── 4. COMPROBANTE Y CONCILIACIÓN ─────────────────────────────────── */}
          <PaymentLinkPanel
            chatId={chatId}
            customerId={customerId ? Number(customerId) : null}
            activeQuotationId={activeSentQuote?.id ?? null}
            activeQuotationRef={activeSentQuote?.reference ?? null}
            activeQuotationTotalUsd={activeSentQuote?.totalUsd ?? null}
          />

          {/* ── 5. DESPACHO Y CIERRE ──────────────────────────────────────────── */}
          <OperativeFranjaSection
            accent="cyan"
            iconClass="ti ti-truck"
            title="Despacho y cierre"
            subtitle="Pedidos pagados y logística · click para abrir"
            subtitleHighlight={false}
            defaultOpen
            resetKey={chatId}
          >
            <p style={{ fontSize: 11, color: "var(--mu-ink-mute)", margin: "0 0 10px", lineHeight: 1.45 }}>
              Solicitar despacho de pedidos pagados y revisar estado en ventas.
            </p>
            <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
              <OpFranjaActionButton
                type="button"
                variant="accent"
                iconClass="ti ti-truck"
                onClick={() => onSetAction("dispatch")}
              >
                Solicitar despacho
              </OpFranjaActionButton>
              <Link
                href="/ventas/pedidos"
                className="mu-ficha-link"
                style={{ fontSize: 11, textAlign: "center" }}
              >
                Ir a pedidos y cierre →
              </Link>
            </div>
          </OperativeFranjaSection>

          {showRecentOrdersSection && (
            <OperativeFranjaSection
              accent="slate"
              iconClass="ti ti-history"
              title="Órdenes recientes"
              subtitle={
                loadingOrders
                  ? "Cargando historial… · click para abrir"
                  : recentOrders.length === 0
                    ? "Sin órdenes activas · click para abrir"
                    : `${recentOrders.length} pedido(s) · click para abrir`
              }
              subtitleHighlight={!loadingOrders && recentOrders.length > 0}
              defaultOpen
              resetKey={chatId}
            >
              {loadingOrders ? (
                <Skeleton rows={3} />
              ) : recentOrders.length === 0 ? (
                <p style={{ color: "var(--mu-ink-mute)", fontSize: 11, margin: 0 }}>Sin órdenes activas</p>
              ) : (
                <div style={{ display: "flex", flexDirection: "column", gap: 6 }}>
                  {recentOrders.map(o => (
                    <Link
                      key={String(o.id)}
                      href="/ventas/pedidos"
                      style={{
                        display: "flex",
                        alignItems: "center",
                        justifyContent: "space-between",
                        padding: "8px 10px",
                        borderRadius: 8,
                        background: "var(--mu-panel)",
                        border: "1px solid var(--mu-line)",
                        textDecoration: "none",
                        fontSize: 11,
                        color: "inherit",
                      }}
                    >
                      <div>
                        <div style={{ fontFamily: "monospace", color: "var(--mu-ink)", fontSize: 11 }}>
                          #{o.id}
                        </div>
                        <div style={{ color: "var(--mu-ink-mute)", fontSize: 9, marginTop: 2 }}>
                          {fmtDate(o.created_at)}
                        </div>
                      </div>
                      <div style={{ textAlign: "right" }}>
                        <div style={{ fontWeight: 700, color: "var(--mu-ink)" }}>{fmtUSD(o.total_usd)}</div>
                        <SaleStatusBadge status={o.status} />
                      </div>
                    </Link>
                  ))}
                </div>
              )}
            </OperativeFranjaSection>
          )}
        </>
      )}

      {/* Cierre bloque tab ficha */}
      </>}

    </div>

    {/* ── Modal: vincular Orden ML ── */}
    <LinkMlOrderModal
      open={linkOrderOpen}
      chatId={chatId}
      onClose={() => setLinkOrderOpen(false)}
      onSuccess={() => {
        setLinkOrderOpen(false);
        onOrderLinked?.();
      }}
    />

    <LinkCustomerModal
      open={linkCustomerOpen}
      chatId={chatId}
      initialChatPhone={
        chat?.phone != null && String(chat.phone).trim() !== ""
          ? String(chat.phone).trim()
          : null
      }
      onClose={() => setLinkCustomerOpen(false)}
      onSuccess={() => {
        setLinkCustomerOpen(false);
        onCustomerLinked?.();
      }}
    />
    </>
  );
}
