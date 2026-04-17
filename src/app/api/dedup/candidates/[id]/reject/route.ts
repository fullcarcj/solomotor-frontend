import type { NextRequest } from "next/server";
import { NextResponse } from "next/server";
import { backendBase, bffHeaders, parseUpstreamJson } from "@/lib/backendBff";

export const runtime = "nodejs";

interface Ctx {
  params: Promise<{ id: string }>;
}

/** BFF → POST /api/dedup/candidates/:id/reject */
export async function POST(req: NextRequest, ctx: Ctx) {
  try {
    const { id } = await ctx.params;
    if (!/^\d+$/.test(id)) {
      return NextResponse.json({ error: "invalid_id" }, { status: 400 });
    }
    const up = await fetch(`${backendBase()}/api/dedup/candidates/${id}/reject`, {
      method: "POST",
      headers: bffHeaders(req, true),
      body: "{}",
      cache: "no-store",
    });
    const json = await parseUpstreamJson(up);
    return NextResponse.json(json, { status: up.status });
  } catch (e) {
    console.error("[BFF dedup/reject]", e);
    return NextResponse.json({ error: "Error de red." }, { status: 502 });
  }
}
