"use client";
import type { ChatMessage } from "@/types/inbox";

function fmtTime(iso: string): string {
  try { return new Date(iso).toLocaleTimeString("es-VE", { hour: "2-digit", minute: "2-digit" }); }
  catch { return ""; }
}

function MessageContent({ msg }: { msg: ChatMessage }) {
  const { type, content } = msg;
  if (type === "text" || type === "chat") {
    return <span style={{ whiteSpace: "pre-wrap", wordBreak: "break-word" }}>{content.text ?? "Sin contenido"}</span>;
  }
  if (type === "image" || type === "video" || type === "audio" || type === "document") {
    return (
      <span>
        <i className="ti ti-paperclip me-1" />
        {content.mediaUrl
          ? <a href={content.mediaUrl} target="_blank" rel="noopener noreferrer" className="text-decoration-underline">
              [Media: {content.mimeType ?? type}]
            </a>
          : `[Media: ${content.mimeType ?? type}]`}
        {content.caption && <span className="d-block mt-1 fst-italic small">{content.caption}</span>}
      </span>
    );
  }
  return <span className="text-muted fst-italic">[{type}]</span>;
}

interface Props { msg: ChatMessage; }

export default function MessageBubble({ msg }: Props) {
  const isOut = msg.direction === "outbound";

  return (
    <div className={`d-flex ${isOut ? "justify-content-end" : "justify-content-start"} mb-2 px-3`}>
      <div
        className="rounded-3 px-3 py-2"
        style={{
          maxWidth: "72%",
          backgroundColor: isOut ? "#0d6efd" : "#f1f3f4",
          color: isOut ? "#fff" : "#212529",
          boxShadow: "0 1px 2px rgba(0,0,0,.12)",
        }}
      >
        <MessageContent msg={msg} />

        <div className={`d-flex align-items-center gap-1 mt-1 ${isOut ? "justify-content-end" : "justify-content-start"}`}>
          <span style={{ fontSize: "0.65rem", opacity: 0.75 }}>{fmtTime(msg.created_at)}</span>
          {msg.ai_reply_status === "suggested" && (
            <span
              className="badge rounded-pill"
              style={{ fontSize: "0.6rem", backgroundColor: "#7c3aed", color: "#fff" }}
            >
              IA
            </span>
          )}
          {msg.is_priority && (
            <span className="badge bg-warning text-dark rounded-pill" style={{ fontSize: "0.6rem" }}>★</span>
          )}
        </div>
      </div>
    </div>
  );
}
