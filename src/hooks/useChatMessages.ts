"use client";
import { useCallback, useEffect, useRef, useState } from "react";
import type { ChatMessage } from "@/types/inbox";

function errMsg(e: unknown) { return e instanceof Error ? e.message : "Error inesperado."; }

/**
 * Normaliza el campo `content` de un mensaje del backend.
 *
 * El BFF pasa el payload raw sin transformar. El backend devuelve
 * snake_case (media_url, mime_type, thumbnail_url), mientras que los
 * tipos FE usan camelCase (mediaUrl, mimeType, thumbnailUrl).
 * Sin esta normalización la multimedia aparece como undefined/null
 * y MessageBubble muestra "[Imagen sin URL]" aunque el dato exista en BD.
 *
 * Hallazgo Sprint 6A — Bloque 5 (multimedia recuperada).
 */
function normalizeContent(raw: unknown): ChatMessage["content"] {
  if (!raw || typeof raw !== "object") {
    return { text: null, caption: null, mediaUrl: null, mimeType: null };
  }
  const c = raw as Record<string, unknown>;
  return {
    text:         (c.text         ?? null) as string | null,
    caption:      (c.caption      ?? null) as string | null,
    mediaUrl:     (c.mediaUrl     ?? c.media_url     ?? null) as string | null,
    mimeType:     (c.mimeType     ?? c.mime_type     ?? null) as string | null,
    duration:     (c.duration     != null ? Number(c.duration)     : undefined) as number | undefined,
    thumbnailUrl: (c.thumbnailUrl ?? c.thumbnail_url ?? null) as string | null,
  };
}

/** Normaliza un mensaje completo del backend (acepta snake_case y camelCase). */
function normalizeMessage(raw: unknown): ChatMessage {
  const m = (raw ?? {}) as Record<string, unknown>;
  return {
    id:                   m.id                   as string | number,
    chat_id:              m.chat_id              as string | number,
    customer_id:          (m.customer_id ?? null) as string | number | null,
    external_message_id:  (m.external_message_id ?? null) as string | null,
    direction:            m.direction             as "inbound" | "outbound",
    type:                 (m.type ?? "text")      as string,
    content:              normalizeContent(m.content),
    sent_by:              (m.sent_by ?? null)     as string | null,
    is_read:              Boolean(m.is_read),
    is_priority:          Boolean(m.is_priority),
    created_at:           (m.created_at ?? new Date().toISOString()) as string,
    ai_reply_status:      (m.ai_reply_status ?? null)  as string | null,
    ai_reply_text:        (m.ai_reply_text   ?? null)  as string | null,
  };
}

function parseMessages(raw: unknown): { messages: ChatMessage[]; meta: Record<string, unknown> } {
  if (!raw || typeof raw !== "object") return { messages: [], meta: {} };
  const r = raw as Record<string, unknown>;
  const rawMsgs: unknown[] = Array.isArray(r.data)     ? r.data
    : Array.isArray(r.messages) ? r.messages
    : Array.isArray(raw)        ? (raw as unknown[])
    : [];
  const msgs = rawMsgs.map(normalizeMessage);
  return { messages: msgs, meta: (r.meta as Record<string, unknown>) ?? {} };
}

/** Última fila gana — orden de entrada se conserva. */
function dedupeByMessageId(msgs: ChatMessage[]): ChatMessage[] {
  const seen = new Set<string>();
  const out: ChatMessage[] = [];
  for (const m of msgs) {
    const k = String(m.id);
    if (seen.has(k)) continue;
    seen.add(k);
    out.push(m);
  }
  return out;
}

export function useChatMessages(chatId: string | number | null) {
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [meta, setMeta]         = useState<Record<string, unknown>>({});
  const [loading, setLoading]   = useState(false);
  const [loadingMore, setLoadingMore] = useState(false);
  const [error, setError]       = useState<string | null>(null);
  const intervalRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const latestIdRef = useRef<string | number | null>(null);

  const load = useCallback(
    async (id: string | number, beforeId?: string | number, options?: { silent?: boolean }) => {
      const silent = Boolean(options?.silent);
      const isMore = beforeId !== undefined;
      if (isMore) setLoadingMore(true);
      else if (!silent) {
        setLoading(true);
        setError(null);
      }
      try {
        const p = new URLSearchParams({ limit: "50" });
        if (beforeId !== undefined) p.set("before_id", String(beforeId));
        const res = await fetch(`/api/bandeja/${encodeURIComponent(String(id))}/messages?${p}`, { credentials: "include" });
        if (!res.ok) {
          const d = await res.json().catch(() => ({})) as Record<string, unknown>;
          throw new Error((d.error as string) ?? `HTTP ${res.status}`);
        }
        const data: unknown = await res.json();
        const { messages: rawList, meta: m } = parseMessages(data);
        const msgs = dedupeByMessageId(rawList);
        if (isMore) {
          setMessages(prev => dedupeByMessageId([...msgs, ...prev]));
        } else {
          setMessages(msgs);
          if (msgs.length > 0) latestIdRef.current = msgs[msgs.length - 1].id;
        }
        setMeta(m);
      } catch (e) {
        if (!isMore && !silent) setError(errMsg(e));
      } finally {
        if (isMore) setLoadingMore(false);
        else if (!silent) setLoading(false);
      }
    },
    []
  );

  /* poll for new messages */
  const poll = useCallback(async (id: string | number) => {
    try {
      const p = new URLSearchParams({ limit: "20" });
      const res = await fetch(`/api/bandeja/${encodeURIComponent(String(id))}/messages?${p}`, { credentials: "include" });
      if (!res.ok) return;
      const data: unknown = await res.json();
      const { messages: newMsgs } = parseMessages(data);
      if (newMsgs.length === 0) return;
      const latestNew = newMsgs[newMsgs.length - 1].id;
      if (latestNew === latestIdRef.current) return;
      setMessages(prev => {
        const existingIds = new Set(prev.map(m => String(m.id)));
        const toAdd = newMsgs.filter(m => !existingIds.has(String(m.id)));
        latestIdRef.current = latestNew;
        if (toAdd.length === 0) return prev;
        return dedupeByMessageId([...prev, ...toAdd]);
      });
    } catch { /* silent */ }
  }, []);

  useEffect(() => {
    if (chatId === null) { setMessages([]); setMeta({}); setError(null); return; }
    void load(chatId);
    intervalRef.current = setInterval(() => void poll(chatId), 15_000);
    return () => { if (intervalRef.current) clearInterval(intervalRef.current); };
  }, [chatId, load, poll]);

  const loadMore = useCallback(() => {
    if (!chatId || messages.length === 0) return;
    const oldestId = messages[0].id;
    void load(chatId, oldestId);
  }, [chatId, load, messages]);

  const sendMessage = useCallback(async (text: string, sentBy?: string): Promise<boolean> => {
    if (!chatId) return false;
    const url = `/api/bandeja/${encodeURIComponent(String(chatId))}/messages`;
    const payload = { text, sent_by: sentBy ?? "agent" };
    try {
      if (process.env.NODE_ENV === "development") {
        // eslint-disable-next-line no-console
        console.log("[useChatMessages] POST", { url, body: payload });
      }
      const res = await fetch(url, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify(payload),
      });
      if (!res.ok) {
        const d = await res.json().catch(() => ({})) as Record<string, unknown>;
        if (process.env.NODE_ENV === "development") {
          // eslint-disable-next-line no-console
          console.error("[useChatMessages] POST failed", res.status, d);
        }
        throw new Error((d.error as string) ?? `HTTP ${res.status}`);
      }
      /* Sincronizar con BD: el optimista local + el mensaje real compartían texto y duplicaban el hilo. */
      await load(chatId, undefined, { silent: true });
      return true;
    } catch (e) {
      if (process.env.NODE_ENV === "development") {
        // eslint-disable-next-line no-console
        console.error("[useChatMessages] sendMessage error:", e);
      }
      return false;
    }
  }, [chatId, load]);

  const refetch = useCallback(() => { if (chatId) void load(chatId); }, [chatId, load]);

  return { messages, meta, loading, loadingMore, error, loadMore, sendMessage, refetch };
}
