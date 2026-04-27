import type { NextRequest } from "next/server";
import { NextResponse } from "next/server";
import { bffBackendBase } from "@/lib/bffBackendBase";

export const runtime = "nodejs";

/**
 * BFF proxy → backend GET /api/ai-responder/pending
 * Devuelve mensajes con ai_reply_status = 'needs_human_review'.
 * Usado por useAiResponderPending + AiReviewDrawer (Sprint 6B).
 */
export async function GET(req: NextRequest) {
  const base = bffBackendBase();
  const cookieHeader = req.headers.get("cookie") ?? "";
  const authHeader = req.headers.get("authorization") ?? "";

  const url = new URL(req.url);
  const limit = url.searchParams.get("limit") ?? "200";

  const res = await fetch(
    `${base}/api/ai-responder/pending?limit=${encodeURIComponent(limit)}`,
    {
      method: "GET",
      headers: {
        Accept: "application/json",
        ...(authHeader ? { Authorization: authHeader } : {}),
        ...(cookieHeader ? { Cookie: cookieHeader } : {}),
      },
      cache: "no-store",
    }
  );

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
