import { NextRequest, NextResponse } from "next/server";

/**
 * Proxy hacia webhook-receiver: GET /api/inventory/products
 * Requiere auth admin en el backend; el secreto solo vive en el servidor (env).
 */
export async function GET(req: NextRequest) {
  const base = process.env.WEBHOOK_RECEIVER_BASE_URL?.trim().replace(/\/$/, "");
  const secret = process.env.WEBHOOK_ADMIN_SECRET?.trim();

  if (!base) {
    return NextResponse.json(
      {
        error: {
          code: "CONFIG",
          message:
            "Falta WEBHOOK_RECEIVER_BASE_URL (URL base del webhook-receiver, sin barra final). Añádela en .env o .env.local y reinicia `next dev`.",
        },
      },
      { status: 503 }
    );
  }
  if (!secret) {
    return NextResponse.json(
      {
        error: {
          code: "CONFIG",
          message:
            "Falta WEBHOOK_ADMIN_SECRET. Debe ser el mismo valor que ADMIN_SECRET del backend. Añádelo en .env o .env.local y reinicia `next dev`.",
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
