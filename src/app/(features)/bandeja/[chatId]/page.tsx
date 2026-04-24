"use client";
import { useCallback, useEffect, useLayoutEffect, useMemo, useRef, useState, startTransition } from "react";
import Link from "next/link";
import { useParams, useRouter } from "next/navigation";
import type { InboxChat } from "@/types/inbox";
import {
  bandejaMlQuestionPipelineStage,
  normalizeChatStage,
  isMlQuestionThreadChat,
} from "@/types/inbox";
import { useChatMessages } from "@/hooks/useChatMessages";
import { useChatContext, primeChatContextFromCrmContext, type UseChatContextOptions } from "@/hooks/useChatContext";
import type { CustomerDetail } from "@/types/customers";
import { useAppDispatch, useAppSelector } from "@/store/hooks";
import { bumpInboxRefetch } from "@/store/realtimeSlice";
import { useBandejaInbox } from "@/app/(features)/bandeja/BandejaInboxContext";
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

const MAX_CHAT_ATTACHMENT_BYTES = 10 * 1024 * 1024;

/** Codifica archivo para JSON al receptor (ML o WA vía `/api/bandeja/.../messages`). */
async function encodeFileForInboxAttachment(file: File): Promise<{
  attachment_base64: string;
  attachment_mime_type: string;
  attachment_file_name: string;
}> {
  if (file.size > MAX_CHAT_ATTACHMENT_BYTES) {
    throw new Error("FILE_TOO_LARGE");
  }
  const dataUrl = await new Promise<string>((resolve, reject) => {
    const fr = new FileReader();
    fr.onload = () => resolve(String(fr.result || ""));
    fr.onerror = () => reject(new Error("read_failed"));
    fr.readAsDataURL(file);
  });
  const comma = dataUrl.indexOf(",");
  const b64 = comma >= 0 ? dataUrl.slice(comma + 1) : dataUrl;
  return {
    attachment_base64: b64,
    attachment_mime_type: file.type || "application/octet-stream",
    attachment_file_name: file.name || "adjunto",
  };
}

/**
 * /bandeja/[chatId] — Módulo Unificado de Ventas (Sprint 6A)
 *
 * Columna INBOX vive en BandejaShell (layout /bandeja) y no se remonta al navegar.
 * Esta página aporta: [CONVO + FICHA] y overlays.
 *
 * Transición entre chats: cabecera optimista desde `useBandejaInbox` + GET /context
 * en segundo plano (`startTransition`); mensajes sin skeleton de pantalla completa
 * al cambiar de hilo (ver `useChatMessages` + `ChatWindow`).
 */
export default function ChatDetailPage() {
  const dispatch = useAppDispatch();
  const params = useParams();
  const router = useRouter();
  const chatId = params.chatId as string;
  const myUserId = useAppSelector((s) => s.auth.userId);
  const slaFromRealtime = useAppSelector((s) => s.realtime.slaDeadlineByChat[chatId] ?? null);
  const { chats: inboxChats } = useBandejaInbox();
  const inboxChatsRef = useRef(inboxChats);
  inboxChatsRef.current = inboxChats;

  const [chat, setChat]                     = useState<InboxChat | null>(null);
  const [chatLoading, setChatLoading]       = useState(true);
  const [chatError, setChatError]           = useState<string | null>(null);
  const [activeAction, setActiveAction]     = useState<ActionType>(null);
  const [editCustomerOpen, setEditCustomerOpen] = useState(false);
  const [photoViewerUrl, setPhotoViewerUrl] = useState<string | null>(null);
  /** Tras GET /context: mismo cliente que `customers` — primar caché y forzar releída de `useChatContext`. */
  const [chatContextRevision, setChatContextRevision] = useState(0);
  /** Fila `customers` del contexto CRM (única fuente en ficha; sin GET directorio redundante). */
  const [bandejaContextCustomer, setBandejaContextCustomer] = useState<CustomerDetail | null>(null);
  /** Primer GET /context del chat resuelto (para no adelantar directorio). */
  const [bandejaContextHydrated, setBandejaContextHydrated] = useState(false);

  /** Antes del pintado: fila del inbox para el chatId (evita frame con chat previo o skeleton). */
  useLayoutEffect(() => {
    if (!chatId) return;
    const row = inboxChatsRef.current.find(c => String(c.id) === String(chatId));
    if (row) {
      setChat(row);
      setChatLoading(false);
    } else {
      setChat(null);
      setChatLoading(true);
    }
  }, [chatId]);

  useEffect(() => {
    setBandejaContextCustomer(null);
    setBandejaContextHydrated(false);
  }, [chatId]);

  /** Lista del shell llega después del primer paint: hidratar cabecera sin esperar solo al GET /context. */
  useEffect(() => {
    if (!chatId) return;
    const row = inboxChats.find(c => String(c.id) === String(chatId));
    if (!row) return;
    setChat(prev => {
      if (prev && String(prev.id) === String(chatId)) return prev;
      return row;
    });
    setChatLoading(false);
  }, [chatId, inboxChats]);

  /* Mensajes y envío */
  const {
    messages,
    loading: msgLoading,
    loadingMore,
    messagesBootstrapping,
    hasMore: msgHasMore,
    error: msgError,
    loadMore,
    sendMessage,
    refetch,
  } = useChatMessages(chatId);

  const sendMessageForChat = useCallback(
    async (text: string, sentBy: string, file?: File | null): Promise<{ success: boolean; errorMessage?: string }> => {
      const src = chat?.source_type ?? "";
      const trimmed = text.trim();

      if (file && chat && isMlQuestionThreadChat(chat)) {
        return {
          success: false,
          errorMessage: "Las preguntas públicas de ML no admiten adjuntos desde esta bandeja.",
        };
      }

      if (chat && isMlQuestionThreadChat(chat)) {
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
        if (!trimmed && !file) {
          return { success: false, errorMessage: "Escribí un mensaje o adjuntá un archivo." };
        }
        try {
          const body: Record<string, unknown> = {
            text: trimmed || (file ? "📎" : ""),
            answered_by: sentBy,
          };
          if (file) {
            try {
              Object.assign(body, await encodeFileForInboxAttachment(file));
            } catch (e) {
              return {
                success: false,
                errorMessage:
                  e instanceof Error && e.message === "FILE_TOO_LARGE"
                    ? "El archivo supera 10 MB."
                    : "No se pudo leer el archivo.",
              };
            }
          }
          const res = await fetch(
            `/api/inbox/${encodeURIComponent(chatId)}/ml-message/reply`,
            {
              method: "POST", credentials: "include",
              headers: { "Content-Type": "application/json" },
              body: JSON.stringify(body),
            }
          );
          const data = (await res.json().catch(() => ({}))) as Record<string, unknown>;
          if (!res.ok) {
            const code = typeof data.code === "string" ? data.code : "";
            if (code === "ML_ATTACHMENT_FAILED") {
              return { success: false, errorMessage: "Mercado Libre rechazó el adjunto (tipo o tamaño)." };
            }
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

      const ok = await sendMessage(trimmed || (file ? "(Adjunto)" : ""), sentBy, file ?? undefined);
      return { success: ok, errorMessage: ok ? undefined : "No se pudo enviar el mensaje. Intenta de nuevo." };
    },
    // eslint-disable-next-line react-hooks/exhaustive-deps -- fetchChat se declara debajo; tras POST ML se llama en runtime.
    [chat, chatId, myUserId, sendMessage, refetch]
  );

  /* Contexto del cliente */
  const customerId    = chat?.customer_id ?? null;
  const customerName  = chat?.customer_name ?? null;

  const getBandejaContextCustomer = useCallback(() => bandejaContextCustomer, [bandejaContextCustomer]);

  const chatContextOpts = useMemo<UseChatContextOptions>(
    () => ({
      getBandejaContextCustomer,
      contextHydrated: bandejaContextHydrated,
    }),
    [getBandejaContextCustomer, bandejaContextHydrated]
  );

  const { customer, recentOrders, loadingCustomer, loadingOrders } = useChatContext(
    customerId,
    chatContextRevision,
    chatContextOpts
  );

  /** Misma lógica que la ficha / header: pregunta ML solo “Con orden+” con cliente + orden activa. */
  const pipelineMiniStage = useMemo(() => {
    if (!chat) return undefined;
    return bandejaMlQuestionPipelineStage(
      chat.chat_stage == null ? undefined : String(chat.chat_stage),
      chat
    );
  }, [chat]);

  const lastImageUrl = getLastImageUrl(messages);

  /* Contexto CRM: cabecera optimista desde la lista del inbox (misma fila que ya cargó el shell). */
  const fetchChat = useCallback(async () => {
    if (!chatId) return;
    setChatError(null);
    try {
      const r = await fetch(`/api/crm/chats/${encodeURIComponent(chatId)}/context`, {
        credentials: "include",
      });
      if (!r.ok) return;
      const d = (await r.json().catch(() => ({}))) as Record<string, unknown>;
      const raw = d.chat as Record<string, unknown> | null;
      if (!raw) {
        setBandejaContextCustomer(null);
        return;
      }
      const customerRaw = d.customer as Record<string, unknown> | null;
      const orderRaw = d.order as Record<string, unknown> | null | undefined;
      const order =
        orderRaw && orderRaw.id != null
          ? {
              id: Number(orderRaw.id),
              payment_status: String(orderRaw.payment_status ?? ""),
              fulfillment_type: String(orderRaw.fulfillment_type ?? ""),
              channel_id: orderRaw.channel_id != null ? Number(orderRaw.channel_id) : null,
              customer_id: orderRaw.customer_id != null ? Number(orderRaw.customer_id) : null,
              status: orderRaw.status != null ? String(orderRaw.status) : null,
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
        chat_stage: normalizeChatStage(
          typeof d.chat_stage === "string" ? d.chat_stage : undefined
        ),
        customer_waiting_reply: raw.customer_waiting_reply === true,
      };

      const vehiclesRaw = d.vehicles;
      const primeCustomerId =
        customerRaw && customerRaw.id != null
          ? Number(customerRaw.id)
          : mapped.customer_id != null && Number.isFinite(mapped.customer_id)
            ? mapped.customer_id
            : null;
      if (
        primeCustomerId != null &&
        customerRaw != null &&
        typeof customerRaw === "object" &&
        !Array.isArray(customerRaw)
      ) {
        const detail = {
          ...customerRaw,
          vehicles: Array.isArray(vehiclesRaw) ? vehiclesRaw : [],
        } as CustomerDetail;
        setBandejaContextCustomer(detail);
        primeChatContextFromCrmContext(primeCustomerId, detail);
        setChatContextRevision(n => n + 1);
      } else {
        setBandejaContextCustomer(null);
      }

      startTransition(() => {
        setChat(mapped);
      });
    } catch (e: unknown) {
      setChatError(errMsg(e));
      setBandejaContextCustomer(null);
    } finally {
      setChatLoading(false);
      setBandejaContextHydrated(true);
    }
  }, [chatId]);

  useEffect(() => {
    void fetchChat();
  }, [fetchChat]);

  useEffect(() => {
    if (!chatId) return;
    const url = `/api/bandeja/${encodeURIComponent(chatId)}/presence`;
    // Diferir 800ms: presence no es crítico para el usuario y no debe competir
    // con los fetches de mensajes y contexto que sí bloquean la UI.
    const timer = setTimeout(() => {
      void fetch(url, {
        method: "POST",
        credentials: "include",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ viewing: true }),
      }).catch(() => {});
    }, 800);
    return () => {
      clearTimeout(timer);
      void fetch(url, {
        method: "POST",
        credentials: "include",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ viewing: false }),
      }).catch(() => {});
    };
  }, [chatId]);

  const slaDeadline = slaFromRealtime ?? chat?.sla_deadline_at ?? null;

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
                onOperationalChanged={() => {
                  void fetchChat();
                  dispatch(bumpInboxRefetch());
                }}
              />
            ) : (
              <div className="bandeja-chat-header-wa">
                <Link href="/bandeja" className="btn btn-sm mu-icon-btn">
                  <i className="ti ti-arrow-left me-1" />Volver
                </Link>
                <span style={{ color: "var(--mu-ink-mute)" }} className="small">Chat #{chatId}</span>
              </div>
            )}

            {/* Pipeline mini — entre header y mensajes */}
            {chat && <PipelineMini stage={pipelineMiniStage} />}

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
              bootstrapping={messagesBootstrapping}
              chatKey={chatId}
              error={msgError}
              hasMore={msgHasMore}
              onLoadMore={loadMore}
            />

            {/* Input de mensaje */}
            <MessageInput
              chatId={chatId}
              sourceType={
                chat && isMlQuestionThreadChat(chat) ? "ml_question" : (chat?.source_type ?? "")
              }
              onSend={sendMessageForChat}
              fbWindowExpiresAt={chat?.fb_window_expires_at ?? null}
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
                chatId={chatId}
                sourceType={chat?.source_type ?? null}
                onClose={() => setEditCustomerOpen(false)}
                onSuccess={() => { setEditCustomerOpen(false); void fetchChat(); }}
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
              onOrderLinked={fetchChat}
              onEditCustomer={() => setEditCustomerOpen(true)}
            />
          </div>
        </div>
    </>
  );
}
