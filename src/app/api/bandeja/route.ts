import type { NextRequest } from "next/server";
import { NextResponse } from "next/server";
import { isBandejaBffVerbose, receiverBase, receiverJsonHeaders } from "@/lib/bandejaReceiverProxy";

export const runtime = "nodejs";
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
    const up = await fetch(`${receiverBase()}/api/inbox?${p}`, { headers: receiverJsonHeaders(req), cache: "no-store" });
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
