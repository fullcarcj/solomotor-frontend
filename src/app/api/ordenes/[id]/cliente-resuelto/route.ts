import type { NextRequest } from "next/server";
import { NextResponse } from "next/server";
import { backendBase, bffHeaders, parseUpstreamJson } from "@/lib/backendBff";

export const runtime = "nodejs";

/** GET → backend GET /api/sales/:id/resolved-customer */
export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  const base = backendBase();
  try {
    const upstream = await fetch(
      `${base}/api/sales/${encodeURIComponent(id)}/resolved-customer`,
      { method: "GET", headers: bffHeaders(req), cache: "no-store" }
    );
    const data = await parseUpstreamJson(upstream);
    return NextResponse.json(data, { status: upstream.status });
  } catch (e) {
    console.error("[BFF GET /api/ordenes/[id]/cliente-resuelto]", e);
    return NextResponse.json({ error: "Error de red." }, { status: 502 });
  }
}
