import type { NextRequest } from "next/server";
import { NextResponse } from "next/server";
import { backendBase, bffHeaders, parseUpstreamJson } from "@/lib/backendBff";

export const runtime = "nodejs";

type Ctx = { params: Promise<{ id: string }> };

export async function PATCH(req: NextRequest, ctx: Ctx) {
  try {
    const { id } = await ctx.params;
    const body = await req.json().catch(() => ({}));
    const up = await fetch(
      `${backendBase()}/api/delivery/services/${encodeURIComponent(id)}/deliver`,
      {
        method: "PATCH",
        headers: bffHeaders(req, true),
        body: JSON.stringify(body),
        cache: "no-store",
      }
    );
    const json = await parseUpstreamJson(up);
    return NextResponse.json(json, { status: up.status });
  } catch (e) {
    console.error("[BFF delivery/services/[id]/deliver]", e);
    return NextResponse.json({ error: "Error de red." }, { status: 502 });
  }
}
