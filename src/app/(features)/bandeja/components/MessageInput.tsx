"use client";
import { useEffect, useRef, useState } from "react";
import { useAppSelector } from "@/store/hooks";

export type MessageSendResult =
  | boolean
  | { success: boolean; errorMessage?: string };

const MAX_ATTACHMENT_BYTES = 10 * 1024 * 1024;

/**
 * Ventana de mensajería estándar Facebook: 24 h desde el último mensaje inbound.
 * Retorna true si ya expiró (o si `expiresAt` es null/undefined).
 */
export function isFbWindowExpired(expiresAt: string | null | undefined): boolean {
  if (!expiresAt) return true;
  return Date.now() >= new Date(expiresAt).getTime();
}

/**
 * Retorna los ms restantes de la ventana FB, o 0 si expiró.
 */
export function fbWindowRemainingMs(expiresAt: string | null | undefined): number {
  if (!expiresAt) return 0;
  return Math.max(0, new Date(expiresAt).getTime() - Date.now());
}

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
  /**
   * Solo para `source_type='fb_page'`: ISO timestamp en que expira la ventana de 24 h de Meta.
   * Si está en el pasado (o es null), el input se bloquea con un aviso.
   */
  fbWindowExpiresAt?: string | null;
}

export default function MessageInput({ chatId: _chatId, sourceType, onSend, fbWindowExpiresAt }: Props) {
  const username = useAppSelector(s => s.auth.role ?? "agent");
  const [text, setText]     = useState("");
  const [sending, setSending] = useState(false);
  const [error, setError]   = useState<string | null>(null);
  const [pendingFile, setPendingFile] = useState<File | null>(null);
  /** URL `blob:` para vista previa de imagen (o video); se revoca al cambiar archivo o desmontar. */
  const [mediaPreviewUrl, setMediaPreviewUrl] = useState<string | null>(null);
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // ── Ventana de 24 h de Meta (solo fb_page) ───────────────────────────────
  const isFbChat = sourceType === "fb_page";
  // Re-evalúa cada minuto para actualizar conteo sin re-render forzado
  const [, setTick] = useState(0);
  useEffect(() => {
    if (!isFbChat || !fbWindowExpiresAt) return;
    const interval = setInterval(() => setTick((n) => n + 1), 60_000);
    return () => clearInterval(interval);
  }, [isFbChat, fbWindowExpiresAt]);

  const fbBlocked = isFbChat && isFbWindowExpired(fbWindowExpiresAt);
  const fbRemainingMs = isFbChat ? fbWindowRemainingMs(fbWindowExpiresAt) : 0;
  const fbRemainingH = Math.floor(fbRemainingMs / 3_600_000);
  const fbRemainingMin = Math.floor((fbRemainingMs % 3_600_000) / 60_000);
  const fbWindowWarning = isFbChat && !fbBlocked && fbRemainingMs < 4 * 3_600_000; // <4h → aviso

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

  const canSend = Boolean(text.trim() || pendingFile) && !sending && !fbBlocked;

  // Si Facebook bloquea: overlay con mensaje; no renderizamos el input normal
  if (fbBlocked) {
    return (
      <div className="d-flex flex-column flex-shrink-0">
        <div
          className="d-flex align-items-center gap-2 px-3 py-3 small"
          style={{ background: "rgba(8,102,255,0.08)", borderTop: "1px solid rgba(8,102,255,0.18)", color: "#4a90d9" }}
        >
          <i className="ti ti-clock-off fs-5 flex-shrink-0" />
          <span>
            <strong>Ventana de Facebook cerrada.</strong>{" "}
            Han pasado más de 24 h desde el último mensaje del cliente.
            Solo puedes responder cuando él vuelva a escribir.
          </span>
        </div>
      </div>
    );
  }

  return (
    <div className="d-flex flex-column flex-shrink-0">
      {fbWindowWarning && (
        <div
          className="d-flex align-items-center gap-2 px-3 py-2 small"
          style={{ background: "rgba(245,158,11,0.08)", borderTop: "1px solid rgba(245,158,11,0.2)", color: "#b45309" }}
        >
          <i className="ti ti-clock-exclamation flex-shrink-0" />
          <span>
            Ventana Facebook: cierra en{" "}
            <strong>{fbRemainingH}h {fbRemainingMin}min</strong>.
            Responde antes de que expire.
          </span>
        </div>
      )}
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
