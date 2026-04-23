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
