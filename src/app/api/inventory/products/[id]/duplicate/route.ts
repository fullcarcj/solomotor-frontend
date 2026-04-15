import { NextRequest, NextResponse } from "next/server";
import {
  getWebhookAdminSecret,
  getWebhookReceiverBaseUrl,
} from "@/lib/inventoryWebhookProxyEnv";

type RouteCtx = { params: Promise<{ id: string }> };

function normalizeProductRouteId(raw: string): string {
  const t = raw.trim();
  const m = /^id-(\d+)$/i.exec(t);
  if (m) return m[1];
  return t;
}

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
              "Falta WEBHOOK_RECEIVER_BASE_URL. En local: .env.local y reinicia `next dev`. En Render: Environment del servicio Next → Save → redeploy.",
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
              "Falta secreto admin: WEBHOOK_ADMIN_SECRET o ADMIN_SECRET (mismo valor que en el webhook-receiver). Render: Environment del frontend → Save → Manual Deploy.",
          },
        },
        { status: 503 }
      ),
    };
  }
  return { base, secret };
}

/**
 * Proxy POST → webhook-receiver /api/inventory/products/:id/duplicate
 */
export async function POST(req: NextRequest, context: RouteCtx) {
  const cfg = proxyConfig();
  if ("error" in cfg) return cfg.error;
  const { base, secret } = cfg;
  const { id: rawId } = await context.params;
  const id = normalizeProductRouteId(rawId);

  if (!/^\d+$/.test(id)) {
    return NextResponse.json(
      { error: { code: "INVALID_ID", message: "ID de producto inválido" } },
      { status: 400 }
    );
  }

  const payload = await req.text();
  const upstream = await fetch(
    `${base.replace(/\/+$/, "")}/api/inventory/products/${id}/duplicate`,
    {
      method: "POST",
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
}
