import type { NextRequest } from "next/server";
import { NextResponse } from "next/server";
import { receiverBase, receiverJsonHeaders } from "@/lib/bandejaReceiverProxy";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";
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
    const targetUrl = `${receiverBase()}/api/inbox/counts${qs ? `?${qs}` : ""}`;
    const up = await fetch(targetUrl, { headers: receiverJsonHeaders(req), cache: "no-store" });
    return NextResponse.json(await up.json().catch(() => ({})), {
      status: up.status,
      headers: {
        "Cache-Control": "private, no-store, max-age=0, must-revalidate",
      },
    });
  } catch (e) {
    const msg = e instanceof Error ? e.message : String(e);
    console.error("[BFF bandeja/counts GET]", msg, "→", receiverBase());
    return NextResponse.json(
      {
        error: "bff_upstream_failed",
        message: "No se pudo contactar al receptor (webhook-receiver). Comprobá que esté en marcha y BACKEND_URL (p. ej. http://localhost:3001).",
        detail: process.env.NODE_ENV === "development" ? msg : undefined,
      },
      { status: 502 }
    );
  }
}
