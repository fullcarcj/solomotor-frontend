import type { NextRequest } from "next/server";
import { NextResponse } from "next/server";
import { receiverBase, receiverJsonHeaders } from "@/lib/bandejaReceiverProxy";

export const runtime = "nodejs";

type Ctx = { params: Promise<{ chatId: string }> };

/**
 * BFF proxy → backend GET /api/sales/chats/:chatId/bot-actions
 * Query passthrough: cursor, limit
 */
export async function GET(req: NextRequest, ctx: Ctx) {
  const { chatId } = await ctx.params;
  const { searchParams } = req.nextUrl;

  const qs = new URLSearchParams();
  const cursor = searchParams.get("cursor");
  const limit = searchParams.get("limit");
  if (cursor) qs.set("cursor", cursor);
  if (limit) qs.set("limit", limit);

  const qsStr = qs.toString();
  const url = `${receiverBase()}/api/sales/chats/${encodeURIComponent(chatId)}/bot-actions${qsStr ? `?${qsStr}` : ""}`;

  try {
    const up = await fetch(url, {
      method: "GET",
      headers: receiverJsonHeaders(req),
      cache: "no-store",
    });

    if (up.status >= 500) {
      console.error("[BFF sales/chats/bot-actions GET]", up.status, url);
      return NextResponse.json({ error: "Error interno del servidor" }, { status: 502 });
    }

    const text = await up.text();
    let data: unknown = {};
    try { data = text.trim() ? (JSON.parse(text) as unknown) : {}; }
    catch { data = { raw: text.slice(0, 500) }; }
    return NextResponse.json(data, { status: up.status });
  } catch (e) {
    console.error("[BFF sales/chats/bot-actions GET] red:", e);
    return NextResponse.json({ error: "Error de red." }, { status: 502 });
  }
}
