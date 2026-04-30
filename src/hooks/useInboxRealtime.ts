"use client";

import { useEffect } from "react";
import { inboxStream } from "@/lib/realtime/inboxStream";
import { playInboxInboundSound, playNewSaleSound, playUrgentSound } from "@/lib/realtime/sounds";
import { traceMlQuestionUi } from "@/lib/realtime/mlQuestionTrace";
import { useAppDispatch, useAppSelector } from "@/store/hooks";
import {
  applySseInboxQuickNotify,
  applySseNewSaleQuickNotify,
  bumpInboxRefetch,
  bumpSalesOrdersSseNonce,
  clearPresence,
  clearSlaDeadline,
  clearUrgent,
  markUrgent,
  setPresence,
  setSlaDeadline,
} from "@/store/realtimeSlice";

function sameUser(a: unknown, b: number | null): boolean {
  if (b === null) return false;
  const n = typeof a === "number" ? a : Number(a);
  return Number.isFinite(n) && n === b;
}

/** Extrae un chatId tipado desde un campo del payload SSE. */
function toChatId(v: unknown): string | number | null {
  if (v === null || v === undefined) return null;
  if (typeof v === "string" || typeof v === "number") return v;
  return null;
}

/**
 * Payload del evento `new_message` (contrato webhook-receiver).
 * `chat_reopened` sigue el mismo shape; todos los campos son opcionales
 * para tolerar versiones anteriores del backend.
 */
interface NewMessagePayload {
  chat_id?: string | number | null;
  source_type?: string | null;
  channel_id?: number | null;
  preview?: string | null;
}

function toNewMessagePayload(d: Record<string, unknown>): NewMessagePayload {
  return {
    chat_id:
      typeof d.chat_id === "string" || typeof d.chat_id === "number"
        ? d.chat_id
        : null,
    source_type: typeof d.source_type === "string" ? d.source_type : null,
    channel_id:
      typeof d.channel_id === "number"
        ? d.channel_id
        : d.channel_id != null
          ? Number(d.channel_id) || null
          : null,
    preview: typeof d.preview === "string" ? d.preview : null,
  };
}

export function useInboxRealtime() {
  const dispatch = useAppDispatch();
  const myUserId = useAppSelector((s) => s.auth.userId);
  const authToken = useAppSelector((s) => s.auth.token);
  const authRestoring = useAppSelector((s) => s.auth.restoring);

  useEffect(() => {
    if (authToken === null || authRestoring) {
      inboxStream.disconnect();
      return;
    }
    inboxStream.connect();
    const off = inboxStream.subscribe((event, data) => {
      const d = data && typeof data === "object" ? (data as Record<string, unknown>) : {};

      switch (event) {
        case "chat_taken": {
          const chatId = toChatId(d.chat_id);
          if (chatId === null) break;
          const uid = d.user_id;
          dispatch(clearUrgent(chatId));
          if (!sameUser(uid, myUserId)) {
            dispatch(
              setPresence({
                chatId,
                userName: typeof d.user_name === "string" ? d.user_name : "Usuario",
                userId: typeof uid === "number" ? uid : Number(uid),
              })
            );
          }
          break;
        }
        case "clear_notification":
          dispatch(bumpInboxRefetch());
          break;
        case "presence_update": {
          const chatId = toChatId(d.chat_id);
          if (chatId === null) break;
          const viewing = Boolean(d.viewing);
          if (!viewing) {
            dispatch(clearPresence(chatId));
            break;
          }
          const viewerId = d.viewing_user_id;
          if (sameUser(viewerId, myUserId)) break;
          dispatch(
            setPresence({
              chatId,
              userName:
                typeof d.viewing_user_name === "string"
                  ? d.viewing_user_name
                  : "Usuario",
              userId: typeof viewerId === "number" ? viewerId : Number(viewerId),
            })
          );
          break;
        }
        case "sla_started": {
          const chatId = toChatId(d.chat_id);
          if (chatId === null) break;
          const deadline =
            typeof d.deadline_at === "string"
              ? d.deadline_at
              : typeof d.deadline === "string"
                ? d.deadline
                : null;
          dispatch(setSlaDeadline({ chatId, deadline }));
          break;
        }
        case "chat_attended":
        case "chat_released": {
          const chatId = toChatId(d.chat_id);
          if (chatId !== null) {
            dispatch(clearSlaDeadline(chatId));
            dispatch(clearPresence(chatId));
            dispatch(clearUrgent(chatId));
          }
          break;
        }
        case "urgent_alert": {
          const chatId = toChatId(d.chat_id);
          if (chatId !== null) {
            dispatch(markUrgent(chatId));
            playUrgentSound();
          }
          break;
        }
        case "new_message": {
          const msg = toNewMessagePayload(d);
          if (msg.chat_id !== null && msg.chat_id !== undefined) {
            dispatch(
              applySseInboxQuickNotify({
                chatId: msg.chat_id,
                preview: msg.preview ?? null,
                sourceType: msg.source_type ?? null,
              })
            );
            if ((msg.source_type ?? "").toLowerCase() === "ml_question") {
              traceMlQuestionUi("frontend_sse_new_message_received", {
                chat_id: msg.chat_id != null ? String(msg.chat_id) : null,
                source_type: msg.source_type ?? null,
                preview: msg.preview ?? null,
              });
            }
            playInboxInboundSound(msg.source_type);
          }
          dispatch(bumpInboxRefetch());
          break;
        }
        case "chat_reopened": {
          const msg = toNewMessagePayload(d);
          if (msg.chat_id !== null && msg.chat_id !== undefined) {
            dispatch(
              applySseInboxQuickNotify({
                chatId: msg.chat_id,
                preview: msg.preview ?? null,
                sourceType: msg.source_type ?? null,
              })
            );
            if ((msg.source_type ?? "").toLowerCase() === "ml_question") {
              traceMlQuestionUi("frontend_sse_chat_reopened_received", {
                chat_id: msg.chat_id != null ? String(msg.chat_id) : null,
                source_type: msg.source_type ?? null,
                preview: msg.preview ?? null,
              });
            }
            playInboxInboundSound(msg.source_type);
          }
          dispatch(bumpInboxRefetch());
          break;
        }
        case "chat_discarded": {
          const chatId = toChatId(d.chat_id);
          if (chatId !== null) {
            dispatch(clearUrgent(chatId));
            dispatch(clearPresence(chatId));
            dispatch(clearSlaDeadline(chatId));
          }
          dispatch(bumpInboxRefetch());
          break;
        }
        case "gap_detected": {
          // Se perdieron eventos durante una reconexión SSE.
          // Refrescar la bandeja para recuperar el estado real.
          dispatch(bumpInboxRefetch());
          break;
        }
        case "new_sale": {
          const oidRaw = d.order_id;
          const orderId =
            typeof oidRaw === "number"
              ? oidRaw
              : oidRaw != null
                ? Number(oidRaw)
                : null;
          const extRaw = d.external_order_id;
          const externalOrderId =
            typeof extRaw === "string" && String(extRaw).trim() !== ""
              ? String(extRaw).trim()
              : null;
          dispatch(
            applySseNewSaleQuickNotify({
              external_order_id: externalOrderId,
              order_id: Number.isFinite(orderId) ? orderId : null,
            })
          );
          playNewSaleSound();
          dispatch(bumpInboxRefetch());
          dispatch(bumpSalesOrdersSseNonce());
          break;
        }
        default:
          break;
      }
    });
    return () => {
      off();
      inboxStream.disconnect();
    };
  }, [dispatch, myUserId, authToken, authRestoring]);
}
