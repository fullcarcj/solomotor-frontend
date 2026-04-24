import type { NextRequest } from "next/server";
import { NextResponse } from "next/server";

export const runtime = "nodejs";

const BACKEND_URL =
  process.env.BACKEND_URL ?? process.env.WEBHOOK_RECEIVER_BASE_URL ?? "http://localhost:3001";

function base() {
  const r = BACKEND_URL.trim().replace(/\/+$/, "");
  return /^https?:\/\//i.test(r) ? r : `https://${r}`;
}

function hdr(req: NextRequest) {
  return {
    Accept: "application/json",
    "Content-Type": "application/json",
    ...(req.headers.get("cookie") ? { cookie: req.headers.get("cookie")! } : {}),
    ...(req.headers.get("authorization")
      ? { authorization: req.headers.get("authorization")! }
      : {}),
  };
}

type RouteCtx = { params: Promise<{ chatId: string }> };

/** BFF → POST /api/inbox/:chatId/quotations/from-ml-order (borrador CH-3 desde orden ML). */
export async function POST(req: NextRequest, ctx: RouteCtx) {
  const { chatId } = await ctx.params;
  let body: Record<string, unknown> = {};
  try {
    body = (await req.json()) as Record<string, unknown>;
  } catch {
    body = {};
  }
  const targetUrl = `${base()}/api/inbox/${encodeURIComponent(chatId)}/quotations/from-ml-order`;

  try {
    const up = await fetch(targetUrl, {
      method: "POST",
      headers: hdr(req),
      body: JSON.stringify(body),
      cache: "no-store",
    });
    const text = await up.text();
    let data: unknown = {};
    try {
      data = text.trim() ? JSON.parse(text) : {};
    } catch {
      data = { raw: text.slice(0, 500) };
    }
    return NextResponse.json(data, { status: up.status });
  } catch (e) {
    console.error("[BFF inbox from-ml-order POST]", e);
    return NextResponse.json({ error: "Error de red." }, { status: 502 });
  }
}
