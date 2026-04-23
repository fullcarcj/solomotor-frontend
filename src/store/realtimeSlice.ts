import { createSlice, type PayloadAction } from "@reduxjs/toolkit";

export interface RealtimeState {
  presenceByChat: Record<string, { userName: string; userId: number } | null>;
  urgentChats: Record<string, boolean>;
  slaDeadlineByChat: Record<string, string | null>;
  /** Incrementa para que la lista de inbox vuelva a cargar (SSE / invalidación). */
  inboxRefetchNonce: number;
  /**
   * Ajuste temporal al contador "Sin atender" (p. ej. -1 tras marcar atendido con éxito).
   * Se resetea a 0 cuando llegan conteos frescos desde el servidor.
   */
  inboxUnreadOptimisticDelta: number;
}

const initialState: RealtimeState = {
  presenceByChat: {},
  urgentChats: {},
  slaDeadlineByChat: {},
  inboxRefetchNonce: 0,
  inboxUnreadOptimisticDelta: 0,
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
  adjustInboxUnreadOptimisticDelta,
  resetInboxUnreadOptimisticDelta,
} = realtimeSlice.actions;

export default realtimeSlice.reducer;
