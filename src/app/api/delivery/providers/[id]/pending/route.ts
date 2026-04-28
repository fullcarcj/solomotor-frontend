import type { NextRequest } from "next/server";
import { NextResponse } from "next/server";
import { backendBase, bffHeaders, parseUpstreamJson } from "@/lib/backendBff";

export const runtime = "nodejs";

type Ctx = { params: Promise<{ id: string }> };

export async function GET(req: NextRequest, ctx: Ctx) {
  try {
    const { id } = await ctx.params;
    const up = await fetch(
      `${backendBase()}/api/delivery/providers/${encodeURIComponent(id)}/pending`,
      { headers: bffHeaders(req), cache: "no-store" }
    );
    const json = await parseUpstreamJson(up);
    return NextResponse.json(json, { status: up.status });
  } catch (e) {
    console.error("[BFF delivery/providers/[id]/pending]", e);
    return NextResponse.json({ error: "Error de red." }, { status: 502 });
  }
}
