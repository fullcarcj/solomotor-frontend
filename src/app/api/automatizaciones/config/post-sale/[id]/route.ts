import type { NextRequest } from "next/server";
import { NextResponse } from "next/server";
import { backendBase, bffHeaders, parseUpstreamJson } from "@/lib/backendBff";

export const runtime = "nodejs";

export async function PATCH(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  try {
    const body = await req.text();
    const up = await fetch(`${backendBase()}/api/automations/config/post-sale/${encodeURIComponent(id)}`, {
      method: "PATCH",
      headers: bffHeaders(req, true),
      body,
      cache: "no-store",
    });
    const json = await parseUpstreamJson(up);
    return NextResponse.json(json, { status: up.status });
  } catch (e) {
    console.error("[BFF automatizaciones/config/post-sale PATCH]", e);
    return NextResponse.json({ error: "Error de red." }, { status: 502 });
  }
}
