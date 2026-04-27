import type { NextRequest } from "next/server";
import { NextResponse } from "next/server";
import { bffBackendBase } from "@/lib/bffBackendBase";

export const runtime = "nodejs";

/**
 * BFF proxy → backend POST /api/ai-responder/:id/approve
 * Envía el ai_reply_text sugerido al cliente sin modificaciones.
 */
export async function POST(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  const base = bffBackendBase();
  const cookieHeader = req.headers.get("cookie") ?? "";
  const authHeader = req.headers.get("authorization") ?? "";

  const res = await fetch(`${base}/api/ai-responder/${encodeURIComponent(id)}/approve`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Accept: "application/json",
      ...(authHeader ? { Authorization: authHeader } : {}),
      ...(cookieHeader ? { Cookie: cookieHeader } : {}),
    },
    body: JSON.stringify({}),
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
