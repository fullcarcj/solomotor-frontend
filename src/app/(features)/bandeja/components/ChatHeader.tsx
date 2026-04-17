"use client";
import Link from "next/link";
import type { InboxChat } from "@/types/inbox";

function SourceBadge({ src }: { src: string }) {
  if (src === "wa_inbound")  return <span className="wa-source-pill">WhatsApp</span>;
  if (src === "ml_question") return <span className="wa-source-pill">Pregunta ML</span>;
  if (src === "ml_message")  return <span className="wa-source-pill">ML Post-venta</span>;
  return <span className="wa-source-pill">{src}</span>;
}

function IdentityBadge({ status }: { status: string }) {
  if (status === "identified") return <span className="wa-source-pill">Identificado</span>;
  if (status === "declared")   return <span className="wa-source-pill">Declarado</span>;
  return <span className="wa-source-pill">Desconocido</span>;
}

const AVATAR_COLORS: Record<string, string> = {
  wa_inbound:  "#1877F2",
  ml_question: "#F5A623",
  ml_message:  "#27AE60",
};
function avatarColor(src: string): string { return AVATAR_COLORS[src] ?? "#6C757D"; }
function initials(name: string | null, phone: string): string {
  if (name) { const p = name.trim().split(" "); return (p[0][0] + (p[1]?.[0] ?? "")).toUpperCase(); }
  return phone.slice(-2);
}

interface Props { chat: InboxChat; }

export default function ChatHeader({ chat }: Props) {
  const displayName = chat.customer_name ?? chat.phone;
  const ini = initials(chat.customer_name, chat.phone);
  const color = avatarColor(chat.source_type);

  return (
    <div className="bandeja-chat-header-wa">
      <Link href="/bandeja" className="btn btn-sm btn-outline-secondary d-flex align-items-center gap-1">
        <i className="ti ti-arrow-left" />
        <span className="d-none d-md-inline">Volver</span>
      </Link>

      <div
        className="rounded-circle d-flex align-items-center justify-content-center text-white fw-bold flex-shrink-0"
        style={{ width: 40, height: 40, backgroundColor: color, fontSize: "0.8rem" }}
      >
        {ini}
      </div>

      <div className="flex-grow-1 min-w-0">
        <div className="bandeja-chat-header-name text-truncate">{displayName}</div>
        <div className="d-flex flex-wrap gap-1 mt-1 bandeja-chat-header-sub">
          <SourceBadge src={chat.source_type} />
          <IdentityBadge status={chat.identity_status} />
          {chat.order && (
            <span className="wa-source-pill wa-source-pill--emph">
              Orden #{chat.order.id}
            </span>
          )}
        </div>
      </div>

      {chat.phone && (
        <small className="bandeja-chat-header-phone d-none d-lg-block text-nowrap">{chat.phone}</small>
      )}

      <div className="bandeja-header-actions d-none d-sm-flex" aria-hidden>
        <span className="ti ti-phone" title="" />
        <span className="ti ti-search" title="" />
        <span className="ti ti-dots-vertical" title="" />
      </div>
    </div>
  );
}
