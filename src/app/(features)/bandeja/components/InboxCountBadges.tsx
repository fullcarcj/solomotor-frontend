"use client";
import { useCallback, useEffect, useRef, useState } from "react";
import type { InboxCounts, InboxFilters } from "@/types/inbox";
import { useAppDispatch, useAppSelector } from "@/store/hooks";
import { resetInboxUnreadOptimisticDelta } from "@/store/realtimeSlice";

interface Props {
  activeFilter: string;
  onFilter: (f: string) => void;
  /**
   * Mismos criterios que GET /api/bandeja (triaje: src, stage, result, search).
   * Sin esto, el badge "Sin atender" cuenta global y la lista queda vacía con filtros activos.
   */
  listFilters?: Pick<InboxFilters, "src" | "stage" | "result" | "search">;
  /** "inline" = misma línea que buscador + bot IA (vista detalle / embedded). */
  layout?: "default" | "inline";
  /**
   * Si viene definido, sustituye el conteo de API para "Sin atender" (lista ya cargada sin `hasMore`).
   */
  unreadDerivedCount?: number;
  /** Evita ocultar la pestaña mientras la lista aún carga (evita parpadeo). */
  listLoading?: boolean;
  /** Alinear totales con `?pipeline_default=1` (misma lista operativa). */
  pipelineDefault?: boolean;
}

const BADGES = [{ key: "unread", label: "Sin atender", icon: "ti-bell" }] as const;

type BadgeKey = (typeof BADGES)[number]["key"];

export default function InboxCountBadges({
  activeFilter,
  onFilter,
  listFilters,
  layout = "default",
  unreadDerivedCount,
  listLoading = false,
  pipelineDefault = true,
}: Props) {
  const dispatch = useAppDispatch();
  const authToken = useAppSelector((s) => s.auth.token);
  const authRestoring = useAppSelector((s) => s.auth.restoring);
  const [counts, setCounts] = useState<InboxCounts | null>(null);
  const intervalRef = useRef<ReturnType<typeof setInterval> | null>(null);
  /** Evita que una respuesta vieja de /counts pise una más nueva (p. ej. 1→0 y luego aparece 8). */
  const countsFetchGenRef = useRef(0);
  const inboxRefetchNonce = useAppSelector((s) => s.realtime.inboxRefetchNonce);
  const inboxUnreadOptimisticDelta = useAppSelector(
    (s) => s.realtime.inboxUnreadOptimisticDelta ?? 0
  );

  const fetchCounts = useCallback(async () => {
    if (authToken === null || authRestoring) return;
    const gen = ++countsFetchGenRef.current;
    try {
      const p = new URLSearchParams();
      if (listFilters?.src) p.set("src", listFilters.src);
      if (listFilters?.stage) p.set("stage", listFilters.stage);
      if (listFilters?.result) p.set("result", listFilters.result);
      if (listFilters?.search) p.set("search", listFilters.search);
      if (pipelineDefault) p.set("pipeline_default", "1");
      p.set("facets", "0");
      const qs = p.toString();
      const headers: Record<string, string> = {};
      if (authToken !== "cookie") {
        headers.Authorization = `Bearer ${authToken}`;
      }
      const r = await fetch(`/api/bandeja/counts${qs ? `?${qs}` : ""}`, {
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
  }, [listFilters, dispatch, pipelineDefault, authToken, authRestoring]);

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

  function getCount(key: BadgeKey): number | null {
    if (!counts) return null;
    if (key === "unread") {
      let base = Number(counts.unread) || 0;
      if (unreadDerivedCount !== undefined) {
        base = unreadDerivedCount;
      }
      return Math.max(0, base + inboxUnreadOptimisticDelta);
    }
    return null;
  }

  const inline = layout === "inline";

  return (
    <div
      className={`bandeja-inbox-toolbar d-flex align-items-center flex-wrap flex-shrink-0 ${
        inline ? "bandeja-inbox-toolbar--inline" : ""
      }`}
    >
      {activeFilter !== "" && (
        <button
          type="button"
          className="bandeja-inbox-clear"
          title="Quitar filtro «Sin atender» y ver todas las conversaciones del contexto"
          onClick={() => onFilter("")}
        >
          Ver todas
        </button>
      )}
      <div className="bandeja-inbox-tabs" role="tablist">
        {BADGES.map((b) => {
          const count = getCount(b.key);
          if (
            b.key === "unread" &&
            !listLoading &&
            count !== null &&
            count <= 0
          ) {
            return null;
          }
          const isActive = activeFilter === b.key;
          const ariaLabel = count !== null ? `${b.label}, ${count}` : b.label;
          return (
            <button
              key={b.key}
              type="button"
              role="tab"
              aria-selected={isActive}
              title={b.label}
              aria-label={ariaLabel}
              className={`btn btn-sm bandeja-inbox-tab d-inline-flex align-items-center justify-content-center ${
                isActive ? "active" : ""
              }`}
              onClick={() => onFilter(b.key)}
            >
              <i className={`ti ${b.icon}`} aria-hidden />
              {count !== null && (
                <span className="bandeja-inbox-tab__n">{count > 999 ? "999+" : count}</span>
              )}
            </button>
          );
        })}
      </div>
    </div>
  );
}
