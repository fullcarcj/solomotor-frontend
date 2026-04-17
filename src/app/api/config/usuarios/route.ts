import type { NextRequest } from "next/server";
import { NextResponse } from "next/server";
import { backendBase, bffHeaders, parseUpstreamJson } from "@/lib/backendBff";

export const runtime = "nodejs";

export async function GET(req: NextRequest) {
  const p = new URLSearchParams();
  const role = req.nextUrl.searchParams.get("role");
  const status = req.nextUrl.searchParams.get("status");
  if (role) p.set("role", role);
  if (status) p.set("status", status);
  const qs = p.toString();
  try {
    const up = await fetch(`${backendBase()}/api/users${qs ? `?${qs}` : ""}`, {
      headers: bffHeaders(req),
      cache: "no-store",
    });
    const json = await parseUpstreamJson(up);
    return NextResponse.json(json, { status: up.status });
  } catch (e) {
    console.error("[BFF config/usuarios GET]", e);
    return NextResponse.json({ error: "Error de red." }, { status: 502 });
  }
}

export async function POST(req: NextRequest) {
  try {
    const body = await req.json().catch(() => ({}));
    const up = await fetch(`${backendBase()}/api/users`, {
      method: "POST",
      headers: bffHeaders(req, true),
      body: JSON.stringify(body),
      cache: "no-store",
    });
    const json = await parseUpstreamJson(up);
    return NextResponse.json(json, { status: up.status });
  } catch (e) {
    console.error("[BFF config/usuarios POST]", e);
    return NextResponse.json({ error: "Error de red." }, { status: 502 });
  }
}
