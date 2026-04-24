"use client";

import React from "react";

export interface FbmpThread {
  id: number;
  external_thread_id: string;
  participant_name: string | null;
  participant_fb_id: string | null;
  chat_id: number | null;
  customer_id: number | null;
  customer_name: string | null;
  unread_count: number | null;
  last_message_text: string | null;
  last_message_at: string | null;
  last_scraped_at: string | null;
}

interface Props {
  threads: FbmpThread[];
  selectedId: number | null;
  onSelect: (thread: FbmpThread) => void;
  loading: boolean;
  extensionActive: boolean;
}

function initials(name: string | null): string {
  if (!name) return "?";
  return name.split(" ").map((w) => w[0]).slice(0, 2).join("").toUpperCase();
}

function relativeTime(iso: string | null): string {
  if (!iso) return "";
  const diff = Date.now() - new Date(iso).getTime();
  if (diff < 60_000) return "ahora";
  if (diff < 3_600_000) return `${Math.floor(diff / 60_000)} min`;
  if (diff < 86_400_000) return `${Math.floor(diff / 3_600_000)} h`;
  return new Date(iso).toLocaleDateString("es-VE", { day: "2-digit", month: "2-digit" });
}

export default function FbmpThreadList({ threads, selectedId, onSelect, loading, extensionActive }: Props) {
  return (
    <div className="fbmp-thread-list">
      <div className="fbmp-list-header">
        <h2>
          <span className={`fbmp-status-dot${extensionActive ? " active" : ""}`} title={extensionActive ? "Extensión activa" : "Extensión inactiva"} />
          FB Marketplace
        </h2>
        <div className="fbmp-subtitle">
          {loading ? "Cargando…" : `${threads.length} conversación${threads.length !== 1 ? "es" : ""}`}
        </div>
      </div>

      <div className="fbmp-list-scroll">
        {!loading && threads.length === 0 && (
          <div className="fbmp-empty-state" style={{ padding: "32px 16px", textAlign: "center" }}>
            <p>Sin conversaciones aún</p>
            <p style={{ fontSize: 11 }}>Abrí la extensión Chrome en Facebook Marketplace para empezar a recibir mensajes.</p>
          </div>
        )}

        {threads.map((t) => (
          <div
            key={t.id}
            className={`fbmp-thread-item${selectedId === t.id ? " selected" : ""}${(t.unread_count ?? 0) > 0 ? " unread" : ""}`}
            onClick={() => onSelect(t)}
          >
            <div className="fbmp-item-avatar">{initials(t.participant_name)}</div>
            <div className="fbmp-item-body">
              <div className="fbmp-item-name">{t.participant_name ?? t.external_thread_id}</div>
              {t.last_message_text && (
                <div className="fbmp-item-preview">{t.last_message_text}</div>
              )}
            </div>
            <div className="fbmp-item-meta">
              <span className="fbmp-item-time">{relativeTime(t.last_message_at)}</span>
              {(t.unread_count ?? 0) > 0 && (
                <span className="fbmp-unread-badge">{t.unread_count}</span>
              )}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
