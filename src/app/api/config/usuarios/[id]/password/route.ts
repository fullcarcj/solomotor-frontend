import type { NextRequest } from "next/server";
import { NextResponse } from "next/server";
import { backendBase, bffHeaders, parseUpstreamJson } from "@/lib/backendBff";

export const runtime = "nodejs";

type Ctx = { params: Promise<{ id: string }> };

export async function POST(req: NextRequest, ctx: Ctx) {
  const { id } = await ctx.params;
  try {
    const body = await req.json().catch(() => ({}));
    const up = await fetch(`${backendBase()}/api/users/${encodeURIComponent(id)}/change-password`, {
      method: "POST",
      headers: bffHeaders(req, true),
      body: JSON.stringify(body),
      cache: "no-store",
    });
    const json = await parseUpstreamJson(up);
    return NextResponse.json(json, { status: up.status });
  } catch (e) {
    console.error("[BFF config/usuarios/[id]/password]", e);
    return NextResponse.json({ error: "Error de red." }, { status: 502 });
  }
}
