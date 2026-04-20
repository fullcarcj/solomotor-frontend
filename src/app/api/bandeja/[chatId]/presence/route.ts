import type { NextRequest } from "next/server";
import { NextResponse } from "next/server";
import { receiverBase, receiverJsonHeaders } from "@/lib/bandejaReceiverProxy";

export const runtime = "nodejs";

type RouteCtx = { params: Promise<{ chatId: string }> };

export async function POST(req: NextRequest, ctx: RouteCtx) {
  const { chatId } = await ctx.params;
  const body: unknown = await req.json().catch(() => ({}));
  const targetUrl = `${receiverBase()}/api/inbox/chats/${encodeURIComponent(chatId)}/presence`;

  try {
    const up = await fetch(targetUrl, {
      method: "POST",
      headers: receiverJsonHeaders(req),
      body: JSON.stringify(body),
      cache: "no-store",
    });
    const text = await up.text();
    let data: unknown = {};
    try {
      data = text.trim() ? (JSON.parse(text) as unknown) : {};
    } catch {
      data = { raw: text.slice(0, 500) };
    }
    return NextResponse.json(data, { status: up.status });
  } catch (e) {
    console.error("[BFF bandeja/presence POST]", e);
    return NextResponse.json({ error: "Error de red." }, { status: 502 });
  }
}
