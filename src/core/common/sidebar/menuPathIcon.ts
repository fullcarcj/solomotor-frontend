/**
 * Alias: nombres que no coinciden con el set Tabler webfont tras kebabizar.
 * @see https://tabler.io/icons
 */
const TABLER_ICON_ALIASES: Record<string, string> = {
  "bar-chart2": "chart-bar",
  "dollar-sign": "currency-dollar",
};

/**
 * Convierte `LayoutGrid` / `MessageSquare` (menú API) o `layout-grid` al sufijo `ti ti-*`.
 */
export function normalizeTablerIcon(
  raw: string | null | undefined,
  fallback = "layout-grid"
): string {
  let s = (raw || "").trim();
  if (!s) return fallback;
  s = s.replace(/^ti\s+ti-/i, "").replace(/^ti-/i, "").trim();
  if (!s) return fallback;
  if (/^[a-z0-9][a-z0-9-]*$/.test(s)) {
    return TABLER_ICON_ALIASES[s] ?? s;
  }
  const kebab = s
    .replace(/([a-z0-9])([A-Z])/g, "$1-$2")
    .replace(/([A-Z])([A-Z][a-z])/g, "$1-$2")
    .toLowerCase();
  const out = kebab || fallback;
  return TABLER_ICON_ALIASES[out] ?? out;
}

/**
 * Icono Tabler (`ti ti-*` sin prefijo) por ruta de menú.
 * El backend puede enviar `icon` en el ítem; si no, se usa esta heurística.
 */
export function tablerIconForMenuPath(path: string): string {
  const p = (path || "").toLowerCase();

  if (p.includes("/dashboard")) return "layout-dashboard";
  if (p.includes("/admin-dashboard")) return "layout-dashboard";
  if (p.includes("/ventas")) return "shopping-cart";
  if (p.includes("/mercadolibre") || p.includes("/ml/")) return "world";
  if (p.includes("/bandeja") || p.includes("/workspace")) return "inbox";
  if (p.includes("/inventario")) return "package";
  if (p.includes("/logistica")) return "truck";
  if (p.includes("/compras")) return "shopping-bag";
  if (p.includes("/finanzas")) return "currency-dollar";
  if (p.includes("/reportes")) return "chart-bar";
  if (p.includes("/clientes")) return "users";
  if (p.includes("/ai-responder")) return "robot";
  if (p.includes("/config") || p.includes("/general-settings")) return "settings";
  if (p.includes("/ordenes")) return "clipboard-list";
  if (p.includes("/supervisor")) return "eye";
  if (p.includes("/observacion")) return "search";
  if (p.includes("/automatizaciones")) return "bolt";
  if (p.includes("/pos")) return "device-laptop";

  return "circle";
}
