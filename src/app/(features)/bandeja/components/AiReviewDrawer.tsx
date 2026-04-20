"use client";
import { useEffect, useRef, useState } from "react";
import type { AiPendingMessage } from "@/hooks/useAiResponderPending";
import { useAiResponderPending } from "@/hooks/useAiResponderPending";
import AiReviewItem from "./AiReviewItem";

interface Props {
  open: boolean;
  onClose: () => void;
}

/**
 * AiReviewDrawer — Sprint 6B
 *
 * Panel lateral derecho de revisión humana de mensajes Tipo M.
 * - position: fixed · derecha · 100vh
 * - width: 480px (ajustable en mobile)
 * - z-index: 500 (debajo del lightbox)
 * - Animación: transform translateX 100% → 0
 * - Backdrop semitransparente clickeable (cierra)
 * - Scroll interno en la lista
 */
export default function AiReviewDrawer({ open, onClose }: Props) {
  const { rows: fetchedRows, loading, error, refetch } = useAiResponderPending();
  const [rows, setRows] = useState<AiPendingMessage[]>([]);
  const panelRef = useRef<HTMLDivElement>(null);

  // Sincronizar rows locales cuando llega el poll (sin sobrescribir ediciones locales)
  useEffect(() => {
    if (!loading) setRows(fetchedRows);
  }, [fetchedRows, loading]);

  // Cerrar con Escape
  useEffect(() => {
    if (!open) return;
    function onKey(e: KeyboardEvent) {
      if (e.key === "Escape") onClose();
    }
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [open, onClose]);

  function handleRemove(id: string) {
    setRows(prev => prev.filter(r => r.id !== id));
  }

  function handleUpdated(id: string, newReplyText: string) {
    setRows(prev =>
      prev.map(r => r.id === id ? { ...r, ai_reply_text: newReplyText } : r)
    );
  }

  return (
    <>
      {/* Backdrop */}
      <div
        aria-hidden
        onClick={onClose}
        style={{
          position: "fixed",
          inset: 0,
          background: "rgba(0,0,0,0.35)",
          zIndex: 499,
          opacity: open ? 1 : 0,
          pointerEvents: open ? "auto" : "none",
          transition: "opacity 220ms ease",
        }}
      />

      {/* Panel */}
      <div
        ref={panelRef}
        role="dialog"
        aria-modal
        aria-label={`Revisión IA (${rows.length})`}
        style={{
          position: "fixed",
          top: 0,
          right: 0,
          height: "100vh",
          width: "min(480px, 100vw)",
          zIndex: 500,
          background: "var(--mu-panel, #1a1b18)",
          borderLeft: "1px solid var(--mu-border, rgba(255,255,255,0.08))",
          display: "flex",
          flexDirection: "column",
          transform: open ? "translateX(0)" : "translateX(100%)",
          transition: "transform 250ms cubic-bezier(0.4,0,0.2,1)",
          boxShadow: open ? "-4px 0 24px rgba(0,0,0,0.4)" : "none",
        }}
      >
        {/* Header */}
        <div
          style={{
            display: "flex",
            alignItems: "center",
            gap: "0.5rem",
            padding: "0.75rem 1rem",
            borderBottom: "1px solid var(--mu-border, rgba(255,255,255,0.08))",
            flexShrink: 0,
          }}
        >
          <i className="ti ti-robot" style={{ fontSize: "1.1rem", color: "var(--mu-accent, #d4ff3a)" }} />
          <h6 style={{ margin: 0, fontWeight: 700, flex: 1, fontSize: "0.95rem" }}>
            Revisión IA
            <span
              style={{
                marginLeft: "0.4rem",
                background: "var(--mu-accent, #d4ff3a)",
                color: "#0a0b08",
                borderRadius: 10,
                padding: "1px 8px",
                fontSize: "0.75rem",
                fontWeight: 700,
              }}
            >
              {rows.length}
            </span>
          </h6>
          <button
            type="button"
            className="btn-close btn-close-white"
            style={{ opacity: 0.7 }}
            aria-label="Cerrar drawer"
            onClick={onClose}
          />
        </div>

        {/* Lista con scroll */}
        <div style={{ flex: 1, overflowY: "auto" }}>
          {loading && rows.length === 0 && (
            <div style={{ padding: "2rem", textAlign: "center", color: "var(--mu-ink-mute)" }}>
              <div className="spinner-border spinner-border-sm me-2" />
              Cargando…
            </div>
          )}

          {!loading && error && (
            <div style={{ padding: "1rem" }}>
              <div className="alert alert-danger py-2 small">{error}</div>
              <button
                type="button"
                className="btn btn-sm btn-outline-secondary w-100"
                onClick={() => void refetch()}
              >
                Reintentar
              </button>
            </div>
          )}

          {!loading && !error && rows.length === 0 && (
            <div
              style={{
                padding: "3rem 1.5rem",
                textAlign: "center",
                color: "var(--mu-ink-mute)",
              }}
            >
              <i className="ti ti-checks" style={{ fontSize: "2rem", display: "block", marginBottom: "0.75rem" }} />
              <p style={{ margin: 0, fontSize: "0.88rem" }}>
                Todo al día · no hay mensajes pendientes
              </p>
            </div>
          )}

          {rows.map(item => (
            <AiReviewItem
              key={item.id}
              item={item}
              onRemove={handleRemove}
              onUpdated={handleUpdated}
            />
          ))}
        </div>
      </div>
    </>
  );
}
