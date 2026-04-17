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

  /* ML questions have their own flow — disable input */
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
    <div className="border-top bg-white px-3 py-2">
      {error && <div className="alert alert-danger py-1 mb-2 small">{error}</div>}
      {isDisabled && (
        <div className="alert alert-warning py-1 mb-2 small">
          <i className="ti ti-info-circle me-1" />
          Las preguntas de MercadoLibre se responden desde el panel de ML.
        </div>
      )}
      <div className="d-flex gap-2 align-items-end">
        <textarea
          ref={textareaRef}
          className="form-control"
          rows={2}
          placeholder={isDisabled ? "Respuesta gestionada por MercadoLibre" : "Escribir mensaje… (Enter para enviar)"}
          value={text}
          onChange={e => setText(e.target.value)}
          onKeyDown={handleKeyDown}
          disabled={isDisabled || sending}
          style={{ resize: "none", fontSize: "0.875rem" }}
        />
        <button
          className="btn btn-primary d-flex align-items-center gap-1 flex-shrink-0"
          onClick={() => void handleSend()}
          disabled={isDisabled || sending || !text.trim()}
          style={{ height: 56 }}
        >
          {sending
            ? <span className="spinner-border spinner-border-sm" />
            : <><i className="ti ti-send" /><span className="d-none d-sm-inline">Enviar</span></>}
        </button>
      </div>
    </div>
  );
}
