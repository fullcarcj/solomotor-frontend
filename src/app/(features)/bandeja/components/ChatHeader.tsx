"use client";
import Link from "next/link";
import { useEffect, useRef, useState } from "react";
import type { InboxChat } from "@/types/inbox";
import ChannelBadge from "./ChannelBadge";
import { CHAT_STAGE_LABELS, bandejaMlQuestionPipelineStage } from "@/types/inbox";
import SlaCountdown from "@/components/bandeja/SlaCountdown";

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
  /** SLA activo (ISO); prioridad sobre `chat.sla_deadline_at` si viene del slice. */
  slaDeadline?: string | null;
  /** Tras marcar/quitar "No cliente", el padre debe refrescar el chat y la bandeja. */
  onOperationalChanged?: () => void;
}

export default function ChatHeader({
  chat,
  lastImageUrl,
  onEditCustomer,
  onViewPhoto,
  slaDeadline,
  onOperationalChanged,
}: Props) {
  const displayName = chat.customer_name ?? chat.phone;
  const ini = initials(chat.customer_name, chat.phone);
  const hasPhone = Boolean(chat.phone);
  const stageNorm = bandejaMlQuestionPipelineStage(
    chat.chat_stage == null ? undefined : String(chat.chat_stage),
    chat
  );
  const [menuOpen, setMenuOpen] = useState(false);
  const [opPending, setOpPending] = useState(false);
  const [opErr, setOpErr] = useState<string | null>(null);
  const menuWrapRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!menuOpen) return;
    const onDoc = (e: MouseEvent) => {
      const el = menuWrapRef.current;
      if (el && !el.contains(e.target as Node)) setMenuOpen(false);
    };
    document.addEventListener("mousedown", onDoc);
    return () => document.removeEventListener("mousedown", onDoc);
  }, [menuOpen]);

  const toggleNoCliente = async () => {
    if (opPending || !onOperationalChanged) return;
    const id = String(chat.id);
    setOpErr(null);
    setOpPending(true);
    try {
      const isOp = Boolean(chat.is_operational);
      if (isOp) {
        const res = await fetch(
          `/api/inbox/whitelist/mark-chat/${encodeURIComponent(id)}`,
          { method: "DELETE", credentials: "include" }
        );
        if (!res.ok) {
          const j = (await res.json().catch(() => ({}))) as Record<string, unknown>;
          setOpErr(String(j.message ?? j.error ?? `Error ${res.status}`));
          return;
        }
      } else {
        const res = await fetch("/api/inbox/whitelist/mark-chat", {
          method: "POST",
          credentials: "include",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ chat_id: Number(id) }),
        });
        if (!res.ok) {
          const j = (await res.json().catch(() => ({}))) as Record<string, unknown>;
          setOpErr(String(j.message ?? j.error ?? `Error ${res.status}`));
          return;
        }
      }
      setMenuOpen(false);
      onOperationalChanged();
    } catch {
      setOpErr("Error de red.");
    } finally {
      setOpPending(false);
    }
  };

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
        <div className="mu-convo-name text-truncate d-flex align-items-center gap-2 flex-wrap">
          {displayName}
          <SlaCountdown deadline={slaDeadline ?? chat.sla_deadline_at ?? null} />
          {stageNorm && (
            <span className="mu-stage-inline">{CHAT_STAGE_LABELS[stageNorm]}</span>
          )}
        </div>
        <div className="mu-convo-sub">
          <ChannelBadge channelId={chat.channel_id} sourceType={chat.source_type} size="sm" />
          <span className="ms-1">{chat.phone}</span>
          {chat.order && <span className="ms-2">Orden #{chat.order.id}</span>}
        </div>
      </div>

      {/* Acciones del header */}
      <div className="mu-header-actions d-flex align-items-center gap-1 flex-shrink-0">
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

        <div ref={menuWrapRef} style={{ position: "relative" }}>
          <button
            type="button"
            className="mu-icon-btn"
            title="Más opciones"
            aria-label="Más opciones"
            aria-expanded={menuOpen}
            aria-haspopup="menu"
            onClick={() => setMenuOpen((v) => !v)}
          >
            <i className="ti ti-dots-vertical" />
          </button>
          {menuOpen && (
            <div
              role="menu"
              className="shadow border rounded-2 py-1"
              style={{
                position: "absolute",
                right: 0,
                top: "calc(100% + 4px)",
                minWidth: 200,
                zIndex: 2000,
                background: "var(--mu-panel, #161b22)",
                borderColor: "var(--mu-line, rgba(255,255,255,0.1))",
              }}
            >
              {onOperationalChanged && (
                <button
                  type="button"
                  role="menuitem"
                  className="dropdown-item d-flex align-items-center gap-2 py-2 small text-start border-0 w-100 bg-transparent"
                  style={{ color: "var(--mu-ink, #e6edf3)" }}
                  disabled={opPending}
                  onClick={() => void toggleNoCliente()}
                >
                  <i className="ti ti-building" style={{ opacity: 0.85 }} />
                  {chat.is_operational ? "Quitar marca No cliente" : "No cliente (interno)"}
                </button>
              )}
              {opErr && (
                <div className="px-3 py-1 small" style={{ color: "#fca5a5" }} role="alert">
                  {opErr}
                </div>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
