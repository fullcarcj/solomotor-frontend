"use client";
import { useMemo, useState } from "react";
import { useBandejaInbox } from "../BandejaInboxContext";
import { useBandejaTriajeUi } from "../BandejaTriajeUiContext";
import { useAiResponderStats } from "@/hooks/useAiResponderStats";
import InboxCountBadges from "./InboxCountBadges";
import ChatFilters from "./ChatFilters";
import ChatListItem from "./ChatListItem";
import AiReviewBadge from "./AiReviewBadge";
import AiReviewDrawer from "./AiReviewDrawer";

interface Props {
  activeChatId?: string | number;
  /** En panel triaje (/bandeja): oculta el header “Spacework” para alinear con bandeja general. */
  variant?: "default" | "embedded";
}

function SkeletonItem() {
  return (
    <div className="d-flex align-items-start gap-2 px-3 py-2 border-bottom border-secondary border-opacity-25 placeholder-glow">
      <div className="rounded-circle bg-secondary placeholder flex-shrink-0" style={{ width: 42, height: 42 }} />
      <div className="flex-grow-1">
        <div className="placeholder col-6 rounded mb-1" style={{ height: 14 }} />
        <div className="placeholder col-9 rounded" style={{ height: 12 }} />
        <div className="placeholder col-4 rounded mt-1" style={{ height: 10 }} />
      </div>
    </div>
  );
}

export default function ChatList({
  activeChatId,
  variant = "default",
}: Props) {
  const { chats, nextCursor, hasMore, total, loading, loadingMore, error, filters, setFilters, loadMore } =
    useBandejaInbox();
  const { stats } = useAiResponderStats();
  const [drawerOpen, setDrawerOpen] = useState(false);
  const triajeUi = useBandejaTriajeUi();

  const pendingCount = stats?.total_pending_count ?? 0;

  const embedded = variant === "embedded";

  const listFiltersForCounts = useMemo(
    () => ({
      src: filters.src,
      stage: filters.stage,
      result: filters.result,
      search: filters.search,
    }),
    [filters.src, filters.stage, filters.result, filters.search]
  );

  const unreadDerivedCount = useMemo(() => {
    if (filters.filter !== "unread") return undefined;
    if (loading) return undefined;
    if (hasMore) return undefined;
    return chats.filter((c) => c.customer_waiting_reply === true).length;
  }, [filters.filter, loading, hasMore, chats]);

  return (
    <div
      className={`d-flex flex-column h-100 min-h-0${embedded ? " chat-list--embedded" : ""}`}
    >
      {!embedded && (
        <div className="bandeja-wa-top-header">
          <div className="bandeja-wa-avatar-sm" aria-hidden>SM</div>
          <div className="flex-grow-1 min-w-0">
            <h2 className="bandeja-wa-title">Spacework</h2>
            {total > 0 && (
              <span className="bandeja-wa-header-meta d-block">
                {total}{hasMore ? "+" : ""} conversaciones
              </span>
            )}
          </div>
          <AiReviewBadge count={pendingCount} onClick={() => setDrawerOpen(true)} />
          <button type="button" className="btn btn-link p-0 border-0" style={{ color: "var(--wa-icon)" }} aria-label="Menú" tabIndex={-1}>
            <i className="ti ti-dots-vertical fs-5" />
          </button>
        </div>
      )}

      {embedded && (
        <div className="bd-compact-header d-flex align-items-center gap-2 flex-wrap min-w-0">
          <div className="bd-compact-search flex-grow-1 min-w-0">
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" aria-hidden="true" className="bd-compact-search-icon">
              <circle cx="11" cy="11" r="7" /><path d="m21 21-4.3-4.3" />
            </svg>
            <input
              type="search"
              className="bd-compact-search-input"
              placeholder="Buscar cliente, orden, SKU…"
              value={filters.search ?? ""}
              onChange={e => setFilters({ search: e.target.value })}
              aria-label="Buscar conversación"
            />
            {total > 0 && (
              <span className="bd-compact-count" title={`${total}${hasMore ? "+" : ""} conversaciones cargadas en la lista`}>
                {total > 999 ? `${Math.floor(total / 1000)}k+` : `${total}${hasMore ? "+" : ""}`}
              </span>
            )}
          </div>
          {embedded && triajeUi && (
            <button
              type="button"
              className={`bd-triaje-filters-trigger${triajeUi.filtersOpen ? " is-open" : ""}`}
              aria-expanded={triajeUi.filtersOpen}
              aria-controls="bd-triaje-filters-panel"
              title={
                triajeUi.activeTriajeFilterCount > 0
                  ? `Filtros de triaje (${triajeUi.activeTriajeFilterCount} activos)`
                  : "Filtros de triaje"
              }
              onClick={() => triajeUi.setFiltersOpen((o) => !o)}
            >
              <svg
                width="13"
                height="13"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="2"
                aria-hidden="true"
              >
                <path d="M22 3H2l8 9.46V19l4 2v-8.54L22 3z" />
              </svg>
              <i className="ti ti-chevron-down" aria-hidden />
              {triajeUi.activeTriajeFilterCount > 0 && (
                <span className="bd-triaje-filters-trigger__dot" aria-hidden />
              )}
            </button>
          )}
          <InboxCountBadges
            activeFilter={filters.filter}
            onFilter={(f) => setFilters({ filter: f })}
            listFilters={listFiltersForCounts}
            layout="inline"
            unreadDerivedCount={unreadDerivedCount}
            listLoading={filters.filter === "unread" ? loading : false}
          />
          <AiReviewBadge count={pendingCount} onClick={() => setDrawerOpen(true)} />
        </div>
      )}

      <AiReviewDrawer open={drawerOpen} onClose={() => setDrawerOpen(false)} />

      {!embedded && (
        <InboxCountBadges
          activeFilter={filters.filter}
          onFilter={(f) => setFilters({ filter: f })}
          listFilters={listFiltersForCounts}
          unreadDerivedCount={unreadDerivedCount}
          listLoading={filters.filter === "unread" ? loading : false}
        />
      )}

      {/* En modo embedded la búsqueda ya está en bd-compact-header; solo mostrar si no es embedded */}
      {!embedded && <ChatFilters filters={filters} onChange={setFilters} />}

      <div className="bandeja-chat-list-scroll bandeja-chat-list">
        {error && (
          <div className="alert bandeja-wa-alert m-2 py-2 small">{error}</div>
        )}

        {loading
          ? Array.from({ length: 8 }).map((_, i) => <SkeletonItem key={i} />)
          : chats.length === 0
          ? (
            <div className="text-center py-5 px-3" style={{ color: "var(--wa-text-secondary)" }}>
              <i className="ti ti-inbox fs-2 d-block mb-2 opacity-50" />
              No hay conversaciones
            </div>
          )
          : chats.map(chat => (
            <ChatListItem
              key={String(chat.id)}
              chat={chat}
              active={activeChatId !== undefined && String(chat.id) === String(activeChatId)}
            />
          ))}

        {nextCursor && !loading && (
          <div className="text-center py-3">
            <button
              type="button"
              className="btn btn-sm"
              style={{
                background: "var(--wa-bg-hover)",
                color: "var(--wa-text-primary)",
                border: "1px solid var(--wa-border)",
              }}
              onClick={loadMore}
              disabled={loadingMore}
            >
              {loadingMore ? <span className="spinner-border spinner-border-sm me-2" /> : <i className="ti ti-chevrons-down me-2" />}
              Cargar más chats
            </button>
          </div>
        )}
      </div>
    </div>
  );
}
