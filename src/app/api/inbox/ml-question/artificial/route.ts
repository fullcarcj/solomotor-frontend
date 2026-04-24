import type { NextRequest } from "next/server";
import { NextResponse } from "next/server";

export const runtime = "nodejs";

const BACKEND_URL = process.env.BACKEND_URL ?? process.env.WEBHOOK_RECEIVER_BASE_URL ?? "http://localhost:3001";

function base() {
  const r = BACKEND_URL.trim().replace(/\/+$/, "");
  return /^https?:\/\//i.test(r) ? r : `https://${r}`;
}

function hdr(req: NextRequest) {
  return {
    "Content-Type": "application/json",
    Accept: "application/json",
    ...(req.headers.get("cookie") ? { cookie: req.headers.get("cookie")! } : {}),
    ...(req.headers.get("authorization") ? { authorization: req.headers.get("authorization")! } : {}),
  };
}

/** BFF → POST /api/inbox/ml-question/artificial — pregunta de prueba sin broadcast SSE */
export async function POST(req: NextRequest) {
  const body: unknown = await req.json().catch(() => ({}));
  const targetUrl = `${base()}/api/inbox/ml-question/artificial`;

  try {
    const up = await fetch(targetUrl, {
      method: "POST",
      headers: hdr(req),
      body: JSON.stringify(body),
      cache: "no-store",
    });
    const text = await up.text();
    let data: unknown = {};
    try {
      data = text.trim() ? (JSON.parse(text) as unknown) : {};
    } catch {
      data = { raw: text.slice(0, 500) };
    }
    return NextResponse.json(data, { status: up.status });
  } catch (e) {
    console.error("[BFF inbox/ml-question/artificial]", e);
    return NextResponse.json({ error: "Error de red." }, { status: 502 });
  }
}
