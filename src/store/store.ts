import { configureStore } from "@reduxjs/toolkit";
import authReducer from "./authSlice";
import menuReducer from "./menuSlice";
import realtimeReducer from "./realtimeSlice";

export const store = configureStore({
  reducer: {
    auth: authReducer,
    menu: menuReducer,
    realtime: realtimeReducer,
  },
});

export type RootState = ReturnType<typeof store.getState>;
export type AppDispatch = typeof store.dispatch;
