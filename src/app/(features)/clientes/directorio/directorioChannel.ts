import type { Customer } from "@/types/customers";

/** Canal activo en la barra lateral (mockup M1). */
export type DirectorioSource =
  | "all"
  | "wa"
  | "ml"
  | "ecom"
  | "mostrador"
  | "fuerza";

export function customerMatchesSource(
  c: Customer,
  source: DirectorioSource
): boolean {
  if (source === "all") return true;
  const t = (c.customer_type ?? "").toLowerCase();
  switch (source) {
    case "wa":
      return Boolean(c.wa_status?.trim()) || Boolean(c.phone?.trim());
    case "ml":
      return t === "mercadolibre" || c.primary_ml_buyer_id != null;
    case "ecom":
      return t === "online";
    case "mostrador":
      return t === "mostrador";
    case "fuerza":
      return t === "cartera";
    default:
      return true;
  }
}

/** Clase CSS del avatar según canal predominante. */
export function directorioAvatarClass(c: Customer): string {
  const t = (c.customer_type ?? "").toLowerCase();
  if (t === "mercadolibre" || c.primary_ml_buyer_id) return "crm-dir-avatar--ml";
  if (t === "mostrador") return "crm-dir-avatar--mostrador";
  if (t === "online") return "crm-dir-avatar--ecom";
  if (t === "cartera") return "crm-dir-avatar--fuerza";
  if (c.wa_status?.trim()) return "crm-dir-avatar--wa";
  return "";
}

export function directorioInitials(name: string): string {
  const p = name.trim().split(/\s+/).filter(Boolean);
  if (p.length >= 2) {
    return `${p[0]![0] ?? ""}${p[1]![0] ?? ""}`.toUpperCase();
  }
  return name.slice(0, 2).toUpperCase() || "—";
}
