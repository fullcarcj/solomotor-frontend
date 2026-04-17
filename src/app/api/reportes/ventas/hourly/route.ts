import type { NextRequest } from "next/server";
import { NextResponse } from "next/server";
import { backendBase, bffHeaders, parseUpstreamJson } from "@/lib/backendBff";

export const runtime = "nodejs";

export async function GET(req: NextRequest) {
  const p = new URLSearchParams();
  const weeks = req.nextUrl.searchParams.get("weeks");
  if (weeks) p.set("weeks", weeks);
  const qs = p.toString();
  try {
    const up = await fetch(`${backendBase()}/api/stats/sales/hourly${qs ? `?${qs}` : ""}`, {
      headers: bffHeaders(req),
      cache: "no-store",
    });
    const json = await parseUpstreamJson(up);
    return NextResponse.json(json, { status: up.status });
  } catch (e) {
    console.error("[BFF reportes/ventas/hourly]", e);
    return NextResponse.json({ error: "Error de red." }, { status: 502 });
  }
}
