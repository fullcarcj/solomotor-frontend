import type { NextRequest } from "next/server";
import { NextResponse } from "next/server";
import { backendBase, bffHeaders, parseUpstreamJson } from "@/lib/backendBff";

export const runtime = "nodejs";

export async function GET(req: NextRequest) {
  const p = new URLSearchParams();
  const period = req.nextUrl.searchParams.get("period");
  if (period) p.set("period", period);
  const qs = p.toString();
  try {
    const up = await fetch(`${backendBase()}/api/stats/customers${qs ? `?${qs}` : ""}`, {
      headers: bffHeaders(req),
      cache: "no-store",
    });
    const json = await parseUpstreamJson(up);
    return NextResponse.json(json, { status: up.status });
  } catch (e) {
    console.error("[BFF reportes/clientes]", e);
    return NextResponse.json({ error: "Error de red." }, { status: 502 });
  }
}
