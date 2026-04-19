import type { NextRequest } from "next/server";
import { NextResponse } from "next/server";

export const runtime = "nodejs";

const BACKEND_URL =
  process.env.BACKEND_URL ??
  process.env.WEBHOOK_RECEIVER_BASE_URL ??
  "http://localhost:3001";

/**
 * BFF proxy → backend GET /api/ai-responder/stats
 * Devuelve el agregado del día (today_log_by_action, today_by_status,
 * pending_count, needs_review_count, force_send, human_review_gate).
 * Usado por la página /observacion para el bloque "Actividad del bot".
 */
export async function GET(req: NextRequest) {
  const base = BACKEND_URL.replace(/\/+$/, "");
  const cookieHeader = req.headers.get("cookie") ?? "";
  const authHeader = req.headers.get("authorization") ?? "";

  const res = await fetch(`${base}/api/ai-responder/stats`, {
    method: "GET",
    headers: {
      Accept: "application/json",
      ...(authHeader ? { Authorization: authHeader } : {}),
      ...(cookieHeader ? { Cookie: cookieHeader } : {}),
    },
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
