import type { NextRequest } from "next/server";
import { NextResponse } from "next/server";
export const runtime = "nodejs";

const B = process.env.BACKEND_URL ?? process.env.WEBHOOK_RECEIVER_BASE_URL ?? "http://localhost:3001";
function base() { const r = B.trim().replace(/\/+$/, ""); return /^https?:\/\//i.test(r) ? r : `https://${r}`; }

/** Proxy transparente: reenvía Authorization (Bearer de la extensión) y body. */
export async function POST(req: NextRequest) {
  try {
    const body = await req.text();
    const up = await fetch(`${base()}/api/fbmp-edge/ingest`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Accept: "application/json",
        ...(req.headers.get("authorization") ? { authorization: req.headers.get("authorization")! } : {}),
      },
      body,
    });
    return NextResponse.json(await up.json().catch(() => ({})), { status: up.status });
  } catch (e) {
    console.error("[BFF fbmp-edge/ingest]", e);
    return NextResponse.json({ error: "Error de red." }, { status: 502 });
  }
}
