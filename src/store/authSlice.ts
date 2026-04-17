import {
  createSlice,
  createAsyncThunk,
  type PayloadAction,
} from "@reduxjs/toolkit";

export interface AuthState {
  /** JWT real o flag `'cookie'` cuando la sesión va por cookie HttpOnly. */
  token: string | null;
  role: string | null;
  canal: string | null;
  /** true mientras se intenta restaurar sesión con GET /api/auth/me */
  restoring: boolean;
}

const initialState: AuthState = {
  token: null,
  role: null,
  canal: null,
  restoring: false,
};

export const restoreSession = createAsyncThunk(
  "auth/restoreSession",
  async (_, { rejectWithValue }) => {
    try {
      const res = await fetch("/api/auth/me", {
        credentials: "include",
        cache: "no-store",
      });
      if (!res.ok) return rejectWithValue("no_session");
      const data = (await res.json()) as {
        user?: { role?: string | null; canal?: string | null };
        role?: string | null;
        canal?: string | null;
      };
      return {
        token: "cookie" as const,
        role: data.user?.role ?? data.role ?? null,
        canal: data.user?.canal ?? data.canal ?? null,
      };
    } catch {
      return rejectWithValue("network_error");
    }
  }
);

const authSlice = createSlice({
  name: "auth",
  initialState,
  reducers: {
    setCredentials(
      state,
      action: PayloadAction<{ token: string | null; role?: string | null; canal?: string | null }>
    ) {
      state.token = action.payload.token;
      if (action.payload.role !== undefined) state.role = action.payload.role;
      if (action.payload.canal !== undefined) state.canal = action.payload.canal;
    },
    clearCredentials() {
      return { ...initialState };
    },
  },
  extraReducers(builder) {
    builder
      .addCase(restoreSession.pending, (state) => {
        state.restoring = true;
      })
      .addCase(restoreSession.fulfilled, (state, action) => {
        state.token = action.payload.token;
        state.role = action.payload.role;
        state.canal = action.payload.canal;
        state.restoring = false;
      })
      .addCase(restoreSession.rejected, (state) => {
        state.token = null;
        state.role = null;
        state.canal = null;
        state.restoring = false;
      });
  },
});

export const { setCredentials, clearCredentials } = authSlice.actions;
export default authSlice.reducer;
