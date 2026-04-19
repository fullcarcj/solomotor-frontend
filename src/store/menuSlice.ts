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

/**
 * Patch temporal · inyecta items que el backend todavía no expone vía /api/menu.
 * Cada item usa dedupe por path: si el backend ya lo incluye, no se duplica.
 *
 * TODO · eliminar cuando backend incluya estas rutas en la tabla de menú:
 *   - /ventas/tablero  → sección Ventas
 *   - /workspace       → sección Bandeja
 *   - /ventas/tablero  → sección Bandeja (acceso cruzado)
 */
function augmentMenuWithSupervisor(menu: MenuSection[] | null): MenuSection[] | null {
  if (!Array.isArray(menu) || menu.length === 0) return menu;

  // ── Items a inyectar en "Ventas" ─────────────────────────────
  const tableroLeaf: MenuItemLeaf = {
    id: "ventas_tablero",
    label: "Tablero",
    path: "/ventas/tablero",
    minRole: "vendedor",
    pendingMigration: false,
    future: false,
  };

  // ── Items a inyectar en "Bandeja" ────────────────────────────
  const workspaceLeaf: MenuItemLeaf = {
    id: "bandeja_workspace",
    label: "Workspace",
    path: "/workspace",
    minRole: "vendedor",
    pendingMigration: false,
    future: false,
  };

  const tableroInBandejaLeaf: MenuItemLeaf = {
    id: "bandeja_tablero",
    label: "Tablero",
    path: "/ventas/tablero",
    minRole: "vendedor",
    pendingMigration: false,
    future: false,
  };

  const isVentasSection = (s: MenuSection): boolean => {
    const key = (s.moduleKey ?? "").toLowerCase();
    if (key === "ventas" || key === "sales") return true;
    const label = (s.label ?? "").toLowerCase();
    const group = (s.group ?? "").toLowerCase();
    return group.includes("ventas") || label === "ventas";
  };

  const isBandejaSection = (s: MenuSection): boolean => {
    const key = (s.moduleKey ?? "").toLowerCase();
    if (key === "bandeja" || key === "inbox") return true;
    const label = (s.label ?? "").toLowerCase();
    const group = (s.group ?? "").toLowerCase();
    return label === "bandeja" || label === "inbox" || group.includes("bandeja");
  };

  const inject = (section: MenuSection, leaves: MenuItemLeaf[]): MenuSection => {
    const toAdd = leaves.filter(l => !section.items.some(it => it.path === l.path));
    if (toAdd.length === 0) return section;
    return { ...section, items: [...section.items, ...toAdd] };
  };

  return menu.map((section) => {
    if (isVentasSection(section))  return inject(section, [tableroLeaf]);
    if (isBandejaSection(section)) return inject(section, [workspaceLeaf, tableroInBandejaLeaf]);
    return section;
  });
}

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
        return {
          menu: augmentMenuWithSupervisor(body),
          role: null as string | null,
          canal: null as string | null,
        };
      }
      return {
        menu: augmentMenuWithSupervisor(body.menu ?? null),
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
