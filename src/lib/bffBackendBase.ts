/**
 * URL base del webhook-receiver para rutas BFF (server-side fetch).
 * Misma regla que `api/auth/me`: si la env no trae esquema, se asume https.
 */
export function bffBackendBase(): string {
  const raw = (
    process.env.BACKEND_URL ??
    process.env.WEBHOOK_RECEIVER_BASE_URL ??
    "http://localhost:3001"
  )
    .trim()
    .replace(/\/+$/, "");
  if (!raw) return "http://localhost:3001";
  if (!/^https?:\/\//i.test(raw)) return `https://${raw}`;
  return raw;
}
