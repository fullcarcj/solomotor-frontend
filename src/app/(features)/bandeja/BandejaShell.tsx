"use client";
import { useCallback, useRef, useState } from "react";
import { usePathname } from "next/navigation";
import type { ReactNode } from "react";
import { useInboxRealtime } from "@/hooks/useInboxRealtime";
import BandejaTriajeMock from "./components/BandejaTriajeMock";
import ChatList from "./components/ChatList";

interface Props {
  children: ReactNode;
}

/**
 * Shell compartido de la bandeja — vive en el layout para sobrevivir a la
 * navegación entre /bandeja y /bandeja/[chatId].
 *
 * Esto evita que ChatList se desmonte y vuelva a montar (y muestre esqueletos)
 * cada vez que el usuario abre o cambia de chat.
 *
 * - useInboxRealtime está aquí (una sola instancia).
 * - ChatList recibe activeChatId desde usePathname() → solo resalta el item
 *   activo, no recarga la lista.
 * - El handle de resize también vive aquí para que el ancho no se resetee al
 *   navegar entre chats.
 */
export default function BandejaShell({ children }: Props) {
  useInboxRealtime();

  const pathname = usePathname();
  const chatIdMatch = pathname?.match(/^\/bandeja\/(\d+)/);
  const activeChatId = chatIdMatch ? chatIdMatch[1] : undefined;
  const isDetail = activeChatId != null;

  /* Ancho resizable de la columna INBOX (antes en ChatDetailPage) */
  const [listWidth, setListWidth] = useState(432);
  const isResizing = useRef(false);

  const startResize = useCallback(
    (e: React.MouseEvent) => {
      isResizing.current = true;
      const startX = e.clientX;
      const startWidth = listWidth;

      const onMove = (ev: MouseEvent) => {
        if (!isResizing.current) return;
        setListWidth(Math.min(Math.max(startWidth + (ev.clientX - startX), 288), 624));
      };
      const onUp = () => {
        isResizing.current = false;
        window.removeEventListener("mousemove", onMove);
        window.removeEventListener("mouseup", onUp);
      };
      window.addEventListener("mousemove", onMove);
      window.addEventListener("mouseup", onUp);
    },
    [listWidth]
  );

  return (
    <div className="page-wrapper" style={{ overflow: "hidden" }}>
      <div className="content p-0">
        <div className={`bandeja-shell${isDetail ? " bandeja-shell--detail" : ""}`}>

          {/* ── Columna izquierda (INBOX) — persiste en toda la navegación ── */}
          <div
            className={
              isDetail
                ? "bandeja-detail-list d-none d-md-flex"
                : "bandeja-panel-left"
            }
            style={isDetail ? { width: listWidth } : undefined}
          >
            <BandejaTriajeMock>
              <ChatList activeChatId={activeChatId} variant="embedded" />
            </BandejaTriajeMock>

            {isDetail && (
              <div
                className="bandeja-resize-handle"
                onMouseDown={startResize}
                role="separator"
                aria-orientation="vertical"
                aria-label="Redimensionar panel lista"
              />
            )}
          </div>

          {/* ── Contenido de la ruta actual (convo + ficha, o estado vacío) ── */}
          {children}

        </div>
      </div>
    </div>
  );
}
