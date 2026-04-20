import { createSlice, type PayloadAction } from "@reduxjs/toolkit";

export interface RealtimeState {
  presenceByChat: Record<string, { userName: string; userId: number } | null>;
  urgentChats: Record<string, boolean>;
  slaDeadlineByChat: Record<string, string | null>;
  /** Slot PENDING ocupado por el usuario actual (id de chat). */
  myPendingChatId: string | null;
  /**
   * El chat pendiente ya tiene al menos un mensaje saliente del agente.
   * Cuando es false y el agente cambia de chat, el chat liberado queda marcado
   * como "abandonado sin respuesta" (autoReleasedChatIds).
   */
  myPendingHasResponded: boolean;
  /**
   * Chats liberados automáticamente (cambio de chat) sin que el agente respondiera.
   * Se usan para mostrar indicador "no leído" local y alerta al supervisor.
   * Se limpian cuando el chat es tomado de nuevo o llega un mensaje saliente.
   */
  autoReleasedChatIds: string[];
  /** Incrementa para que la lista de inbox vuelva a cargar (SSE / invalidación). */
  inboxRefetchNonce: number;
}

const initialState: RealtimeState = {
  presenceByChat: {},
  urgentChats: {},
  slaDeadlineByChat: {},
  myPendingChatId: null,
  myPendingHasResponded: false,
  autoReleasedChatIds: [],
  inboxRefetchNonce: 0,
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
    setMyPending(state, action: PayloadAction<string | number | null>) {
      state.myPendingChatId =
        action.payload === null || action.payload === undefined
          ? null
          : String(action.payload);
    },
    clearMyPending(state) {
      state.myPendingChatId = null;
      state.myPendingHasResponded = false;
    },
    setMyPendingResponded(state, action: PayloadAction<boolean>) {
      state.myPendingHasResponded = action.payload;
    },
    /**
     * Registra un chat liberado automáticamente sin respuesta del agente.
     * Provoca indicador "no leído" local y alerta de supervisión.
     */
    markAutoReleased(state, action: PayloadAction<string | number>) {
      const id = String(action.payload);
      if (!state.autoReleasedChatIds.includes(id)) {
        state.autoReleasedChatIds.push(id);
      }
      // Marcar como urgente para que aparezca destacado en la lista
      state.urgentChats[id] = true;
    },
    clearAutoReleased(state, action: PayloadAction<string | number>) {
      const id = String(action.payload);
      state.autoReleasedChatIds = state.autoReleasedChatIds.filter((x) => x !== id);
      delete state.urgentChats[id];
    },
    bumpInboxRefetch(state) {
      state.inboxRefetchNonce += 1;
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
  setMyPending,
  clearMyPending,
  setMyPendingResponded,
  markAutoReleased,
  clearAutoReleased,
  bumpInboxRefetch,
} = realtimeSlice.actions;

export default realtimeSlice.reducer;
