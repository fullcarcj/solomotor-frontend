import { NextRequest, NextResponse } from "next/server";
import { inventoryUpstreamAgent } from "@/lib/inventoryUpstreamUndiciAgent";
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

  try {
    const upstream = await fetch(target.toString(), {
      method: "GET",
      headers: { "X-Admin-Secret": secret },
      cache: "no-store",
      dispatcher: inventoryUpstreamAgent,
    });

    const body = await upstream.text();
    return new NextResponse(body, {
      status: upstream.status,
      headers: {
        "Content-Type":
          upstream.headers.get("Content-Type") ?? "application/json",
      },
    });
  } catch (e) {
    const cause = e instanceof Error && e.cause instanceof Error ? e.cause : null;
    const code =
      cause && "code" in cause && typeof (cause as { code?: string }).code === "string"
        ? (cause as { code: string }).code
        : undefined;
    const isTimeout =
      code === "UND_ERR_HEADERS_TIMEOUT" ||
      code === "UND_ERR_BODY_TIMEOUT" ||
      code === "UND_ERR_CONNECT_TIMEOUT";

    return NextResponse.json(
      {
        error: {
          code: isTimeout ? "UPSTREAM_TIMEOUT" : "UPSTREAM_FETCH_FAILED",
          message: isTimeout
            ? "El servidor de inventario tardó demasiado en responder (timeout). Revisa la query en el webhook-receiver o el estado de la base de datos."
            : "No se pudo contactar al servidor de inventario. Comprueba WEBHOOK_RECEIVER_BASE_URL y la red.",
        },
      },
      { status: isTimeout ? 504 : 502 }
    );
  }
}
