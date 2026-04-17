import { createSlice, createAsyncThunk, type PayloadAction } from "@reduxjs/toolkit";

type StateWithAuth = { auth?: { token: string | null } };

/** Contrato alineado al backend (prompt v4). */
export interface MenuItemLeaf {
  id: string;
  label: string;
  path: string;
  minRole: string;
  pendingMigration: boolean;
  future: boolean;
}

export interface MenuSection {
  id: string;
  label: string;
  icon: string;
  group: string;
  moduleKey: string | null;
  moduleStatus: "active" | "pending" | null;
  items: MenuItemLeaf[];
}

export interface MenuApiResponse {
  menu?: MenuSection[];
  role?: string | null;
  canal?: string | null;
}

export interface MenuState {
  /** null = aún no cargado; array = respuesta recibida (puede estar vacía). */
  data: MenuSection[] | null;
  loading: boolean;
  error: string | null;
  role: string | null;
  canal: string | null;
}

const initialState: MenuState = {
  data: null,
  loading: false,
  error: null,
  role: null,
  canal: null,
};

export const fetchMenu = createAsyncThunk(
  "menu/fetch",
  async (_, { getState, rejectWithValue }) => {
    const state = getState() as StateWithAuth;
    const token = state.auth?.token ?? null;
    try {
      const res = await fetch("/api/menu", {
        headers:
          token && token !== "cookie"
            ? { Authorization: `Bearer ${token}` }
            : {},
        credentials: "include",
        cache: "no-store",
      });
      if (!res.ok) {
        return rejectWithValue(`HTTP ${res.status}`);
      }
      const body = (await res.json()) as MenuApiResponse | MenuSection[];
      if (Array.isArray(body)) {
        return { menu: body, role: null as string | null, canal: null as string | null };
      }
      return {
        menu: body.menu ?? null,
        role: body.role ?? null,
        canal: body.canal ?? null,
      };
    } catch {
      return rejectWithValue("network_error");
    }
  }
);

const menuSlice = createSlice({
  name: "menu",
  initialState,
  reducers: {
    clearMenu() {
      return initialState;
    },
    setMenuMeta(state, action: PayloadAction<{ role?: string | null; canal?: string | null }>) {
      if (action.payload.role !== undefined) state.role = action.payload.role;
      if (action.payload.canal !== undefined) state.canal = action.payload.canal;
    },
  },
  extraReducers(builder) {
    builder
      .addCase(fetchMenu.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(fetchMenu.fulfilled, (state, action) => {
        state.loading = false;
        state.data = action.payload.menu ?? null;
        state.role = action.payload.role ?? null;
        state.canal = action.payload.canal ?? null;
        state.error = null;
      })
      .addCase(fetchMenu.rejected, (state, action) => {
        state.loading = false;
        state.error =
          typeof action.payload === "string" ? action.payload : "Error al cargar menú";
      });
  },
});

export const { clearMenu, setMenuMeta } = menuSlice.actions;
export default menuSlice.reducer;
