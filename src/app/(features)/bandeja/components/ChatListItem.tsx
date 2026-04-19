"use client";
import Link from "next/link";
import { Tag } from "antd";
import type { InboxChat, ChatStage } from "@/types/inbox";
import { CHAT_STAGE_LABELS } from "@/types/inbox";

const STAGE_COLORS: Record<ChatStage, string> = {
  contact:   'default',
  ml_answer: 'cyan',
  quote:     'blue',
  approved:  'geekblue',
  order:     'purple',
  payment:   'orange',
  dispatch:  'gold',
  closed:    'green',
};

function ChatStagePill({ stage }: { stage?: ChatStage }) {
  if (!stage) return null;
  return (
    <Tag
      color={STAGE_COLORS[stage]}
      style={{ fontSize: '0.6rem', padding: '0 5px', lineHeight: '16px', marginLeft: 0 }}
    >
      {CHAT_STAGE_LABELS[stage]}
    </Tag>
  );
}

const AVATAR_COLORS: Record<string, string> = {
  wa_inbound:  "#1877F2",
  ml_question: "#F5A623",
  ml_message:  "#27AE60",
};
function avatarColor(src: string): string { return AVATAR_COLORS[src] ?? "#6C757D"; }

function SourceBadge({ src }: { src: string }) {
  if (src === "wa_inbound")  return <span className="wa-source-pill">WhatsApp</span>;
  if (src === "ml_question") return <span className="wa-source-pill">Pregunta ML</span>;
  if (src === "ml_message")  return <span className="wa-source-pill">ML Post-venta</span>;
  return <span className="wa-source-pill">{src}</span>;
}

function fmtTime(iso: string | null): string {
  if (!iso) return "";
  try {
    const d = new Date(iso);
    const now = new Date();
    const isToday = d.toDateString() === now.toDateString();
    if (isToday) return d.toLocaleTimeString("es-VE", { hour: "2-digit", minute: "2-digit" });
    return d.toLocaleDateString("es-VE", { day: "2-digit", month: "2-digit" });
  } catch { return ""; }
}

function initials(name: string | null, phone: string): string {
  if (name) {
    const parts = name.trim().split(" ");
    return (parts[0][0] + (parts[1]?.[0] ?? "")).toUpperCase();
  }
  return phone.slice(-2);
}

interface Props {
  chat:    InboxChat;
  active?: boolean;
}

export default function ChatListItem({ chat, active }: Props) {
  const unread = Number(chat.unread_count);
  const displayName = chat.customer_name ?? chat.phone;
  const preview = chat.last_message_text
    ? chat.last_message_text.slice(0, 50) + (chat.last_message_text.length > 50 ? "…" : "")
    : "Sin mensajes";
  const ini = initials(chat.customer_name, chat.phone);
  const color = avatarColor(chat.source_type);

  return (
    <Link
      href={`/bandeja/${String(chat.id)}`}
      className="text-decoration-none d-block"
    >
      <div
        className={`chat-list-item-inner d-flex align-items-start gap-2 ${active ? "active" : ""}`}
        style={{
          cursor: "pointer",
          backgroundColor: !active && unread > 0 ? "rgba(0, 168, 132, 0.06)" : undefined,
        }}
      >
        <div
          className="chat-list-avatar rounded-circle d-flex align-items-center justify-content-center flex-shrink-0 text-white fw-bold"
          style={{ backgroundColor: color, fontSize: "0.8rem" }}
        >
          {ini}
        </div>

        <div className="flex-grow-1 min-w-0">
          <div className="d-flex justify-content-between align-items-start mb-1">
            <span className={`chat-list-name text-truncate ${unread > 0 ? "fw-semibold" : ""}`}>
              {displayName}
            </span>
            <div className="d-flex align-items-center gap-1 flex-shrink-0 ms-1">
              <span className="chat-list-time">{fmtTime(chat.last_message_at)}</span>
              {unread > 0 && (
                <span className="chat-list-unread-badge">{unread}</span>
              )}
            </div>
          </div>

          <div className="chat-list-preview">{preview}</div>

          <div className="d-flex gap-1 mt-1 align-items-center flex-wrap">
            <SourceBadge src={chat.source_type} />
            {chat.order !== null && (
              <span className="wa-source-pill wa-source-pill--emph">Con orden</span>
            )}
            <ChatStagePill stage={chat.chat_stage} />
          </div>
        </div>
      </div>
    </Link>
  );
}
