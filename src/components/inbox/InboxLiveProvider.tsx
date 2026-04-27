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
import Link from "next/link";
import { usePathname } from "next/navigation";
import type { InboxCounts } from "@/types/inbox";
import { useInboxRealtime } from "@/hooks/useInboxRealtime";
import { useAppDispatch, useAppSelector } from "@/store/hooks";
import {
  clearPendingMlSalesBellCount,
  resetInboxUnreadOptimisticDelta,
} from "@/store/realtimeSlice";
import { unlockBandejaAudio } from "@/lib/realtime/sounds";
import {
  requestBandejaNotifyPermission,
  tryBandejaDesktopNotify,
  tryNewMlSaleDesktopNotify,
} from "@/lib/realtime/bandejaAttentionNotify";
import { traceMlQuestionUi } from "@/lib/realtime/mlQuestionTrace";
import { all_routes } from "@/data/all_routes";

const FAVICON_PENDING =
  "data:image/svg+xml," +
  encodeURIComponent(
    `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 32 32"><rect width="32" height="32" rx="6" fill="#1c2128"/><circle cx="24" cy="9" r="6" fill="#f59e0b"/></svg>`
  );

export type InboxLiveContextValue = {
  /** Total «Sin atender» (GET /api/inbox/counts, pipeline_default=1) + delta optimista. */
  sinAtenderCount: number | null;
  /** Órdenes ML nuevas (SSE `new_sale`) hasta abrir Pedidos. */
  pendingMlSalesBellCount: number;
  /** Suma para el badge de la campana (bandeja + pedidos ML). */
  headerBellTotal: number;
  /** Preguntas ML sin responder (ml_questions_pending, status=UNANSWERED). */
  mlQuestionsPendingCount: number;
};

const InboxLiveContext = createContext<InboxLiveContextValue | null>(null);

export function useInboxLive(): InboxLiveContextValue {
  const v = useContext(InboxLiveContext);
  return v ?? { sinAtenderCount: null, pendingMlSalesBellCount: 0, headerBellTotal: 0, mlQuestionsPendingCount: 0 };
}

/**
 * Una sola suscripción SSE + conteo «Sin atender» para todo el shell `(features)`:
 * campana del header, título/favicon y notificación de escritorio en cualquier página del menú.
 * Órdenes ML: mismo canal SSE (`new_sale`) + campana + OS + barra global.
 */
export function InboxLiveProvider({ children }: { children: ReactNode }) {
  useInboxRealtime();
  const dispatch = useAppDispatch();
  const pathname = usePathname();
  const authToken = useAppSelector((s) => s.auth.token);
  const authRestoring = useAppSelector((s) => s.auth.restoring);
  const inboxRefetchNonce = useAppSelector((s) => s.realtime.inboxRefetchNonce);
  const inboxUnreadOptimisticDelta = useAppSelector((s) => s.realtime.inboxUnreadOptimisticDelta ?? 0);
  const pendingMlSalesBellCount = useAppSelector((s) => s.realtime.pendingMlSalesBellCount ?? 0);
  const sseQuick = useAppSelector((s) => s.realtime.sseInboxQuickNotify);
  const sseNewSale = useAppSelector((s) => s.realtime.sseNewSaleQuickNotify);

  const [counts, setCounts] = useState<InboxCounts | null>(null);
  const countsFetchGenRef = useRef(0);
  const intervalRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const lastInboxDesktopTickRef = useRef(0);
  const lastSaleDesktopTickRef = useRef(0);

  const [newSaleToast, setNewSaleToast] = useState(false);
  const lastSaleToastTickRef = useRef(0);

  const activeMatch = pathname?.match(/^\/bandeja\/(\d+)/);
  const activeChatId = activeMatch ? activeMatch[1] : null;

  const fetchCounts = useCallback(async () => {
    // Sin sesión no llamamos al receptor: GET /api/inbox/counts exige JWT/cookie + permiso crm:read → evita 401 en consola.
    if (authToken === null || authRestoring) return;
    const gen = ++countsFetchGenRef.current;
    try {
      const headers: Record<string, string> = {};
      if (authToken !== "cookie") {
        headers.Authorization = `Bearer ${authToken}`;
      }
      const r = await fetch("/api/bandeja/counts?pipeline_default=1", {
        credentials: "include",
        cache: "no-store",
        headers,
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
  }, [dispatch, authToken, authRestoring]);

  useEffect(() => {
    if (authToken === null && !authRestoring) setCounts(null);
  }, [authToken, authRestoring]);

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

  const headerBellTotal = useMemo(() => {
    const base = sinAtenderCount ?? 0;
    return Math.max(0, base + pendingMlSalesBellCount);
  }, [sinAtenderCount, pendingMlSalesBellCount]);

  const mlQuestionsPendingCount = useMemo(
    () => (counts?.ml_questions_pending != null ? Number(counts.ml_questions_pending) : 0),
    [counts]
  );

  const ctxValue = useMemo(
    () => ({ sinAtenderCount, pendingMlSalesBellCount, headerBellTotal, mlQuestionsPendingCount }),
    [sinAtenderCount, pendingMlSalesBellCount, headerBellTotal, mlQuestionsPendingCount]
  );

  const baseTitleRef = useRef<string | null>(null);
  const savedIconHrefRef = useRef<string | null>(null);
  const iconTouchedRef = useRef(false);

  useEffect(() => {
    if (typeof document === "undefined") return;
    if (baseTitleRef.current == null) {
      baseTitleRef.current = document.title.replace(/^\(\d+\)\s+/, "").trim() || "ERP";
    }
    const pending = headerBellTotal;
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
  }, [headerBellTotal]);

  useEffect(() => {
    const tick = sseQuick?.tick ?? 0;
    if (tick < 1 || !sseQuick) return;
    if (tick <= lastInboxDesktopTickRef.current) return;
    lastInboxDesktopTickRef.current = tick;
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

  useEffect(() => {
    const tick = sseNewSale?.tick ?? 0;
    if (tick < 1 || !sseNewSale) return;
    if (tick <= lastSaleDesktopTickRef.current) return;
    lastSaleDesktopTickRef.current = tick;
    tryNewMlSaleDesktopNotify({
      external_order_id: sseNewSale.external_order_id,
      order_id: sseNewSale.order_id,
      activePath: pathname ?? null,
    });
  }, [sseNewSale, pathname]);

  useEffect(() => {
    const tick = sseNewSale?.tick ?? 0;
    if (tick < 1 || !sseNewSale) return;
    if (tick <= lastSaleToastTickRef.current) return;
    lastSaleToastTickRef.current = tick;
    setNewSaleToast(true);
  }, [sseNewSale]);

  useEffect(() => {
    if (pathname != null && (pathname === "/ventas/pedidos" || pathname.startsWith("/ventas/pedidos?"))) {
      dispatch(clearPendingMlSalesBellCount());
    }
  }, [pathname, dispatch]);

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

  return (
    <InboxLiveContext.Provider value={ctxValue}>
      {children}
      {newSaleToast && (
        <div
          style={{
            position: "fixed",
            bottom: 20,
            left: "50%",
            transform: "translateX(-50%)",
            zIndex: 9999,
            maxWidth: "min(520px, calc(100vw - 32px))",
          }}
        >
          <div
            role="button"
            tabIndex={0}
            onClick={() => setNewSaleToast(false)}
            onKeyDown={(e) => {
              if (e.key === "Enter" || e.key === " ") {
                e.preventDefault();
                setNewSaleToast(false);
              }
            }}
            style={{
              display: "flex",
              flexDirection: "column",
              alignItems: "flex-start",
              gap: 4,
              width: "100%",
              padding: "12px 16px",
              borderRadius: 10,
              border: "1px solid rgba(45, 212, 191, 0.45)",
              background: "linear-gradient(135deg, rgba(15, 118, 110, 0.95), rgba(30, 58, 138, 0.92))",
              color: "#ecfeff",
              cursor: "pointer",
              textAlign: "left",
              fontFamily: "system-ui, sans-serif",
              boxShadow: "0 8px 32px rgba(0,0,0,0.35)",
            }}
          >
            <span style={{ fontWeight: 800, letterSpacing: "0.1em", fontSize: 12 }}>NUEVA ORDEN</span>
            <span style={{ fontSize: 13, opacity: 0.95 }}>
              Mercado Libre
              {sseNewSale?.external_order_id != null && String(sseNewSale.external_order_id).trim() !== ""
                ? ` · ${String(sseNewSale.external_order_id).trim()}`
                : sseNewSale?.order_id != null
                  ? ` · #${sseNewSale.order_id}`
                  : ""}
            </span>
            <span style={{ fontSize: 11, opacity: 0.75 }}>
              Toca para cerrar ·{" "}
              <Link
                href={all_routes.ventasPedidos}
                style={{ color: "#a5f3fc", textDecoration: "underline" }}
                onClick={(e) => {
                  e.stopPropagation();
                  setNewSaleToast(false);
                }}
              >
                Abrir pedidos
              </Link>
            </span>
          </div>
        </div>
      )}
    </InboxLiveContext.Provider>
  );
}
