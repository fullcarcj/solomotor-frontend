/**
 * Variables de entorno del proxy de inventario → webhook-receiver (solo servidor).
 */

export function getWebhookReceiverBaseUrl(): string {
  return (process.env.WEBHOOK_RECEIVER_BASE_URL ?? "")
    .trim()
    .replace(/\/+$/, "");
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
