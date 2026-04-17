import type { NextRequest } from "next/server";
import { NextResponse } from "next/server";

export const runtime = "nodejs";

const BACKEND_URL =
  process.env.BACKEND_URL ??
  process.env.WEBHOOK_RECEIVER_BASE_URL ??
  "http://localhost:3001";

/** Path en receiver; override si tu API usa otra ruta. */
const UPSTREAM_PATH =
  (process.env.POS_PAYMENT_METHODS_UPSTREAM_PATH ?? "").trim() ||
  "/api/igtf/payment-methods";

export async function GET(req: NextRequest) {
  const base = BACKEND_URL.replace(/\/+$/, "");
  const path = UPSTREAM_PATH.startsWith("/") ? UPSTREAM_PATH : `/${UPSTREAM_PATH}`;
  const cookieHeader = req.headers.get("cookie") ?? "";
  const authHeader = req.headers.get("authorization") ?? "";

  const { searchParams } = new URL(req.url);
  const q = new URLSearchParams();
  searchParams.forEach((v, k) => q.set(k, v));

  const res = await fetch(`${base}${path}?${q}`, {
    method: "GET",
    headers: {
      Accept: "application/json",
      ...(authHeader ? { Authorization: authHeader } : {}),
      ...(cookieHeader ? { Cookie: cookieHeader } : {}),
    },
    cache: "no-store",
  });

  const text = await res.text();
  let data: unknown = {};
  if (text.trim()) {
    try {
      data = JSON.parse(text) as unknown;
    } catch {
      data = { error: { message: "Respuesta no JSON del servidor" } };
    }
  }
  return NextResponse.json(data, { status: res.status });
}
