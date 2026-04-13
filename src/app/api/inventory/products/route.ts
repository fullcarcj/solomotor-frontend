import { NextRequest, NextResponse } from "next/server";
import {
  getWebhookAdminSecret,
  getWebhookReceiverBaseUrl,
} from "@/lib/inventoryWebhookProxyEnv";

/**
 * Proxy hacia webhook-receiver: GET /api/inventory/products
 * Requiere auth admin en el backend; el secreto solo vive en el servidor (env).
 */
export async function GET(req: NextRequest) {
  const base = getWebhookReceiverBaseUrl();
  const secret = getWebhookAdminSecret();

  if (!base) {
    return NextResponse.json(
      {
        error: {
          code: "CONFIG",
          message:
            "Falta WEBHOOK_RECEIVER_BASE_URL (URL base del webhook-receiver, sin barra final). En local: .env.local y reinicia `next dev`. En Render: Environment del servicio Next → Save → redeploy.",
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
            "Falta secreto admin para el proxy: define WEBHOOK_ADMIN_SECRET o ADMIN_SECRET (mismo valor que ADMIN_SECRET del webhook-receiver). En Render: Environment del servicio frontend → Save → Manual Deploy.",
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
