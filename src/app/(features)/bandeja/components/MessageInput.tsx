"use client";
import { useRef, useState } from "react";
import { useAppSelector } from "@/store/hooks";

export type MessageSendResult =
  | boolean
  | { success: boolean; errorMessage?: string };

interface Props {
  chatId:       string | number;
  sourceType:   string;
  onSend:       (text: string, sentBy: string) => Promise<MessageSendResult>;
}

export default function MessageInput({ chatId: _chatId, sourceType, onSend }: Props) {
  const username = useAppSelector(s => s.auth.role ?? "agent");
  const [text, setText]     = useState("");
  const [sending, setSending] = useState(false);
  const [error, setError]   = useState<string | null>(null);
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  const placeholder =
    sourceType === "ml_question"
      ? "Responder pregunta en ML..."
      : sourceType === "ml_message"
        ? "Enviar mensaje por ML..."
        : "Escribir un mensaje…";

  async function handleSend() {
    const trimmed = text.trim();
    if (!trimmed || sending) return;
    setSending(true);
    setError(null);
    if (process.env.NODE_ENV === "development") {
      // eslint-disable-next-line no-console
      console.log("[MessageInput] POST body:", { text: trimmed, sent_by: String(username), chatId: _chatId });
      // eslint-disable-next-line no-console
      console.log("[MessageInput] URL:", `/api/bandeja/${_chatId}/messages`);
    }
    const raw = await onSend(trimmed, String(username));
    const ok = typeof raw === "boolean" ? raw : raw.success;
    const customMsg = typeof raw === "boolean" ? undefined : raw.errorMessage;
    if (ok) {
      setText("");
      textareaRef.current?.focus();
    } else {
      setError(customMsg ?? "No se pudo enviar el mensaje. Intenta de nuevo.");
    }
    setSending(false);
  }

  function handleKeyDown(e: React.KeyboardEvent<HTMLTextAreaElement>) {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      void handleSend();
    }
  }

  return (
    <div className="d-flex flex-column flex-shrink-0">
      {error && (
        <div className="alert bandeja-wa-alert py-2 px-3 mb-0 small border-0 rounded-0">{error}</div>
      )}
      <div className="bandeja-msg-input-bar">
        <span className="bandeja-msg-input-icon" aria-hidden>😊</span>
        <textarea
          ref={textareaRef}
          className="form-control"
          rows={2}
          placeholder={placeholder}
          value={text}
          onChange={e => setText(e.target.value)}
          onKeyDown={handleKeyDown}
          disabled={sending}
          style={{ resize: "none" }}
          aria-label="Escribir mensaje"
        />
        <span className="bandeja-msg-input-icon d-none d-sm-inline" aria-hidden>🎤</span>
        <button
          type="button"
          className="btn btn-primary d-flex align-items-center justify-content-center flex-shrink-0 px-3"
          onClick={() => void handleSend()}
          disabled={sending || !text.trim()}
          style={{ minWidth: 48, height: 48 }}
          aria-label="Enviar"
        >
          {sending
            ? <span className="spinner-border spinner-border-sm" />
            : <i className="ti ti-send" />}
        </button>
      </div>
    </div>
  );
}
