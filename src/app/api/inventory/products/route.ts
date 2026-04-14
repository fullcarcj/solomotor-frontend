import { NextRequest, NextResponse } from "next/server";
import { inventoryUpstreamAgent } from "@/lib/inventoryUpstreamUndiciAgent";
import {
  getWebhookAdminSecret,
  getWebhookReceiverBaseUrl,
} from "@/lib/inventoryWebhookProxyEnv";

/** `node:undici` (Agent) solo en runtime Node; evita fallos si el handler corriera en Edge. */
export const runtime = "nodejs";

/** Fetch al receiver: primero con timeouts largos (undici Agent); si falla el runtime, sin dispatcher. */
async function fetchInventoryUpstream(
  url: string,
  secret: string
): Promise<Response> {
  const init: RequestInit = {
    method: "GET",
    headers: { "X-Admin-Secret": secret },
    cache: "no-store",
  };
  try {
    // `dispatcher` es de undici (Node); no figura en DOM RequestInit pero el fetch de Node lo usa.
    return await fetch(url, {
      ...init,
      dispatcher: inventoryUpstreamAgent,
    } as RequestInit);
  } catch (e) {
    console.warn(
      "[api/inventory/products] fetch con Agent undici falló, reintento sin dispatcher:",
      e
    );
    return await fetch(url, init);
  }
}

/**
 * Proxy hacia webhook-receiver: GET /api/inventory/products
 * Requiere auth admin en el backend; el secreto solo vive en el servidor (env).
 * Siempre devuelve JSON al cliente: nunca reenvía HTML/texto del upstream (evita "Respuesta no JSON" en el front).
 */
export async function GET(req: NextRequest) {
  try {
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

    let target: URL;
    try {
      target = new URL(`${base.replace(/\/+$/, "")}/api/inventory/products`);
    } catch {
      return NextResponse.json(
        {
          error: {
            code: "CONFIG",
            message:
              "WEBHOOK_RECEIVER_BASE_URL no es una URL válida (revisa el esquema https:// y el dominio).",
          },
        },
        { status: 503 }
      );
    }
    req.nextUrl.searchParams.forEach((value, key) => {
      target.searchParams.set(key, value);
    });

    try {
      const upstream = await fetchInventoryUpstream(target.toString(), secret);

      const bodyText = await upstream.text();
      const status = upstream.status;

      if (bodyText.trim()) {
        try {
          const parsed: unknown = JSON.parse(bodyText);
          return NextResponse.json(parsed, {
            status,
            headers: { "Content-Type": "application/json; charset=utf-8" },
          });
        } catch {
          /* cuerpo no JSON (p. ej. HTML de error de nginx/Render) */
        }
      }

      const outStatus = status >= 500 ? 502 : status === 404 ? 404 : 502;
      return NextResponse.json(
        {
          error: {
            code: "UPSTREAM_NON_JSON",
            message:
              status >= 500
                ? `El servicio de inventario respondió ${status} sin JSON válido. Revisa logs del webhook-receiver, la base de datos y que ADMIN_SECRET coincida.`
                : `El servicio de inventario respondió ${status} con un cuerpo que no es JSON.`,
          },
        },
        { status: outStatus }
      );
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
  } catch (e) {
    console.error("[api/inventory/products]", e);
    return NextResponse.json(
      {
        error: {
          code: "PROXY_ERROR",
          message:
            e instanceof Error
              ? e.message
              : "Error interno al proxy de inventario.",
        },
      },
      { status: 500 }
    );
  }
}
