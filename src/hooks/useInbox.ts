"use client";
import { useCallback, useEffect, useRef, useState } from "react";
import type { InboxChat, InboxFilters } from "@/types/inbox";

const DEFAULT_FILTERS: InboxFilters = { filter: "", src: "", search: "", limit: 30 };

function errMsg(e: unknown) { return e instanceof Error ? e.message : "Error desconocido."; }

function parseChats(raw: unknown): { chats: InboxChat[]; nextCursor: string | null; total: number } {
  if (!raw || typeof raw !== "object") return { chats: [], nextCursor: null, total: 0 };
  const r = raw as Record<string, unknown>;
  const chats: InboxChat[] = Array.isArray(r.chats) ? (r.chats as InboxChat[])
    : Array.isArray(r.data) ? (r.data as InboxChat[])
    : Array.isArray(raw)   ? (raw    as InboxChat[])
    : [];
  return {
    chats,
    nextCursor: typeof r.nextCursor === "string" ? r.nextCursor : null,
    total:      typeof r.total      === "number" ? r.total      : chats.length,
  };
}

export function useInbox() {
  const [filters, setFiltersState] = useState<InboxFilters>(DEFAULT_FILTERS);
  const [chats, setChats]           = useState<InboxChat[]>([]);
  const [nextCursor, setNextCursor] = useState<string | null>(null);
  const [total, setTotal]           = useState(0);
  const [loading, setLoading]       = useState(true);
  const [loadingMore, setLoadingMore] = useState(false);
  const [error, setError]           = useState<string | null>(null);
  const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const load = useCallback(async (f: InboxFilters, cursor?: string) => {
    const isMore = !!cursor;
    if (isMore) setLoadingMore(true); else setLoading(true);
    setError(null);
    try {
      const p = new URLSearchParams();
      if (f.filter) p.set("filter", f.filter);
      if (f.src)    p.set("src",    f.src);
      if (f.search) p.set("search", f.search);
      if (cursor)   p.set("cursor", cursor);
      p.set("limit", String(f.limit));
      const res = await fetch(`/api/bandeja?${p}`, { credentials: "include" });
      if (!res.ok) {
        const d = await res.json().catch(() => ({})) as Record<string, unknown>;
        throw new Error((d.error as string) ?? `HTTP ${res.status}`);
      }
      const data: unknown = await res.json();
      const { chats: newChats, nextCursor: nc, total: t } = parseChats(data);
      if (isMore) {
        setChats(prev => [...prev, ...newChats]);
      } else {
        setChats(newChats);
      }
      setNextCursor(nc);
      setTotal(t);
    } catch (e) {
      setError(errMsg(e));
    } finally {
      if (isMore) setLoadingMore(false); else setLoading(false);
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

  useEffect(() => { void load(DEFAULT_FILTERS); }, []); // eslint-disable-line react-hooks/exhaustive-deps

  const loadMore = useCallback(() => {
    if (nextCursor) void load(filters, nextCursor);
  }, [load, filters, nextCursor]);

  const refetch = useCallback(() => { void load(filters); }, [load, filters]);

  return { chats, nextCursor, total, loading, loadingMore, error, filters, setFilters, loadMore, refetch };
}
