import { NextRequest, NextResponse } from "next/server";
import {
  getWebhookAdminSecret,
  getWebhookReceiverBaseUrl,
} from "@/lib/inventoryWebhookProxyEnv";

type RouteCtx = { params: Promise<{ id: string }> };

/** Si por error llega `id-123` (p. ej. confusión con rowKey), extrae solo los dígitos. */
function normalizeProductRouteId(raw: string): string {
  const t = raw.trim();
  const m = /^id-(\d+)$/i.exec(t);
  if (m) return m[1];
  return t;
}

/**
 * Proxy POST → webhook-receiver /api/inventory/products/:id/deactivate
 * (misma baja lógica que DELETE; evita proxies que bloquean DELETE).
 */
export async function POST(_req: NextRequest, context: RouteCtx) {
  const base = getWebhookReceiverBaseUrl();
  const secret = getWebhookAdminSecret();
  const { id: rawId } = await context.params;
  const id = normalizeProductRouteId(rawId);

  if (!base) {
    return NextResponse.json(
      {
        error: {
          code: "CONFIG",
          message:
            "Falta WEBHOOK_RECEIVER_BASE_URL. En local: .env.local. En Render: Environment del servicio Next → Save → redeploy.",
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
            "Falta secreto admin: WEBHOOK_ADMIN_SECRET o ADMIN_SECRET (mismo valor que en el webhook-receiver). Render: Environment del frontend → Save → Manual Deploy.",
        },
      },
      { status: 503 }
    );
  }

  if (!/^\d+$/.test(id)) {
    return NextResponse.json(
      { error: { code: "INVALID_ID", message: "ID de producto inválido" } },
      { status: 400 }
    );
  }

  const pid = Number(id);
  const headers: HeadersInit = {
    "X-Admin-Secret": secret,
    "Content-Type": "application/json",
  };

  const pathUrl = `${base}/api/inventory/products/${encodeURIComponent(id)}/deactivate`;
  let upstream = await fetch(pathUrl, {
    method: "POST",
    headers,
    body: "{}",
    cache: "no-store",
  });

  if (upstream.status === 404) {
    upstream = await fetch(`${base}/api/inventory/products/deactivate`, {
      method: "POST",
      headers,
      body: JSON.stringify({ product_id: pid }),
      cache: "no-store",
    });
  }

  const body = await upstream.text();
  return new NextResponse(body, {
    status: upstream.status,
    headers: {
      "Content-Type":
        upstream.headers.get("Content-Type") ?? "application/json",
    },
  });
}
