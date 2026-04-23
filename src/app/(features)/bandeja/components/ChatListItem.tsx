"use client";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useCallback, useState } from "react";
import type { InboxChat, ChatStage } from "@/types/inbox";
import { bandejaMlQuestionPipelineStage, normalizeChatStage } from "@/types/inbox";
import ExceptionBadge from "@/components/bandeja/ExceptionBadge";
import { useAppDispatch, useAppSelector } from "@/store/hooks";
import {
  bumpInboxRefetch,
  clearUrgent,
} from "@/store/realtimeSlice";
import MlOrderMessagingModal from "@/app/(features)/ventas/pedidos/components/MlOrderMessagingModal";

// ─── Origin helpers ────────────────────────────────────────────────────────────

function originClass(sourceType: string): string {
  const s = sourceType.toLowerCase();
  if (s.includes("social_media") || s.includes("wa") || s.includes("whatsapp"))
    return "origin-wa";
  if (s.includes("mercadolibre") || s.includes("ml_") || s.startsWith("ml"))
    return "origin-ml";
  if (s.includes("ecommerce") || s.includes("ecom") || s.includes("shopify"))
    return "origin-ecom";
  if (s.includes("fuerza") || s.includes("field") || s.includes("sales_force"))
    return "origin-fuerza";
  if (s.includes("mostrador") || s.includes("pos"))
    return "origin-mostrador";
  return "origin-wa";
}

// ─── Channel icon (inline SVG like the mockup) ─────────────────────────────────

const SVG_WA = (
  <svg viewBox="0 0 24 24">
    <rect width="24" height="24" rx="5" fill="#25D366" />
    <path d="M17 13.5c-.2-.1-1.3-.6-1.5-.7-.2-.1-.3-.1-.5.1s-.5.7-.7.8c-.1.2-.2.2-.5.1s-1-.4-1.9-1.1c-.7-.6-1.1-1.3-1.3-1.6s0-.3.1-.4c.1-.1.2-.2.3-.4l.2-.3c0-.1 0-.2 0-.4s-.5-1.2-.7-1.6-.4-.4-.5-.4h-.4c-.2 0-.4.1-.6.3s-.8.8-.8 1.9.8 2.2.9 2.3c.1.2 1.6 2.4 3.8 3.4.5.2.9.4 1.3.5.5.2 1 .1 1.4.1.4-.1 1.3-.5 1.5-1.1.2-.5.2-1 .1-1.1s-.2-.1-.4-.2z" fill="#fff" />
  </svg>
);

const SVG_ML_MSG = (
  <svg viewBox="0 0 24 24">
    <rect width="24" height="24" rx="5" fill="#FFE600" />
    <path d="M6 9c0-1.1.9-2 2-2h8c1.1 0 2 .9 2 2v4c0 1.1-.9 2-2 2h-5l-3 2.5V15H8c-1.1 0-2-.9-2-2V9z" fill="#2D3277" />
  </svg>
);

const SVG_ML_PREG = (
  <svg viewBox="0 0 24 24">
    <rect width="24" height="24" rx="5" fill="#FFE600" />
    <text x="12" y="17.5" textAnchor="middle" fontFamily="Inter,sans-serif" fontSize="15" fontWeight="800" fill="#2D3277">?</text>
  </svg>
);

const SVG_ECOM = (
  <svg viewBox="0 0 24 24">
    <rect width="24" height="24" rx="5" fill="#FF6B35" />
    <path d="M6 8h1.5l1.5 7h7l1.5-5H9" stroke="#fff" strokeWidth="1.5" fill="none" strokeLinecap="round" strokeLinejoin="round" />
    <circle cx="10" cy="17.5" r="1" fill="#fff" />
    <circle cx="15" cy="17.5" r="1" fill="#fff" />
  </svg>
);

const SVG_MOSTRADOR = (
  <svg viewBox="0 0 24 24">
    <rect width="24" height="24" rx="5" fill="#3b82f6" />
    <path d="M4 10h16M4 10v8a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2v-8M4 10l2-5a2 2 0 0 1 2-1h8a2 2 0 0 1 2 1l2 5" stroke="#fff" strokeWidth="1.5" fill="none" strokeLinejoin="round" />
  </svg>
);

const SVG_FUERZA = (
  <svg viewBox="0 0 24 24">
    <rect width="24" height="24" rx="5" fill="#FF6B35" />
    <path d="M12 5v14M5 12h14" stroke="#fff" strokeWidth="2.5" fill="none" strokeLinecap="round" />
  </svg>
);

function ChannelOriginIcon({ sourceType, mlQuestionId }: { sourceType: string; mlQuestionId?: string | number | null }) {
  const s = sourceType.toLowerCase();
  if (s.includes("social_media") || s.includes("wa") || s.includes("whatsapp"))
    return <span className="origen" aria-hidden="true">{SVG_WA}</span>;
  // Pregunta ML: tanto source_type = ml_question como ml_message si tiene ml_question_id
  if (s.includes("ml_preg") || s.includes("question") || (s.startsWith("ml") && mlQuestionId != null))
    return <span className="origen" aria-hidden="true">{SVG_ML_PREG}</span>;
  if (s.includes("mercadolibre") || s.includes("ml_") || s.startsWith("ml"))
    return <span className="origen" aria-hidden="true">{SVG_ML_MSG}</span>;
  if (s.includes("ecommerce") || s.includes("ecom") || s.includes("shopify"))
    return <span className="origen" aria-hidden="true">{SVG_ECOM}</span>;
  if (s.includes("fuerza") || s.includes("field") || s.includes("sales_force"))
    return <span className="origen" aria-hidden="true">{SVG_FUERZA}</span>;
  return <span className="origen" aria-hidden="true">{SVG_MOSTRADOR}</span>;
}

// ─── Stage chip ─────────────────────────────────────────────────────────────────

interface StageInfo { num: string; label: string; cls: string; }

const STAGE_MAP: Record<ChatStage, StageInfo> = {
  contact:   { num: "01", label: "Contacto",  cls: "st-01" },
  quote:     { num: "02", label: "Cotizar",   cls: "st-02" },
  approved:  { num: "03", label: "Aprobada",  cls: "st-03" },
  order:     { num: "04", label: "Orden",     cls: "st-04" },
  payment:   { num: "05", label: "Pago",      cls: "st-05" },
  dispatch:  { num: "06", label: "Despacho",  cls: "st-06" },
  closed:    { num: "07", label: "Cerrada",   cls: "st-07" },
};

function StageChip({ stage }: { stage: ChatStage | string }) {
  const s = normalizeChatStage(stage == null ? undefined : String(stage)) ?? "contact";
  const info = STAGE_MAP[s] ?? { num: "?", label: String(stage), cls: "st-07" };
  return (
    <span className={`bd-status ${info.cls}`}>
      <span className="num">{info.num}</span>
      {info.label}
    </span>
  );
}

// ─── Elapsed / SLA ──────────────────────────────────────────────────────────────

function elapsedBucket(
  lastAt: string | null,
  slaDeadline: string | null,
  stage: ChatStage | undefined
): "hot" | "warn" | "cold" | "ok" {
  if (stage === "closed") return "ok";
  if (slaDeadline) {
    const ms = new Date(slaDeadline).getTime() - Date.now();
    if (ms < 0) return "hot";
    if (ms < 3 * 3_600_000) return "warn";
    return "cold";
  }
  if (!lastAt) return "cold";
  const hours = (Date.now() - new Date(lastAt).getTime()) / 3_600_000;
  if (hours > 48) return "hot";
  if (hours > 12) return "warn";
  return "cold";
}

function fmtElapsed(lastAt: string | null): string {
  if (!lastAt) return "—";
  const ms = Date.now() - new Date(lastAt).getTime();
  if (ms < 0) return "—";
  const days = ms / 86_400_000;
  const hours = ms / 3_600_000;
  const mins = ms / 60_000;
  if (days >= 1) return `${Math.floor(days)}d`;
  if (hours >= 1) return `${Math.floor(hours)}h`;
  return `${Math.floor(mins)}m`;
}

function slaClass(
  isUrgent: boolean,
  slaDeadline: string | null
): "sla-hot" | "sla-warn" | "" {
  if (isUrgent) return "sla-hot";
  if (slaDeadline) {
    const ms = new Date(slaDeadline).getTime() - Date.now();
    if (ms < 0) return "sla-hot";
    if (ms < 3 * 3_600_000) return "sla-warn";
  }
  return "";
}

// ─── Time format ────────────────────────────────────────────────────────────────

function fmtTime(iso: string | null): string {
  if (!iso) return "";
  try {
    const d = new Date(iso);
    const now = new Date();
    if (d.toDateString() === now.toDateString()) {
      return d.toLocaleTimeString("es-VE", { hour: "2-digit", minute: "2-digit" });
    }
    return d.toLocaleDateString("es-VE", { day: "2-digit", month: "2-digit" });
  } catch { return ""; }
}

function initials(name: string | null, phone: string): string {
  if (name?.trim()) {
    const parts = name.trim().split(" ");
    return (parts[0][0] + (parts[1]?.[0] ?? "")).toUpperCase();
  }
  return phone.slice(-2).toUpperCase();
}

// ─── Avatar color palette ────────────────────────────────────────────────────────

const AV_PALETTE = [
  { bg: "#1e5a3a", color: "#86efac" },
  { bg: "#1e4a7a", color: "#93c5fd" },
  { bg: "#7a3a1e", color: "#fdba74" },
  { bg: "#7a1e1e", color: "#fca5a5" },
  { bg: "#5a2e7a", color: "#c4b5fd" },
  { bg: "#2d5a5a", color: "#67e8f9" },
  { bg: "#5a4a1e", color: "#fde047" },
];

function avColor(key: string) {
  let h = 0;
  for (let i = 0; i < key.length; i++)
    h = ((h * 31 + key.charCodeAt(i)) >>> 0) % AV_PALETTE.length;
  return AV_PALETTE[h];
}

// ─── Clock SVG ──────────────────────────────────────────────────────────────────

const ClockSvg = (
  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" aria-hidden="true">
    <circle cx="12" cy="12" r="9" />
    <path d="M12 7v5l3 2" />
  </svg>
);

// ─── Component ──────────────────────────────────────────────────────────────────

interface Props {
  chat:    InboxChat;
  active?: boolean;
}

export default function ChatListItem({ chat, active }: Props) {
  const router   = useRouter();
  const dispatch = useAppDispatch();
  const [mlPackSale, setMlPackSale] = useState<{
    saleId: string;
    externalHint: string | null;
  } | null>(null);
  const [mlPackBusy, setMlPackBusy] = useState(false);
  const [mlPackErr, setMlPackErr]   = useState<string | null>(null);
  const myUserId            = useAppSelector((s) => s.auth.userId);
  const presence            = useAppSelector((s) => s.realtime.presenceByChat[String(chat.id)]);
  const urgentRedux         = useAppSelector((s) => s.realtime.urgentChats[String(chat.id)]);

  const isUrgent = Boolean(urgentRedux || chat.is_urgent);
  /** P1: pendiente de respuesta = último mensaje inbound (misma regla que campana “Sin atender”). */
  const waitingReply = Boolean(chat.customer_waiting_reply);

  const displayName = chat.customer_name ?? chat.phone;
  const preview = chat.last_message_text
    ? chat.last_message_text.slice(0, 60) + (chat.last_message_text.length > 60 ? "…" : "")
    : "Sin mensajes";

  const ini = initials(chat.customer_name, chat.phone);
  const av  = avColor(chat.customer_name ?? chat.phone);

  const href = `/bandeja/${String(chat.id)}`;

  const stageNorm =
    bandejaMlQuestionPipelineStage(
      chat.chat_stage == null ? undefined : String(chat.chat_stage),
      chat
    ) ?? "contact";

  const isOperational = Boolean(chat.is_operational);
  const origCls  = originClass(chat.source_type);
  const slaCls   = slaClass(isUrgent, chat.sla_deadline_at ?? null);
  const bucket   = elapsedBucket(chat.last_message_at, chat.sla_deadline_at ?? null, stageNorm);
  const elapsed  = fmtElapsed(chat.last_message_at);
  const showViewingChip = presence && myUserId != null && presence.userId !== myUserId;

  const mlOid =
    chat.source_type === "ml_message" && chat.ml_order_id != null && String(chat.ml_order_id).trim() !== ""
      ? String(chat.ml_order_id).trim()
      : null;
  const linkedSalePk =
    chat.order != null && Number.isFinite(Number(chat.order.id)) && Number(chat.order.id) > 0
      ? Number(chat.order.id)
      : null;

  const openMlPackModal = useCallback(
    async (e: React.MouseEvent) => {
      e.preventDefault();
      e.stopPropagation();
      setMlPackErr(null);
      if (!mlOid) return;
      if (linkedSalePk != null && Number.isFinite(linkedSalePk) && linkedSalePk > 0) {
        setMlPackSale({ saleId: `so-${linkedSalePk}`, externalHint: mlOid });
        return;
      }
      setMlPackBusy(true);
      try {
        const res = await fetch(
          `/api/ventas/pedidos/resolve-ml-order?ml_order_id=${encodeURIComponent(mlOid)}`,
          { credentials: "include", cache: "no-store" }
        );
        const j = (await res.json().catch(() => ({}))) as {
          data?: { id?: string; external_order_id?: string | null };
          error?: string;
          message?: string;
        };
        if (!res.ok || !j.data?.id) {
          const msg =
            (typeof j.error === "string" && j.error.trim()) ||
            (typeof j.message === "string" && j.message.trim()) ||
            "No hay venta importada en ERP para esta orden ML.";
          setMlPackErr(msg);
          return;
        }
        setMlPackSale({
          saleId: String(j.data.id).trim(),
          externalHint:
            j.data.external_order_id != null && String(j.data.external_order_id).trim() !== ""
              ? String(j.data.external_order_id).trim()
              : mlOid,
        });
      } catch {
        setMlPackErr("Error de red al resolver la orden.");
      } finally {
        setMlPackBusy(false);
      }
    },
    [mlOid, linkedSalePk]
  );

  const onNavigate = useCallback(
    (e: React.MouseEvent<HTMLAnchorElement>) => {
      if (e.defaultPrevented) return;
      if (e.button !== 0 || e.metaKey || e.ctrlKey || e.shiftKey || e.altKey) return;
      e.preventDefault();
      dispatch(clearUrgent(String(chat.id)));
      router.push(href);
    },
    [chat.id, dispatch, href, router]
  );

  return (
    <>
      <Link
        href={href}
        prefetch={false}
        className="text-decoration-none d-block"
        onClick={onNavigate}
        aria-label={`Conversación con ${displayName}`}
      >
        <div
          className={[
            "bd-inbox-row",
            origCls,
            slaCls,
            active ? "bd-inbox-row--active" : "",
            isOperational ? "bd-inbox-row--operational" : "",
          ].filter(Boolean).join(" ")}
        >
          {/* Avatar */}
          <div
            className="bd-avatar"
            style={
              isOperational
                ? { background: "var(--mu-panel-2, #2a2a2a)", color: "var(--mu-ink-mute, #888)", filter: "grayscale(1)" }
                : { background: av.bg, color: av.color }
            }
            aria-hidden="true"
          >
            {ini}
          </div>

          {/* Cuerpo */}
          <div className="bd-row-body">
            <div className="bd-row-top">
              <div className="bd-row-name">{displayName}</div>
              <div className="bd-row-time">{fmtTime(chat.last_message_at)}</div>
            </div>

            <div className="bd-row-msg">{preview}</div>

            <div className="bd-row-tags">
              <ChannelOriginIcon sourceType={chat.source_type} mlQuestionId={chat.ml_question_id} />

              {stageNorm !== "closed" && elapsed !== "—" && (
                <span className={`bd-elapsed ${bucket}`}>
                  {ClockSvg}
                  {elapsed}
                </span>
              )}

              {isOperational ? (
                <span
                  style={{
                    display: "inline-flex",
                    alignItems: "center",
                    gap: 4,
                    fontSize: 9,
                    fontWeight: 700,
                    letterSpacing: "0.06em",
                    textTransform: "uppercase",
                    padding: "2px 7px",
                    borderRadius: 4,
                    background: "rgba(200,200,200,0.12)",
                    color: "var(--mu-ink-mute, #999)",
                    border: "1px solid rgba(200,200,200,0.2)",
                  }}
                >
                  <i className="ti ti-building" style={{ fontSize: 9 }} />
                  No cliente
                </span>
              ) : (
                stageNorm && <StageChip stage={stageNorm} />
              )}

              {mlOid != null && (
                <button
                  type="button"
                  className="bd-ir-venta-btn"
                  disabled={mlPackBusy}
                  title={mlPackErr ?? "Mensajería pack ML de la orden (ventana emergente)"}
                  aria-label="Abrir mensajería ML de la orden"
                  onClick={openMlPackModal}
                >
                  {mlPackBusy ? "…" : "Mensaje ML"}
                </button>
              )}

              {/* Bloque 2 — excepción activa */}
              {(chat.has_active_exception ?? false) && (
                <ExceptionBadge
                  code={chat.top_exception_code ?? "MANUAL_REVIEW_REQUESTED"}
                  reason={chat.top_exception_reason ?? "Excepción activa"}
                  compact
                />
              )}

              {showViewingChip && (
                <span
                  className="bd-viewing-chip"
                  title={`${presence.userName} está viendo este chat`}
                >
                  Viendo: {presence.userName}
                </span>
              )}
            </div>
          </div>

          {/* Pendiente atención (P1): último mensaje del cliente sin respuesta */}
          {waitingReply && (
            <div
              className="bd-unread-count"
              aria-label="Pendiente de respuesta"
              title="El último mensaje es del cliente — pendiente de respuesta"
            >
              1
            </div>
          )}
        </div>
      </Link>
      {mlPackSale != null && (
        <MlOrderMessagingModal
          saleId={mlPackSale.saleId}
          externalHint={mlPackSale.externalHint ?? undefined}
          onAfterReply={() => {
            dispatch(bumpInboxRefetch());
          }}
          onClose={() => {
            setMlPackSale(null);
            setMlPackErr(null);
          }}
        />
      )}
    </>
  );
}
