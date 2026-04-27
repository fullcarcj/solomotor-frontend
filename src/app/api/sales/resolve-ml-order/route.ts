import type { NextRequest } from "next/server";
import { NextResponse } from "next/server";

export const runtime = "nodejs";

const BACKEND_URL =
  process.env.BACKEND_URL ??
  process.env.WEBHOOK_RECEIVER_BASE_URL ??
  "http://localhost:3001";

/** Misma lógica que `GET /api/ventas/pedidos/resolve-ml-order` — alias directo al backend. */
export async function GET(req: NextRequest) {
  const base = BACKEND_URL.replace(/\/+$/, "");
  const mlOrderId = req.nextUrl.searchParams.get("ml_order_id");
  if (mlOrderId == null || String(mlOrderId).trim() === "") {
    return NextResponse.json(
      { error: "Falta ml_order_id", code: "BAD_REQUEST" },
      { status: 400 }
    );
  }
  const params = new URLSearchParams();
  params.set("ml_order_id", String(mlOrderId).trim());

  const cookieHeader = req.headers.get("cookie") ?? "";
  const authHeader = req.headers.get("authorization") ?? "";

  const res = await fetch(`${base}/api/sales/resolve-ml-order?${params.toString()}`, {
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
