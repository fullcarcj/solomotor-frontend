"use client";
import { useEffect, useState } from "react";
import { useParams } from "next/navigation";
import type { InboxChat } from "@/types/inbox";
import { useChatMessages } from "@/hooks/useChatMessages";
import { useChatContext } from "@/hooks/useChatContext";
import ChatList from "../components/ChatList";
import ChatHeader from "../components/ChatHeader";
import ChatWindow from "../components/ChatWindow";
import MessageInput from "../components/MessageInput";
import ChatContextPanel from "./components/ChatContextPanel";
import ChatActionSlideOver from "./components/ChatActionSlideOver";

type ActionType = "quote" | "pay" | "pos" | "dispatch" | null;

const ACTION_LABELS: Record<NonNullable<ActionType>, (name: string | null) => string> = {
  quote:    name => `+ Creando cotización${name ? ` para ${name}` : ""}`,
  pay:      name => `$ Cobrando${name ? ` a ${name}` : ""}`,
  pos:      name => `POS rápido${name ? ` — ${name}` : ""}`,
  dispatch: name => `→ Despachando orden${name ? ` de ${name}` : ""}`,
};

function errMsg(e: unknown) { return e instanceof Error ? e.message : "Error."; }

export default function ChatDetailPage() {
  const params = useParams();
  const chatId = params.chatId as string;

  const [chat, setChat]               = useState<InboxChat | null>(null);
  const [chatLoading, setChatLoading] = useState(true);
  const [chatError, setChatError]     = useState<string | null>(null);
  const [activeAction, setActiveAction] = useState<ActionType>(null);

  const {
    messages, loading: msgLoading, loadingMore, error: msgError,
    loadMore, sendMessage,
  } = useChatMessages(chatId);

  /* Derivar customerId del chat */
  const customerId = chat?.customer_id ?? null;
  const customerName = chat?.customer_name ?? null;

  /* Hook de contexto del cliente */
  const { customer, recentOrders, loadingCustomer, loadingOrders } = useChatContext(customerId);

  /* Cargar metadata del chat */
  useEffect(() => {
    if (!chatId) return;
    setChatLoading(true);
    setChatError(null);
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

  const actionLabel = activeAction
    ? ACTION_LABELS[activeAction](customerName)
    : null;

  return (
    <div className="page-wrapper" style={{ overflow: "hidden" }}>
      <div className="content p-0">
        <div className="bandeja-workspace">

          {/* Col 1 — Lista de chats */}
          <div className="bw-list d-none d-lg-flex">
            <ChatList activeChatId={chatId} />
          </div>

          {/* Col 2 — Ventana de mensajes */}
          <div className="bw-chat">
            {/* Header */}
            {chatLoading ? (
              <div className="border-bottom py-3 px-3 placeholder-glow d-flex align-items-center gap-2 flex-shrink-0">
                <div className="rounded-circle bg-secondary placeholder" style={{ width: 36, height: 36 }} />
                <div className="placeholder col-4 rounded" style={{ height: 16 }} />
              </div>
            ) : chatError ? (
              <div className="border-bottom py-2 px-3 flex-shrink-0">
                <span className="text-danger small">{chatError}</span>
              </div>
            ) : chat ? (
              <ChatHeader chat={chat} />
            ) : (
              <div className="border-bottom py-2 px-3 d-flex align-items-center gap-2 flex-shrink-0">
                <a href="/bandeja" className="btn btn-sm btn-outline-secondary">
                  <i className="ti ti-arrow-left me-1" />Volver
                </a>
                <span className="text-muted small">Chat #{chatId}</span>
              </div>
            )}

            {/* Banner de acción activa */}
            {actionLabel && (
              <div className="chat-action-banner">
                <span><i className="ti ti-tools me-2" />{actionLabel}</span>
                <button
                  className="btn btn-sm p-0 border-0 bg-transparent"
                  style={{ color: "var(--bs-info-text-emphasis)", fontSize: "1rem", lineHeight: 1 }}
                  onClick={() => setActiveAction(null)}
                  aria-label="Cerrar acción"
                >×</button>
              </div>
            )}

            {/* Mensajes */}
            <ChatWindow
              messages={messages}
              loading={msgLoading}
              loadingMore={loadingMore}
              error={msgError}
              onLoadMore={loadMore}
            />

            {/* Input */}
            <MessageInput
              chatId={chatId}
              sourceType={chat?.source_type ?? ""}
              onSend={sendMessage}
            />
          </div>

          {/* Col 3 — Panel contextual */}
          <div className="bw-context d-none d-lg-flex">
            <ChatContextPanel
              chat={chat}
              customerId={customerId}
              customer={customer}
              recentOrders={recentOrders}
              loadingCustomer={loadingCustomer}
              loadingOrders={loadingOrders}
              activeAction={activeAction}
              onSetAction={setActiveAction}
            />
          </div>
        </div>

        {/* Slide-over de acciones */}
        <ChatActionSlideOver
          action={activeAction}
          chatId={chatId}
          customerId={customerId}
          customerName={customerName}
          recentOrders={recentOrders}
          onClose={() => setActiveAction(null)}
          onSuccess={() => setActiveAction(null)}
        />
      </div>
    </div>
  );
}
