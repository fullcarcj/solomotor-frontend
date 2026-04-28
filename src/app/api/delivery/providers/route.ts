import type { NextRequest } from "next/server";
import { NextResponse } from "next/server";
import { backendBase, bffHeaders, parseUpstreamJson } from "@/lib/backendBff";

export const runtime = "nodejs";

export async function GET(req: NextRequest) {
  try {
    const up = await fetch(`${backendBase()}/api/delivery/providers`, {
      headers: bffHeaders(req),
      cache: "no-store",
    });
    const json = await parseUpstreamJson(up);
    return NextResponse.json(json, { status: up.status });
  } catch (e) {
    console.error("[BFF delivery/providers GET]", e);
    return NextResponse.json({ error: "Error de red." }, { status: 502 });
  }
}

export async function POST(req: NextRequest) {
  try {
    const body = await req.json().catch(() => ({}));
    const up = await fetch(`${backendBase()}/api/delivery/providers`, {
      method: "POST",
      headers: bffHeaders(req, true),
      body: JSON.stringify(body),
      cache: "no-store",
    });
    const json = await parseUpstreamJson(up);
    return NextResponse.json(json, { status: up.status });
  } catch (e) {
    console.error("[BFF delivery/providers POST]", e);
    return NextResponse.json({ error: "Error de red." }, { status: 502 });
  }
}
