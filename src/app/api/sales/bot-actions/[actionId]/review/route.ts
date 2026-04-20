import type { NextRequest } from "next/server";
import { NextResponse } from "next/server";
import { receiverBase, receiverJsonHeaders } from "@/lib/bandejaReceiverProxy";

export const runtime = "nodejs";

type Ctx = { params: Promise<{ actionId: string }> };

/**
 * BFF proxy → backend POST /api/sales/bot-actions/:actionId/review
 * Cuerpo esperado: { is_correct: boolean, review_notes?: string }
 */
export async function POST(req: NextRequest, ctx: Ctx) {
  const { actionId } = await ctx.params;
  const url = `${receiverBase()}/api/sales/bot-actions/${encodeURIComponent(actionId)}/review`;

  const bodyText = await req.text();

  try {
    const up = await fetch(url, {
      method: "POST",
      headers: receiverJsonHeaders(req),
      body: bodyText || "{}",
      cache: "no-store",
    });

    if (up.status >= 500) {
      console.error("[BFF sales/bot-actions/review POST]", up.status, url);
      return NextResponse.json({ error: "Error interno del servidor" }, { status: 502 });
    }

    const text = await up.text();
    let data: unknown = {};
    try { data = text.trim() ? (JSON.parse(text) as unknown) : {}; }
    catch { data = { raw: text.slice(0, 500) }; }
    return NextResponse.json(data, { status: up.status });
  } catch (e) {
    console.error("[BFF sales/bot-actions/review POST] red:", e);
    return NextResponse.json({ error: "Error de red." }, { status: 502 });
  }
}
