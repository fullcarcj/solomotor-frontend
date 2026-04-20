"use client";

interface Props {
  count: number;
  onClick: () => void;
}

/**
 * AiReviewBadge — Sprint 6B
 *
 * Botón flotante integrado en el header de ChatList.
 * Muestra el total de mensajes en cola de revisión humana.
 * Se oculta completamente si count === 0.
 */
export default function AiReviewBadge({ count, onClick }: Props) {
  if (count === 0) return null;

  return (
    <button
      type="button"
      onClick={onClick}
      aria-label={`Revisión IA: ${count} pendiente${count !== 1 ? "s" : ""}`}
      title="Abrir cola de revisión IA"
      style={{
        position: "relative",
        display: "inline-flex",
        alignItems: "center",
        justifyContent: "center",
        width: 32,
        height: 32,
        borderRadius: "50%",
        border: "none",
        background: "var(--mu-accent, #d4ff3a)",
        color: "#0a0b08",
        cursor: "pointer",
        flexShrink: 0,
        padding: 0,
      }}
    >
      <i className="ti ti-robot" style={{ fontSize: "1rem", lineHeight: 1 }} />
      <span
        aria-hidden
        style={{
          position: "absolute",
          top: -4,
          right: -4,
          minWidth: 18,
          height: 18,
          borderRadius: 9,
          background: "#ef4444",
          color: "#fff",
          fontSize: 10,
          fontWeight: 700,
          lineHeight: "18px",
          textAlign: "center",
          padding: "0 3px",
          border: "2px solid var(--mu-bg, #151611)",
        }}
      >
        {count > 99 ? "99+" : count}
      </span>
    </button>
  );
}
