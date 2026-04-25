import type { NextRequest } from "next/server";
import { NextResponse } from "next/server";
import { receiverBase, receiverJsonHeaders } from "@/lib/bandejaReceiverProxy";

export const runtime = "nodejs";

/** BFF proxy → backend GET /api/sales/bank-credits */
export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url);
  const qs = searchParams.toString();
  const url = `${receiverBase()}/api/sales/bank-credits${qs ? `?${qs}` : ""}`;

  try {
    const up = await fetch(url, {
      method: "GET",
      headers: receiverJsonHeaders(req),
      cache: "no-store",
    });
    const text = await up.text();
    let data: unknown = {};
    try { data = text.trim() ? (JSON.parse(text) as unknown) : {}; } catch { data = { raw: text.slice(0, 500) }; }
    return NextResponse.json(data, { status: up.status });
  } catch (e) {
    console.error("[BFF sales/bank-credits GET] red:", e);
    return NextResponse.json({ error: "Error de red." }, { status: 502 });
  }
}
