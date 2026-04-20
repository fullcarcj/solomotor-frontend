import type { NextRequest } from "next/server";
import { NextResponse } from "next/server";
import { receiverBase, receiverJsonHeaders } from "@/lib/bandejaReceiverProxy";

export const runtime = "nodejs";

/**
 * BFF proxy → backend GET /api/sales/supervisor/exceptions
 * Vista supervisor: todas las excepciones OPEN (sin filtro de chat_id).
 * Query passthrough: status, cursor, limit
 *
 * Nota T0.3: existe también /api/ventas/supervisor/exceptions que proxia al mismo backend.
 * Este handler es el path canónico del Bloque 2 (ADR-004 naming-api).
 */
export async function GET(req: NextRequest) {
  const { searchParams } = req.nextUrl;

  const qs = new URLSearchParams();
  const status = searchParams.get("status");
  const cursor = searchParams.get("cursor");
  const limit = searchParams.get("limit");
  if (status) qs.set("status", status);
  if (cursor) qs.set("cursor", cursor);
  if (limit) qs.set("limit", limit);

  const qsStr = qs.toString();
  const url = `${receiverBase()}/api/sales/supervisor/exceptions${qsStr ? `?${qsStr}` : ""}`;

  try {
    const up = await fetch(url, {
      method: "GET",
      headers: receiverJsonHeaders(req),
      cache: "no-store",
    });

    if (up.status >= 500) {
      console.error("[BFF sales/supervisor/exceptions GET]", up.status, url);
      return NextResponse.json({ error: "Error interno del servidor" }, { status: 502 });
    }

    const text = await up.text();
    let data: unknown = {};
    try { data = text.trim() ? (JSON.parse(text) as unknown) : {}; }
    catch { data = { raw: text.slice(0, 500) }; }
    return NextResponse.json(data, { status: up.status });
  } catch (e) {
    console.error("[BFF sales/supervisor/exceptions GET] red:", e);
    return NextResponse.json({ error: "Error de red." }, { status: 502 });
  }
}
