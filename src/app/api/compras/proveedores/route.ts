import type { NextRequest } from "next/server";
import { NextResponse } from "next/server";
export const runtime = "nodejs";
const BACKEND_URL = process.env.BACKEND_URL ?? process.env.WEBHOOK_RECEIVER_BASE_URL ?? "http://localhost:3001";
function base() { const r = BACKEND_URL.trim().replace(/\/+$/, ""); return /^https?:\/\//i.test(r) ? r : `https://${r}`; }
function headers(req: NextRequest) {
  return { "Content-Type": "application/json", Accept: "application/json", cookie: req.headers.get("cookie") ?? "", ...(req.headers.get("authorization") ? { authorization: req.headers.get("authorization")! } : {}) };
}
export async function GET(req: NextRequest) {
  const p = new URLSearchParams();
  for (const k of ["search", "is_active", "limit", "offset"] as const) { const v = req.nextUrl.searchParams.get(k); if (v !== null && v !== "") p.set(k, v); }
  if (!p.has("limit")) p.set("limit", "50");
  try {
    const up = await fetch(`${base()}/api/suppliers?${p}`, { headers: headers(req), cache: "no-store" });
    return NextResponse.json(await up.json().catch(() => ({})), { status: up.status });
  } catch (e) { console.error("[BFF compras/proveedores GET]", e); return NextResponse.json({ error: "Error de red." }, { status: 502 }); }
}
export async function POST(req: NextRequest) {
  try {
    const body: unknown = await req.json().catch(() => ({}));
    const up = await fetch(`${base()}/api/suppliers`, { method: "POST", headers: headers(req), body: JSON.stringify(body), cache: "no-store" });
    return NextResponse.json(await up.json().catch(() => ({})), { status: up.status });
  } catch (e) { console.error("[BFF compras/proveedores POST]", e); return NextResponse.json({ error: "Error de red." }, { status: 502 }); }
}
