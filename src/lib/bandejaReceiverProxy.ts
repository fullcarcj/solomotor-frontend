import type { NextRequest } from "next/server";

const BACKEND_URL =
  process.env.BACKEND_URL ?? process.env.WEBHOOK_RECEIVER_BASE_URL ?? "http://localhost:3001";

/** Base del webhook-receiver (mismo criterio que `api/bandeja/.../messages`). */
export function receiverBase(): string {
  const r = BACKEND_URL.trim().replace(/\/+$/, "");
  return /^https?:\/\//i.test(r) ? r : `https://${r}`;
}

function adminSecret(): string | undefined {
  const s =
    (process.env.WEBHOOK_ADMIN_SECRET ?? "").trim() ||
    (process.env.ADMIN_SECRET ?? "").trim();
  return s || undefined;
}

/** Headers para JSON hacia `/api/inbox/...` en el receiver. */
export function receiverJsonHeaders(req: NextRequest): Record<string, string> {
  const h: Record<string, string> = {
    "Content-Type": "application/json",
    Accept: "application/json",
    cookie: req.headers.get("cookie") ?? "",
  };
  const auth = req.headers.get("authorization");
  if (auth) h.authorization = auth;
  const secret = adminSecret();
  if (secret) h["X-Admin-Secret"] = secret;
  return h;
}

/** Headers para SSE (`/api/realtime/stream`). */
export function receiverSseHeaders(req: NextRequest): Record<string, string> {
  const h: Record<string, string> = {
    Accept: "text/event-stream",
    cookie: req.headers.get("cookie") ?? "",
  };
  const auth = req.headers.get("authorization");
  if (auth) h.authorization = auth;
  const secret = adminSecret();
  if (secret) h["X-Admin-Secret"] = secret;
  return h;
}
