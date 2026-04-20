"use client";
import { useCallback, useEffect, useRef, useState } from "react";
import { useParams } from "next/navigation";
import type { InboxChat } from "@/types/inbox";
import { useChatMessages } from "@/hooks/useChatMessages";
import { useChatContext } from "@/hooks/useChatContext";
import ChatList from "../components/ChatList";
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

/**
 * /bandeja/[chatId] — Módulo Unificado de Ventas (Sprint 6A)
 *
 * Layout de 3 columnas dentro del área de contenido:
 *   [INBOX (lista)] [CONVO (hilo activo)] [FICHA 360° (panel derecho)]
 *
 * El NAV global proviene del layout (features)/layout.tsx.
 * PipelineMini se renderiza entre el header y los mensajes de CONVO.
 *
 * Sprint 6B añadirá: drawer IA, acciones funcionales activadas.
 */
export default function ChatDetailPage() {
  const params = useParams();
  const chatId = params.chatId as string;

  const [chat, setChat]                     = useState<InboxChat | null>(null);
  const [chatLoading, setChatLoading]       = useState(true);
  const [chatError, setChatError]           = useState<string | null>(null);
  const [activeAction, setActiveAction]     = useState<ActionType>(null);
  const [editCustomerOpen, setEditCustomerOpen] = useState(false);
  const [photoViewerUrl, setPhotoViewerUrl] = useState<string | null>(null);

  /* Ancho resizable de la columna INBOX */
  const [listWidth, setListWidth] = useState(360);
  const isResizing = useRef(false);

  const startResize = useCallback((e: React.MouseEvent) => {
    isResizing.current = true;
    const startX = e.clientX;
    const startWidth = listWidth;

    const onMove = (ev: MouseEvent) => {
      if (!isResizing.current) return;
      setListWidth(Math.min(Math.max(startWidth + (ev.clientX - startX), 240), 520));
    };
    const onUp = () => {
      isResizing.current = false;
      window.removeEventListener("mousemove", onMove);
      window.removeEventListener("mouseup", onUp);
    };
    window.addEventListener("mousemove", onMove);
    window.addEventListener("mouseup", onUp);
  }, [listWidth]);

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
            body: JSON.stringify({ answer_text: text, answered_by: sentBy }),
          });
          if (res.ok) { await refetch(); return { success: true }; }
          return { success: false, errorMessage: "Error al responder la pregunta en ML" };
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

  /* Fetch del chat activo */
  const fetchChat = useCallback(() => {
    if (!chatId) return;
    setChatLoading(true); setChatError(null);
    fetch(`/api/bandeja?limit=1&search=${encodeURIComponent(chatId)}`, { credentials: "include" })
      .then(async r => {
        if (!r.ok) return;
        const d = await r.json().catch(() => ({})) as Record<string, unknown>;
        const chats = Array.isArray(d.chats) ? d.chats as InboxChat[] : [];
        const found = chats.find(c => String(c.id) === String(chatId));
        if (found) setChat(found);
      })
      .catch((e: unknown) => setChatError(errMsg(e)))
      .finally(() => setChatLoading(false));
  }, [chatId]);

  useEffect(() => { fetchChat(); }, [fetchChat]);

  const actionLabel = activeAction ? ACTION_LABELS[activeAction](customerName) : null;

  return (
    <div className="page-wrapper" style={{ overflow: "hidden" }}>
      <div className="content p-0">
        <div className="bandeja-shell bandeja-shell--detail">

          {/* ── Columna INBOX (lista) ───────────────────────────── */}
          <div
            className="bandeja-detail-list d-none d-md-flex"
            style={{ width: listWidth }}
          >
            <ChatList activeChatId={chatId} />
            <div
              className="bandeja-resize-handle"
              onMouseDown={startResize}
              role="separator"
              aria-orientation="vertical"
              aria-label="Redimensionar panel lista"
            />
          </div>

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
              />
            ) : (
              <div className="bandeja-chat-header-wa">
                <a href="/bandeja" className="btn btn-sm mu-icon-btn">
                  <i className="ti ti-arrow-left me-1" />Volver
                </a>
                <span style={{ color: "var(--mu-ink-mute)" }} className="small">Chat #{chatId}</span>
              </div>
            )}

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

        {/* Slide-over de acción */}
        <ChatActionSlideOver
          action={activeAction}
          chatId={chatId}
          customerId={customerId}
          customerName={customerName}
          recentOrders={recentOrders}
          onClose={() => setActiveAction(null)}
          onSuccess={() => setActiveAction(null)}
        />

        {/* B.4 · Modal de edición de cliente */}
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

        {/* B.3 · Visor de foto (última imagen inbound) */}
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
    </div>
  );
}
