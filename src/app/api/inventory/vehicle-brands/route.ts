import { NextResponse } from "next/server";
import {
  getVehicleBrandsUpstreamPath,
  getWebhookAdminSecret,
  getWebhookReceiverBaseUrl,
} from "@/lib/inventoryWebhookProxyEnv";

/**
 * Proxy GET → webhook-receiver: listado de marcas de vehículo (crm_vehicle_brands).
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
            "Falta WEBHOOK_RECEIVER_BASE_URL. En local: .env.local y reinicia `next dev`. En Render: Environment del servicio Next → Save → redeploy.",
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
            "Falta secreto admin para el proxy: define WEBHOOK_ADMIN_SECRET o ADMIN_SECRET.",
        },
      },
      { status: 503 }
    );
  }

  const path = getVehicleBrandsUpstreamPath();
  const upstream = await fetch(`${base.replace(/\/+$/, "")}${path}`, {
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
