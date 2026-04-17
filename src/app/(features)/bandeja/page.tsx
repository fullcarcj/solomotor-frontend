"use client";
import { Suspense } from "react";
import { useSearchParams } from "next/navigation";
import ChatList from "./components/ChatList";

function BandejaInner() {
  const searchParams = useSearchParams();
  const initialSrc    = searchParams.get("src")    ?? "";
  const initialFilter = searchParams.get("filter") ?? "";

  return (
    <ChatList
      initialSrc={initialSrc}
      initialFilter={initialFilter}
    />
  );
}

function ChatListSkeleton() {
  return (
    <div className="d-flex flex-column h-100">
      <div className="bandeja-wa-top-header">
        <div className="bandeja-wa-avatar-sm placeholder-glow bg-secondary" style={{ opacity: 0.4 }} />
        <span className="placeholder col-4 rounded bandeja-wa-title" style={{ height: 18, opacity: 0.4 }} />
      </div>
      <div className="bandeja-chat-list-scroll placeholder-glow px-2">
        {Array.from({ length: 8 }).map((_, i) => (
          <div key={i} className="d-flex align-items-start gap-2 py-3 border-bottom border-secondary border-opacity-25">
            <div className="rounded-circle bg-secondary placeholder flex-shrink-0" style={{ width: 42, height: 42 }} />
            <div className="flex-grow-1">
              <div className="placeholder col-6 rounded mb-2" style={{ height: 14 }} />
              <div className="placeholder col-9 rounded" style={{ height: 12 }} />
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

export default function BandejaPage() {
  return (
    <div className="page-wrapper">
      <div className="content p-0">
        <div className="bandeja-shell">
          <div className="bandeja-panel-left">
            <Suspense fallback={<ChatListSkeleton />}>
              <BandejaInner />
            </Suspense>
          </div>

          <div className="bandeja-panel-right--empty d-none d-md-flex flex-column text-center px-4">
            <i className="ti ti-message-2 d-block mb-3" style={{ fontSize: "3rem" }} />
            <p className="mb-0">Seleccioná una conversación para ver los mensajes</p>
          </div>
        </div>
      </div>
    </div>
  );
}
