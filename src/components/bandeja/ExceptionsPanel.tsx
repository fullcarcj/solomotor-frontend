"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { List, Modal, Input } from "antd";
import type { Exception } from "@/types/exceptions";
import { EXCEPTION_CODE_LABELS, EXCEPTION_CODE_COLORS } from "@/types/exceptions";
import { useExceptions, useResolveException } from "@/hooks/useExceptions";
import { inboxStream } from "@/lib/realtime/inboxStream";
import Swal from "sweetalert2";

function timeAgo(iso: string): string {
  const diff = Date.now() - new Date(iso).getTime();
  const mins = Math.floor(diff / 60_000);
  if (mins < 60) return `hace ${mins}m`;
  const hrs = Math.floor(mins / 60);
  if (hrs < 24) return `hace ${hrs}h`;
  return `hace ${Math.floor(hrs / 24)}d`;
}

interface Props {
  /** Si se pasa, filtra solo las excepciones de ese chat. */
  chatId?: number | string;
  className?: string;
}

export default function ExceptionsPanel({ chatId, className }: Props) {
  const router = useRouter();
  const { data, isLoading, refetch } = useExceptions({ status: "OPEN", chatId });
  const { loading: resolving, mutate: resolve } = useResolveException();

  // Suscripción SSE: refetch ante cambios de estado de chat que pueden alterar excepciones.
  useEffect(() => {
    const unsub = inboxStream.subscribe((event, payload) => {
      if (!["chat_taken", "chat_released", "chat_attended", "chat_reopened"].includes(event)) return;
      // Si hay filtro por chatId, solo refetch si el evento afecta a ese chat.
      if (chatId != null) {
        const d = payload as Record<string, unknown> | null;
        const eventChatId = d?.chat_id ?? d?.chatId;
        if (eventChatId !== undefined && String(eventChatId) !== String(chatId)) return;
      }
      refetch();
    });
    return unsub;
  }, [chatId, refetch]);

  const [selected, setSelected] = useState<Exception | null>(null);
  const [notes, setNotes] = useState("");

  const handleResolve = async () => {
    if (!selected) return;
    const ok = await resolve({ id: selected.id, resolution_notes: notes });
    if (ok) {
      setSelected(null);
      setNotes("");
      refetch();
      void Swal.fire({
        icon: "success",
        title: "Excepción resuelta",
        text: "La excepción fue marcada como resuelta.",
        timer: 1800,
        showConfirmButton: false,
        background: "var(--mu-panel, #1a1f2e)",
        color: "var(--mu-ink, #e2e8f0)",
      });
    }
  };

  if (isLoading) {
    return (
      <div className={`exc-panel ${className ?? ""}`}>
        {Array.from({ length: 3 }).map((_, i) => (
          <div key={i} className="exc-panel-skel" />
        ))}
      </div>
    );
  }

  if (data.length === 0) {
    return (
      <div className={`exc-panel exc-panel--empty ${className ?? ""}`}>
        <i className="ti ti-circle-check" style={{ fontSize: 28, color: "#22c55e", marginBottom: 8 }} />
        <p>No hay excepciones abiertas</p>
      </div>
    );
  }

  return (
    <>
      <div className={`exc-panel ${className ?? ""}`}>
        <List
          dataSource={data}
          renderItem={(exc) => {
            const label = EXCEPTION_CODE_LABELS[exc.code] ?? exc.code;
            const color = EXCEPTION_CODE_COLORS[exc.code] ?? "#ef4444";
            return (
              <List.Item
                className="exc-panel-row"
                onClick={() =>
                  router.push(`/bandeja?chat_id=${exc.chat_id}`)
                }
                actions={[
                  <button
                    key="resolve"
                    type="button"
                    className="exc-resolve-btn"
                    onClick={(e) => {
                      e.stopPropagation();
                      setSelected(exc);
                      setNotes("");
                    }}
                  >
                    Resolver
                  </button>,
                ]}
              >
                <div className="exc-panel-row-content">
                  <span
                    className="exc-panel-code"
                    style={{ background: `${color}22`, border: `1px solid ${color}55`, color }}
                  >
                    <i className="ti ti-alert-triangle" style={{ fontSize: 11 }} />
                    {label}
                  </span>
                  <span className="exc-panel-chat">Chat #{exc.chat_id}</span>
                  <span className="exc-panel-time">{timeAgo(exc.created_at)}</span>
                </div>
              </List.Item>
            );
          }}
        />
      </div>

      <Modal
        open={!!selected}
        title={
          <span>
            <i className="ti ti-clipboard-check" style={{ marginRight: 8, color: "#22c55e" }} />
            Resolver excepción #{selected?.id}
          </span>
        }
        onCancel={() => setSelected(null)}
        onOk={handleResolve}
        okText="Confirmar resolución"
        cancelText="Cancelar"
        confirmLoading={resolving}
        okButtonProps={{ style: { background: "#22c55e", borderColor: "#22c55e" } }}
      >
        <div style={{ marginBottom: 8, fontSize: 13 }}>
          <strong>Código:</strong>{" "}
          <code>{selected?.code}</code>
        </div>
        <div style={{ marginBottom: 12, fontSize: 12, color: "#9aa4b8" }}>
          {selected?.reason}
        </div>
        <Input.TextArea
          rows={4}
          placeholder="Describe cómo se resolvió (requerido)…"
          value={notes}
          onChange={(e) => setNotes(e.target.value)}
          maxLength={500}
          showCount
        />
      </Modal>
    </>
  );
}
