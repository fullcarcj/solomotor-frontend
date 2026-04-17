"use client";
import { useEffect, useRef } from "react";
import type { ChatMessage } from "@/types/inbox";
import MessageBubble from "./MessageBubble";

function dayKey(iso: string): string {
  try { return new Date(iso).toDateString(); } catch { return iso; }
}
function dayLabel(key: string): string {
  const d = new Date(key);
  const now = new Date();
  const yesterday = new Date(now); yesterday.setDate(now.getDate() - 1);
  if (d.toDateString() === now.toDateString())       return "Hoy";
  if (d.toDateString() === yesterday.toDateString()) return "Ayer";
  return d.toLocaleDateString("es-VE", { day: "2-digit", month: "2-digit", year: "numeric" });
}

type GroupedItem =
  | { type: "separator"; label: string }
  | { type: "message"; msg: ChatMessage };

function buildGroups(messages: ChatMessage[]): GroupedItem[] {
  const items: GroupedItem[] = [];
  let lastDay = "";
  for (const msg of messages) {
    const key = dayKey(msg.created_at);
    if (key !== lastDay) {
      items.push({ type: "separator", label: dayLabel(key) });
      lastDay = key;
    }
    items.push({ type: "message", msg });
  }
  return items;
}

interface Props {
  messages:    ChatMessage[];
  loading:     boolean;
  loadingMore: boolean;
  error:       string | null;
  onLoadMore:  () => void;
}

export default function ChatWindow({ messages, loading, loadingMore, error, onLoadMore }: Props) {
  const bottomRef = useRef<HTMLDivElement>(null);
  const prevLen   = useRef(0);

  useEffect(() => {
    if (messages.length > prevLen.current) {
      bottomRef.current?.scrollIntoView({ behavior: "smooth" });
    }
    prevLen.current = messages.length;
  }, [messages.length]);

  if (loading) {
    return (
      <div className="bandeja-chat-window flex-grow-1 d-flex align-items-center justify-content-center">
        <div className="spinner-border text-primary" role="status" aria-label="Cargando" />
      </div>
    );
  }

  if (error) {
    return (
      <div className="bandeja-chat-window flex-grow-1 d-flex align-items-center justify-content-center p-3">
        <div className="alert bandeja-wa-alert w-100 text-center mb-0">{error}</div>
      </div>
    );
  }

  const groups = buildGroups(messages);

  return (
    <div className="bandeja-chat-window flex-grow-1">
      {messages.length >= 50 && (
        <div className="text-center py-2">
          <button
            type="button"
            className="btn btn-sm"
            style={{
              background: "var(--wa-bg-secondary)",
              color: "var(--wa-text-primary)",
              border: "1px solid var(--wa-border)",
            }}
            onClick={onLoadMore}
            disabled={loadingMore}
          >
            {loadingMore ? <span className="spinner-border spinner-border-sm me-1" /> : <i className="ti ti-arrow-up me-1" />}
            Mensajes anteriores
          </button>
        </div>
      )}

      {messages.length === 0 && (
        <div className="text-center py-5" style={{ color: "var(--wa-text-secondary)" }}>
          <i className="ti ti-message-off fs-2 d-block mb-2 opacity-50" />
          Sin mensajes en este chat
        </div>
      )}

      {groups.map((item, i) => {
        if (item.type === "separator") {
          return (
            <div key={`sep-${i}`} className="bandeja-day-sep">
              <div className="flex-grow-1 border-top" />
              <small>{item.label}</small>
              <div className="flex-grow-1 border-top" />
            </div>
          );
        }
        return <MessageBubble key={String(item.msg.id)} msg={item.msg} />;
      })}

      <div ref={bottomRef} />
    </div>
  );
}
