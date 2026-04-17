"use client";
import { useEffect, useState } from "react";
import { useParams } from "next/navigation";
import type { InboxChat } from "@/types/inbox";
import { useChatMessages } from "@/hooks/useChatMessages";
import ChatList from "../components/ChatList";
import ChatHeader from "../components/ChatHeader";
import ChatWindow from "../components/ChatWindow";
import MessageInput from "../components/MessageInput";

function errMsg(e: unknown) { return e instanceof Error ? e.message : "Error."; }

export default function ChatDetailPage() {
  const params = useParams();
  const chatId = params.chatId as string;

  const [chat, setChat]       = useState<InboxChat | null>(null);
  const [chatLoading, setChatLoading] = useState(true);
  const [chatError, setChatError]     = useState<string | null>(null);

  const {
    messages, loading: msgLoading, loadingMore, error: msgError,
    loadMore, sendMessage,
  } = useChatMessages(chatId);

  /* Load chat metadata from inbox list */
  useEffect(() => {
    if (!chatId) return;
    setChatLoading(true);
    setChatError(null);
    /* Try to get chat detail from inbox endpoint */
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

  return (
    <div className="page-wrapper">
      <div className="content p-0" style={{ height: "calc(100vh - 60px)", overflow: "hidden" }}>
        <div className="row g-0 h-100">
          {/* Lista — solo desktop */}
          <div className="col-md-4 d-none d-md-block h-100">
            <ChatList activeChatId={chatId} />
          </div>

          {/* Conversación */}
          <div className="col-12 col-md-8 d-flex flex-column h-100">
            {/* Header */}
            {chatLoading ? (
              <div className="border-bottom py-3 px-3 placeholder-glow d-flex align-items-center gap-2">
                <div className="rounded-circle bg-secondary placeholder" style={{ width: 36, height: 36 }} />
                <div className="placeholder col-4 rounded" style={{ height: 16 }} />
              </div>
            ) : chatError ? (
              <div className="border-bottom py-2 px-3">
                <span className="text-danger small">{chatError}</span>
              </div>
            ) : chat ? (
              <ChatHeader chat={chat} />
            ) : (
              <div className="border-bottom py-2 px-3 d-flex align-items-center gap-2">
                <a href="/bandeja" className="btn btn-sm btn-outline-secondary">
                  <i className="ti ti-arrow-left me-1" />Volver
                </a>
                <span className="text-muted small">Chat #{chatId}</span>
              </div>
            )}

            {/* Messages */}
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
        </div>
      </div>
    </div>
  );
}
