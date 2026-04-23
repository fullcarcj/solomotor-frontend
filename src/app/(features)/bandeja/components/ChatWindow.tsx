"use client";
import { useCallback, useEffect, useLayoutEffect, useRef } from "react";
import type { ChatMessage } from "@/types/inbox";
import MessageBubble from "./MessageBubble";

function dayKey(iso: string): string {
  try { return new Date(iso).toDateString(); } catch { return iso; }
}
function dayLabel(key: string): string {
  const d = new Date(key);
  const now = new Date();
  const yesterday = new Date(now); yesterday.setDate(now.getDate() - 1);
  if (d.toDateString() === now.toDateString())       return "Hoy";
  if (d.toDateString() === yesterday.toDateString()) return "Ayer";
  return d.toLocaleDateString("es-VE", { day: "2-digit", month: "2-digit", year: "numeric" });
}

type GroupedItem =
  | { type: "separator"; label: string }
  | { type: "message"; msg: ChatMessage };

function buildGroups(messages: ChatMessage[]): GroupedItem[] {
  const items: GroupedItem[] = [];
  let lastDay = "";
  for (const msg of messages) {
    const key = dayKey(msg.created_at);
    if (key !== lastDay) {
      items.push({ type: "separator", label: dayLabel(key) });
      lastDay = key;
    }
    items.push({ type: "message", msg });
  }
  return items;
}

/** px desde el tope del scroll para disparar carga de historial */
const SCROLL_LOAD_TOP_THRESHOLD = 120;
const SCROLL_LOAD_DEBOUNCE_MS = 400;

interface Props {
  messages:    ChatMessage[];
  loading:     boolean;
  loadingMore: boolean;
  /** Cambio de chat: carga silenciosa sin skeleton de pantalla completa. */
  bootstrapping?: boolean;
  /** Id de chat activo: scroll al final al cambiar (misma UX que /workspace). */
  chatKey?:    string | number | null;
  error:       string | null;
  /** Hay más mensajes antiguos en servidor (`meta.has_more` del CRM). */
  hasMore?:    boolean;
  onLoadMore:  () => void;
}

export default function ChatWindow({
  messages,
  loading,
  loadingMore,
  bootstrapping = false,
  chatKey = null,
  error,
  hasMore = false,
  onLoadMore,
}: Props) {
  const rootRef   = useRef<HTMLDivElement>(null);
  const bottomRef = useRef<HTMLDivElement>(null);
  const prevLen   = useRef(0);
  const prevNewestIdRef = useRef<string | number | null>(null);
  const lastChatKeyRef = useRef<string | number | null>(null);
  /** Guardar altura/scroll y cantidad de mensajes antes de pedir página anterior (evita salto visual al prepend). */
  const scrollAnchorRef = useRef<{ h: number; top: number; count: number } | null>(null);
  const wasLoadingMoreRef = useRef(false);
  const scrollLoadCooldownUntil = useRef(0);

  const triggerLoadMore = useCallback(() => {
    if (!hasMore || loadingMore) return;
    const el = rootRef.current;
    if (el) {
      scrollAnchorRef.current = { h: el.scrollHeight, top: el.scrollTop, count: messages.length };
    }
    onLoadMore();
  }, [hasMore, loadingMore, messages.length, onLoadMore]);

  useLayoutEffect(() => {
    const el = rootRef.current;
    if (!el) return;
    const switched =
      chatKey != null &&
      String(lastChatKeyRef.current ?? "") !== String(chatKey);
    if (switched) {
      lastChatKeyRef.current = chatKey;
      prevLen.current = messages.length;
      prevNewestIdRef.current = messages.length ? messages[messages.length - 1].id : null;
      scrollAnchorRef.current = null;
      el.scrollTop = el.scrollHeight;
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [chatKey]);

  /* Tras prepend: restaurar posición. Tras mensajes nuevos al final: scroll suave abajo. */
  useLayoutEffect(() => {
    const el = rootRef.current;
    const newest = messages.length ? messages[messages.length - 1].id : null;
    const grew = messages.length > prevLen.current;

    if (el && wasLoadingMoreRef.current && !loadingMore && scrollAnchorRef.current) {
      const anchor = scrollAnchorRef.current;
      if (messages.length > anchor.count) {
        const { h, top } = anchor;
        el.scrollTop = el.scrollHeight - h + top;
      }
      scrollAnchorRef.current = null;
    } else if (grew && newest != null && newest !== prevNewestIdRef.current) {
      bottomRef.current?.scrollIntoView({ behavior: "smooth" });
    }

    prevLen.current = messages.length;
    prevNewestIdRef.current = newest;
    wasLoadingMoreRef.current = loadingMore;
  }, [messages, loadingMore]);

  /* Al acercarse al tope: cargar historial (misma acción que el botón). */
  useEffect(() => {
    const el = rootRef.current;
    if (!el || !hasMore) return;
    const onScroll = () => {
      if (!hasMore || loadingMore) return;
      if (el.scrollTop > SCROLL_LOAD_TOP_THRESHOLD) return;
      const now = Date.now();
      if (now < scrollLoadCooldownUntil.current) return;
      scrollLoadCooldownUntil.current = now + SCROLL_LOAD_DEBOUNCE_MS;
      triggerLoadMore();
    };
    el.addEventListener("scroll", onScroll, { passive: true });
    return () => el.removeEventListener("scroll", onScroll);
  }, [hasMore, loadingMore, triggerLoadMore]);

  if (loading && messages.length === 0) {
    return (
      <div className="bandeja-chat-window flex-grow-1" style={{ padding: "16px 12px", display: "flex", flexDirection: "column", gap: 12 }}>
        {/* Skeletons con forma de burbujas para que el usuario sienta que hay conversación */}
        {[
          { align: "flex-start", width: "62%"  },
          { align: "flex-end",   width: "45%"  },
          { align: "flex-start", width: "78%"  },
          { align: "flex-end",   width: "55%"  },
          { align: "flex-start", width: "40%"  },
          { align: "flex-end",   width: "68%"  },
        ].map((s, i) => (
          <div key={i} style={{ display: "flex", justifyContent: s.align }}>
            <div
              style={{
                width: s.width,
                height: 38,
                borderRadius: s.align === "flex-end" ? "16px 4px 16px 16px" : "4px 16px 16px 16px",
                background: "var(--wa-bg-secondary, rgba(255,255,255,0.07))",
                animation: "mu-pulse 1.4s ease-in-out infinite",
                animationDelay: `${i * 0.12}s`,
              }}
            />
          </div>
        ))}
        <style>{`@keyframes mu-pulse{0%,100%{opacity:.4}50%{opacity:.9}}`}</style>
      </div>
    );
  }

  if (bootstrapping && messages.length === 0 && !loading) {
    return (
      <div
        ref={rootRef}
        className="bandeja-chat-window flex-grow-1 d-flex align-items-center justify-content-center"
        style={{ padding: "24px 12px", minHeight: 120 }}
        aria-busy="true"
        aria-label="Cargando mensajes"
      >
        <div
          className="spinner-border text-secondary"
          style={{ width: "1.75rem", height: "1.75rem", opacity: 0.85 }}
          role="status"
        />
      </div>
    );
  }

  if (error) {
    return (
      <div className="bandeja-chat-window flex-grow-1 d-flex align-items-center justify-content-center p-3">
        <div className="alert bandeja-wa-alert w-100 text-center mb-0">{error}</div>
      </div>
    );
  }

  const groups = buildGroups(messages);

  return (
    <div ref={rootRef} className="bandeja-chat-window flex-grow-1">
      {hasMore && (
        <div className="text-center py-2">
          <button
            type="button"
            className="btn btn-sm"
            style={{
              background: "var(--wa-bg-secondary)",
              color: "var(--wa-text-primary)",
              border: "1px solid var(--wa-border)",
            }}
            onClick={() => triggerLoadMore()}
            disabled={loadingMore}
          >
            {loadingMore ? <span className="spinner-border spinner-border-sm me-1" /> : <i className="ti ti-arrow-up me-1" />}
            Mensajes anteriores
          </button>
        </div>
      )}

      {messages.length === 0 && (
        <div className="text-center py-5" style={{ color: "var(--wa-text-secondary)" }}>
          <i className="ti ti-message-off fs-2 d-block mb-2 opacity-50" />
          Sin mensajes en este chat
        </div>
      )}

      {groups.map((item, i) => {
        if (item.type === "separator") {
          return (
            <div key={`sep-${i}`} className="bandeja-day-sep">
              <div className="flex-grow-1 border-top" />
              <small>{item.label}</small>
              <div className="flex-grow-1 border-top" />
            </div>
          );
        }
        return <MessageBubble key={String(item.msg.id)} msg={item.msg} />;
      })}

      <div ref={bottomRef} />
    </div>
  );
}
