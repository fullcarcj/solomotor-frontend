"use client";
import { useCallback, useEffect, useRef, useState } from "react";
import type { ChatMessage } from "@/types/inbox";

function fmtTime(iso: string): string {
  try { return new Date(iso).toLocaleTimeString("es-VE", { hour: "2-digit", minute: "2-digit" }); }
  catch { return ""; }
}

interface AudioPlayerProps {
  url?: string;
  duration?: number;
  isOutgoing: boolean;
}

function AudioPlayer({ url, duration, isOutgoing }: AudioPlayerProps) {
  const audioRef = useRef<HTMLAudioElement>(null);
  const [playing, setPlaying] = useState(false);
  const [currentTime, setCurrentTime] = useState(0);
  const [totalDuration, setTotalDuration] = useState(duration ?? 0);

  useEffect(() => {
    if (duration != null && duration > 0) setTotalDuration(duration);
  }, [duration]);

  const toggle = () => {
    const audio = audioRef.current;
    if (!audio || !url) return;
    if (playing) {
      audio.pause();
    } else {
      void audio.play().catch(() => setPlaying(false));
    }
  };

  const handleTimeUpdate = () => {
    if (audioRef.current) setCurrentTime(audioRef.current.currentTime);
  };

  const handleLoadedMetadata = () => {
    if (audioRef.current && Number.isFinite(audioRef.current.duration)) {
      setTotalDuration(audioRef.current.duration);
    }
  };

  const handleEnded = () => setPlaying(false);

  const progress = totalDuration > 0 ? (currentTime / totalDuration) * 100 : 0;

  const formatTime = (s: number) => {
    const m = Math.floor(s / 60);
    const sec = Math.floor(s % 60);
    return `${m}:${sec.toString().padStart(2, "0")}`;
  };

  return (
    <div className={`audio-player ${isOutgoing ? "audio-player--out" : "audio-player--in"}`}>
      {url && (
        <audio
          ref={audioRef}
          src={url}
          onTimeUpdate={handleTimeUpdate}
          onLoadedMetadata={handleLoadedMetadata}
          onPlay={() => setPlaying(true)}
          onPause={() => setPlaying(false)}
          onEnded={handleEnded}
          preload="metadata"
        />
      )}

      <button
        type="button"
        className="audio-player__btn"
        onClick={toggle}
        disabled={!url}
        aria-label={playing ? "Pausar" : "Reproducir"}
      >
        <i className={`ti ${playing ? "ti-player-pause" : "ti-player-play"}`} />
      </button>

      <div className="audio-player__waveform">
        <div className="audio-player__progress" style={{ width: `${progress}%` }} />
      </div>

      <span className="audio-player__time">
        {formatTime(playing ? currentTime : totalDuration)}
      </span>
    </div>
  );
}

/* ─── Modal lightbox (imagen / PDF) — no navega fuera del chat ─── */

interface MediaModalProps {
  open: boolean;
  url: string;
  type: "image" | "pdf";
  onClose: () => void;
}

function MediaModal({ open, url, type, onClose }: MediaModalProps) {
  useEffect(() => {
    if (!open) return;
    const handler = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
    };
    window.addEventListener("keydown", handler);
    return () => window.removeEventListener("keydown", handler);
  }, [open, onClose]);

  useEffect(() => {
    document.body.style.overflow = open ? "hidden" : "";
    return () => {
      document.body.style.overflow = "";
    };
  }, [open]);

  if (!open) return null;

  return (
    <div className="media-modal__overlay" onClick={onClose} role="presentation">
      <div className="media-modal__container" onClick={e => e.stopPropagation()} role="dialog" aria-modal="true">
        <button type="button" className="media-modal__close" onClick={onClose} aria-label="Cerrar">
          <span className="media-modal__close-mark" aria-hidden>×</span>
        </button>

        {type === "image" && (
          <img src={url} alt="Vista previa" className="media-modal__image" />
        )}

        {/* Limitación: si el servidor responde con Content-Disposition: attachment, el navegador puede descargar en lugar de mostrar en el iframe. */}
        {type === "pdf" && (
          <iframe src={url} className="media-modal__pdf" title="Documento PDF" />
        )}
      </div>
    </div>
  );
}

type OpenModalFn = (url: string, type: "image" | "pdf") => void;

function MessageContent({ msg, onOpenModal }: { msg: ChatMessage; onOpenModal: OpenModalFn }) {
  const { type, content } = msg;
  if (type === "text" || type === "chat") {
    return <span style={{ whiteSpace: "pre-wrap", wordBreak: "break-word" }}>{content.text ?? "Sin contenido"}</span>;
  }
  if (type === "audio") {
    return (
      <span className="d-inline-flex flex-column w-100">
        <AudioPlayer
          url={content.mediaUrl ?? undefined}
          duration={content.duration}
          isOutgoing={msg.direction === "outbound"}
        />
        {content.caption && <span className="d-block mt-1 fst-italic small">{content.caption}</span>}
      </span>
    );
  }
  if (type === "image") {
    return (
      <span className="media-bubble media-bubble--image">
        {content.mediaUrl ? (
          <>
            <img
              src={content.mediaUrl}
              alt={content.caption ?? "imagen"}
              className="media-bubble__thumb"
              onClick={() => onOpenModal(content.mediaUrl!, "image")}
              onKeyDown={e => {
                if (e.key === "Enter" || e.key === " ") {
                  e.preventDefault();
                  onOpenModal(content.mediaUrl!, "image");
                }
              }}
              tabIndex={0}
              role="button"
              aria-label="Ampliar imagen"
            />
            {content.caption && (
              <span className="d-block mt-1 small media-bubble__caption">{content.caption}</span>
            )}
          </>
        ) : (
          <span className="fst-italic opacity-75">[Imagen sin URL]</span>
        )}
      </span>
    );
  }
  if (type === "video") {
    const poster = content.thumbnailUrl ?? undefined;
    return (
      <span className="media-bubble media-bubble--video">
        {content.mediaUrl ? (
          <>
            <video
              src={content.mediaUrl}
              controls
              preload="metadata"
              className="media-bubble__video"
              poster={poster || undefined}
            />
            {content.caption && (
              <span className="d-block mt-1 small media-bubble__caption">{content.caption}</span>
            )}
          </>
        ) : (
          <span className="fst-italic opacity-75">[Video sin URL]</span>
        )}
      </span>
    );
  }
  if (type === "document") {
    const isPdf = content.mimeType?.toLowerCase().includes("pdf") ?? false;
    const openDoc = () => {
      if (!content.mediaUrl) return;
      if (isPdf) onOpenModal(content.mediaUrl, "pdf");
      else window.open(content.mediaUrl, "_blank", "noopener,noreferrer");
    };
    return (
      <span className="media-bubble media-bubble--document d-flex align-items-start flex-wrap gap-1">
        <i className={`ti ${isPdf ? "ti-file-type-pdf" : "ti-file"} flex-shrink-0 mt-1`} />
        {content.mediaUrl ? (
          <span
            className="media-bubble__doc-link"
            onClick={openDoc}
            onKeyDown={e => {
              if (e.key === "Enter" || e.key === " ") {
                e.preventDefault();
                openDoc();
              }
            }}
            role="button"
            tabIndex={0}
          >
            {content.mimeType ?? "documento"}
          </span>
        ) : (
          <span className="fst-italic opacity-75">[Documento sin URL]</span>
        )}
        {content.caption && (
          <span className="d-block w-100 mt-1 small fst-italic media-bubble__caption">{content.caption}</span>
        )}
      </span>
    );
  }
  return <span className="fst-italic opacity-75">[{type}]</span>;
}

interface Props { msg: ChatMessage; }

export default function MessageBubble({ msg }: Props) {
  const isOut = msg.direction === "outbound";

  const [modalOpen, setModalOpen] = useState(false);
  const [modalUrl, setModalUrl] = useState("");
  const [modalType, setModalType] = useState<"image" | "pdf">("image");

  const openModal = useCallback((url: string, type: "image" | "pdf") => {
    setModalUrl(url);
    setModalType(type);
    setModalOpen(true);
  }, []);

  const closeModal = useCallback(() => setModalOpen(false), []);

  return (
    <>
      <div className={`wa-msg-row ${isOut ? "wa-msg-row--out" : "wa-msg-row--in"}`}>
        <div className={`wa-bubble ${isOut ? "wa-bubble--out" : "wa-bubble--in"}`}>
          <MessageContent msg={msg} onOpenModal={openModal} />

          <div className={`d-flex align-items-center gap-1 mt-1 flex-wrap ${isOut ? "justify-content-end" : "justify-content-start"}`}>
            <span className="wa-bubble-time">{fmtTime(msg.created_at)}</span>
            {isOut && (
              <span
                className="wa-bubble-ticks"
                style={{ fontSize: "0.75rem", color: msg.is_read ? "var(--wa-accent)" : "var(--wa-text-secondary)" }}
                aria-hidden
              >
                {msg.is_read ? "✓✓" : "✓"}
              </span>
            )}
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

      <MediaModal open={modalOpen} url={modalUrl} type={modalType} onClose={closeModal} />
    </>
  );
}
