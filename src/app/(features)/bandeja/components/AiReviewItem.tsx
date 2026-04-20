"use client";
import { useState } from "react";
import type { AiPendingMessage } from "@/hooks/useAiResponderPending";
import ChannelBadge from "./ChannelBadge";

const MAX_REPLY_LEN = 4000;

interface Props {
  item: AiPendingMessage;
  onRemove: (id: string) => void;
  onUpdated: (id: string, newReplyText: string) => void;
}

function relativeTime(isoStr: string): string {
  const diff = (Date.now() - new Date(isoStr).getTime()) / 1000;
  if (diff < 60) return "hace un momento";
  if (diff < 3600) return `hace ${Math.floor(diff / 60)} min`;
  if (diff < 86400) return `hace ${Math.floor(diff / 3600)} h`;
  return `hace ${Math.floor(diff / 86400)} d`;
}

function toastShort(msg: string) {
  // Fallback toast para entornos sin librería global: alert en modo dev, silent en prod.
  if (typeof window !== "undefined") {
    const el = document.createElement("div");
    el.textContent = msg;
    Object.assign(el.style, {
      position: "fixed",
      bottom: "1.5rem",
      left: "50%",
      transform: "translateX(-50%)",
      background: "#1e2020",
      color: "#f0f0e8",
      padding: "0.5rem 1rem",
      borderRadius: "0.5rem",
      zIndex: "10001",
      fontSize: "0.85rem",
      boxShadow: "0 2px 12px rgba(0,0,0,0.35)",
      pointerEvents: "none",
    });
    document.body.appendChild(el);
    setTimeout(() => el.remove(), 2800);
  }
}

export default function AiReviewItem({ item, onRemove, onUpdated }: Props) {
  const [editText, setEditText] = useState<string>(item.ai_reply_text ?? "");
  const [loading, setLoading] = useState(false);
  const [showRejectModal, setShowRejectModal] = useState(false);
  const [rejectReason, setRejectReason] = useState("");

  const displayName = item.customer_full_name ?? item.chat_phone ?? `Chat #${item.chat_id}`;
  const hasReplyText = item.ai_reply_text !== null;
  const canApprove = hasReplyText;
  const canDraft = editText.trim().length > 0;

  async function postAction(
    action: "approve" | "override" | "draft" | "reject",
    body: Record<string, unknown> = {}
  ): Promise<{ ok: boolean; legacy409: boolean }> {
    const res = await fetch(`/api/ai-responder/${item.id}/${action}`, {
      method: "POST",
      credentials: "include",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(body),
    });
    if (res.status === 409) {
      const data = await res.json().catch(() => ({})) as Record<string, unknown>;
      const code = typeof data.code === "string" ? data.code : "";
      if (code === "legacy_archived_blocked") {
        toastShort("Este mensaje ya no está activo");
        return { ok: false, legacy409: true };
      }
    }
    if (!res.ok) {
      const data = await res.json().catch(() => ({})) as Record<string, unknown>;
      const msg = typeof data.error === "string" ? data.error : `Error ${res.status}`;
      toastShort(msg);
      return { ok: false, legacy409: false };
    }
    return { ok: true, legacy409: false };
  }

  async function handleApprove() {
    setLoading(true);
    try {
      const { ok, legacy409 } = await postAction("approve");
      if (ok) {
        toastShort("Enviado");
        onRemove(item.id);
      } else if (legacy409) {
        onRemove(item.id);
      }
    } finally {
      setLoading(false);
    }
  }

  async function handleOverride() {
    const text = editText.trim();
    if (!text) return;
    setLoading(true);
    try {
      const { ok, legacy409 } = await postAction("override", { reply_text: text });
      if (ok) {
        toastShort("Enviado");
        onRemove(item.id);
      } else if (legacy409) {
        onRemove(item.id);
      }
    } finally {
      setLoading(false);
    }
  }

  async function handleDraft() {
    const text = editText.trim();
    if (!text) return;
    setLoading(true);
    try {
      const { ok } = await postAction("draft", { reply_text: text });
      if (ok) {
        toastShort("Borrador guardado");
        onUpdated(item.id, text);
      }
    } finally {
      setLoading(false);
    }
  }

  async function handleReject() {
    setLoading(true);
    try {
      const { ok, legacy409 } = await postAction("reject", {
        reason: rejectReason.trim() || undefined,
      });
      if (ok) {
        toastShort("Rechazado");
        onRemove(item.id);
      } else if (legacy409) {
        onRemove(item.id);
      }
    } finally {
      setLoading(false);
      setShowRejectModal(false);
      setRejectReason("");
    }
  }

  return (
    <div
      style={{
        borderBottom: "1px solid var(--mu-border, rgba(255,255,255,0.08))",
        padding: "0.9rem 1rem",
      }}
    >
      {/* Fila superior: canal + nombre + timestamp */}
      <div className="d-flex align-items-center gap-2 mb-1">
        <ChannelBadge
          channelId={item.channel_id}
          sourceType={item.source_type}
          size="sm"
        />
        <span
          style={{
            fontWeight: 600,
            fontSize: "0.85rem",
            flex: 1,
            minWidth: 0,
            overflow: "hidden",
            textOverflow: "ellipsis",
            whiteSpace: "nowrap",
          }}
          title={displayName}
        >
          {displayName}
        </span>
        {item.customer_segment && (
          <span
            style={{
              background: "var(--mu-panel-2, rgba(255,255,255,0.06))",
              borderRadius: 4,
              padding: "1px 6px",
              fontSize: "0.7rem",
              flexShrink: 0,
            }}
          >
            {item.customer_segment}
          </span>
        )}
        <span
          style={{
            color: "var(--mu-ink-mute, #6b6b6b)",
            fontSize: "0.7rem",
            flexShrink: 0,
          }}
        >
          {relativeTime(item.created_at)}
        </span>
      </div>

      {/* Preview del mensaje del cliente */}
      {item.message_text_preview && (
        <p
          style={{
            fontSize: "0.78rem",
            color: "var(--mu-ink-mute, #6b6b6b)",
            margin: "0 0 0.5rem",
            display: "-webkit-box",
            WebkitLineClamp: 2,
            WebkitBoxOrient: "vertical",
            overflow: "hidden",
          }}
        >
          {item.message_text_preview}
        </p>
      )}

      {/* Textarea con sugerencia IA */}
      <textarea
        value={editText}
        onChange={(e) => setEditText(e.target.value)}
        disabled={loading}
        maxLength={MAX_REPLY_LEN}
        placeholder="Sin sugerencia IA · escribí la respuesta"
        rows={3}
        style={{
          width: "100%",
          resize: "vertical",
          fontSize: "0.82rem",
          padding: "0.4rem 0.6rem",
          borderRadius: 6,
          border: "1px solid var(--mu-border, rgba(255,255,255,0.12))",
          background: "var(--mu-panel-2, rgba(255,255,255,0.04))",
          color: "inherit",
          marginBottom: "0.5rem",
          outline: "none",
        }}
      />
      <div style={{ fontSize: "0.68rem", color: "var(--mu-ink-mute)", textAlign: "right", marginTop: "-0.3rem", marginBottom: "0.5rem" }}>
        {editText.length}/{MAX_REPLY_LEN}
      </div>

      {/* Botones de acción */}
      <div className="d-flex gap-2 flex-wrap">
        {canApprove && (
          <button
            type="button"
            className="btn btn-sm"
            disabled={loading}
            onClick={() => void handleApprove()}
            style={{ background: "#22c55e", color: "#0a0b08", fontWeight: 600, fontSize: "0.75rem" }}
          >
            <i className="ti ti-check me-1" />
            Aprobar
          </button>
        )}

        <button
          type="button"
          className="btn btn-sm"
          disabled={loading || !editText.trim()}
          onClick={() => void handleOverride()}
          style={{ background: "#3b82f6", color: "#fff", fontWeight: 600, fontSize: "0.75rem" }}
        >
          <i className="ti ti-send me-1" />
          Editar y enviar
        </button>

        {canDraft && (
          <button
            type="button"
            className="btn btn-sm btn-outline-secondary"
            disabled={loading}
            onClick={() => void handleDraft()}
            style={{ fontSize: "0.75rem" }}
          >
            <i className="ti ti-device-floppy me-1" />
            Borrador
          </button>
        )}

        <button
          type="button"
          className="btn btn-sm"
          disabled={loading}
          onClick={() => setShowRejectModal(true)}
          style={{ marginLeft: "auto", color: "#ef4444", background: "transparent", border: "1px solid #ef4444", fontSize: "0.75rem" }}
        >
          <i className="ti ti-x me-1" />
          Rechazar
        </button>
      </div>

      {/* Modal de confirmación de rechazo */}
      {showRejectModal && (
        <>
          <div
            style={{
              position: "fixed",
              inset: 0,
              background: "rgba(0,0,0,0.5)",
              zIndex: 10002,
            }}
            onClick={() => { setShowRejectModal(false); setRejectReason(""); }}
          />
          <div
            role="dialog"
            aria-modal
            aria-label="Confirmar rechazo"
            style={{
              position: "fixed",
              top: "50%",
              left: "50%",
              transform: "translate(-50%, -50%)",
              zIndex: 10003,
              background: "var(--mu-panel, #1e2020)",
              border: "1px solid var(--mu-border, rgba(255,255,255,0.1))",
              borderRadius: 10,
              padding: "1.25rem",
              width: 320,
              boxShadow: "0 8px 32px rgba(0,0,0,0.4)",
            }}
          >
            <h6 style={{ fontWeight: 700, marginBottom: "0.75rem" }}>¿Rechazar sin enviar?</h6>
            <textarea
              value={rejectReason}
              onChange={(e) => setRejectReason(e.target.value)}
              placeholder="Motivo (opcional)"
              rows={2}
              style={{
                width: "100%",
                resize: "none",
                fontSize: "0.82rem",
                padding: "0.4rem 0.6rem",
                borderRadius: 6,
                border: "1px solid var(--mu-border, rgba(255,255,255,0.12))",
                background: "var(--mu-panel-2, rgba(255,255,255,0.04))",
                color: "inherit",
                marginBottom: "0.75rem",
                outline: "none",
              }}
            />
            <div className="d-flex gap-2 justify-content-end">
              <button
                type="button"
                className="btn btn-sm btn-outline-secondary"
                onClick={() => { setShowRejectModal(false); setRejectReason(""); }}
              >
                Cancelar
              </button>
              <button
                type="button"
                className="btn btn-sm"
                disabled={loading}
                onClick={() => void handleReject()}
                style={{ background: "#ef4444", color: "#fff", fontWeight: 600 }}
              >
                Rechazar
              </button>
            </div>
          </div>
        </>
      )}
    </div>
  );
}
