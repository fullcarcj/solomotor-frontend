"use client";
import { useRef, useState } from "react";
import { useAppSelector } from "@/store/hooks";

interface Props {
  chatId:       string | number;
  sourceType:   string;
  onSend:       (text: string, sentBy: string) => Promise<boolean>;
}

export default function MessageInput({ chatId: _chatId, sourceType, onSend }: Props) {
  const username = useAppSelector(s => s.auth.role ?? "agent");
  const [text, setText]     = useState("");
  const [sending, setSending] = useState(false);
  const [error, setError]   = useState<string | null>(null);
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  const isDisabled = sourceType === "ml_question";

  async function handleSend() {
    const trimmed = text.trim();
    if (!trimmed || sending || isDisabled) return;
    setSending(true);
    setError(null);
    if (process.env.NODE_ENV === "development") {
      // eslint-disable-next-line no-console
      console.log("[MessageInput] POST body:", { text: trimmed, sent_by: String(username), chatId: _chatId });
      // eslint-disable-next-line no-console
      console.log("[MessageInput] URL:", `/api/bandeja/${_chatId}/messages`);
    }
    const ok = await onSend(trimmed, String(username));
    if (ok) {
      setText("");
      textareaRef.current?.focus();
    } else {
      setError("No se pudo enviar el mensaje. Intenta de nuevo.");
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
      {isDisabled && (
        <div className="alert bandeja-wa-alert-warn py-2 px-3 mb-0 small border-0 rounded-0">
          <i className="ti ti-info-circle me-1" />
          Las preguntas de MercadoLibre se responden desde el panel de ML.
        </div>
      )}
      <div className="bandeja-msg-input-bar">
        <span className="bandeja-msg-input-icon" aria-hidden>😊</span>
        <textarea
          ref={textareaRef}
          className="form-control"
          rows={2}
          placeholder={isDisabled ? "Respuesta gestionada por MercadoLibre" : "Escribir un mensaje…"}
          value={text}
          onChange={e => setText(e.target.value)}
          onKeyDown={handleKeyDown}
          disabled={isDisabled || sending}
          style={{ resize: "none" }}
          aria-label="Escribir mensaje"
        />
        <span className="bandeja-msg-input-icon d-none d-sm-inline" aria-hidden>🎤</span>
        <button
          type="button"
          className="btn btn-primary d-flex align-items-center justify-content-center flex-shrink-0 px-3"
          onClick={() => void handleSend()}
          disabled={isDisabled || sending || !text.trim()}
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
