import { NextResponse } from "next/server";
import {
  getWebhookAdminSecret,
  getWebhookReceiverBaseUrl,
} from "@/lib/inventoryWebhookProxyEnv";

export const runtime = "nodejs";

function proxyConfig() {
  const base = getWebhookReceiverBaseUrl();
  const secret = getWebhookAdminSecret();
  if (!base) {
    return {
      error: NextResponse.json(
        {
          error: {
            code: "CONFIG",
            message:
              "Falta WEBHOOK_RECEIVER_BASE_URL. En local: .env.local y reinicia `next dev`.",
          },
        },
        { status: 503 }
      ),
    };
  }
  if (!secret) {
    return {
      error: NextResponse.json(
        {
          error: {
            code: "CONFIG",
            message:
              "Falta secreto admin: define WEBHOOK_ADMIN_SECRET o ADMIN_SECRET.",
          },
        },
        { status: 503 }
      ),
    };
  }
  return { base, secret };
}

/** Proxy GET → webhook-receiver /api/inventory/pricing/settings */
export async function GET() {
  const cfg = proxyConfig();
  if ("error" in cfg) return cfg.error;
  const { base, secret } = cfg;

  try {
    const upstream = await fetch(
      `${base}/api/inventory/pricing/settings`,
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
  } catch (e) {
    console.error("[api/inventory/pricing/settings GET]", e);
    return NextResponse.json(
      { error: { code: "UPSTREAM_FETCH_FAILED", message: "No se pudo contactar al servidor de inventario." } },
      { status: 502 }
    );
  }
}
