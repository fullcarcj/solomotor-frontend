import type { NextRequest } from "next/server";
import { NextResponse } from "next/server";
import { isBandejaBffVerbose } from "@/lib/bandejaReceiverProxy";

export const runtime = "nodejs";
const BACKEND_URL = process.env.BACKEND_URL ?? process.env.WEBHOOK_RECEIVER_BASE_URL ?? "http://localhost:3001";
function base() { const r = BACKEND_URL.trim().replace(/\/+$/, ""); return /^https?:\/\//i.test(r) ? r : `https://${r}`; }
function hdr(req: NextRequest) {
  return { "Content-Type": "application/json", Accept: "application/json", cookie: req.headers.get("cookie") ?? "", ...(req.headers.get("authorization") ? { authorization: req.headers.get("authorization")! } : {}) };
}
const FWD = ["filter", "src", "search", "cursor", "limit", "stage", "result", "pipeline_default"] as const;

let _seqBandeja = 0;

export async function GET(req: NextRequest) {
  const p = new URLSearchParams();
  for (const k of FWD) { const v = req.nextUrl.searchParams.get(k); if (v !== null && v !== "") p.set(k, v); }
  if (!p.has("limit")) p.set("limit", "30");

  const verbose = isBandejaBffVerbose();
  const seq = ++_seqBandeja;
  const t0 = verbose ? Date.now() : 0;
  if (verbose) console.log(`[BFF bandeja GET #${seq}] → ${p}`);

  try {
    const up = await fetch(`${base()}/api/inbox?${p}`, { headers: hdr(req), cache: "no-store" });
    const json = await up.json().catch(() => ({}));
    if (verbose) {
      const ms = Date.now() - t0;
      const n = (json as Record<string, unknown[]>).chats?.length ?? "?";
      console.log(`[BFF bandeja GET #${seq}] ← ${up.status} en ${ms}ms (${n} chats)`);
    }
    return NextResponse.json(json, {
      status: up.status,
      headers: {
        "Cache-Control": "private, no-store, max-age=0, must-revalidate",
      },
    });
  } catch (e) {
    if (verbose) console.log(`[BFF bandeja GET #${seq}] ← ERROR en ${Date.now() - t0}ms`);
    console.error("[BFF bandeja GET]", e);
    return NextResponse.json({ error: "Error de red." }, { status: 502 });
  }
}
