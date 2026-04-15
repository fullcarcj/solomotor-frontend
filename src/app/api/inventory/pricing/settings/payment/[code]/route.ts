import { NextRequest, NextResponse } from "next/server";
import {
  getWebhookAdminSecret,
  getWebhookReceiverBaseUrl,
} from "@/lib/inventoryWebhookProxyEnv";

export const runtime = "nodejs";

type RouteCtx = { params: Promise<{ code: string }> };

function proxyConfig() {
  const base = getWebhookReceiverBaseUrl();
  const secret = getWebhookAdminSecret();
  if (!base) {
    return {
      error: NextResponse.json(
        { error: { code: "CONFIG", message: "Falta WEBHOOK_RECEIVER_BASE_URL." } },
        { status: 503 }
      ),
    };
  }
  if (!secret) {
    return {
      error: NextResponse.json(
        { error: { code: "CONFIG", message: "Falta secreto admin: WEBHOOK_ADMIN_SECRET o ADMIN_SECRET." } },
        { status: 503 }
      ),
    };
  }
  return { base, secret };
}

/** Proxy PATCH → webhook-receiver /api/inventory/pricing/settings/payment/{code} */
export async function PATCH(req: NextRequest, context: RouteCtx) {
  const cfg = proxyConfig();
  if ("error" in cfg) return cfg.error;
  const { base, secret } = cfg;
  const { code } = await context.params;

  try {
    const payload = await req.text();
    const upstream = await fetch(
      `${base}/api/inventory/pricing/settings/payment/${code}`,
      {
        method: "PATCH",
        headers: {
          "X-Admin-Secret": secret,
          "Content-Type": "application/json",
        },
        body: payload || "{}",
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
    console.error(`[api/inventory/pricing/settings/payment/${code} PATCH]`, e);
    return NextResponse.json(
      { error: { code: "UPSTREAM_FETCH_FAILED", message: "No se pudo contactar al servidor de inventario." } },
      { status: 502 }
    );
  }
}
