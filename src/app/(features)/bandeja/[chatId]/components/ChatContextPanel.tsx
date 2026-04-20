"use client";
import Link from "next/link";
import { useEffect, useMemo, useState, type CSSProperties, type ReactNode } from "react";
import type { InboxChat } from "@/types/inbox";
import { CHAT_STAGE_LABELS, CHAT_STAGE_ORDER } from "@/types/inbox";
import type { CustomerDetail } from "@/types/customers";
import type { Sale } from "@/types/sales";
import SaleStatusBadge from "@/app/(features)/ventas/pedidos/components/SaleStatusBadge";
import { IdentifyCustomerSection } from "@/app/(features)/bandeja/components/IdentifyCustomerSection";
import BotActionsTimeline from "@/components/bandeja/BotActionsTimeline";
import ExceptionsPanel from "@/components/bandeja/ExceptionsPanel";
import "@/app/(features)/supervisor/supervisor-theme.scss";

type ActionType = "quote" | "pay" | "pos" | "dispatch" | null;

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

function MlOrderSection({ chatId }: { chatId: string }) {
  const [loading, setLoading] = useState(true);
  const [data, setData]       = useState<MlOrderData | null>(null);
  const [error, setError]     = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;
    setLoading(true); setError(null);
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
    return () => { cancelled = true; };
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
    return () => { cancelled = true; };
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

/* ── Pipeline stage en ficha ─────────────────────────────────── */
function FichaStageSection({ chat }: { chat: InboxChat | null }) {
  if (!chat?.chat_stage) return null;
  const currentIdx = CHAT_STAGE_ORDER.indexOf(chat.chat_stage);

  return (
    <div className="mu-ficha-section">
      <h4 className="mu-ficha-title">Etapa del pipeline</h4>
      <div className="chat-stage-pipeline">
        {CHAT_STAGE_ORDER.map((stage, idx) => {
          const isPast    = idx < currentIdx;
          const isCurrent = idx === currentIdx;
          return (
            <div key={stage} className={`chat-stage-step${isPast ? " past" : isCurrent ? " current" : ""}`}>
              <div className="chat-stage-dot" />
              <div className="chat-stage-label">{CHAT_STAGE_LABELS[stage]}</div>
            </div>
          );
        })}
      </div>
    </div>
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

/* ── Acciones (placeholder visual, funcionalidad en Sprint 6B) ─ */
const ACTIONS: { key: ActionType; label: string; icon: string }[] = [
  { key: "quote",    label: "Cotizar",    icon: "ti-file-invoice" },
  { key: "pay",      label: "Cobrar",     icon: "ti-cash" },
  { key: "pos",      label: "POS",        icon: "ti-shopping-cart" },
  { key: "dispatch", label: "Despachar",  icon: "ti-truck" },
];

function FichaAccionesSection({ activeAction, onSetAction }: { activeAction: ActionType; onSetAction: (a: ActionType) => void }) {
  return (
    <div className="mu-ficha-section">
      <h4 className="mu-ficha-title">Acciones</h4>
      <div className="mu-ficha-actions">
        {ACTIONS.map(a => (
          <button
            key={a.key}
            type="button"
            className={`mu-ficha-action-btn${activeAction === a.key ? " mu-ficha-action-btn--primary" : ""}`}
            onClick={() => onSetAction(activeAction === a.key ? null : a.key)}
          >
            <i className={`ti ${a.icon}`} style={{ fontSize: "0.9rem" }} />
            {a.label}
          </button>
        ))}
      </div>
    </div>
  );
}

/* ── Componente principal ─────────────────────────────────────── */

type FichaTab = "ficha" | "bot" | "excepciones";

export default function ChatContextPanel({
  chatId, chat, customerId, customer, recentOrders,
  loadingCustomer, loadingOrders, activeAction, onSetAction,
  onCustomerLinked,
}: Props) {
  const hasCustomer = customerId !== null && customerId !== undefined;
  const [activeTab, setActiveTab] = useState<FichaTab>("ficha");

  return (
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

      {/* ── Tab: Ficha 360° (contenido original) ─────────────── */}
      {activeTab === "ficha" && <>

      {/* ML question: aplica para preguntas pendientes Y respondidas */}
      {(chat?.source_type === "ml_question" || chat?.source_type === "ml_message") && chat?.ml_question_id != null && (
        <MlQuestionContextSection chatId={chatId} chat={chat} />
      )}

      {/* Orden ML con ítems, producto y ubicación WMS */}
      {chat?.source_type === "ml_message" && (
        chat?.ml_order_id != null
          ? <MlOrderSection chatId={chatId} />
          : (
            <div className="mu-ficha-section">
              <h4 className="mu-ficha-title">Orden ML</h4>
              <p style={{ fontSize: 11, color: "var(--mu-ink-mute)", margin: 0, display: "flex", gap: 6, alignItems: "center" }}>
                <i className="ti ti-link-off" style={{ fontSize: 12 }} />
                Sin orden vinculada a este chat.
              </p>
              {process.env.NODE_ENV === "development" && (
                <pre style={{ fontSize: 8, color: "var(--mu-ink-mute)", marginTop: 4 }}>
                  {`ml_order_id: ${JSON.stringify(chat?.ml_order_id)}\nsource: ${chat?.source_type}`}
                </pre>
              )}
            </div>
          )
      )}

      {/* ── Sección: Cliente ─────────────────────────── */}
      <div className="mu-ficha-section">
        <h4 className="mu-ficha-title">
          Cliente
          {hasCustomer && customerId && (
            <Link href={`/clientes/historial?id=${customerId}`} className="mu-ficha-link">
              VER FICHA →
            </Link>
          )}
        </h4>

        {!hasCustomer ? (
          <div>
            <div style={{ display: "flex", alignItems: "center", gap: 6, marginBottom: 8, color: "var(--mu-ink-mute)", fontSize: 12 }}>
              <i className="ti ti-user-question" />
              <span>Cliente no identificado</span>
            </div>
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
              <dd>{customer.phone ?? chat?.phone ?? "—"}</dd>

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

            {/* Stats compactos */}
            <div className="mu-ficha-stats" style={{ marginTop: 10 }}>
              <div className="mu-stat-box">
                <div className="mu-stat-value">{customer.total_orders}</div>
                <div className="mu-stat-label">Órdenes</div>
              </div>
              <div className="mu-stat-box">
                <div className="mu-stat-value" style={{ fontSize: 16 }}>{fmtUSD(customer.total_spent_usd)}</div>
                <div className="mu-stat-label">Total gastado</div>
              </div>
            </div>
          </>
        ) : (
          <p style={{ color: "var(--mu-ink-mute)", fontSize: 11, margin: 0 }}>Sin datos del cliente</p>
        )}
      </div>

      {/* ── Sección: Orden vinculada (CONDICIONAL) ─── */}
      {chat && <FichaOrdenSection chat={chat} />}

      {/* ── Sección: Etapa pipeline ──────────────────── */}
      <FichaStageSection chat={chat} />

      {/* ── Sección: Acciones ────────────────────────── */}
      <FichaAccionesSection activeAction={activeAction} onSetAction={onSetAction} />

      {/* ── Sección: Órdenes recientes ───────────────── */}
      {hasCustomer && (
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
  );
}
