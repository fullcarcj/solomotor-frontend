import type { NextRequest } from "next/server";
import { NextResponse } from "next/server";
export const runtime = "nodejs";
const BACKEND_URL = process.env.BACKEND_URL ?? process.env.WEBHOOK_RECEIVER_BASE_URL ?? "http://localhost:3001";
function base() { const r = BACKEND_URL.trim().replace(/\/+$/, ""); return /^https?:\/\//i.test(r) ? r : `https://${r}`; }
const API_KEY = process.env.FRONTEND_API_KEY ?? "";
export async function GET(req: NextRequest) {
  const p = new URLSearchParams();
  const sku = req.nextUrl.searchParams.get("sku");
  const limit = req.nextUrl.searchParams.get("limit");
  if (!sku) return NextResponse.json({ error: "Parámetro 'sku' requerido." }, { status: 400 });
  p.set("sku", sku);
  if (limit) p.set("limit", limit);
  try {
    const up = await fetch(`${base()}/api/v1/catalog/compat/equivalences?${p}`, {
      headers: { "Content-Type": "application/json", Accept: "application/json", "X-API-KEY": API_KEY },
      cache: "no-store",
    });
    return NextResponse.json(await up.json().catch(() => ({})), { status: up.status });
  } catch (e) { console.error("[BFF inventario/equivalencias GET]", e); return NextResponse.json({ error: "Error de red." }, { status: 502 }); }
}
