import type { NextRequest } from "next/server";
import { NextResponse } from "next/server";
export const runtime = "nodejs";

const B = process.env.BACKEND_URL ?? process.env.WEBHOOK_RECEIVER_BASE_URL ?? "http://localhost:3001";
function base() { const r = B.trim().replace(/\/+$/, ""); return /^https?:\/\//i.test(r) ? r : `https://${r}`; }
function hdr(req: NextRequest) {
  return {
    "Content-Type": "application/json",
    Accept: "application/json",
    cookie: req.headers.get("cookie") ?? "",
    ...(req.headers.get("authorization") ? { authorization: req.headers.get("authorization")! } : {}),
  };
}

export async function POST(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await params;
    const body   = await req.text();
    const up = await fetch(`${base()}/api/fbmp-edge/threads/${id}/reply`, {
      method: "POST",
      headers: hdr(req),
      body,
    });
    return NextResponse.json(await up.json().catch(() => ({})), { status: up.status });
  } catch (e) {
    console.error("[BFF fbmp-edge/threads/reply]", e);
    return NextResponse.json({ error: "Error de red." }, { status: 502 });
  }
}
