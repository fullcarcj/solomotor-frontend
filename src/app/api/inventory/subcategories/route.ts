import { NextRequest, NextResponse } from "next/server";
import {
  getWebhookAdminSecret,
  getWebhookReceiverBaseUrl,
} from "@/lib/inventoryWebhookProxyEnv";

/**
 * Proxy GET → webhook-receiver /api/inventory/subcategories
 * Query opcional: category_id (padre).
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

  const url = new URL(req.url);
  const categoryId = url.searchParams.get("category_id");
  const qs = categoryId
    ? `?category_id=${encodeURIComponent(categoryId)}`
    : "";

  const upstream = await fetch(
    `${base.replace(/\/+$/, "")}/api/inventory/subcategories${qs}`,
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
