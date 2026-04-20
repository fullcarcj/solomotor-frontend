"use client";
import Link from "next/link";
import type { InboxChat } from "@/types/inbox";
import ChannelBadge from "./ChannelBadge";
import { CHAT_STAGE_LABELS } from "@/types/inbox";

function initials(name: string | null, phone: string): string {
  if (name) { const p = name.trim().split(" "); return (p[0][0] + (p[1]?.[0] ?? "")).toUpperCase(); }
  return phone.slice(-2);
}

interface Props { chat: InboxChat; }

export default function ChatHeader({ chat }: Props) {
  const displayName = chat.customer_name ?? chat.phone;
  const ini = initials(chat.customer_name, chat.phone);

  return (
    <div className="mu-convo-header bandeja-chat-header-wa">
      <Link href="/bandeja" className="btn btn-sm mu-icon-btn d-flex align-items-center gap-1" aria-label="Volver a bandeja">
        <i className="ti ti-arrow-left" />
        <span className="d-none d-md-inline" style={{ fontSize: "0.75rem" }}>Volver</span>
      </Link>

      {/* Avatar + ch-badge */}
      <div style={{ position: "relative", flexShrink: 0 }}>
        <div
          className="mu-avatar"
          style={{ width: 40, height: 40 }}
          aria-hidden
        >
          {ini}
        </div>
        <ChannelBadge
          channelId={chat.channel_id}
          sourceType={chat.source_type}
          overlay
        />
      </div>

      {/* Nombre + metadatos */}
      <div className="flex-grow-1 min-w-0">
        <div className="mu-convo-name text-truncate d-flex align-items-center gap-2">
          {displayName}
          {chat.chat_stage && (
            <span className="mu-stage-inline">{CHAT_STAGE_LABELS[chat.chat_stage]}</span>
          )}
        </div>
        <div className="mu-convo-sub">
          <ChannelBadge channelId={chat.channel_id} sourceType={chat.source_type} size="sm" />
          <span className="ms-1">{chat.phone}</span>
          {chat.order && <span className="ms-2">Orden #{chat.order.id}</span>}
        </div>
      </div>

      {/* Acciones del header (estáticas — 6B las activa) */}
      <div className="mu-header-actions d-none d-sm-flex" aria-hidden>
        <span className="mu-icon-btn ti ti-phone" title="Llamar (6B)" />
        <span className="mu-icon-btn ti ti-search" title="Buscar" />
        <span className="mu-icon-btn ti ti-dots-vertical" title="Más opciones" />
      </div>
    </div>
  );
}
