"use client";
import { useCallback, useEffect, useRef, useState } from "react";
import type { InboxChat, InboxFilters } from "@/types/inbox";
import { useAppSelector } from "@/store/hooks";

const DEFAULT_FILTERS: InboxFilters = {
  filter: "",
  src: "",
  search: "",
  limit: 30,
  stage: "",
  result: "",
};

function errMsg(e: unknown) { return e instanceof Error ? e.message : "Error desconocido."; }

function parseChats(raw: unknown): { chats: InboxChat[]; nextCursor: string | null; hasMore: boolean } {
  if (!raw || typeof raw !== "object") return { chats: [], nextCursor: null, hasMore: false };
  const r = raw as Record<string, unknown>;
  const chats: InboxChat[] = Array.isArray(r.chats) ? (r.chats as InboxChat[])
    : Array.isArray(r.data) ? (r.data as InboxChat[])
    : Array.isArray(raw)   ? (raw    as InboxChat[])
    : [];
  const nextCursor = typeof r.nextCursor === "string" ? r.nextCursor : null;
  return {
    chats,
    nextCursor,
    hasMore: typeof r.hasMore === "boolean" ? r.hasMore : nextCursor !== null,
  };
}

export function useInbox(initialFilters?: Partial<InboxFilters>) {
  const [filters, setFiltersState] = useState<InboxFilters>(() => ({
    ...DEFAULT_FILTERS,
    ...initialFilters,
  }));
  const [chats, setChats]           = useState<InboxChat[]>([]);
  const [nextCursor, setNextCursor] = useState<string | null>(null);
  const [hasMore, setHasMore]       = useState(false);
  /** Total visible acumulado de chats cargados (crece con loadMore). */
  const [total, setTotal]           = useState(0);
  const [loading, setLoading]       = useState(true);
  const [loadingMore, setLoadingMore] = useState(false);
  const [error, setError]           = useState<string | null>(null);
  const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  /**
   * Debounce para refetches por nonce (SSE + bumpInboxRefetch post-acción).
   * Varios bumps dentro de la misma ventana de 250 ms se colapsan en un solo fetch,
   * evitando disparar 3–4 GETs a /api/bandeja por un único cambio de chat.
   */
  const nonceDebouncRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const inboxRefetchNonce = useAppSelector((s) => s.realtime.inboxRefetchNonce);
  const prevNonceRef = useRef<number | null>(null);

  /**
   * @param background - Si es true, no muestra spinner de carga (refetch silencioso por SSE/post-acción).
   *                     Evita el parpadeo de la lista cuando llega un mensaje nuevo.
   */
  const load = useCallback(async (f: InboxFilters, cursor?: string, background = false) => {
    const isMore = !!cursor;
    if (isMore) {
      setLoadingMore(true);
    } else if (!background) {
      setLoading(true);
    }
    setError(null);
    try {
      const p = new URLSearchParams();
      if (f.filter) p.set("filter", f.filter);
      if (f.src)    p.set("src",    f.src);
      if (f.search) p.set("search", f.search);
      if (f.stage)  p.set("stage",  f.stage);
      if (f.result) p.set("result", f.result);
      if (cursor)   p.set("cursor", cursor);
      p.set("limit", String(f.limit));
      const res = await fetch(`/api/bandeja?${p}`, { credentials: "include" });
      if (!res.ok) {
        const d = await res.json().catch(() => ({})) as Record<string, unknown>;
        throw new Error((d.error as string) ?? `HTTP ${res.status}`);
      }
      const data: unknown = await res.json();
      const { chats: newChats, nextCursor: nc, hasMore: hm } = parseChats(data);
      if (isMore) {
        setChats(prev => {
          const next = [...prev, ...newChats];
          setTotal(next.length);
          return next;
        });
      } else {
        setChats(newChats);
        setTotal(newChats.length);
      }
      setNextCursor(nc);
      setHasMore(hm);
    } catch (e) {
      setError(errMsg(e));
    } finally {
      if (isMore) setLoadingMore(false);
      else if (!background) setLoading(false);
    }
  }, []);

  const setFilters = useCallback((partial: Partial<InboxFilters>) => {
    setFiltersState(prev => {
      const next = { ...prev, ...partial };
      if (partial.search !== undefined && partial.search !== prev.search) {
        if (debounceRef.current) clearTimeout(debounceRef.current);
        debounceRef.current = setTimeout(() => void load(next), 300);
        return next;
      }
      void load(next);
      return next;
    });
  }, [load]);

  const initFilters = { ...DEFAULT_FILTERS, ...initialFilters };
  // eslint-disable-next-line react-hooks/exhaustive-deps
  useEffect(() => { void load(initFilters); }, []);

  useEffect(() => {
    if (prevNonceRef.current === null) {
      prevNonceRef.current = inboxRefetchNonce;
      return;
    }
    if (inboxRefetchNonce === prevNonceRef.current) return;
    prevNonceRef.current = inboxRefetchNonce;

    // Debounce: colapsar rafagas de bumpInboxRefetch (release + SSE clear_notification +
    // new_message que llegan en <250ms) en un solo fetch al backend.
    if (nonceDebouncRef.current) clearTimeout(nonceDebouncRef.current);
    const capturedFilters = filters;
    nonceDebouncRef.current = setTimeout(() => {
      nonceDebouncRef.current = null;
      void load(capturedFilters, undefined, true);
    }, 250);
  }, [inboxRefetchNonce, load, filters]);

  const loadMore = useCallback(() => {
    if (nextCursor) void load(filters, nextCursor);
  }, [load, filters, nextCursor]);

  const refetch = useCallback(() => { void load(filters, undefined, true); }, [load, filters]);

  return { chats, nextCursor, hasMore, total, loading, loadingMore, error, filters, setFilters, loadMore, refetch };
}
