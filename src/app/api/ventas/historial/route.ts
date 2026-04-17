import type { NextRequest } from "next/server";
import { NextResponse } from "next/server";

export const runtime = "nodejs";

const BACKEND_URL =
  process.env.BACKEND_URL ??
  process.env.WEBHOOK_RECEIVER_BASE_URL ??
  "http://localhost:3001";

/** Reenviados desde el query del cliente (no incluye include_completed — forzado abajo). */
const FORWARD_KEYS = [
  "limit",
  "offset",
  "status",
  "source",
  "from",
  "to",
  "customer_id",
] as const;

/**
 * BFF historial de pedidos procesados/cerrados.
 * Mismo upstream que /api/ventas/pedidos pero con include_completed=1 siempre.
 * El backend filtra órdenes completadas/canceladas según canal; el frontend no replica esa lógica.
 */
export async function GET(req: NextRequest) {
  const base = BACKEND_URL.replace(/\/+$/, "");
  const { searchParams } = new URL(req.url);
  const params = new URLSearchParams();

  params.set("include_completed", "1");

  FORWARD_KEYS.forEach((k) => {
    const v = searchParams.get(k);
    if (v != null && v !== "") params.set(k, v);
  });

  const cookieHeader = req.headers.get("cookie") ?? "";
  const authHeader = req.headers.get("authorization") ?? "";

  const res = await fetch(`${base}/api/sales?${params}`, {
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
