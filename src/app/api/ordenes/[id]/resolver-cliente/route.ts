import type { NextRequest } from "next/server";
import { NextResponse } from "next/server";
import { backendBase, bffHeaders, parseUpstreamJson } from "@/lib/backendBff";

export const runtime = "nodejs";

/** POST → backend POST /api/sales/:id/resolve-customer */
export async function POST(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  const base = backendBase();
  let body: unknown = {};
  try {
    body = await req.json();
  } catch {
    body = {};
  }
  try {
    const upstream = await fetch(
      `${base}/api/sales/${encodeURIComponent(id)}/resolve-customer`,
      {
        method: "POST",
        headers: bffHeaders(req, true),
        body: JSON.stringify(body),
        cache: "no-store",
      }
    );
    const data = await parseUpstreamJson(upstream);
    return NextResponse.json(data, { status: upstream.status });
  } catch (e) {
    console.error("[BFF POST /api/ordenes/[id]/resolver-cliente]", e);
    return NextResponse.json({ error: "Error de red." }, { status: 502 });
  }
}
