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

export async function GET() {
  const base = backendBase();
  try {
    const upstream = await fetch(`${base}/api/igtf/payment-methods`, { cache: "no-store" });
    const json: unknown = await upstream.json().catch(() => ({}));
    return NextResponse.json(json, { status: upstream.status });
  } catch (err) {
    console.error("[BFF /api/finanzas/igtf/payment-methods]", err);
    return NextResponse.json({ error: "Error de red al conectar con el backend." }, { status: 502 });
  }
}
