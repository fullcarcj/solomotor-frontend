"use client";
import { useState } from "react";
import { useInbox } from "@/hooks/useInbox";
import { useAiResponderStats } from "@/hooks/useAiResponderStats";
import InboxCountBadges from "./InboxCountBadges";
import ChatFilters from "./ChatFilters";
import ChatListItem from "./ChatListItem";
import AiReviewBadge from "./AiReviewBadge";
import AiReviewDrawer from "./AiReviewDrawer";

interface Props {
  activeChatId?: string | number;
  initialSrc?:   string;
  initialFilter?: string;
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

export default function ChatList({ activeChatId, initialSrc = "", initialFilter = "" }: Props) {
  const { chats, nextCursor, total, loading, loadingMore, error, filters, setFilters, loadMore } = useInbox(
    initialSrc || initialFilter ? { src: initialSrc, filter: initialFilter } : undefined
  );
  const { stats } = useAiResponderStats();
  const [drawerOpen, setDrawerOpen] = useState(false);

  const pendingCount = stats?.total_pending_count ?? 0;

  return (
    <div className="d-flex flex-column h-100 min-h-0">
      <div className="bandeja-wa-top-header">
        <div className="bandeja-wa-avatar-sm" aria-hidden>SM</div>
        <div className="flex-grow-1 min-w-0">
          <h2 className="bandeja-wa-title">Spacework</h2>
          {total > 0 && (
            <span className="bandeja-wa-header-meta d-block">{total} conversaciones</span>
          )}
        </div>
        <AiReviewBadge count={pendingCount} onClick={() => setDrawerOpen(true)} />
        <button type="button" className="btn btn-link p-0 border-0" style={{ color: "var(--wa-icon)" }} aria-label="Menú" tabIndex={-1}>
          <i className="ti ti-dots-vertical fs-5" />
        </button>
      </div>

      <AiReviewDrawer open={drawerOpen} onClose={() => setDrawerOpen(false)} />

      <InboxCountBadges activeFilter={filters.filter} onFilter={(f) => setFilters({ filter: f })} />

      <ChatFilters filters={filters} onChange={setFilters} />

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
