import type { NextRequest } from "next/server";
import { NextResponse } from "next/server";
export const runtime = "nodejs";
export const dynamic = "force-dynamic";
const BACKEND_URL = process.env.BACKEND_URL ?? process.env.WEBHOOK_RECEIVER_BASE_URL ?? "http://localhost:3001";
function base() { const r = BACKEND_URL.trim().replace(/\/+$/, ""); return /^https?:\/\//i.test(r) ? r : `https://${r}`; }
function hdr(req: NextRequest) {
  return { "Content-Type": "application/json", Accept: "application/json", cookie: req.headers.get("cookie") ?? "", ...(req.headers.get("authorization") ? { authorization: req.headers.get("authorization")! } : {}) };
}
const FWD = ["src", "stage", "result", "search", "pipeline_default", "facets"] as const;

/** Vercel/Node: polling de counts puede superar 10s si la DB está cargada. */
export const maxDuration = 60;

export async function GET(req: NextRequest) {
  try {
    const p = new URLSearchParams();
    for (const k of FWD) {
      const v = req.nextUrl.searchParams.get(k);
      if (v !== null && v !== "") p.set(k, v);
    }
    const qs = p.toString();
    const targetUrl = `${base()}/api/inbox/counts${qs ? `?${qs}` : ""}`;
    const up = await fetch(targetUrl, { headers: hdr(req), cache: "no-store" });
    return NextResponse.json(await up.json().catch(() => ({})), {
      status: up.status,
      headers: {
        "Cache-Control": "private, no-store, max-age=0, must-revalidate",
      },
    });
  } catch (e) { console.error("[BFF bandeja/counts GET]", e); return NextResponse.json({ error: "Error de red." }, { status: 502 }); }
}
