"use client";
import { useEffect, useRef } from "react";
import type { ChatMessage } from "@/types/inbox";
import MessageBubble from "./MessageBubble";

/* ── date separator helpers ── */
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

  /* auto-scroll when new messages arrive (not when loading older) */
  useEffect(() => {
    if (messages.length > prevLen.current) {
      bottomRef.current?.scrollIntoView({ behavior: "smooth" });
    }
    prevLen.current = messages.length;
  }, [messages.length]);

  if (loading) {
    return (
      <div className="flex-grow-1 d-flex align-items-center justify-content-center">
        <div className="spinner-border text-primary" />
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex-grow-1 d-flex align-items-center justify-content-center p-3">
        <div className="alert alert-danger w-100 text-center">{error}</div>
      </div>
    );
  }

  const groups = buildGroups(messages);

  return (
    <div className="flex-grow-1 overflow-auto py-2" style={{ minHeight: 0 }}>
      {/* Load older messages */}
      {messages.length >= 50 && (
        <div className="text-center py-2">
          <button className="btn btn-sm btn-outline-secondary" onClick={onLoadMore} disabled={loadingMore}>
            {loadingMore ? <span className="spinner-border spinner-border-sm me-1" /> : <i className="ti ti-arrow-up me-1" />}
            Mensajes anteriores
          </button>
        </div>
      )}

      {messages.length === 0 && (
        <div className="text-center text-muted py-5">
          <i className="ti ti-message-off fs-2 d-block mb-2" />
          Sin mensajes en este chat
        </div>
      )}

      {groups.map((item, i) => {
        if (item.type === "separator") {
          return (
            <div key={`sep-${i}`} className="d-flex align-items-center gap-2 px-3 py-1">
              <div className="flex-grow-1 border-top" />
              <small className="text-muted flex-shrink-0 px-2 py-1 rounded" style={{ background: "rgba(0,0,0,.04)", fontSize: "0.7rem" }}>
                {item.label}
              </small>
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
