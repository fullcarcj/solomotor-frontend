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
 *   - /workspace               → sección Bandeja
 *   - /ventas/tablero          → sección Bandeja (acceso cruzado)
 *   - /ai-responder/monitor    → sección AI Responder
 */
function augmentMenuWithSupervisor(menu: MenuSection[] | null): MenuSection[] | null {
  if (!Array.isArray(menu) || menu.length === 0) return menu;

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

  // ── Sección sintética "AI Responder" con Monitor bot ─────────
  const aiMonitorSection: MenuSection = {
    id:           "ai-responder",
    label:        "AI Responder",
    icon:         "activity",
    group:        "ai-responder",
    moduleKey:    "ai-responder",
    moduleStatus: "active",
    items: [
      {
        id:               "ai_responder_monitor",
        label:            "Monitor bot",
        path:             "/ai-responder/monitor",
        minRole:          "admin",
        pendingMigration: false,
        future:           false,
      },
    ],
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

  // Dedupe: no agregar la sección AI Responder si el backend ya la devuelve
  const alreadyHasAiSection = menu.some(
    s => (s.moduleKey ?? "").toLowerCase() === "ai-responder"
  );

  const patched = menu.map((section) => {
    if (isBandejaSection(section)) return inject(section, [workspaceLeaf, tableroInBandejaLeaf]);
    return section;
  });

  return alreadyHasAiSection ? patched : [...patched, aiMonitorSection];
}

/**
 * Parche de presentación · renombres y ocultamientos acordados en FE (Apr 2026).
 * Opera sobre rutas y etiquetas del backend; no requiere cambios en BD.
 *
 * TODO · eliminar cada entrada cuando el backend refleje el cambio correspondiente.
 */
function applyFrontendPatches(menu: MenuSection[] | null): MenuSection[] | null {
  if (!Array.isArray(menu) || menu.length === 0) return menu;

  // Paths de items a eliminar del menú
  const REMOVE_PATHS = new Set([
    "/channels-monitor",  // Monitor de Canales — ruta 404
    "/dashboard",         // Panel Global — duplicado de inicio (erpDashboard)
    "/ventas/tablero",    // Tablero — ocultar de sección Ventas
  ]);

  // Etiquetas a eliminar (fallback si el path difiere entre entornos)
  const REMOVE_LABELS = new Set([
    "Panel Global",
    "Monitor de Canales",
    "Tablero",
  ]);

  // Renombres por path (prioridad sobre etiqueta)
  const RENAME_BY_PATH: Record<string, string> = {
    "/ventas/nueva":   "Crear venta",
    "/ventas/pedidos": "Bandeja de órdenes",
  };

  // Renombres por etiqueta (fallback)
  const RENAME_BY_LABEL: Record<string, string> = {
    "Nueva venta (POS)": "Crear venta",
    "Todos los pedidos": "Bandeja de órdenes",
    "Pedidos y Ventas":  "Bandeja de órdenes",
  };

  // Secciones a renombrar por etiqueta actual
  const RENAME_SECTION: Record<string, string> = {
    "Ventas Omnicanal": "Ventas",
  };

  return menu.map((section) => {
    const newSectionLabel = RENAME_SECTION[section.label] ?? section.label;

    const newItems = section.items
      .filter((item) => {
        if (REMOVE_PATHS.has(item.path)) return false;
        // Solo aplica REMOVE_LABELS dentro de secciones no-Bandeja para evitar
        // ocultar un "Tablero" legítimo en bandeja si coincide por nombre
        const isBandeja = ["bandeja", "inbox"].includes((section.moduleKey ?? "").toLowerCase());
        if (!isBandeja && REMOVE_LABELS.has(item.label)) return false;
        return true;
      })
      .map((item) => {
        const renamedLabel =
          RENAME_BY_PATH[item.path] ??
          RENAME_BY_LABEL[item.label] ??
          item.label;
        return renamedLabel !== item.label ? { ...item, label: renamedLabel } : item;
      });

    if (
      newSectionLabel === section.label &&
      newItems.length === section.items.length &&
      newItems.every((item, i) => item === section.items[i])
    ) {
      return section;
    }

    return { ...section, label: newSectionLabel, items: newItems };
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
      const patch = (m: MenuSection[] | null) =>
        applyFrontendPatches(augmentMenuWithSupervisor(m));
      if (Array.isArray(body)) {
        return {
          menu: patch(body),
          role: null as string | null,
          canal: null as string | null,
        };
      }
      return {
        menu: patch(body.menu ?? null),
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
