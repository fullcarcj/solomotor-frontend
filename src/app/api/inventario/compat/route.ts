import type { NextRequest } from "next/server";
import { NextResponse } from "next/server";
export const runtime = "nodejs";
const BACKEND_URL = process.env.BACKEND_URL ?? process.env.WEBHOOK_RECEIVER_BASE_URL ?? "http://localhost:3001";
function base() { const r = BACKEND_URL.trim().replace(/\/+$/, ""); return /^https?:\/\//i.test(r) ? r : `https://${r}`; }
const API_KEY = process.env.FRONTEND_API_KEY ?? "";
const FWD = ["make", "model", "year", "displacement_l", "limit", "offset"] as const;
export async function GET(req: NextRequest) {
  const p = new URLSearchParams();
  for (const k of FWD) { const v = req.nextUrl.searchParams.get(k); if (v !== null && v !== "") p.set(k, v); }
  try {
    const up = await fetch(`${base()}/api/v1/catalog/compat/search?${p}`, {
      headers: { "Content-Type": "application/json", Accept: "application/json", "X-API-KEY": API_KEY },
      cache: "no-store",
    });
    return NextResponse.json(await up.json().catch(() => ({})), { status: up.status });
  } catch (e) { console.error("[BFF inventario/compat GET]", e); return NextResponse.json({ error: "Error de red." }, { status: 502 }); }
}
