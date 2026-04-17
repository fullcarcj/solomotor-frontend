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
    <div className="d-flex flex-column h-100" style={{ borderRight: "1px solid var(--bs-border-color)" }}>
      <div className="px-3 pt-2 pb-1 border-bottom d-flex justify-content-between align-items-center">
        <span className="fw-semibold">Bandeja</span>
      </div>
      <div className="overflow-auto flex-grow-1 placeholder-glow">
        {Array.from({ length: 8 }).map((_, i) => (
          <div key={i} className="d-flex align-items-start gap-2 px-3 py-2 border-bottom">
            <div className="rounded-circle bg-secondary placeholder flex-shrink-0" style={{ width: 40, height: 40 }} />
            <div className="flex-grow-1">
              <div className="placeholder col-6 rounded mb-1" style={{ height: 14 }} />
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
      <div className="content p-0" style={{ height: "calc(100vh - 60px)", overflow: "hidden" }}>
        <div className="row g-0 h-100">
          {/* Lista de chats */}
          <div className="col-12 col-md-4 h-100">
            <Suspense fallback={<ChatListSkeleton />}>
              <BandejaInner />
            </Suspense>
          </div>

          {/* Panel vacío — desktop */}
          <div
            className="col-md-8 d-none d-md-flex align-items-center justify-content-center h-100"
            style={{ borderLeft: "1px solid var(--bs-border-color)", background: "#f8f9fa" }}
          >
            <div className="text-center text-muted">
              <i className="ti ti-message-2 d-block mb-3" style={{ fontSize: "3rem", opacity: 0.3 }} />
              <p className="mb-0">Seleccioná una conversación para ver los mensajes</p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
