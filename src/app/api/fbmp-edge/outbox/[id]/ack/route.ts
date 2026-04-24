import type { NextRequest } from "next/server";
import { NextResponse } from "next/server";
export const runtime = "nodejs";

const B = process.env.BACKEND_URL ?? process.env.WEBHOOK_RECEIVER_BASE_URL ?? "http://localhost:3001";
function base() { const r = B.trim().replace(/\/+$/, ""); return /^https?:\/\//i.test(r) ? r : `https://${r}`; }

export async function POST(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await params;
    const up = await fetch(`${base()}/api/fbmp-edge/outbox/${id}/ack`, {
      method: "POST",
      headers: {
        Accept: "application/json",
        ...(req.headers.get("authorization") ? { authorization: req.headers.get("authorization")! } : {}),
      },
    });
    return NextResponse.json(await up.json().catch(() => ({})), { status: up.status });
  } catch (e) {
    console.error("[BFF fbmp-edge/outbox/ack]", e);
    return NextResponse.json({ error: "Error de red." }, { status: 502 });
  }
}
