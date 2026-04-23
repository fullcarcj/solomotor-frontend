import type { NextRequest } from "next/server";
import { NextResponse } from "next/server";
export const runtime = "nodejs";
const BACKEND_URL = process.env.BACKEND_URL ?? process.env.WEBHOOK_RECEIVER_BASE_URL ?? "http://localhost:3001";
function base() { const r = BACKEND_URL.trim().replace(/\/+$/, ""); return /^https?:\/\//i.test(r) ? r : `https://${r}`; }
function hdr(req: NextRequest) {
  return { "Content-Type": "application/json", Accept: "application/json", cookie: req.headers.get("cookie") ?? "", ...(req.headers.get("authorization") ? { authorization: req.headers.get("authorization")! } : {}) };
}
export async function GET(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await params;
    const up = await fetch(`${base()}/api/suppliers/${encodeURIComponent(id)}`, { headers: hdr(req), cache: "no-store" });
    return NextResponse.json(await up.json().catch(() => ({})), { status: up.status });
  } catch (e) { console.error("[BFF proveedores/[id] GET]", e); return NextResponse.json({ error: "Error de red." }, { status: 502 }); }
}
export async function PATCH(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await params;
    const body: unknown = await req.json().catch(() => ({}));
    const up = await fetch(`${base()}/api/suppliers/${encodeURIComponent(id)}`, { method: "PATCH", headers: hdr(req), body: JSON.stringify(body), cache: "no-store" });
    return NextResponse.json(await up.json().catch(() => ({})), { status: up.status });
  } catch (e) { console.error("[BFF proveedores/[id] PATCH]", e); return NextResponse.json({ error: "Error de red." }, { status: 502 }); }
}
export async function DELETE(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await params;
    const up = await fetch(`${base()}/api/suppliers/${encodeURIComponent(id)}`, { method: "DELETE", headers: hdr(req), cache: "no-store" });
    return NextResponse.json(await up.json().catch(() => ({})), { status: up.status });
  } catch (e) { console.error("[BFF proveedores/[id] DELETE]", e); return NextResponse.json({ error: "Error de red." }, { status: 502 }); }
}
