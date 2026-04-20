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
        <div className="bandeja-wa-avatar-sm" style={{ opacity: 0.4 }} />
        <span style={{ width: 80, height: 18, background: "var(--mu-panel-2)", borderRadius: 4, opacity: 0.4, display: "inline-block" }} />
      </div>
      <div className="bandeja-chat-list-scroll px-2" style={{ paddingTop: 8 }}>
        {Array.from({ length: 8 }).map((_, i) => (
          <div key={i} className="mu-conv" style={{ opacity: 0.4 }}>
            <div className="mu-conv-avatar">
              <div className="mu-avatar mu-skeleton" style={{ width: 40, height: 40 }} />
            </div>
            <div className="mu-conv-meta" style={{ display: "flex", flexDirection: "column", gap: 6 }}>
              <div className="mu-skeleton" style={{ height: 12, width: "55%", borderRadius: 4 }} />
              <div className="mu-skeleton" style={{ height: 10, width: "80%", borderRadius: 4 }} />
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

/**
 * /bandeja — vista de lista unificada (Sprint 6A)
 *
 * Layout: NAV (global sidebar del (features) layout) + INBOX + panel vacío.
 * En desktop ≥ 768px la columna derecha muestra el estado vacío.
 * Al seleccionar una conversación navega a /bandeja/[chatId] donde aparecen
 * las 4 columnas completas: NAV + INBOX + CONVO + FICHA 360°.
 */
export default function BandejaPage() {
  return (
    <div className="page-wrapper">
      <div className="content p-0">
        <div className="bandeja-shell">

          {/* Columna INBOX */}
          <div className="bandeja-panel-left">
            <Suspense fallback={<ChatListSkeleton />}>
              <BandejaInner />
            </Suspense>
          </div>

          {/* Estado vacío — columna CONVO+FICHA en desktop */}
          <div
            className="bandeja-panel-right--empty d-none d-md-flex flex-column text-center px-4"
            aria-label="Sin conversación seleccionada"
          >
            <i className="ti ti-message-2" style={{ fontSize: "2.5rem" }} />
            <p className="mb-0" style={{ fontSize: 13 }}>Seleccioná una conversación para ver los mensajes</p>
            <p style={{ fontSize: 11, color: "var(--mu-ink-mute)", marginTop: 4 }}>
              o usa los filtros de la izquierda
            </p>
          </div>

        </div>
      </div>
    </div>
  );
}
