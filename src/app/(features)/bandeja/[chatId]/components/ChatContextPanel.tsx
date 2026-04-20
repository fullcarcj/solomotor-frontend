"use client";
import Link from "next/link";
import { useEffect, useMemo, useState } from "react";
import type { InboxChat } from "@/types/inbox";
import { CHAT_STAGE_LABELS, CHAT_STAGE_ORDER } from "@/types/inbox";
import type { CustomerDetail } from "@/types/customers";
import type { Sale } from "@/types/sales";
import SaleStatusBadge from "@/app/(features)/ventas/pedidos/components/SaleStatusBadge";
import { IdentifyCustomerSection } from "@/app/(features)/bandeja/components/IdentifyCustomerSection";

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

/* ── Sección ML question (solo para source_type = ml_question) ── */

function mlQuestionRoot(json: Record<string, unknown>): Record<string, unknown> {
  const d = json.data;
  if (d && typeof d === "object" && !Array.isArray(d)) return d as Record<string, unknown>;
  return json;
}

function mlVeItemUrl(itemIdRaw: string | null | undefined, permalink: string | null | undefined): string | null {
  if (permalink && permalink.startsWith("http")) return permalink;
  if (!itemIdRaw) return null;
  let s = String(itemIdRaw).trim();
  if (s.toUpperCase().startsWith("MLV")) s = s.slice(3).replace(/^[-_]/, "");
  if (!s) return null;
  return `https://articulo.mercadolibre.com.ve/MLV-${s}`;
}

function itemIdFromRow(r: Record<string, unknown>): string | null {
  const v = r.item_id ?? r.itemId;
  if (v == null || v === "") return null;
  return String(v);
}

function MlQuestionContextSection({ chatId, chat }: { chatId: string; chat: InboxChat | null }) {
  const [loadingQ, setLoadingQ] = useState(true);
  const [qError, setQError]     = useState<string | null>(null);
  const [qRow, setQRow]         = useState<Record<string, unknown> | null>(null);

  useEffect(() => {
    let cancelled = false;
    setLoadingQ(true); setQError(null);
    void (async () => {
      try {
        const res = await fetch(`/api/inbox/${encodeURIComponent(chatId)}/ml-question`, {
          credentials: "include", cache: "no-store",
        });
        const j = (await res.json().catch(() => ({}))) as Record<string, unknown>;
        if (cancelled) return;
        if (!res.ok || res.status === 404) { setQError("No se pudo cargar la pregunta"); setQRow(null); return; }
        setQRow(mlQuestionRoot(j));
      } catch {
        if (!cancelled) setQError("No se pudo cargar la pregunta");
      } finally {
        if (!cancelled) setLoadingQ(false);
      }
    })();
    return () => { cancelled = true; };
  }, [chatId]);

  const questionText = qRow && (typeof qRow.question_text === "string" ? qRow.question_text : typeof qRow.text === "string" ? qRow.text : null);
  const buyer        = qRow && (typeof qRow.buyer_nickname === "string" ? qRow.buyer_nickname : typeof qRow.buyer === "string" ? qRow.buyer : null);
  const itemId       = useMemo(() => (qRow ? itemIdFromRow(qRow) : null), [qRow]);
  const permalink    = qRow && typeof qRow.permalink === "string" && qRow.permalink.startsWith("http") ? qRow.permalink : null;
  const mlUrl        = useMemo(() => mlVeItemUrl(itemId, permalink), [itemId, permalink]);
  const mlQid        = chat?.ml_question_id;

  return (
    <div className="mu-ficha-section">
      <h4 className="mu-ficha-title">Pregunta ML</h4>
      {mlQid != null && (
        <div style={{ fontSize: 9, color: "var(--mu-ink-mute)", fontFamily: "monospace", marginBottom: 6 }}>
          ml_question_id: {String(mlQid)}
        </div>
      )}
      {loadingQ ? <Skeleton rows={2} /> : qError ? (
        <p style={{ color: "var(--mu-bad)", fontSize: 11, margin: 0 }}>{qError}</p>
      ) : (
        <>
          {questionText && (
            <blockquote style={{
              fontSize: 12, margin: "0 0 8px", padding: "8px 10px",
              borderLeft: "3px solid var(--mu-accent)", background: "var(--mu-panel-2)",
              borderRadius: "0 6px 6px 0", color: "var(--mu-ink-dim)", lineHeight: 1.5,
            }}>
              {questionText}
            </blockquote>
          )}
          {buyer && <div style={{ fontSize: 10, color: "var(--mu-ink-mute)", marginBottom: 4 }}>Comprador: {buyer}</div>}
          {itemId && <div style={{ fontSize: 10, fontFamily: "monospace", color: "var(--mu-ink-mute)", marginBottom: 6 }}>{itemId}</div>}
          {mlUrl && (
            <a href={mlUrl} target="_blank" rel="noopener noreferrer"
               style={{ fontSize: 10, color: "var(--mu-accent)", textDecoration: "underline" }}>
              Ver en MercadoLibre →
            </a>
          )}
        </>
      )}
    </div>
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
export default function ChatContextPanel({
  chatId, chat, customerId, customer, recentOrders,
  loadingCustomer, loadingOrders, activeAction, onSetAction,
  onCustomerLinked,
}: Props) {
  const hasCustomer = customerId !== null && customerId !== undefined;

  return (
    <div className="mu-ficha">

      {/* ML question solo si aplica */}
      {chat?.source_type === "ml_question" && (
        <MlQuestionContextSection chatId={chatId} chat={chat} />
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

    </div>
  );
}
