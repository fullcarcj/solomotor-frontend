"use client";
import Link from "next/link";
import type { InboxChat } from "@/types/inbox";

/* ── avatar colors by source ── */
const AVATAR_COLORS: Record<string, string> = {
  wa_inbound:  "#1877F2",  /* azul */
  ml_question: "#F5A623",  /* amarillo */
  ml_message:  "#27AE60",  /* verde */
};
function avatarColor(src: string): string { return AVATAR_COLORS[src] ?? "#6C757D"; }

/* ── source badges ── */
function SourceBadge({ src }: { src: string }) {
  if (src === "wa_inbound")  return <span className="badge bg-success" style={{ fontSize: "0.65rem" }}>WhatsApp</span>;
  if (src === "ml_question") return <span className="badge bg-warning text-dark" style={{ fontSize: "0.65rem" }}>Pregunta ML</span>;
  if (src === "ml_message")  return <span className="badge bg-info" style={{ fontSize: "0.65rem" }}>ML Post-venta</span>;
  return <span className="badge bg-secondary" style={{ fontSize: "0.65rem" }}>{src}</span>;
}

/* ── time format ── */
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

/* ── initials ── */
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
      className="text-decoration-none"
    >
      <div
        className={`d-flex align-items-start gap-2 px-3 py-2 border-bottom ${active ? "bg-primary bg-opacity-10" : ""}`}
        style={{
          cursor: "pointer",
          backgroundColor: !active && unread > 0 ? "rgba(13,110,253,0.04)" : undefined,
          transition: "background 0.15s",
        }}
      >
        {/* Avatar */}
        <div
          className="rounded-circle d-flex align-items-center justify-content-center flex-shrink-0 text-white fw-bold"
          style={{ width: 40, height: 40, backgroundColor: color, fontSize: "0.8rem" }}
        >
          {ini}
        </div>

        {/* Content */}
        <div className="flex-grow-1 min-w-0">
          <div className="d-flex justify-content-between align-items-center mb-1">
            <span className={`fw-semibold text-truncate ${unread > 0 ? "text-body" : "text-secondary"}`} style={{ fontSize: "0.875rem" }}>
              {displayName}
            </span>
            <div className="d-flex align-items-center gap-1 flex-shrink-0 ms-1">
              <span className="text-muted" style={{ fontSize: "0.7rem" }}>{fmtTime(chat.last_message_at)}</span>
              {unread > 0 && (
                <span className="badge bg-danger rounded-pill" style={{ fontSize: "0.65rem" }}>{unread}</span>
              )}
            </div>
          </div>

          <div className="text-truncate text-muted" style={{ fontSize: "0.78rem" }}>{preview}</div>

          <div className="d-flex gap-1 mt-1 align-items-center">
            <SourceBadge src={chat.source_type} />
            {chat.order !== null && (
              <span className="badge bg-primary" style={{ fontSize: "0.62rem" }}>Con orden</span>
            )}
          </div>
        </div>
      </div>
    </Link>
  );
}
