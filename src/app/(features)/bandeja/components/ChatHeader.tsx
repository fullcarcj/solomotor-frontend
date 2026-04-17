"use client";
import Link from "next/link";
import type { InboxChat } from "@/types/inbox";

function SourceBadge({ src }: { src: string }) {
  if (src === "wa_inbound")  return <span className="badge bg-success">WhatsApp</span>;
  if (src === "ml_question") return <span className="badge bg-warning text-dark">Pregunta ML</span>;
  if (src === "ml_message")  return <span className="badge bg-info">ML Post-venta</span>;
  return <span className="badge bg-secondary">{src}</span>;
}

function IdentityBadge({ status }: { status: string }) {
  if (status === "identified") return <span className="badge bg-success">Identificado</span>;
  if (status === "declared")   return <span className="badge bg-info">Declarado</span>;
  return <span className="badge bg-secondary">Desconocido</span>;
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
    <div className="d-flex align-items-center gap-3 px-3 py-2 border-bottom bg-white"
         style={{ minHeight: 60, position: "sticky", top: 0, zIndex: 10 }}>
      <Link href="/bandeja" className="btn btn-sm btn-outline-secondary d-flex align-items-center gap-1">
        <i className="ti ti-arrow-left" />
        <span className="d-none d-md-inline">Volver</span>
      </Link>

      <div className="rounded-circle d-flex align-items-center justify-content-center text-white fw-bold flex-shrink-0"
           style={{ width: 36, height: 36, backgroundColor: color, fontSize: "0.75rem" }}>
        {ini}
      </div>

      <div className="flex-grow-1 min-w-0">
        <div className="fw-semibold text-truncate">{displayName}</div>
        <div className="d-flex flex-wrap gap-1 mt-1">
          <SourceBadge src={chat.source_type} />
          <IdentityBadge status={chat.identity_status} />
          {chat.order && (
            <span className="badge bg-primary">
              Orden #{chat.order.id}
            </span>
          )}
        </div>
      </div>

      {chat.phone && (
        <small className="text-muted d-none d-lg-block text-nowrap">{chat.phone}</small>
      )}
    </div>
  );
}
