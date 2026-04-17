"use client";
import { useCallback, useEffect, useRef, useState } from "react";
import type { ChatMessage } from "@/types/inbox";

function errMsg(e: unknown) { return e instanceof Error ? e.message : "Error inesperado."; }

function parseMessages(raw: unknown): { messages: ChatMessage[]; meta: Record<string, unknown> } {
  if (!raw || typeof raw !== "object") return { messages: [], meta: {} };
  const r = raw as Record<string, unknown>;
  const msgs: ChatMessage[] = Array.isArray(r.data) ? (r.data as ChatMessage[])
    : Array.isArray(r.messages) ? (r.messages as ChatMessage[])
    : Array.isArray(raw) ? (raw as ChatMessage[])
    : [];
  return { messages: msgs, meta: (r.meta as Record<string, unknown>) ?? {} };
}

export function useChatMessages(chatId: string | number | null) {
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [meta, setMeta]         = useState<Record<string, unknown>>({});
  const [loading, setLoading]   = useState(false);
  const [loadingMore, setLoadingMore] = useState(false);
  const [error, setError]       = useState<string | null>(null);
  const intervalRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const latestIdRef = useRef<string | number | null>(null);

  const load = useCallback(async (id: string | number, beforeId?: string | number) => {
    const isMore = beforeId !== undefined;
    if (isMore) setLoadingMore(true); else { setLoading(true); setError(null); }
    try {
      const p = new URLSearchParams({ limit: "50" });
      if (beforeId !== undefined) p.set("before_id", String(beforeId));
      const res = await fetch(`/api/bandeja/${encodeURIComponent(String(id))}/messages?${p}`, { credentials: "include" });
      if (!res.ok) {
        const d = await res.json().catch(() => ({})) as Record<string, unknown>;
        throw new Error((d.error as string) ?? `HTTP ${res.status}`);
      }
      const data: unknown = await res.json();
      const { messages: msgs, meta: m } = parseMessages(data);
      if (isMore) {
        setMessages(prev => [...msgs, ...prev]);
      } else {
        setMessages(msgs);
        if (msgs.length > 0) latestIdRef.current = msgs[msgs.length - 1].id;
      }
      setMeta(m);
    } catch (e) {
      if (!isMore) setError(errMsg(e));
    } finally {
      if (isMore) setLoadingMore(false); else setLoading(false);
    }
  }, []);

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
        if (toAdd.length === 0) return prev;
        latestIdRef.current = latestNew;
        return [...prev, ...toAdd];
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
      /* optimistic: add locally */
      const optimistic: ChatMessage = {
        id: `local-${Date.now()}`, chat_id: chatId, customer_id: null,
        external_message_id: null, direction: "outbound", type: "text",
        content: { text, caption: null, mediaUrl: null, mimeType: null },
        sent_by: sentBy ?? "agent", is_read: true, is_priority: false,
        created_at: new Date().toISOString(), ai_reply_status: null, ai_reply_text: null,
      };
      setMessages(prev => [...prev, optimistic]);
      return true;
    } catch (e) {
      if (process.env.NODE_ENV === "development") {
        // eslint-disable-next-line no-console
        console.error("[useChatMessages] sendMessage error:", e);
      }
      return false;
    }
  }, [chatId]);

  const refetch = useCallback(() => { if (chatId) void load(chatId); }, [chatId, load]);

  return { messages, meta, loading, loadingMore, error, loadMore, sendMessage, refetch };
}
