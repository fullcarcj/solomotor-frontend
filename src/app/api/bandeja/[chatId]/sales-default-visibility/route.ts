import type { NextRequest } from "next/server";
import { NextResponse } from "next/server";
import { isBandejaBffVerbose, receiverBase, receiverJsonHeaders } from "@/lib/bandejaReceiverProxy";

export const runtime = "nodejs";

type RouteCtx = { params: Promise<{ chatId: string }> };

/** PATCH body `{ hidden: boolean }` → `crm_chats.sales_default_hidden_at`. */
export async function PATCH(req: NextRequest, ctx: RouteCtx) {
  const { chatId } = await ctx.params;
  const targetUrl = `${receiverBase()}/api/inbox/chats/${encodeURIComponent(chatId)}/sales-default-visibility`;

  if (isBandejaBffVerbose()) console.log("[BFF sales-default-visibility PATCH]", targetUrl);

  let body: unknown;
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: "invalid_json" }, { status: 400 });
  }

  try {
    const up = await fetch(targetUrl, {
      method: "PATCH",
      headers: { ...receiverJsonHeaders(req), "Content-Type": "application/json" },
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
    console.error("[BFF bandeja/sales-default-visibility PATCH]", e);
    return NextResponse.json({ error: "Error de red." }, { status: 502 });
  }
}
