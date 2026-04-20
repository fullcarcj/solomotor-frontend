"use client";
import Link from "next/link";
import type { InboxChat, ChatStage } from "@/types/inbox";
import { CHAT_STAGE_LABELS } from "@/types/inbox";
import ChannelBadge from "./ChannelBadge";

/* ── Stage tag compacto ──────────────────────────────────────── */

const STAGE_STYLE: Record<ChatStage, { bg: string; color: string }> = {
  contact:   { bg: "#2a2c24",             color: "#a8a89a" },
  ml_answer: { bg: "#3a3218",             color: "#fff159" },
  quote:     { bg: "#3a3218",             color: "#fff159" },
  approved:  { bg: "#1a3a2e",             color: "#7fd67f" },
  order:     { bg: "#2a1f3a",             color: "#b98cff" },
  payment:   { bg: "#2a1f3a",             color: "#b98cff" },
  dispatch:  { bg: "#1a2a3a",             color: "#6ab6ff" },
  closed:    { bg: "#2a2c24",             color: "#6e6f64" },
};

function StageTag({ stage }: { stage: ChatStage }) {
  const s = STAGE_STYLE[stage];
  return (
    <span
      className="mu-conv-tag"
      style={{ background: s.bg, color: s.color }}
      title={CHAT_STAGE_LABELS[stage]}
    >
      {CHAT_STAGE_LABELS[stage]}
    </span>
  );
}

/* ── Utilidades ──────────────────────────────────────────────── */

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
    ? chat.last_message_text.slice(0, 60) + (chat.last_message_text.length > 60 ? "…" : "")
    : "Sin mensajes";
  const ini = initials(chat.customer_name, chat.phone);

  return (
    <Link
      href={`/bandeja/${String(chat.id)}`}
      className="mu-conv-link text-decoration-none d-block"
    >
      <div className={`mu-conv${active ? " mu-conv--active" : ""}`}>

        {/* Avatar + ch-badge */}
        <div className="mu-conv-avatar" style={{ position: "relative" }}>
          <div className="mu-avatar">{ini}</div>
          <ChannelBadge
            channelId={chat.channel_id}
            sourceType={chat.source_type}
            overlay
          />
        </div>

        {/* Meta */}
        <div className="mu-conv-meta">
          <div className="mu-conv-top">
            <span className={`mu-conv-name${unread > 0 ? " mu-conv-name--bold" : ""}`}>
              {displayName}
            </span>
          </div>
          <div className="mu-conv-preview">{preview}</div>
          <div className="mu-conv-tags">
            {chat.chat_stage && <StageTag stage={chat.chat_stage} />}
            {chat.order !== null && (
              <span className="mu-conv-tag" style={{ background: "#1a3a2e", color: "#7fd67f" }}>
                Orden #{chat.order.id}
              </span>
            )}
          </div>
        </div>

        {/* Derecha: hora + badge no leídos */}
        <div className="mu-conv-right">
          <span className="mu-conv-time">{fmtTime(chat.last_message_at)}</span>
          {unread > 0 && (
            <span className="mu-unread-badge">{unread}</span>
          )}
        </div>

      </div>
    </Link>
  );
}
