import { createSlice, type PayloadAction } from "@reduxjs/toolkit";

export interface SseInboxQuickNotify {
  chatId: string;
  preview: string | null;
  sourceType: string | null;
  /** Contador monótono para que useInbox reaccione a cada evento aunque sea el mismo chat. */
  tick: number;
}

/** SSE `new_sale` — misma idea que inbox quick notify (título / OS / toast). */
export interface SseNewSaleQuickNotify {
  tick: number;
  external_order_id: string | null;
  order_id: number | null;
}

export interface RealtimeState {
  presenceByChat: Record<string, { userName: string; userId: number } | null>;
  urgentChats: Record<string, boolean>;
  slaDeadlineByChat: Record<string, string | null>;
  /** Incrementa para que la lista de inbox vuelva a cargar (SSE / invalidación). */
  inboxRefetchNonce: number;
  /**
   * Parche optimista al recibir `new_message` / `chat_reopened` por SSE (preview + tope de lista)
   * antes del GET /api/bandeja.
   */
  sseInboxQuickNotify: SseInboxQuickNotify | null;
  sseNewSaleQuickNotify: SseNewSaleQuickNotify | null;
  /**
   * Ajuste temporal al contador "Sin atender" (p. ej. -1 tras marcar atendido con éxito).
   * Se resetea a 0 cuando llegan conteos frescos desde el servidor.
   */
  inboxUnreadOptimisticDelta: number;
  /**
   * Órdenes ML nuevas (SSE `new_sale`) pendientes de “ver” en Pedidos; suma al badge de campana.
   */
  pendingMlSalesBellCount: number;
  /** Solo SSE `new_sale`: pantalla Pedidos puede invalidar listado sin mezclar con mensajes inbox. */
  salesOrdersSseNonce: number;
}

const initialState: RealtimeState = {
  presenceByChat: {},
  urgentChats: {},
  slaDeadlineByChat: {},
  inboxRefetchNonce: 0,
  sseInboxQuickNotify: null,
  sseNewSaleQuickNotify: null,
  inboxUnreadOptimisticDelta: 0,
  pendingMlSalesBellCount: 0,
  salesOrdersSseNonce: 0,
};

const realtimeSlice = createSlice({
  name: "realtime",
  initialState,
  reducers: {
    setPresence(
      state,
      action: PayloadAction<{ chatId: string | number; userName: string; userId: number }>
    ) {
      const id = String(action.payload.chatId);
      state.presenceByChat[id] = {
        userName: action.payload.userName,
        userId: action.payload.userId,
      };
    },
    clearPresence(state, action: PayloadAction<string | number>) {
      const id = String(action.payload);
      state.presenceByChat[id] = null;
    },
    markUrgent(state, action: PayloadAction<string | number>) {
      state.urgentChats[String(action.payload)] = true;
    },
    clearUrgent(state, action: PayloadAction<string | number>) {
      delete state.urgentChats[String(action.payload)];
    },
    setSlaDeadline(
      state,
      action: PayloadAction<{ chatId: string | number; deadline: string | null }>
    ) {
      const id = String(action.payload.chatId);
      state.slaDeadlineByChat[id] = action.payload.deadline;
    },
    clearSlaDeadline(state, action: PayloadAction<string | number>) {
      const id = String(action.payload);
      delete state.slaDeadlineByChat[id];
    },
    bumpInboxRefetch(state) {
      state.inboxRefetchNonce += 1;
    },
    applySseInboxQuickNotify(
      state,
      action: PayloadAction<{ chatId: string | number; preview: string | null; sourceType?: string | null }>
    ) {
      const prevTick = state.sseInboxQuickNotify?.tick ?? 0;
      state.sseInboxQuickNotify = {
        chatId: String(action.payload.chatId),
        preview: action.payload.preview,
        sourceType: action.payload.sourceType != null ? String(action.payload.sourceType) : null,
        tick: prevTick + 1,
      };
    },
    applySseNewSaleQuickNotify(
      state,
      action: PayloadAction<{ external_order_id: string | null; order_id: number | null }>
    ) {
      const prevTick = state.sseNewSaleQuickNotify?.tick ?? 0;
      state.sseNewSaleQuickNotify = {
        tick: prevTick + 1,
        external_order_id:
          action.payload.external_order_id != null &&
          String(action.payload.external_order_id).trim() !== ""
            ? String(action.payload.external_order_id).trim()
            : null,
        order_id:
          action.payload.order_id != null && Number.isFinite(Number(action.payload.order_id))
            ? Number(action.payload.order_id)
            : null,
      };
      state.pendingMlSalesBellCount += 1;
      if (state.pendingMlSalesBellCount > 99) state.pendingMlSalesBellCount = 99;
    },
    clearPendingMlSalesBellCount(state) {
      state.pendingMlSalesBellCount = 0;
    },
    bumpSalesOrdersSseNonce(state) {
      state.salesOrdersSseNonce += 1;
    },
    adjustInboxUnreadOptimisticDelta(state, action: PayloadAction<number>) {
      const n = Number(action.payload);
      if (!Number.isFinite(n) || n === 0) return;
      state.inboxUnreadOptimisticDelta += n;
      if (state.inboxUnreadOptimisticDelta > 0) state.inboxUnreadOptimisticDelta = 0;
      if (state.inboxUnreadOptimisticDelta < -500) state.inboxUnreadOptimisticDelta = -500;
    },
    resetInboxUnreadOptimisticDelta(state) {
      state.inboxUnreadOptimisticDelta = 0;
    },
  },
});

export const {
  setPresence,
  clearPresence,
  markUrgent,
  clearUrgent,
  setSlaDeadline,
  clearSlaDeadline,
  bumpInboxRefetch,
  applySseInboxQuickNotify,
  applySseNewSaleQuickNotify,
  clearPendingMlSalesBellCount,
  bumpSalesOrdersSseNonce,
  adjustInboxUnreadOptimisticDelta,
  resetInboxUnreadOptimisticDelta,
} = realtimeSlice.actions;

export default realtimeSlice.reducer;
