import { NextResponse } from "next/server";
import {
  getWebhookAdminSecret,
  getWebhookReceiverBaseUrl,
} from "@/lib/inventoryWebhookProxyEnv";

/**
 * Proxy GET → webhook-receiver /api/inventory/category-products
 * (lista category_products; secreto solo en servidor).
 */
export async function GET() {
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

  const upstream = await fetch(
    `${base}/api/inventory/category-products`,
    {
      method: "GET",
      headers: { "X-Admin-Secret": secret },
      cache: "no-store",
    }
  );

  const body = await upstream.text();
  return new NextResponse(body, {
    status: upstream.status,
    headers: {
      "Content-Type":
        upstream.headers.get("Content-Type") ?? "application/json",
    },
  });
}
