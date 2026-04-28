import type { NextRequest } from "next/server";
import { NextResponse } from "next/server";
import { backendBase, bffHeaders, parseUpstreamJson } from "@/lib/backendBff";

export const runtime = "nodejs";

export async function GET(req: NextRequest) {
  try {
    const q = req.nextUrl.searchParams.toString();
    const path = q ? `/api/delivery/stats?${q}` : "/api/delivery/stats";
    const up = await fetch(`${backendBase()}${path}`, {
      headers: bffHeaders(req),
      cache: "no-store",
    });
    const json = await parseUpstreamJson(up);
    return NextResponse.json(json, { status: up.status });
  } catch (e) {
    console.error("[BFF delivery/stats]", e);
    return NextResponse.json({ error: "Error de red." }, { status: 502 });
  }
}
