"use client";
import Link from "next/link";
import { useEffect, useMemo, useState } from "react";
import type { InboxChat } from "@/types/inbox";
import type { CustomerDetail } from "@/types/customers";
import type { Sale } from "@/types/sales";
import SaleStatusBadge from "@/app/(features)/ventas/pedidos/components/SaleStatusBadge";
import { IdentifyCustomerSection } from "@/app/(features)/bandeja/components/IdentifyCustomerSection";
import { ChatStageSection } from "@/app/(features)/bandeja/components/ChatStageSection";

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

function initials(name: string | null): string {
  if (!name) return "?";
  return name.trim().split(/\s+/).slice(0, 2).map(w => w[0]?.toUpperCase() ?? "").join("");
}

function fmtDate(iso: string | null): string {
  if (!iso) return "—";
  try { return new Date(iso).toLocaleDateString("es-VE", { day: "2-digit", month: "short", year: "numeric" }); }
  catch { return iso; }
}

function fmtUSD(v: number | string): string {
  const n = Number(v);
  return Number.isFinite(n) ? `$${n.toFixed(2)}` : "—";
}

function mlQuestionRoot(json: Record<string, unknown>): Record<string, unknown> {
  const d = json.data;
  if (d && typeof d === "object" && !Array.isArray(d)) return d as Record<string, unknown>;
  return json;
}

/** URL pública VE; si hay permalink del backend, usarlo. */
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

function MlQuestionContextSection({
  chatId,
  chat,
}: {
  chatId: string;
  chat: InboxChat | null;
}) {
  const [loadingQ, setLoadingQ] = useState(true);
  const [qError, setQError] = useState<string | null>(null);
  const [qRow, setQRow] = useState<Record<string, unknown> | null>(null);

  useEffect(() => {
    let cancelled = false;
    setLoadingQ(true);
    setQError(null);
    void (async () => {
      try {
        const res = await fetch(`/api/inbox/${encodeURIComponent(chatId)}/ml-question`, {
          credentials: "include",
          cache: "no-store",
        });
        const j = (await res.json().catch(() => ({}))) as Record<string, unknown>;
        if (cancelled) return;
        if (!res.ok || res.status === 404) {
          setQError("No se pudo cargar el detalle de la pregunta");
          setQRow(null);
          return;
        }
        setQRow(mlQuestionRoot(j));
      } catch {
        if (!cancelled) setQError("No se pudo cargar el detalle de la pregunta");
      } finally {
        if (!cancelled) setLoadingQ(false);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [chatId]);

  const questionText =
    qRow && typeof qRow.question_text === "string"
      ? qRow.question_text
      : qRow && typeof qRow.text === "string"
        ? qRow.text
        : null;
  const buyer =
    qRow && typeof qRow.buyer_nickname === "string"
      ? qRow.buyer_nickname
      : qRow && typeof qRow.buyer === "string"
        ? qRow.buyer
        : null;

  const itemId = useMemo(() => (qRow ? itemIdFromRow(qRow) : null), [qRow]);
  const permalink =
    qRow && typeof qRow.permalink === "string" && qRow.permalink.startsWith("http")
      ? qRow.permalink
      : null;
  const mlUrl = useMemo(() => mlVeItemUrl(itemId, permalink), [itemId, permalink]);

  const mlQid = chat?.ml_question_id;

  return (
    <div className="p-3 border-bottom bg-white">
      <div
        className="small fw-semibold text-muted text-uppercase mb-2"
        style={{ letterSpacing: ".05em", fontSize: "0.7rem" }}
      >
        Pregunta ML
      </div>
      {mlQid != null && mlQid !== "" && (
        <div className="text-muted small mb-2 font-monospace">ml_question_id: {String(mlQid)}</div>
      )}
      {loadingQ ? (
        <div className="placeholder-glow">
          <div className="placeholder col-12 rounded mb-2" style={{ height: 48 }} />
        </div>
      ) : qError ? (
        <p className="text-danger small mb-0">{qError}</p>
      ) : (
        <>
          <div className="small fw-semibold mb-1">Pregunta</div>
          {questionText ? (
            <blockquote className="small mb-3 ps-2 border-start border-3 border-warning text-body-secondary">
              {questionText}
            </blockquote>
          ) : (
            <p className="text-muted small">—</p>
          )}

          <div className="small fw-semibold mb-1">Ítem preguntado</div>
          <p className="small font-monospace mb-2">{itemId ?? "—"}</p>

          {buyer && (
            <div className="small text-muted mb-2">
              <span className="fw-semibold text-body-secondary">Comprador: </span>
              {buyer}
            </div>
          )}

          {mlUrl ? (
            <a
              href={mlUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="btn btn-sm btn-outline-primary w-100"
            >
              Ver en ML
            </a>
          ) : null}
        </>
      )}
    </div>
  );
}

const ACTIONS: { key: ActionType; label: string; icon: string; color: string }[] = [
  { key: "quote",    label: "+ Cotizar",    icon: "ti-file-invoice",  color: "outline-primary" },
  { key: "pay",      label: "$ Cobrar",     icon: "ti-cash",          color: "outline-success" },
  { key: "pos",      label: "POS rápido",   icon: "ti-shopping-cart", color: "outline-warning" },
  { key: "dispatch", label: "→ Despachar",  icon: "ti-truck",         color: "outline-secondary" },
];

/* ─── Skeleton ─── */
function CustomerSkeleton() {
  return (
    <div className="placeholder-glow">
      <div className="d-flex align-items-center gap-2 mb-3">
        <div className="rounded-circle placeholder bg-secondary" style={{ width: 44, height: 44 }} />
        <div className="flex-grow-1">
          <div className="placeholder col-7 rounded mb-1" style={{ height: 14 }} />
          <div className="placeholder col-5 rounded" style={{ height: 12 }} />
        </div>
      </div>
      <div className="placeholder col-12 rounded mb-2" style={{ height: 12 }} />
      <div className="placeholder col-8 rounded" style={{ height: 12 }} />
    </div>
  );
}

export default function ChatContextPanel({
  chatId, chat, customerId, customer, recentOrders,
  loadingCustomer, loadingOrders, activeAction, onSetAction,
  onCustomerLinked,
}: Props) {
  const hasCustomer = customerId !== null && customerId !== undefined;

  return (
    <div className="d-flex flex-column h-100 overflow-y-auto" style={{ background: "var(--bs-light)" }}>

      {chat?.source_type === "ml_question" && (
        <MlQuestionContextSection chatId={chatId} chat={chat} />
      )}

      {/* ── Sección 1: Ficha cliente ─────────────────────────── */}
      <div className="p-3 border-bottom bg-white">
        <div className="small fw-semibold text-muted text-uppercase mb-2" style={{ letterSpacing: ".05em", fontSize: "0.7rem" }}>
          Cliente
        </div>
        {!hasCustomer ? (
          <div className="py-1">
            <div className="d-flex align-items-center gap-1 mb-2">
              <i className="ti ti-user-question text-muted" />
              <span className="text-muted small">Cliente no identificado</span>
            </div>
            <IdentifyCustomerSection
              chatId={chatId}
              onLinked={onCustomerLinked ?? (() => {})}
            />
          </div>
        ) : loadingCustomer ? (
          <CustomerSkeleton />
        ) : customer ? (
          <>
            <div className="d-flex align-items-center gap-2 mb-2">
              <div className="rounded-circle bg-primary text-white d-flex align-items-center justify-content-center fw-bold flex-shrink-0"
                   style={{ width: 44, height: 44, fontSize: "0.85rem" }}>
                {initials(customer.full_name ?? chat?.customer_name)}
              </div>
              <div className="min-w-0">
                <div className="fw-semibold small text-truncate">{customer.full_name ?? chat?.customer_name}</div>
                <div className="text-muted" style={{ fontSize: "0.75rem" }}>{customer.phone ?? chat?.phone}</div>
              </div>
            </div>
            {customer.first_order_date && (
              <div className="text-muted small mb-2">
                <i className="ti ti-calendar me-1" />Cliente desde: {fmtDate(customer.first_order_date)}
              </div>
            )}
            <div className="row g-2 mb-2">
              <div className="col-6">
                <div className="border rounded text-center py-2 bg-light">
                  <div className="fw-bold">{customer.total_orders}</div>
                  <div className="text-muted" style={{ fontSize: "0.7rem" }}>Órdenes</div>
                </div>
              </div>
              <div className="col-6">
                <div className="border rounded text-center py-2 bg-light">
                  <div className="fw-bold small">{fmtUSD(customer.total_spent_usd)}</div>
                  <div className="text-muted" style={{ fontSize: "0.7rem" }}>Total gastado</div>
                </div>
              </div>
            </div>
            <Link
              href={`/clientes/historial?id=${customerId}`}
              className="btn btn-sm btn-outline-primary w-100"
            >
              Ver historial completo →
            </Link>
          </>
        ) : (
          <div className="text-muted small text-center py-2">Sin datos del cliente</div>
        )}
      </div>

      {/* ── Sección 1b: Pipeline de etapas ─────────────────── */}
      <ChatStageSection currentStage={chat?.chat_stage} />

      {/* ── Sección 2: Acciones ─────────────────────────────── */}
      <div className="p-3 border-bottom bg-white mt-2">
        <div className="small fw-semibold text-muted text-uppercase mb-2" style={{ letterSpacing: ".05em", fontSize: "0.7rem" }}>
          Acciones
        </div>
        <div className="row g-2">
          {ACTIONS.map(a => (
            <div key={a.key} className="col-6">
              <button
                className={`btn btn-sm w-100 d-flex align-items-center justify-content-center gap-1 ${
                  activeAction === a.key ? a.color.replace("outline-", "") + " text-white" : `btn-${a.color}`
                }`}
                onClick={() => onSetAction(activeAction === a.key ? null : a.key)}
              >
                <i className={`ti ${a.icon}`} style={{ fontSize: "0.85rem" }} />
                <span style={{ fontSize: "0.78rem" }}>{a.label}</span>
              </button>
            </div>
          ))}
        </div>
      </div>

      {/* ── Sección 3: Órdenes recientes ────────────────────── */}
      <div className="p-3 border-bottom bg-white mt-2">
        <div className="small fw-semibold text-muted text-uppercase mb-2" style={{ letterSpacing: ".05em", fontSize: "0.7rem" }}>
          Órdenes recientes
        </div>
        {!hasCustomer ? (
          <p className="text-muted small mb-0">—</p>
        ) : loadingOrders ? (
          <div className="placeholder-glow">
            {Array.from({ length: 3 }).map((_, i) => (
              <div key={i} className="placeholder col-12 rounded mb-2" style={{ height: 36 }} />
            ))}
          </div>
        ) : recentOrders.length === 0 ? (
          <p className="text-muted small mb-0">Sin órdenes activas</p>
        ) : (
          <div className="d-flex flex-column gap-1">
            {recentOrders.map(o => (
              <Link
                key={String(o.id)}
                href="/ventas/pedidos"
                className="d-flex align-items-center justify-content-between p-2 rounded border bg-light text-decoration-none"
                style={{ fontSize: "0.78rem" }}
              >
                <div>
                  <code className="text-body small">#{o.id}</code>
                  <div className="text-muted" style={{ fontSize: "0.7rem" }}>{fmtDate(o.created_at)}</div>
                </div>
                <div className="text-end">
                  <div className="fw-semibold">{fmtUSD(o.total_usd)}</div>
                  <SaleStatusBadge status={o.status} />
                </div>
              </Link>
            ))}
          </div>
        )}
      </div>

      {/* ── Sección 4: Vehículos ─────────────────────────────── */}
      {customer && customer.vehicles && customer.vehicles.length > 0 && (
        <div className="p-3 bg-white mt-2">
          <div className="small fw-semibold text-muted text-uppercase mb-2" style={{ letterSpacing: ".05em", fontSize: "0.7rem" }}>
            Vehículos registrados
          </div>
          <div className="d-flex flex-wrap gap-1">
            {customer.vehicles.map(v => (
              <span key={v.id} className="badge bg-light text-dark border" style={{ fontSize: "0.72rem", fontWeight: 500 }}>
                <i className="ti ti-car me-1" />
                {v.label ?? `${v.brand_name} ${v.model_name} ${v.year_start ?? ""}`}
              </span>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
