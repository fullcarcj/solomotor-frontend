import type { NextRequest } from "next/server";
import { NextResponse } from "next/server";

export const runtime = "nodejs";

const BACKEND_URL =
  process.env.BACKEND_URL ??
  process.env.WEBHOOK_RECEIVER_BASE_URL ??
  "http://localhost:3001";

function forwardHeaders(req: NextRequest) {
  const cookieHeader = req.headers.get("cookie") ?? "";
  const authHeader = req.headers.get("authorization") ?? "";
  return {
    Accept: "application/json",
    "Content-Type": "application/json",
    ...(authHeader ? { Authorization: authHeader } : {}),
    ...(cookieHeader ? { Cookie: cookieHeader } : {}),
  };
}

/** BFF → GET /api/ai-responder/settings */
export async function GET(req: NextRequest) {
  const base = BACKEND_URL.replace(/\/+$/, "");
  const res = await fetch(`${base}/api/ai-responder/settings`, {
    method: "GET",
    headers: forwardHeaders(req),
    cache: "no-store",
  });
  const text = await res.text();
  let data: unknown = {};
  if (text.trim()) {
    try {
      data = JSON.parse(text) as unknown;
    } catch {
      data = { error: { message: "Respuesta no JSON del servidor" } };
    }
  }
  return NextResponse.json(data, { status: res.status });
}

/** BFF → PATCH /api/ai-responder/settings */
export async function PATCH(req: NextRequest) {
  const base = BACKEND_URL.replace(/\/+$/, "");
  const body = await req.text();
  const res = await fetch(`${base}/api/ai-responder/settings`, {
    method: "PATCH",
    headers: forwardHeaders(req),
    body: body || "{}",
    cache: "no-store",
  });
  const text = await res.text();
  let data: unknown = {};
  if (text.trim()) {
    try {
      data = JSON.parse(text) as unknown;
    } catch {
      data = { error: { message: "Respuesta no JSON del servidor" } };
    }
  }
  return NextResponse.json(data, { status: res.status });
}
