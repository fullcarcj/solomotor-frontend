import type { NextRequest } from "next/server";
import { NextResponse } from "next/server";
import { backendBase, bffHeaders, parseUpstreamJson } from "@/lib/backendBff";

export const runtime = "nodejs";

export async function GET(req: NextRequest) {
  try {
    const up = await fetch(`${backendBase()}/api/automations/config/post-sale`, {
      headers: bffHeaders(req),
      cache: "no-store",
    });
    const json = await parseUpstreamJson(up);
    return NextResponse.json(json, { status: up.status });
  } catch (e) {
    console.error("[BFF automatizaciones/config/post-sale GET]", e);
    return NextResponse.json({ error: "Error de red." }, { status: 502 });
  }
}
