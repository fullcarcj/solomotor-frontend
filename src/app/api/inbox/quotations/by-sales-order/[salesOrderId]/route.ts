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
    ...(req.headers.get("cookie") ? { cookie: req.headers.get("cookie")! } : {}),
    ...(req.headers.get("authorization")
      ? { authorization: req.headers.get("authorization")! }
      : {}),
  };
}

type RouteCtx = { params: Promise<{ salesOrderId: string }> };

/**
 * BFF → GET /api/inbox/quotations/by-sales-order/:salesOrderId
 * Cotización activa anclada a la transacción (cross-chat).
 */
export async function GET(req: NextRequest, ctx: RouteCtx) {
  const { salesOrderId } = await ctx.params;
  const targetUrl = `${base()}/api/inbox/quotations/by-sales-order/${encodeURIComponent(salesOrderId)}`;
  try {
    const up = await fetch(targetUrl, {
      method: "GET",
      headers: hdr(req),
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
    console.error("[BFF quotations/by-sales-order GET]", e);
    return NextResponse.json({ error: "Error de red." }, { status: 502 });
  }
}
