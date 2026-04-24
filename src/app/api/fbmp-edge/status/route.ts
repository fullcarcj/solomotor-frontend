import type { NextRequest } from "next/server";
import { NextResponse } from "next/server";
export const runtime = "nodejs";

const B = process.env.BACKEND_URL ?? process.env.WEBHOOK_RECEIVER_BASE_URL ?? "http://localhost:3001";
function base() { const r = B.trim().replace(/\/+$/, ""); return /^https?:\/\//i.test(r) ? r : `https://${r}`; }
function hdr(req: NextRequest) {
  return {
    Accept: "application/json",
    cookie: req.headers.get("cookie") ?? "",
    ...(req.headers.get("authorization") ? { authorization: req.headers.get("authorization")! } : {}),
  };
}

export async function GET(req: NextRequest) {
  try {
    const up = await fetch(`${base()}/api/fbmp-edge/status`, { headers: hdr(req), cache: "no-store" });
    return NextResponse.json(await up.json().catch(() => ({})), { status: up.status });
  } catch (e) {
    console.error("[BFF fbmp-edge/status]", e);
    return NextResponse.json({ error: "Error de red." }, { status: 502 });
  }
}
