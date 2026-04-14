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
