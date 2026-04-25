"use client";

import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useRef,
  useState,
  type ReactNode,
} from "react";
import { usePathname } from "next/navigation";
import type { InboxCounts } from "@/types/inbox";
import { useInboxRealtime } from "@/hooks/useInboxRealtime";
import { useAppDispatch, useAppSelector } from "@/store/hooks";
import { resetInboxUnreadOptimisticDelta } from "@/store/realtimeSlice";
import { unlockBandejaAudio } from "@/lib/realtime/sounds";
import { requestBandejaNotifyPermission, tryBandejaDesktopNotify } from "@/lib/realtime/bandejaAttentionNotify";
import { traceMlQuestionUi } from "@/lib/realtime/mlQuestionTrace";

const FAVICON_PENDING =
  "data:image/svg+xml," +
  encodeURIComponent(
    `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 32 32"><rect width="32" height="32" rx="6" fill="#1c2128"/><circle cx="24" cy="9" r="6" fill="#f59e0b"/></svg>`
  );

export type InboxLiveContextValue = {
  /** Total «Sin atender» (GET /api/inbox/counts, pipeline_default=1) + delta optimista. */
  sinAtenderCount: number | null;
};

const InboxLiveContext = createContext<InboxLiveContextValue | null>(null);

export function useInboxLive(): InboxLiveContextValue {
  const v = useContext(InboxLiveContext);
  return v ?? { sinAtenderCount: null };
}

/**
 * Una sola suscripción SSE + conteo «Sin atender» para todo el shell `(features)`:
 * campana del header, título/favicon y notificación de escritorio en cualquier página del menú.
 */
export function InboxLiveProvider({ children }: { children: ReactNode }) {
  useInboxRealtime();
  const dispatch = useAppDispatch();
  const pathname = usePathname();
  const inboxRefetchNonce = useAppSelector((s) => s.realtime.inboxRefetchNonce);
  const inboxUnreadOptimisticDelta = useAppSelector((s) => s.realtime.inboxUnreadOptimisticDelta ?? 0);
  const sseQuick = useAppSelector((s) => s.realtime.sseInboxQuickNotify);

  const [counts, setCounts] = useState<InboxCounts | null>(null);
  const countsFetchGenRef = useRef(0);
  const intervalRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const lastDesktopTickRef = useRef(0);

  const activeMatch = pathname?.match(/^\/bandeja\/(\d+)/);
  const activeChatId = activeMatch ? activeMatch[1] : null;

  const fetchCounts = useCallback(async () => {
    const gen = ++countsFetchGenRef.current;
    try {
      const r = await fetch("/api/bandeja/counts?pipeline_default=1", {
        credentials: "include",
        cache: "no-store",
      });
      if (gen !== countsFetchGenRef.current) return;
      if (!r.ok) return;
      const d = (await r.json().catch(() => null)) as InboxCounts | null;
      if (gen !== countsFetchGenRef.current) return;
      if (d) {
        setCounts(d);
        dispatch(resetInboxUnreadOptimisticDelta());
      }
    } catch {
      /* silent */
    }
  }, [dispatch]);

  useEffect(() => {
    void fetchCounts();
    intervalRef.current = setInterval(() => void fetchCounts(), 30_000);
    return () => {
      if (intervalRef.current) clearInterval(intervalRef.current);
    };
  }, [fetchCounts]);

  useEffect(() => {
    if (inboxRefetchNonce <= 0) return;
    void fetchCounts();
  }, [inboxRefetchNonce, fetchCounts]);

  useEffect(() => {
    const onPointer = () => {
      unlockBandejaAudio();
      void requestBandejaNotifyPermission();
    };
    document.addEventListener("pointerdown", onPointer, { capture: true });
    return () => document.removeEventListener("pointerdown", onPointer, { capture: true });
  }, []);

  const sinAtenderCount = useMemo(() => {
    if (!counts) return null;
    const base = Number(counts.unread) || 0;
    return Math.max(0, base + inboxUnreadOptimisticDelta);
  }, [counts, inboxUnreadOptimisticDelta]);

  const ctxValue = useMemo(() => ({ sinAtenderCount }), [sinAtenderCount]);

  const baseTitleRef = useRef<string | null>(null);
  const savedIconHrefRef = useRef<string | null>(null);
  const iconTouchedRef = useRef(false);

  useEffect(() => {
    if (typeof document === "undefined") return;
    if (baseTitleRef.current == null) {
      baseTitleRef.current = document.title.replace(/^\(\d+\)\s+/, "").trim() || "ERP";
    }
    const pending = sinAtenderCount ?? 0;
    const base = baseTitleRef.current || "ERP";
    document.title = pending > 0 ? `(${pending}) ${base}` : base;

    const iconLink = document.querySelector<HTMLLinkElement>('link[rel="icon"]');
    if (iconLink) {
      if (savedIconHrefRef.current == null) {
        savedIconHrefRef.current = iconLink.href;
      }
      if (pending > 0) {
        iconLink.href = FAVICON_PENDING;
        iconTouchedRef.current = true;
      } else if (iconTouchedRef.current && savedIconHrefRef.current != null) {
        iconLink.href = savedIconHrefRef.current;
        iconTouchedRef.current = false;
      }
    }
  }, [sinAtenderCount]);

  useEffect(() => {
    const tick = sseQuick?.tick ?? 0;
    if (tick < 1 || !sseQuick) return;
    if (tick <= lastDesktopTickRef.current) return;
    lastDesktopTickRef.current = tick;
    if ((sseQuick.sourceType ?? "").toLowerCase() === "ml_question") {
      traceMlQuestionUi("frontend_desktop_notify_attempt", {
        chat_id: sseQuick.chatId,
        source_type: sseQuick.sourceType ?? null,
        preview: sseQuick.preview ?? null,
        active_chat_id: activeChatId,
      });
    }
    tryBandejaDesktopNotify({
      chatId: sseQuick.chatId,
      preview: sseQuick.preview,
      activeChatId,
    });
  }, [sseQuick, activeChatId]);

  useEffect(
    () => () => {
      if (typeof document === "undefined") return;
      if (baseTitleRef.current) {
        document.title = baseTitleRef.current;
      }
      const iconLink = document.querySelector<HTMLLinkElement>('link[rel="icon"]');
      if (iconLink && savedIconHrefRef.current != null && iconTouchedRef.current) {
        iconLink.href = savedIconHrefRef.current;
      }
    },
    []
  );

  return <InboxLiveContext.Provider value={ctxValue}>{children}</InboxLiveContext.Provider>;
}
