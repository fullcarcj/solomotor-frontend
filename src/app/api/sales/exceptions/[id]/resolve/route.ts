import type { NextRequest } from "next/server";
import { NextResponse } from "next/server";
import { receiverBase, receiverJsonHeaders } from "@/lib/bandejaReceiverProxy";

export const runtime = "nodejs";

type Ctx = { params: Promise<{ id: string }> };

/**
 * BFF proxy → backend PATCH /api/sales/exceptions/:id/resolve
 * Cuerpo esperado: { resolution_notes: string }
 */
export async function PATCH(req: NextRequest, ctx: Ctx) {
  const { id } = await ctx.params;
  const url = `${receiverBase()}/api/sales/exceptions/${encodeURIComponent(id)}/resolve`;
  const bodyText = await req.text();

  try {
    const up = await fetch(url, {
      method: "PATCH",
      headers: receiverJsonHeaders(req),
      body: bodyText || "{}",
      cache: "no-store",
    });

    if (up.status >= 500) {
      console.error("[BFF sales/exceptions/resolve PATCH]", up.status, url);
      return NextResponse.json({ error: "Error interno del servidor" }, { status: 502 });
    }

    const text = await up.text();
    let data: unknown = {};
    try { data = text.trim() ? (JSON.parse(text) as unknown) : {}; }
    catch { data = { raw: text.slice(0, 500) }; }
    return NextResponse.json(data, { status: up.status });
  } catch (e) {
    console.error("[BFF sales/exceptions/resolve PATCH] red:", e);
    return NextResponse.json({ error: "Error de red." }, { status: 502 });
  }
}
