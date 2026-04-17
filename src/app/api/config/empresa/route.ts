import type { NextRequest } from "next/server";
import { NextResponse } from "next/server";
import { backendBase, bffHeaders, parseUpstreamJson } from "@/lib/backendBff";

export const runtime = "nodejs";

export async function GET(req: NextRequest) {
  try {
    const up = await fetch(`${backendBase()}/api/config/company`, {
      headers: bffHeaders(req),
      cache: "no-store",
    });
    const json = await parseUpstreamJson(up);
    return NextResponse.json(json, { status: up.status });
  } catch (e) {
    console.error("[BFF config/empresa GET]", e);
    return NextResponse.json({ error: "Error de red." }, { status: 502 });
  }
}

export async function PUT(req: NextRequest) {
  try {
    const body = await req.json().catch(() => ({}));
    const up = await fetch(`${backendBase()}/api/config/company`, {
      method: "PUT",
      headers: bffHeaders(req, true),
      body: JSON.stringify(body),
      cache: "no-store",
    });
    const json = await parseUpstreamJson(up);
    return NextResponse.json(json, { status: up.status });
  } catch (e) {
    console.error("[BFF config/empresa PUT]", e);
    return NextResponse.json({ error: "Error de red." }, { status: 502 });
  }
}
