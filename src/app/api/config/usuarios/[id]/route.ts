import type { NextRequest } from "next/server";
import { NextResponse } from "next/server";
import { backendBase, bffHeaders, parseUpstreamJson } from "@/lib/backendBff";

export const runtime = "nodejs";

type Ctx = { params: Promise<{ id: string }> };

export async function GET(req: NextRequest, ctx: Ctx) {
  const { id } = await ctx.params;
  try {
    const up = await fetch(`${backendBase()}/api/users/${encodeURIComponent(id)}`, {
      headers: bffHeaders(req),
      cache: "no-store",
    });
    const json = await parseUpstreamJson(up);
    return NextResponse.json(json, { status: up.status });
  } catch (e) {
    console.error("[BFF config/usuarios/[id] GET]", e);
    return NextResponse.json({ error: "Error de red." }, { status: 502 });
  }
}

export async function PATCH(req: NextRequest, ctx: Ctx) {
  const { id } = await ctx.params;
  try {
    const body = await req.json().catch(() => ({}));
    const up = await fetch(`${backendBase()}/api/users/${encodeURIComponent(id)}`, {
      method: "PATCH",
      headers: bffHeaders(req, true),
      body: JSON.stringify(body),
      cache: "no-store",
    });
    const json = await parseUpstreamJson(up);
    return NextResponse.json(json, { status: up.status });
  } catch (e) {
    console.error("[BFF config/usuarios/[id] PATCH]", e);
    return NextResponse.json({ error: "Error de red." }, { status: 502 });
  }
}
