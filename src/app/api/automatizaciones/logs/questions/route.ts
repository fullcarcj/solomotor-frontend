import type { NextRequest } from "next/server";
import { NextResponse } from "next/server";
import { backendBase, bffHeaders, parseUpstreamJson } from "@/lib/backendBff";

export const runtime = "nodejs";

const KEYS = ["status", "from", "to", "limit", "offset"] as const;

export async function GET(req: NextRequest) {
  const p = new URLSearchParams();
  for (const k of KEYS) {
    const v = req.nextUrl.searchParams.get(k);
    if (v) p.set(k, v);
  }
  const qs = p.toString();
  try {
    const up = await fetch(`${backendBase()}/api/automations/logs/questions-ia${qs ? `?${qs}` : ""}`, {
      headers: bffHeaders(req),
      cache: "no-store",
    });
    const json = await parseUpstreamJson(up);
    return NextResponse.json(json, { status: up.status });
  } catch (e) {
    console.error("[BFF automatizaciones/logs/questions]", e);
    return NextResponse.json({ error: "Error de red." }, { status: 502 });
  }
}
