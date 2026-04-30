import type { NextRequest } from "next/server";
import { NextResponse } from "next/server";
import { receiverBase, receiverJsonHeaders } from "@/lib/bandejaReceiverProxy";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

/**
 * BFF proxy para GET /api/realtime/cursor.
 * Devuelve { current: string, serverTime: string } desde el receptor.
 * El cliente usa `current` para comparar con su lastEventId y detectar gaps SSE.
 */
export async function GET(req: NextRequest) {
  try {
    const r = await fetch(`${receiverBase()}/api/realtime/cursor`, {
      headers: receiverJsonHeaders(req),
      cache: "no-store",
    });
    const data: unknown = await r.json();
    return NextResponse.json(data, { status: r.status });
  } catch (e) {
    console.error("[BFF realtime/cursor GET]", e);
    return NextResponse.json({ error: "cursor_unavailable" }, { status: 502 });
  }
}
