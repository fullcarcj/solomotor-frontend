import type { NextRequest } from "next/server";
import { NextResponse } from "next/server";

export const runtime = "nodejs";

const BACKEND_URL =
  process.env.BACKEND_URL ??
  process.env.WEBHOOK_RECEIVER_BASE_URL ??
  "http://localhost:3001";

function backendBase(): string {
  const raw = BACKEND_URL.trim().replace(/\/+$/, "");
  if (!raw) return "http://localhost:3001";
  if (!/^https?:\/\//i.test(raw)) return `https://${raw}`;
  return raw;
}

/** POST → backend POST /api/customers (crear ficha CRM). */
export async function POST(req: NextRequest) {
  const base = backendBase();
  let body: unknown;
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: "invalid_json" }, { status: 400 });
  }
  try {
    const upstream = await fetch(`${base}/api/customers`, {
      method: "POST",
      headers: {
        Accept: "application/json",
        "Content-Type": "application/json",
        cookie: req.headers.get("cookie") ?? "",
        ...(req.headers.get("authorization")
          ? { authorization: req.headers.get("authorization")! }
          : {}),
      },
      body: JSON.stringify(body),
      cache: "no-store",
    });
    const json: unknown = await upstream.json().catch(() => ({}));
    return NextResponse.json(json, { status: upstream.status });
  } catch (err) {
    console.error("[BFF /api/clientes/nuevo]", err);
    return NextResponse.json(
      { error: "Error de red al conectar con el backend." },
      { status: 502 }
    );
  }
}
