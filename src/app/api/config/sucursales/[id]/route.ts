import type { NextRequest } from "next/server";
import { NextResponse } from "next/server";
import { backendBase, bffHeaders, parseUpstreamJson } from "@/lib/backendBff";

export const runtime = "nodejs";

type Ctx = { params: Promise<{ id: string }> };

export async function GET(req: NextRequest, ctx: Ctx) {
  const { id } = await ctx.params;
  try {
    const up = await fetch(`${backendBase()}/api/config/branches/${encodeURIComponent(id)}`, {
      headers: bffHeaders(req),
      cache: "no-store",
    });
    const json = await parseUpstreamJson(up);
    return NextResponse.json(json, { status: up.status });
  } catch (e) {
    console.error("[BFF config/sucursales/[id] GET]", e);
    return NextResponse.json({ error: "Error de red." }, { status: 502 });
  }
}

export async function PUT(req: NextRequest, ctx: Ctx) {
  const { id } = await ctx.params;
  try {
    const body = await req.json().catch(() => ({}));
    const up = await fetch(`${backendBase()}/api/config/branches/${encodeURIComponent(id)}`, {
      method: "PUT",
      headers: bffHeaders(req, true),
      body: JSON.stringify(body),
      cache: "no-store",
    });
    const json = await parseUpstreamJson(up);
    return NextResponse.json(json, { status: up.status });
  } catch (e) {
    console.error("[BFF config/sucursales/[id] PUT]", e);
    return NextResponse.json({ error: "Error de red." }, { status: 502 });
  }
}

export async function DELETE(_req: NextRequest, ctx: Ctx) {
  const { id } = await ctx.params;
  try {
    const up = await fetch(`${backendBase()}/api/config/branches/${encodeURIComponent(id)}`, {
      method: "DELETE",
      headers: bffHeaders(_req),
      cache: "no-store",
    });
    const json = await parseUpstreamJson(up);
    return NextResponse.json(json, { status: up.status });
  } catch (e) {
    console.error("[BFF config/sucursales/[id] DELETE]", e);
    return NextResponse.json({ error: "Error de red." }, { status: 502 });
  }
}
