"use client";
import Link from "next/link";
import type { InboxChat } from "@/types/inbox";
import ChannelBadge from "./ChannelBadge";
import { CHAT_STAGE_LABELS } from "@/types/inbox";

function initials(name: string | null, phone: string): string {
  if (name) { const p = name.trim().split(" "); return (p[0][0] + (p[1]?.[0] ?? "")).toUpperCase(); }
  return phone.slice(-2);
}

interface Props {
  chat: InboxChat;
  /** URL de la última imagen inbound del chat (para VER FOTO). Null si no hay. */
  lastImageUrl?: string | null;
  /** Callback para abrir el modal de edición de cliente. */
  onEditCustomer?: () => void;
  /** Callback para abrir el lightbox con lastImageUrl. */
  onViewPhoto?: () => void;
}

export default function ChatHeader({ chat, lastImageUrl, onEditCustomer, onViewPhoto }: Props) {
  const displayName = chat.customer_name ?? chat.phone;
  const ini = initials(chat.customer_name, chat.phone);
  const hasPhone = Boolean(chat.phone);

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

      {/* Acciones del header */}
      <div className="mu-header-actions d-none d-sm-flex align-items-center gap-1">
        {/* B.2 · LLAMAR */}
        {hasPhone ? (
          <a
            href={`tel:${chat.phone}`}
            className="mu-icon-btn"
            title="Llamar"
            aria-label="Llamar"
          >
            <i className="ti ti-phone" />
          </a>
        ) : (
          <button
            type="button"
            className="mu-icon-btn"
            disabled
            title="Sin teléfono registrado"
            aria-label="Sin teléfono registrado"
            style={{ opacity: 0.35, cursor: "not-allowed" }}
          >
            <i className="ti ti-phone" />
          </button>
        )}

        {/* B.3 · VER FOTO */}
        {lastImageUrl ? (
          <button
            type="button"
            className="mu-icon-btn"
            title="Ver última imagen"
            aria-label="Ver última imagen"
            onClick={onViewPhoto}
          >
            <i className="ti ti-photo" />
          </button>
        ) : (
          <button
            type="button"
            className="mu-icon-btn"
            disabled
            title="Sin imágenes en este chat"
            aria-label="Sin imágenes en este chat"
            style={{ opacity: 0.35, cursor: "not-allowed" }}
          >
            <i className="ti ti-photo" />
          </button>
        )}

        {/* B.4 · EDITAR */}
        <button
          type="button"
          className="mu-icon-btn"
          title="Editar cliente"
          aria-label="Editar cliente"
          onClick={onEditCustomer}
          disabled={!onEditCustomer}
          style={!onEditCustomer ? { opacity: 0.35, cursor: "not-allowed" } : undefined}
        >
          <i className="ti ti-edit" />
        </button>

        {/* ti-search eliminado (B.5) */}

        <button
          type="button"
          className="mu-icon-btn"
          title="Más opciones"
          aria-label="Más opciones"
        >
          <i className="ti ti-dots-vertical" />
        </button>
      </div>
    </div>
  );
}
