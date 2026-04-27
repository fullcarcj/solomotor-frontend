import type { NextRequest } from "next/server";
import { NextResponse } from "next/server";
import { bffBackendBase } from "@/lib/bffBackendBase";

export const runtime = "nodejs";

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
  const base = bffBackendBase();
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
  const base = bffBackendBase();
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
