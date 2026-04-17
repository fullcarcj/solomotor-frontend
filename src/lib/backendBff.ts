import type { NextRequest } from "next/server";

/** Base URL del backend ERP (BFF cookie + Authorization). */
export function backendBase(): string {
  const raw = (process.env.BACKEND_URL ?? process.env.WEBHOOK_RECEIVER_BASE_URL ?? "http://localhost:3001")
    .trim()
    .replace(/\/+$/, "");
  return /^https?:\/\//i.test(raw) ? raw : `https://${raw}`;
}

export function bffHeaders(req: NextRequest, withJsonBody = false): HeadersInit {
  const h: Record<string, string> = {
    Accept: "application/json",
    ...(req.headers.get("cookie") ? { Cookie: req.headers.get("cookie")! } : {}),
    ...(req.headers.get("authorization") ? { Authorization: req.headers.get("authorization")! } : {}),
  };
  if (withJsonBody) h["Content-Type"] = "application/json";
  return h;
}

export async function parseUpstreamJson(res: Response): Promise<unknown> {
  const text = await res.text();
  try {
    return text.trim() ? JSON.parse(text) : {};
  } catch {
    return { raw: text.slice(0, 500) };
  }
}
