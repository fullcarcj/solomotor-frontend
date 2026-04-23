import type { NextRequest } from "next/server";
import { NextResponse } from "next/server";
export const runtime = "nodejs";
const BACKEND_URL = process.env.BACKEND_URL ?? process.env.WEBHOOK_RECEIVER_BASE_URL ?? "http://localhost:3001";
function base() { const r = BACKEND_URL.trim().replace(/\/+$/, ""); return /^https?:\/\//i.test(r) ? r : `https://${r}`; }
function hdr(req: NextRequest) {
  return { "Content-Type": "application/json", Accept: "application/json", cookie: req.headers.get("cookie") ?? "", ...(req.headers.get("authorization") ? { authorization: req.headers.get("authorization")! } : {}) };
}
const FWD = ["from", "to", "page", "page_size", "bin_id"] as const;
export async function GET(req: NextRequest, { params }: { params: Promise<{ sku: string }> }) {
  const p = new URLSearchParams();
  for (const k of FWD) { const v = req.nextUrl.searchParams.get(k); if (v !== null && v !== "") p.set(k, v); }
  try {
    const { sku } = await params;
    const up = await fetch(`${base()}/api/wms/movements/${encodeURIComponent(sku)}?${p}`, { headers: hdr(req), cache: "no-store" });
    return NextResponse.json(await up.json().catch(() => ({})), { status: up.status });
  } catch (e) { console.error("[BFF movimientos/sku GET]", e); return NextResponse.json({ error: "Error de red." }, { status: 502 }); }
}
