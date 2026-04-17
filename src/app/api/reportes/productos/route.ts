import type { NextRequest } from "next/server";
import { NextResponse } from "next/server";
import { backendBase, bffHeaders, parseUpstreamJson } from "@/lib/backendBff";

export const runtime = "nodejs";

export async function GET(req: NextRequest) {
  const p = new URLSearchParams();
  const period = req.nextUrl.searchParams.get("period");
  const limit  = req.nextUrl.searchParams.get("limit");
  if (period) p.set("period", period);
  if (limit)  p.set("limit", limit);
  if (!p.has("limit")) p.set("limit", "10");
  const qs = p.toString();
  try {
    const up = await fetch(`${backendBase()}/api/stats/sales/products?${qs}`, {
      headers: bffHeaders(req),
      cache: "no-store",
    });
    const json = await parseUpstreamJson(up);
    return NextResponse.json(json, { status: up.status });
  } catch (e) {
    console.error("[BFF reportes/productos]", e);
    return NextResponse.json({ error: "Error de red." }, { status: 502 });
  }
}
