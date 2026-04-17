/**
 * Variables de entorno del proxy de inventario → webhook-receiver (solo servidor).
 */

/**
 * URL base del webhook-receiver (sin barra final).
 * Si falta el esquema (`https://`), se asume HTTPS para que `new URL(base + path)` no lance.
 */
export function getWebhookReceiverBaseUrl(): string {
  let raw = (process.env.WEBHOOK_RECEIVER_BASE_URL ?? "")
    .trim()
    .replace(/\/+$/, "");
  if (!raw) return "";
  if (!/^https?:\/\//i.test(raw)) {
    raw = `https://${raw}`;
  }
  try {
    new URL(raw);
    return raw.replace(/\/+$/, "");
  } catch {
    return "";
  }
}

/**
 * Mismo valor que ADMIN_SECRET del webhook-receiver (cabecera X-Admin-Secret).
 * Acepta WEBHOOK_ADMIN_SECRET; si está vacío, ADMIN_SECRET (p. ej. si en Render solo existe esa clave).
 */
export function getWebhookAdminSecret(): string {
  const primary = (process.env.WEBHOOK_ADMIN_SECRET ?? "").trim();
  if (primary) return primary;
  return (process.env.ADMIN_SECRET ?? "").trim();
}

/**
 * Ruta absoluta (path) en el webhook-receiver para el listado de fabricantes.
 * Por defecto: `GET /api/inventory/manufacturers`.
 * Si tu API usa otra URL (p. ej. `/api/inventory/brands`), define en `.env.local`:
 * `INVENTORY_MANUFACTURERS_UPSTREAM_PATH=/api/inventory/brands`
 */
export function getInventoryManufacturersUpstreamPath(): string {
  const raw = (process.env.INVENTORY_MANUFACTURERS_UPSTREAM_PATH ?? "")
    .trim()
    .replace(/\s+/g, "");
  if (raw) {
    return raw.startsWith("/") ? raw : `/${raw}`;
  }
  return "/api/inventory/manufacturers";
}

/**
 * Ruta absoluta (path) en el webhook-receiver para el listado de marcas de vehículo.
 * Por defecto: `GET /api/crm/brands`.
 * Personalizable con `VEHICLE_BRANDS_UPSTREAM_PATH` en `.env.local`.
 */
export function getVehicleBrandsUpstreamPath(): string {
  const raw = (process.env.VEHICLE_BRANDS_UPSTREAM_PATH ?? "")
    .trim()
    .replace(/\s+/g, "");
  if (raw) {
    return raw.startsWith("/") ? raw : `/${raw}`;
  }
  return "/api/crm/brands";
}

/**
 * Listado global de cotizaciones en el webhook-receiver.
 * Si el GET no existe en `/api/inbox/quotations`, define la ruta real, p. ej. `QUOTATIONS_UPSTREAM_PATH=/api/quotations`
 */
export function getQuotationsUpstreamPath(): string {
  const raw = (process.env.QUOTATIONS_UPSTREAM_PATH ?? "")
    .trim()
    .replace(/\s+/g, "");
  if (raw) {
    return raw.startsWith("/") ? raw : `/${raw}`;
  }
  return "/api/inbox/quotations";
}
