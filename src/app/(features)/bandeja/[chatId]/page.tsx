"use client";
import { useCallback, useEffect, useRef, useState } from "react";
import Link from "next/link";
import { useParams, useRouter } from "next/navigation";
import type { InboxChat } from "@/types/inbox";
import { useChatMessages } from "@/hooks/useChatMessages";
import { useChatContext } from "@/hooks/useChatContext";
import { useAppDispatch, useAppSelector } from "@/store/hooks";
import { bumpInboxRefetch, clearMyPending } from "@/store/realtimeSlice";
import ChatHeader from "../components/ChatHeader";
import ChatWindow from "../components/ChatWindow";
import PipelineMini from "../components/PipelineMini";
import MessageInput from "../components/MessageInput";
import ChatContextPanel from "./components/ChatContextPanel";
import ChatActionSlideOver from "./components/ChatActionSlideOver";
import EditCustomerModal from "./components/EditCustomerModal";

type ActionType = "quote" | "pay" | "pos" | "dispatch" | null;

/** Último mediaUrl de imagen inbound del chat. */
function getLastImageUrl(messages: import("@/types/inbox").ChatMessage[]): string | null {
  for (let i = messages.length - 1; i >= 0; i--) {
    const m = messages[i];
    if (
      m.direction === "inbound" &&
      m.content.mediaUrl &&
      (!m.content.mimeType || m.content.mimeType.startsWith("image/"))
    ) {
      return m.content.mediaUrl;
    }
  }
  return null;
}

const ACTION_LABELS: Record<NonNullable<ActionType>, (name: string | null) => string> = {
  quote:    name => `+ Creando cotización${name ? ` para ${name}` : ""}`,
  pay:      name => `$ Cobrando${name ? ` a ${name}` : ""}`,
  pos:      name => `POS rápido${name ? ` — ${name}` : ""}`,
  dispatch: name => `→ Despachando orden${name ? ` de ${name}` : ""}`,
};

function errMsg(e: unknown) { return e instanceof Error ? e.message : "Error."; }

function parseReleaseFailure(res: Response, data: Record<string, unknown>): string {
  if (typeof data.message === "string" && data.message.trim()) return data.message;
  if (typeof data.error === "string" && data.error.trim()) return data.error;
  const err = data.error;
  if (err && typeof err === "object" && err !== null && "message" in err) {
    const m = (err as { message?: unknown }).message;
    if (typeof m === "string" && m.trim()) return m;
  }
  return `No se pudo liberar la conversación (código ${res.status}).`;
}

/**
 * /bandeja/[chatId] — Módulo Unificado de Ventas (Sprint 6A)
 *
 * Columna INBOX vive en BandejaShell (layout /bandeja) y no se remonta al navegar.
 * Esta página aporta: [CONVO + FICHA] y overlays.
 */
export default function ChatDetailPage() {
  const dispatch = useAppDispatch();
  const params = useParams();
  const router = useRouter();
  const chatId = params.chatId as string;
  const myUserId = useAppSelector((s) => s.auth.userId);
  const slaFromRealtime = useAppSelector((s) => s.realtime.slaDeadlineByChat[chatId] ?? null);

  const [chat, setChat]                     = useState<InboxChat | null>(null);
  const [chatLoading, setChatLoading]       = useState(true);
  const [chatError, setChatError]           = useState<string | null>(null);
  const [activeAction, setActiveAction]     = useState<ActionType>(null);
  const [editCustomerOpen, setEditCustomerOpen] = useState(false);
  const [photoViewerUrl, setPhotoViewerUrl] = useState<string | null>(null);
  const [releasePending, setReleasePending] = useState(false);
  const [releaseError, setReleaseError] = useState<string | null>(null);
  const releaseInFlight = useRef(false);

  /* Mensajes y envío */
  const {
    messages, loading: msgLoading, loadingMore, error: msgError,
    loadMore, sendMessage, refetch,
  } = useChatMessages(chatId);

  const sendMessageForChat = useCallback(
    async (text: string, sentBy: string): Promise<{ success: boolean; errorMessage?: string }> => {
      const src = chat?.source_type ?? "";

      if (src === "ml_question") {
        try {
          const res = await fetch(`/api/inbox/${chatId}/ml-question/answer`, {
            method: "POST", credentials: "include",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ answer_text: text, answered_by: myUserId ?? sentBy }),
          });
          if (res.ok) { await refetch(); fetchChat(); return { success: true }; }
          const errData = (await res.json().catch(() => ({}))) as Record<string, unknown>;
          const detail = typeof errData.message === "string" ? errData.message
            : typeof errData.error === "string" ? errData.error
            : `HTTP ${res.status}`;
          return { success: false, errorMessage: `Error ML: ${detail}` };
        } catch {
          return { success: false, errorMessage: "Error al responder la pregunta en ML" };
        }
      }

      if (src === "ml_message") {
        try {
          const res = await fetch(
            `/api/inbox/${encodeURIComponent(chatId)}/ml-message/reply`,
            {
              method: "POST", credentials: "include",
              headers: { "Content-Type": "application/json" },
              body: JSON.stringify({ text, answered_by: sentBy }),
            }
          );
          const data = (await res.json().catch(() => ({}))) as Record<string, unknown>;
          if (!res.ok) {
            const errObj = data.error;
            if (res.status === 502 || (typeof errObj === "object" && errObj && "code" in errObj && (errObj as { code?: string }).code === "ML_SEND_FAILED")) {
              return { success: false, errorMessage: "Error al enviar por ML. Verifica que la orden esté activa." };
            }
            const msg = typeof errObj === "string" ? errObj
              : errObj && typeof errObj === "object" && "message" in errObj
                ? String((errObj as { message?: string }).message ?? "")
                : `Error ${res.status}`;
            return { success: false, errorMessage: msg || "No se pudo enviar el mensaje." };
          }
          await refetch();
          return { success: true };
        } catch {
          return { success: false, errorMessage: "Error al enviar por ML. Verifica que la orden esté activa." };
        }
      }

      const ok = await sendMessage(text, sentBy);
      return { success: ok, errorMessage: ok ? undefined : "No se pudo enviar el mensaje. Intenta de nuevo." };
    },
    [chat?.source_type, chatId, sendMessage, refetch]
  );

  /* Contexto del cliente */
  const customerId    = chat?.customer_id ?? null;
  const customerName  = chat?.customer_name ?? null;
  const { customer, recentOrders, loadingCustomer, loadingOrders } = useChatContext(customerId);

  const lastImageUrl = getLastImageUrl(messages);

  /* Fetch del chat activo por ID directo */
  const fetchChat = useCallback(async () => {
    if (!chatId) return;
    setChatLoading(true);
    setChatError(null);
    try {
      const r = await fetch(`/api/crm/chats/${encodeURIComponent(chatId)}/context`, {
        credentials: "include",
      });
      if (!r.ok) return;
      const d = (await r.json().catch(() => ({}))) as Record<string, unknown>;
      const raw = d.chat as Record<string, unknown> | null;
      if (!raw) return;
      const customerRaw = d.customer as Record<string, unknown> | null;
      const orderRaw = d.order as Record<string, unknown> | null | undefined;
      const order =
        orderRaw && orderRaw.id != null
          ? {
              id: Number(orderRaw.id),
              payment_status: String(orderRaw.payment_status ?? ""),
              fulfillment_type: String(orderRaw.fulfillment_type ?? ""),
              channel_id: orderRaw.channel_id != null ? Number(orderRaw.channel_id) : null,
            }
          : null;
      const mapped: InboxChat = {
        id: Number(raw.id),
        phone: String(raw.phone ?? ""),
        source_type: String(raw.source_type ?? ""),
        identity_status: String(raw.identity_status ?? ""),
        last_message_text: raw.last_message_text != null ? String(raw.last_message_text) : "",
        last_message_at: raw.last_message_at != null ? String(raw.last_message_at) : null,
        unread_count: Number(raw.unread_count) || 0,
        ml_order_id: raw.ml_order_id != null ? String(raw.ml_order_id) : null,
        ml_question_id: raw.ml_question_id != null ? Number(raw.ml_question_id) : null,
        customer_id: raw.customer_id != null ? Number(raw.customer_id) : null,
        assigned_to: raw.assigned_to != null ? Number(raw.assigned_to) : null,
        customer_name: customerRaw?.full_name != null ? String(customerRaw.full_name) : null,
        order,
        status: raw.status != null ? (raw.status as InboxChat["status"]) : "UNASSIGNED",
        sla_deadline_at: raw.sla_deadline_at != null ? String(raw.sla_deadline_at) : null,
        last_outbound_at: raw.last_outbound_at != null ? String(raw.last_outbound_at) : null,
      };
      setChat(mapped);
    } catch (e: unknown) {
      setChatError(errMsg(e));
    } finally {
      setChatLoading(false);
    }
  }, [chatId]);

  useEffect(() => {
    void fetchChat();
  }, [fetchChat]);

  useEffect(() => {
    if (!chatId) return;
    const url = `/api/bandeja/${encodeURIComponent(chatId)}/presence`;
    const open = () => {
      void fetch(url, {
        method: "POST",
        credentials: "include",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ viewing: true }),
      }).catch(() => {});
    };
    open();
    return () => {
      void fetch(url, {
        method: "POST",
        credentials: "include",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ viewing: false }),
      }).catch(() => {});
    };
  }, [chatId]);

  const handleRelease = useCallback(async () => {
    if (releaseInFlight.current) return;
    if (
      !globalThis.window?.confirm(
        "¿Liberar esta conversación? Volverá a la bandeja general para que otro agente pueda tomarla."
      )
    ) {
      return;
    }
    releaseInFlight.current = true;
    setReleasePending(true);
    setReleaseError(null);
    try {
      const res = await fetch(`/api/bandeja/${encodeURIComponent(chatId)}/release`, {
        method: "POST",
        credentials: "include",
        headers: { "Content-Type": "application/json" },
      });
      const data = (await res.json().catch(() => ({}))) as Record<string, unknown>;
      if (!res.ok) {
        setReleaseError(parseReleaseFailure(res, data));
        return;
      }
      dispatch(bumpInboxRefetch());
      dispatch(clearMyPending());
      await refetch();
      await fetchChat();
      router.push("/bandeja");
    } catch (e: unknown) {
      setReleaseError(errMsg(e));
    } finally {
      releaseInFlight.current = false;
      setReleasePending(false);
    }
  }, [chatId, router, dispatch, refetch, fetchChat]);

  const slaDeadline = slaFromRealtime ?? chat?.sla_deadline_at ?? null;
  const showRelease =
    chat != null &&
    chat.status === "PENDING_RESPONSE" &&
    myUserId != null &&
    chat.assigned_to === myUserId;

  const actionLabel = activeAction ? ACTION_LABELS[activeAction](customerName) : null;

  return (
    <>
      <div
        className="bandeja-detail-center-wrap"
        style={{
          display: "flex",
          flex: 1,
          minWidth: 0,
          minHeight: 0,
          overflow: "hidden",
          alignSelf: "stretch",
        }}
      >
        {/* ── Columna CONVO (hilo activo) ─────────────────────── */}
        <div className="bandeja-detail-main bw-chat">

            {/* Header del chat */}
            {chatLoading ? (
              <div className="bandeja-chat-header-wa" style={{ opacity: 0.5 }}>
                <div className="mu-skeleton" style={{ width: 40, height: 40, borderRadius: "50%" }} />
                <div className="mu-skeleton" style={{ width: 120, height: 14, borderRadius: 4 }} />
              </div>
            ) : chatError ? (
              <div className="bandeja-chat-header-wa">
                <span className="bandeja-wa-alert small">{chatError}</span>
              </div>
            ) : chat ? (
              <ChatHeader
                chat={chat}
                lastImageUrl={lastImageUrl}
                onViewPhoto={lastImageUrl ? () => setPhotoViewerUrl(lastImageUrl) : undefined}
                onEditCustomer={customerId != null ? () => setEditCustomerOpen(true) : undefined}
                slaDeadline={slaDeadline}
                showRelease={showRelease}
                onRelease={showRelease ? handleRelease : undefined}
                releasePending={showRelease ? releasePending : undefined}
              />
            ) : (
              <div className="bandeja-chat-header-wa">
                <Link href="/bandeja" className="btn btn-sm mu-icon-btn">
                  <i className="ti ti-arrow-left me-1" />Volver
                </Link>
                <span style={{ color: "var(--mu-ink-mute)" }} className="small">Chat #{chatId}</span>
              </div>
            )}

            {releaseError ? (
              <div
                className="d-flex align-items-center justify-content-between gap-2 px-3 py-2 small"
                style={{
                  background: "rgba(220, 53, 69, 0.12)",
                  borderBottom: "1px solid var(--mu-line)",
                  color: "var(--mu-ink)",
                }}
                role="alert"
              >
                <span>{releaseError}</span>
                <button
                  type="button"
                  className="btn btn-sm btn-link p-0 text-decoration-none"
                  onClick={() => setReleaseError(null)}
                >
                  Cerrar
                </button>
              </div>
            ) : null}

            {/* Pipeline mini — entre header y mensajes */}
            {chat && <PipelineMini stage={chat.chat_stage} />}

            {/* Banner de acción activa */}
            {actionLabel && (
              <div className="chat-action-banner">
                <span><i className="ti ti-tools me-2" />{actionLabel}</span>
                <button
                  type="button"
                  className="btn btn-sm p-0 border-0 bg-transparent"
                  style={{ color: "var(--mu-ink-mute)", fontSize: "1rem" }}
                  onClick={() => setActiveAction(null)}
                  aria-label="Cerrar acción"
                >×</button>
              </div>
            )}

            {/* Ventana de mensajes */}
            <ChatWindow
              messages={messages}
              loading={msgLoading}
              loadingMore={loadingMore}
              error={msgError}
              onLoadMore={loadMore}
            />

            {/* Input de mensaje */}
            <MessageInput
              chatId={chatId}
              sourceType={chat?.source_type ?? ""}
              onSend={sendMessageForChat}
            />

            {/* Slide-over / modales: dentro de CONVO para no añadir columnas al flex del shell */}
            <ChatActionSlideOver
              action={activeAction}
              chatId={chatId}
              customerId={customerId}
              customerName={customerName}
              recentOrders={recentOrders}
              onClose={() => setActiveAction(null)}
              onSuccess={() => setActiveAction(null)}
            />

            {customerId != null && (
              <EditCustomerModal
                open={editCustomerOpen}
                customerId={Number(customerId)}
                currentName={chat?.customer_name ?? null}
                currentPhone={chat?.phone ?? null}
                onClose={() => setEditCustomerOpen(false)}
                onSuccess={() => { setEditCustomerOpen(false); fetchChat(); }}
              />
            )}

            {photoViewerUrl && (
              <>
                <div
                  style={{
                    position: "fixed",
                    inset: 0,
                    background: "rgba(0,0,0,0.85)",
                    zIndex: 10000,
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                  }}
                  onClick={() => setPhotoViewerUrl(null)}
                  role="dialog"
                  aria-modal
                  aria-label="Vista de imagen"
                >
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img
                    src={photoViewerUrl}
                    alt="Imagen del chat"
                    style={{ maxWidth: "90vw", maxHeight: "90vh", borderRadius: 8, boxShadow: "0 4px 32px rgba(0,0,0,0.6)" }}
                    onClick={(e) => e.stopPropagation()}
                  />
                  <button
                    type="button"
                    aria-label="Cerrar"
                    onClick={() => setPhotoViewerUrl(null)}
                    style={{
                      position: "absolute",
                      top: 16,
                      right: 16,
                      background: "rgba(255,255,255,0.1)",
                      border: "none",
                      borderRadius: "50%",
                      width: 36,
                      height: 36,
                      color: "#fff",
                      fontSize: "1.2rem",
                      cursor: "pointer",
                      display: "flex",
                      alignItems: "center",
                      justifyContent: "center",
                    }}
                  >
                    <i className="ti ti-x" />
                  </button>
                </div>
              </>
            )}
          </div>

          {/* ── Columna FICHA 360° ──────────────────────────────── */}
          <div className="bandeja-detail-context">
            <ChatContextPanel
              chatId={chatId}
              chat={chat}
              customerId={customerId}
              customer={customer}
              recentOrders={recentOrders}
              loadingCustomer={loadingCustomer}
              loadingOrders={loadingOrders}
              activeAction={activeAction}
              onSetAction={setActiveAction}
              onCustomerLinked={fetchChat}
            />
          </div>
        </div>
    </>
  );
}
