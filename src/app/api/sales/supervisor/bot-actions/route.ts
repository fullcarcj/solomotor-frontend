import type { NextRequest } from "next/server";
import { NextResponse } from "next/server";
import { receiverBase, receiverJsonHeaders } from "@/lib/bandejaReceiverProxy";

export const runtime = "nodejs";

/**
 * BFF proxy → backend GET /api/sales/supervisor/bot-actions
 * Query passthrough: is_reviewed, cursor, limit
 *
 * ⚠️ AVISO (verificado 2026-04-20): este endpoint causó un crash del backend
 * durante el Ticket 0 de Fase 2. Ver docs/reports/bloque2-frontend-fase2-ticket0.md §T0.5.
 * El arquitecto debe verificar el estado del endpoint antes de usar en producción.
 */
export async function GET(req: NextRequest) {
  const { searchParams } = req.nextUrl;

  const qs = new URLSearchParams();
  const isReviewed = searchParams.get("is_reviewed");
  const cursor = searchParams.get("cursor");
  const limit = searchParams.get("limit");
  if (isReviewed !== null) qs.set("is_reviewed", isReviewed);
  if (cursor) qs.set("cursor", cursor);
  if (limit) qs.set("limit", limit);

  const qsStr = qs.toString();
  const url = `${receiverBase()}/api/sales/supervisor/bot-actions${qsStr ? `?${qsStr}` : ""}`;

  try {
    const up = await fetch(url, {
      method: "GET",
      headers: receiverJsonHeaders(req),
      cache: "no-store",
    });

    if (up.status >= 500) {
      console.error("[BFF sales/supervisor/bot-actions GET]", up.status, url);
      return NextResponse.json({ error: "Error interno del servidor" }, { status: 502 });
    }

    const text = await up.text();
    let data: unknown = {};
    try { data = text.trim() ? (JSON.parse(text) as unknown) : {}; }
    catch { data = { raw: text.slice(0, 500) }; }
    return NextResponse.json(data, { status: up.status });
  } catch (e) {
    console.error("[BFF sales/supervisor/bot-actions GET] red:", e);
    return NextResponse.json({ error: "Error de red." }, { status: 502 });
  }
}
