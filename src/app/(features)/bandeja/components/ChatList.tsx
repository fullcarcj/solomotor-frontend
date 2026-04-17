"use client";
import { useInbox } from "@/hooks/useInbox";
import InboxCountBadges from "./InboxCountBadges";
import ChatFilters from "./ChatFilters";
import ChatListItem from "./ChatListItem";

interface Props {
  activeChatId?: string | number;
}

function SkeletonItem() {
  return (
    <div className="d-flex align-items-start gap-2 px-3 py-2 border-bottom placeholder-glow">
      <div className="rounded-circle bg-secondary placeholder flex-shrink-0" style={{ width: 40, height: 40 }} />
      <div className="flex-grow-1">
        <div className="placeholder col-6 rounded mb-1" style={{ height: 14 }} />
        <div className="placeholder col-9 rounded" style={{ height: 12 }} />
        <div className="placeholder col-4 rounded mt-1" style={{ height: 10 }} />
      </div>
    </div>
  );
}

export default function ChatList({ activeChatId }: Props) {
  const { chats, nextCursor, total, loading, loadingMore, error, filters, setFilters, loadMore } = useInbox();

  return (
    <div className="d-flex flex-column h-100" style={{ borderRight: "1px solid var(--bs-border-color)" }}>
      {/* Sticky header */}
      <div className="bg-white" style={{ position: "sticky", top: 0, zIndex: 10 }}>
        <div className="px-3 pt-2 pb-1 border-bottom d-flex justify-content-between align-items-center">
          <span className="fw-semibold">Bandeja</span>
          {total > 0 && <small className="text-muted">{total} conversaciones</small>}
        </div>
        <InboxCountBadges activeFilter={filters.filter} onFilter={(f) => setFilters({ filter: f })} />
        <ChatFilters filters={filters} onChange={setFilters} />
      </div>

      {/* List */}
      <div className="overflow-auto flex-grow-1">
        {error && (
          <div className="alert alert-danger m-2 py-2 small">{error}</div>
        )}

        {loading
          ? Array.from({ length: 8 }).map((_, i) => <SkeletonItem key={i} />)
          : chats.length === 0
          ? (
            <div className="text-center text-muted py-5">
              <i className="ti ti-inbox fs-2 d-block mb-2" />
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
              className="btn btn-sm btn-outline-secondary"
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
