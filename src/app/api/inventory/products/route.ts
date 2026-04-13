import { NextRequest, NextResponse } from "next/server";

/**
 * Proxy hacia webhook-receiver: GET /api/inventory/products
 * Requiere auth admin en el backend; el secreto solo vive en el servidor (env).
 */
export async function GET(req: NextRequest) {
  const base = process.env.WEBHOOK_RECEIVER_BASE_URL?.replace(/\/$/, "");
  const secret = process.env.WEBHOOK_ADMIN_SECRET;

  if (!base || !secret) {
    return NextResponse.json(
      {
        error: {
          code: "CONFIG",
          message:
            "Faltan WEBHOOK_RECEIVER_BASE_URL o WEBHOOK_ADMIN_SECRET en el entorno del servidor.",
        },
      },
      { status: 503 }
    );
  }

  const target = new URL(`${base}/api/inventory/products`);
  req.nextUrl.searchParams.forEach((value, key) => {
    target.searchParams.set(key, value);
  });

  const upstream = await fetch(target.toString(), {
    method: "GET",
    headers: { "X-Admin-Secret": secret },
    cache: "no-store",
  });

  const body = await upstream.text();
  return new NextResponse(body, {
    status: upstream.status,
    headers: {
      "Content-Type":
        upstream.headers.get("Content-Type") ?? "application/json",
    },
  });
}
