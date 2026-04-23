import type { NextRequest } from "next/server";
import { NextResponse } from "next/server";
import { isBandejaBffVerbose, receiverBase, receiverJsonHeaders } from "@/lib/bandejaReceiverProxy";

export const runtime = "nodejs";

type RouteCtx = { params: Promise<{ chatId: string }> };

/** PATCH → marcar hilo como atendido manual (crm_chats.marked_attended_at). */
export async function PATCH(req: NextRequest, ctx: RouteCtx) {
  const { chatId } = await ctx.params;
  const targetUrl = `${receiverBase()}/api/inbox/chats/${encodeURIComponent(chatId)}/mark-attended`;

  if (isBandejaBffVerbose()) console.log("[BFF mark-attended PATCH]", targetUrl);

  try {
    const headers = { ...receiverJsonHeaders(req) };
    delete headers["Content-Type"];
    const up = await fetch(targetUrl, {
      method: "PATCH",
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
    console.error("[BFF bandeja/mark-attended PATCH]", e);
    return NextResponse.json({ error: "Error de red." }, { status: 502 });
  }
}
