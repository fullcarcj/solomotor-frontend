"use client";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useEffect, useMemo, useState, type CSSProperties, type ReactNode } from "react";
import type { InboxChat } from "@/types/inbox";
import { normalizeChatStage } from "@/types/inbox";
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

function MlOrderSection({ chatId }: { chatId: string }) {
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

  if (loading) return (
    <div className="mu-ficha-section">
      <h4 className="mu-ficha-title">Orden ML</h4>
      <Skeleton rows={4} />
    </div>
  );
  if (error) return (
    <div className="mu-ficha-section">
      <h4 className="mu-ficha-title">Orden ML</h4>
      <p style={{ fontSize: 11, color: "var(--mu-bad)", margin: 0 }}>{error}</p>
    </div>
  );
  if (!data) return null;
  if (data.not_synced) return (
    <div className="mu-ficha-section">
      <h4 className="mu-ficha-title">Orden ML · #{data.ml_order_id}</h4>
      <p style={{ fontSize: 11, color: "var(--mu-ink-mute)", margin: 0 }}>Orden no sincronizada aún.</p>
    </div>
  );

  const orderUrl = `https://www.mercadolibre.com.ve/ventas/${data.ml_order_id}/detalle`;

  return (
    <div className="mu-ficha-section" style={{ paddingBottom: 0 }}>
      <h4 className="mu-ficha-title">
        Orden ML
        <a href={orderUrl} target="_blank" rel="noopener noreferrer"
           className="mu-ficha-link" style={{ marginLeft: "auto" }}>
          #{String(data.ml_order_id)} →
        </a>
      </h4>

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
    </div>
  );
}

/* ── Sección ML question (solo para source_type = ml_question) ── */

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

function MlQuestionContextSection({ chatId, chat }: { chatId: string; chat: InboxChat | null }) {
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

  return (
    <>
      {/* ── Tarjeta de publicación ML (primera en la ficha) ── */}
      <div className="mu-ficha-section" style={{ paddingBottom: 0 }}>
        <h4 className="mu-ficha-title" style={{ marginBottom: 8 }}>
          Publicación
          {mlUrl && (
            <MlExternalLink
              href={mlUrl}
              className="mu-ficha-link"
              style={{ marginLeft: "auto" }}
            >
              VER EN ML →
            </MlExternalLink>
          )}
        </h4>

        {loadingQ ? (
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
        )}
      </div>

      {/* ── Pregunta del comprador ── */}
      <div className="mu-ficha-section">
        <h4 className="mu-ficha-title">Pregunta del comprador</h4>
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
      </div>
    </>
  );
}

/* ── Orden vinculada (CONDICIONAL — Decisión 6 Sprint 6A) ──────
   Regla: si chat.order !== null → mostrar. Si null → NO renderizar.
   NO se muestra placeholder "sin orden". */
function FichaOrdenSection({ chat }: { chat: InboxChat }) {
  if (!chat.order) return null;

  const o = chat.order;
  const statusLabel = o.payment_status ?? "—";
  const fulfillLabel = o.fulfillment_type ?? "—";

  return (
    <div className="mu-ficha-section">
      <h4 className="mu-ficha-title">
        Estado
        <Link href="/ventas/pedidos" className="mu-ficha-link">HISTORIAL →</Link>
      </h4>
      <div className="mu-estado-card">
        <div className="mu-estado-tipo">
          ORDEN · #{o.id}
        </div>
        <div className="mu-estado-num">
          Pago: {statusLabel} · Entrega: {fulfillLabel}
        </div>
        <div style={{ fontSize: 10, color: "var(--mu-ink-mute)", fontFamily: "monospace", marginTop: 4 }}>
          CH-{o.channel_id}
        </div>
      </div>
    </div>
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
  const [waFromPhoneBusy, setWaFromPhoneBusy] = useState(false);
  const [waFromPhoneErr, setWaFromPhoneErr]   = useState<string | null>(null);

  // Estado local sincronizado con la prop del chat
  const isOperational = opState !== null ? opState : Boolean(chat?.is_operational);

  // Mostrar zona ML cuando el chat es WA sin orden ML asociada (aunque aún no haya cliente CRM).
  // Así el operador puede vincular la orden ML y fusionar datos / teléfono antes o después de identificar.
  const canLinkMlOrder =
    chat?.source_type === "wa_inbound" &&
    chat?.ml_order_id == null;

  const canLinkCustomerManual =
    !hasCustomer &&
    (chat?.source_type === "ml_question" || chat?.source_type === "ml_message");

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

  const handleOpenWaThreadFromPhone = async () => {
    if (!canOpenWaThread || waFromPhoneBusy || !displayPhone) return;
    setWaFromPhoneErr(null);
    setWaFromPhoneBusy(true);
    try {
      const res = await fetch("/api/inbox/wa-chat/from-customer-phone", {
        method: "POST",
        credentials: "include",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          phone: displayPhone,
          customer_id:
            customerId != null && String(customerId).trim() !== ""
              ? Number(customerId)
              : undefined,
          customer_name: customer?.full_name ?? chat?.customer_name ?? "",
        }),
      });
      const data = (await res.json().catch(() => ({}))) as {
        chat_id?: number;
        message?: string;
        error?: string;
      };
      if (!res.ok) {
        setWaFromPhoneErr(
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
        setWaFromPhoneErr("Respuesta sin chat");
        return;
      }
      router.push(`/bandeja/${String(cid)}`);
    } finally {
      setWaFromPhoneBusy(false);
    }
  };

  /**
   * Pregunta ML sin orden vinculada en el chat: aún no hay compra ML que aprobar/pagar.
   * El pipeline no debe mostrarse en ORDEN ni adelantar etapas; se fuerza CONTACTO
   * (inicio del ciclo) hasta que exista `chat.order`.
   */
  const mlQuestionSinOrdenMl = Boolean(
    chat?.source_type === "ml_question" && chat?.order == null
  );

  const stageForPanel = useMemo(() => {
    if (mlQuestionSinOrdenMl) return normalizeChatStage("contact");
    return normalizeChatStage(chat?.chat_stage == null ? undefined : String(chat.chat_stage));
  }, [mlQuestionSinOrdenMl, chat?.chat_stage]);

  const pipelineMiniStage = useMemo(() => {
    if (mlQuestionSinOrdenMl) return "contact";
    return chat?.chat_stage;
  }, [mlQuestionSinOrdenMl, chat?.chat_stage]);

  // Posición contextual del pipeline en la franja operativa (usa etapa efectiva).
  // contact/payment/dispatch/closed → antes de QuotePanel (primer paso visible)
  // quote  → antes de Órdenes recientes
  // order  → antes de FichaOrdenSection
  const pipelineAt: "before_quote" | "before_orders" | "before_orden" =
    stageForPanel === "order"  ? "before_orden"  :
    stageForPanel === "quote"  ? "before_orders" :
    "before_quote";

  /** En pregunta ML el foco es aprobar/pagar en ML; no listar pedidos ERP aquí. */
  const showRecentOrdersSection = hasCustomer && chat?.source_type !== "ml_question";

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

      {/* ── Tab: Ficha 360° (contenido original) ─────────────── */}
      {activeTab === "ficha" && <>

      {/* ── Pipeline contextual: antes de QuotePanel para stage=contact/… ── */}
      {pipelineAt === "before_quote" && chat && (
        <div style={{ marginBottom: 10 }}>
          <PipelineMini stage={pipelineMiniStage} />
        </div>
      )}

      {/* ── Panel de cotización (siempre disponible, colapsado sin ítems) ── */}
      <QuotePanel
        chatId={chatId}
        customerId={customerId ?? null}
        customerName={customer?.full_name ?? chat?.customer_name ?? null}
        forceOpen={quoteForceOpen}
        onForceOpenConsumed={() => setQuoteForceOpen(false)}
        onSentQuoteChange={setActiveSentQuote}
      />

      {/* ── Pago y conciliación ─────────────────────────────────────── */}
      <PaymentLinkPanel
        chatId={chatId}
        customerId={customerId ? Number(customerId) : null}
        activeQuotationId={activeSentQuote?.id ?? null}
        activeQuotationRef={activeSentQuote?.reference ?? null}
        activeQuotationTotalUsd={activeSentQuote?.totalUsd ?? null}
      />

      {/* ── Banner NO CLIENTE ───────────────────────────────────── */}
      {isOperational && (
        <div
          style={{
            display: "flex",
            alignItems: "center",
            gap: 8,
            padding: "8px 14px",
            background: "rgba(180,180,180,0.08)",
            border: "1px solid rgba(180,180,180,0.18)",
            borderRadius: 8,
            marginBottom: 10,
          }}
        >
          <i className="ti ti-building" style={{ fontSize: 14, color: "var(--mu-ink-mute)" }} />
          <div style={{ flex: 1 }}>
            <div style={{ fontSize: 11, fontWeight: 700, letterSpacing: "0.06em", textTransform: "uppercase", color: "var(--mu-ink-mute)" }}>
              No cliente · Personal de empresa
            </div>
            <div style={{ fontSize: 10, color: "var(--mu-ink-mute)", marginTop: 2 }}>
              Este número está marcado como contacto interno.
            </div>
          </div>
          <button
            type="button"
            onClick={handleToggleOperational}
            disabled={opToggling}
            title="Quitar marca No Cliente"
            style={{
              background: "none",
              border: "1px solid rgba(180,180,180,0.3)",
              borderRadius: 5,
              padding: "3px 8px",
              fontSize: 10,
              color: "var(--mu-ink-mute)",
              cursor: "pointer",
              opacity: opToggling ? 0.5 : 1,
            }}
          >
            {opToggling ? "…" : "Quitar"}
          </button>
        </div>
      )}

      {/* ml_question CON orden vinculada: la orden es lo primero (más operativo) */}
      {chat?.source_type === "ml_question" && chat.order != null && (
        <MlOrderSection chatId={chatId} />
      )}

      {/* Publicación ML + texto de pregunta */}
      {(chat?.source_type === "ml_question" || chat?.source_type === "ml_message") && chat?.ml_question_id != null && (
        <MlQuestionContextSection chatId={chatId} chat={chat} />
      )}

      {/* Orden ML con ítems, producto y ubicación WMS — para chats ml_message */}
      {chat?.source_type === "ml_message" && (
        <MlOrderSection chatId={chatId} />
      )}

      {/* ── Sección: Cliente ─────────────────────────── */}
      <div className="mu-ficha-section">
        <h4 className="mu-ficha-title">
          <span>Cliente</span>
          {hasCustomer && customerId && (
            <span style={{ display: "inline-flex", alignItems: "center", gap: 10 }}>
              {onEditCustomer && (
                <button
                  type="button"
                  onClick={onEditCustomer}
                  className="mu-ficha-link"
                  style={{
                    background: "none",
                    border: "none",
                    padding: 0,
                    cursor: "pointer",
                    font: "inherit",
                    letterSpacing: "0.1em",
                  }}
                >
                  Editar cliente
                </button>
              )}
              <Link href={`/clientes/historial?id=${customerId}`} className="mu-ficha-link">
                VER FICHA →
              </Link>
            </span>
          )}
        </h4>

        {!hasCustomer ? (
          <div>
            <div style={{ display: "flex", alignItems: "center", gap: 6, marginBottom: 8, color: "var(--mu-ink-mute)", fontSize: 12 }}>
              <i className="ti ti-user-question" />
              <span>Cliente no identificado</span>
            </div>
            {canLinkCustomerManual && (
              <div style={{ marginBottom: 10 }}>
                <button
                  type="button"
                  onClick={() => setLinkCustomerOpen(true)}
                  style={{
                    display: "inline-flex",
                    alignItems: "center",
                    gap: 6,
                    padding: "5px 12px",
                    borderRadius: 6,
                    background: "#ff7400",
                    color: "#fff",
                    fontWeight: 700,
                    fontSize: 11,
                    border: "none",
                    cursor: "pointer",
                  }}
                >
                  <i className="ti ti-link" style={{ fontSize: 13 }} />
                  Vincular Cliente
                </button>
              </div>
            )}
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
                {canOpenWaThread ? (
                  <button
                    type="button"
                    onClick={handleOpenWaThreadFromPhone}
                    disabled={waFromPhoneBusy}
                    title="Abrir hilo de WhatsApp; si hace tiempo sin mensajes, se envía un saludo para retomar contacto"
                    className="mu-ficha-link"
                    style={{
                      background: "none",
                      border: "none",
                      padding: 0,
                      cursor: waFromPhoneBusy ? "wait" : "pointer",
                      font: "inherit",
                      textDecoration: "underline",
                      textUnderlineOffset: 2,
                    }}
                  >
                    {displayPhone}
                  </button>
                ) : (
                  "—"
                )}
                {waFromPhoneErr ? (
                  <div style={{ fontSize: 10, color: "#ef4444", marginTop: 4 }}>{waFromPhoneErr}</div>
                ) : null}
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
      </div>

      {/* ── Pipeline contextual: antes de FichaOrden para stage=order/payment/dispatch ── */}
      {pipelineAt === "before_orden" && chat && (
        <div style={{ marginBottom: 10 }}>
          <PipelineMini stage={pipelineMiniStage} />
        </div>
      )}

      {/* ── Sección: Orden vinculada (CONDICIONAL) ─── */}
      {/* Para ml_question con orden se omite: ya se muestra MlOrderSection arriba con datos completos */}
      {chat && chat.source_type !== "ml_question" && <FichaOrdenSection chat={chat} />}

      {/* ── Sección: Vincular Orden ML (solo chats WA sin orden asociada) ── */}
      {canLinkMlOrder && (
        <div className="mu-ficha-section">
          <h4 className="mu-ficha-title">Canal · Zona MercadoLibre</h4>
          {!hasCustomer && (
            <p style={{ fontSize: 10, color: "var(--mu-ink-mute)", margin: "0 0 8px", lineHeight: 1.45 }}>
              Podés vincular la orden ML aunque el cliente aún no esté identificado en CRM: se asocia el hilo de WhatsApp
              a la compra ML y luego se puede fusionar el contacto cuando corresponda.
            </p>
          )}
          <div
            style={{
              padding: "8px 12px",
              borderRadius: 8,
              background: "rgba(255,116,0,0.06)",
              border: "1px solid rgba(255,116,0,0.2)",
              marginBottom: 4,
            }}
          >
            <button
              type="button"
              onClick={() => setLinkOrderOpen(true)}
              style={{
                display: "inline-flex",
                alignItems: "center",
                gap: 6,
                padding: "5px 12px",
                borderRadius: 6,
                background: "#ff7400",
                color: "#fff",
                fontWeight: 700,
                fontSize: 11,
                border: "none",
                cursor: "pointer",
              }}
            >
              <i className="ti ti-link" style={{ fontSize: 13 }} />
              Vincular Orden ML
            </button>
          </div>
        </div>
      )}

      {/* ── Pipeline contextual: antes de Órdenes recientes para stage=quote ── */}
      {pipelineAt === "before_orders" && chat && (
        <div style={{ marginBottom: 10 }}>
          <PipelineMini stage={pipelineMiniStage} />
        </div>
      )}

      {/* ── Sección: Órdenes recientes ───────────────── */}
      {showRecentOrdersSection && (
        <div className="mu-ficha-section">
          <h4 className="mu-ficha-title">Órdenes recientes</h4>
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
        </div>
      )}

      {/* ── Sección: Vehículos ───────────────────────── */}
      {customer && customer.vehicles && customer.vehicles.length > 0 && (
        <div className="mu-ficha-section">
          <h4 className="mu-ficha-title">Vehículos registrados</h4>
          <div style={{ display: "flex", flexWrap: "wrap", gap: 6 }}>
            {customer.vehicles.map(v => (
              <span key={v.id} className="mu-vehicle-tag">
                <i className="ti ti-car" style={{ fontSize: 11 }} />
                {v.label ?? `${v.brand_name} ${v.model_name} ${v.year_start ?? ""}`}
              </span>
            ))}
          </div>
        </div>
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
      onClose={() => setLinkCustomerOpen(false)}
      onSuccess={() => {
        setLinkCustomerOpen(false);
        onCustomerLinked?.();
      }}
    />
    </>
  );
}
