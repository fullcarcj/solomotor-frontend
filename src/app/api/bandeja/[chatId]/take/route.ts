import type { NextRequest } from "next/server";
import { NextResponse } from "next/server";
import { receiverBase, receiverJsonHeaders } from "@/lib/bandejaReceiverProxy";

export const runtime = "nodejs";

type RouteCtx = { params: Promise<{ chatId: string }> };

const dev = process.env.NODE_ENV === "development";

export async function POST(req: NextRequest, ctx: RouteCtx) {
  const { chatId } = await ctx.params;
  const targetUrl = `${receiverBase()}/api/inbox/chats/${encodeURIComponent(chatId)}/take`;

  if (dev) console.log("[BFF take POST]", targetUrl);

  try {
    const headers = { ...receiverJsonHeaders(req) };
    delete headers["Content-Type"];
    const up = await fetch(targetUrl, {
      method: "POST",
      headers,
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
    console.error("[BFF bandeja/take POST]", e);
    return NextResponse.json({ error: "Error de red." }, { status: 502 });
  }
}
