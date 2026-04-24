"use client";
import { useEffect, useRef, useState } from "react";
import { useAppSelector } from "@/store/hooks";

export type MessageSendResult =
  | boolean
  | { success: boolean; errorMessage?: string };

const MAX_ATTACHMENT_BYTES = 10 * 1024 * 1024;

function formatFileSize(bytes: number): string {
  if (!Number.isFinite(bytes) || bytes < 0) return "";
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
}

function attachmentDocIconClass(mime: string): string {
  const m = mime.toLowerCase();
  if (m === "application/pdf" || m.includes("pdf")) return "ti ti-file-type-pdf";
  if (m.startsWith("text/")) return "ti ti-file-text";
  return "ti ti-file";
}

interface Props {
  chatId:       string | number;
  sourceType:   string;
  /** `file` opcional: WhatsApp (`/api/bandeja/.../messages`) y mensajería ML (`ml_message`). */
  onSend:       (text: string, sentBy: string, file?: File | null) => Promise<MessageSendResult>;
}

export default function MessageInput({ chatId: _chatId, sourceType, onSend }: Props) {
  const username = useAppSelector(s => s.auth.role ?? "agent");
  const [text, setText]     = useState("");
  const [sending, setSending] = useState(false);
  const [error, setError]   = useState<string | null>(null);
  const [pendingFile, setPendingFile] = useState<File | null>(null);
  /** URL `blob:` para vista previa de imagen (o video); se revoca al cambiar archivo o desmontar. */
  const [mediaPreviewUrl, setMediaPreviewUrl] = useState<string | null>(null);
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const allowAttachments = sourceType !== "ml_question";

  const fileInputAccept =
    sourceType === "ml_message"
      ? "image/*,.pdf,.txt,application/pdf,text/plain"
      : "image/*,video/*,.pdf,.txt,application/pdf,text/plain";

  useEffect(() => {
    if (!pendingFile) {
      setMediaPreviewUrl((prev) => {
        if (prev) URL.revokeObjectURL(prev);
        return null;
      });
      return;
    }
    const mime = pendingFile.type || "";
    const isVisual = mime.startsWith("image/") || mime.startsWith("video/");
    if (!isVisual) {
      setMediaPreviewUrl((prev) => {
        if (prev) URL.revokeObjectURL(prev);
        return null;
      });
      return;
    }
    const url = URL.createObjectURL(pendingFile);
    setMediaPreviewUrl((prev) => {
      if (prev) URL.revokeObjectURL(prev);
      return url;
    });
    return () => {
      URL.revokeObjectURL(url);
    };
  }, [pendingFile]);

  const placeholder =
    sourceType === "ml_question"
      ? "Responder pregunta en ML..."
      : sourceType === "ml_message"
        ? "Enviar mensaje por ML..."
        : "Escribir un mensaje…";

  async function handleSend() {
    const trimmed = text.trim();
    const file = pendingFile;
    if ((!trimmed && !file) || sending) return;
    setSending(true);
    setError(null);
    if (process.env.NODE_ENV === "development") {
      // eslint-disable-next-line no-console
      console.log("[MessageInput] send", { text: trimmed, chatId: _chatId, hasFile: Boolean(file) });
    }
    const raw = await onSend(trimmed, String(username), file ?? undefined);
    const ok = typeof raw === "boolean" ? raw : raw.success;
    const customMsg = typeof raw === "boolean" ? undefined : raw.errorMessage;
    if (ok) {
      setText("");
      setPendingFile(null);
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

  function onPickFile(ev: React.ChangeEvent<HTMLInputElement>) {
    const f = ev.target.files?.[0];
    ev.target.value = "";
    if (!f) return;
    if (f.size > MAX_ATTACHMENT_BYTES) {
      setError("El archivo supera 10 MB.");
      return;
    }
    setError(null);
    setPendingFile(f);
  }

  const canSend = Boolean(text.trim() || pendingFile) && !sending;

  return (
    <div className="d-flex flex-column flex-shrink-0">
      {error && (
        <div className="alert bandeja-wa-alert py-2 px-3 mb-0 small border-0 rounded-0">{error}</div>
      )}
      {pendingFile && (
        <div className="bandeja-msg-attachment-preview">
          <button
            type="button"
            className="btn btn-sm btn-link bandeja-msg-attachment-preview-remove p-0"
            onClick={() => setPendingFile(null)}
            aria-label="Quitar adjunto"
          >
            <i className="ti ti-x" />
          </button>
          <div className="bandeja-msg-attachment-preview-body">
            {mediaPreviewUrl && pendingFile.type.startsWith("image/") && (
              <div className="bandeja-msg-attachment-preview-thumb">
                {/* eslint-disable-next-line @next/next/no-img-element -- blob: local */}
                <img
                  src={mediaPreviewUrl}
                  alt={`Vista previa de ${pendingFile.name}`}
                  className="bandeja-msg-attachment-preview-img"
                />
              </div>
            )}
            {mediaPreviewUrl && pendingFile.type.startsWith("video/") && (
              <div className="bandeja-msg-attachment-preview-thumb bandeja-msg-attachment-preview-thumb--video">
                <video
                  src={mediaPreviewUrl}
                  className="bandeja-msg-attachment-preview-video"
                  muted
                  playsInline
                  controls
                  preload="metadata"
                />
              </div>
            )}
            {!mediaPreviewUrl && (
              <div className="bandeja-msg-attachment-preview-doc" aria-hidden>
                <i className={attachmentDocIconClass(pendingFile.type)} />
              </div>
            )}
            <div className="bandeja-msg-attachment-preview-meta">
              <div className="bandeja-msg-attachment-preview-name text-truncate" title={pendingFile.name}>
                {pendingFile.name}
              </div>
              <div className="bandeja-msg-attachment-preview-sub">
                {formatFileSize(pendingFile.size)}
                {pendingFile.type ? ` · ${pendingFile.type.split(";")[0]}` : ""}
              </div>
            </div>
          </div>
        </div>
      )}
      <div className="bandeja-msg-input-bar">
        <span className="bandeja-msg-input-icon" aria-hidden>😊</span>
        {allowAttachments && (
          <>
            <input
              ref={fileInputRef}
              type="file"
              className="d-none"
              accept={fileInputAccept}
              aria-hidden
              tabIndex={-1}
              onChange={onPickFile}
            />
            <button
              type="button"
              className="btn btn-sm bandeja-msg-input-attach"
              onClick={() => fileInputRef.current?.click()}
              disabled={sending}
              title="Adjuntar foto o archivo (JPG, PNG, PDF, TXT)"
              aria-label="Adjuntar archivo"
            >
              {/* Glifo visible aunque falle la fuente Tabler en esta franja */}
              <span className="me-1" style={{ fontSize: "1.15rem", lineHeight: 1 }} aria-hidden>📎</span>
              <i className="ti ti-paperclip" style={{ fontSize: "1.1rem" }} aria-hidden />
            </button>
          </>
        )}
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
          disabled={!canSend}
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
