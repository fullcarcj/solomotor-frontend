import type { NextRequest } from "next/server";
import { NextResponse } from "next/server";
export const runtime = "nodejs";
const BACKEND_URL = process.env.BACKEND_URL ?? process.env.WEBHOOK_RECEIVER_BASE_URL ?? "http://localhost:3001";
function base() { const r = BACKEND_URL.trim().replace(/\/+$/, ""); return /^https?:\/\//i.test(r) ? r : `https://${r}`; }
export async function POST(req: NextRequest) {
  try {
    const body: unknown = await req.json().catch(() => ({}));
    const up = await fetch(`${base()}/api/dispatch/request`, { method: "POST", headers: { "Content-Type": "application/json", cookie: req.headers.get("cookie") ?? "", ...(req.headers.get("authorization") ? { authorization: req.headers.get("authorization")! } : {}) }, body: JSON.stringify(body), cache: "no-store" });
    return NextResponse.json(await up.json().catch(() => ({})), { status: up.status });
  } catch (e) { console.error("[BFF logistica/request]", e); return NextResponse.json({ error: "Error de red." }, { status: 502 }); }
}
