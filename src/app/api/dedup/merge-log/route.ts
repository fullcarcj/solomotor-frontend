import type { NextRequest } from "next/server";
import { NextResponse } from "next/server";
import { backendBase, bffHeaders, parseUpstreamJson } from "@/lib/backendBff";

export const runtime = "nodejs";

/** BFF → GET /api/dedup/merge-log (proxy al backend ERP) */
export async function GET(req: NextRequest) {
  try {
    const qs = req.nextUrl.searchParams.toString();
    const url = `${backendBase()}/api/dedup/merge-log${qs ? `?${qs}` : ""}`;
    const up = await fetch(url, {
      headers: bffHeaders(req),
      cache: "no-store",
    });
    const json = await parseUpstreamJson(up);
    return NextResponse.json(json, { status: up.status });
  } catch (e) {
    console.error("[BFF dedup/merge-log]", e);
    return NextResponse.json({ error: "Error de red." }, { status: 502 });
  }
}
