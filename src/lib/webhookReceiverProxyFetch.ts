/**
 * Proxy genérico hacia webhook-receiver (mismo secreto que inventario/config).
 */
import { NextResponse } from "next/server";
import { inventoryUpstreamAgent } from "@/lib/inventoryUpstreamUndiciAgent";
import {
  getWebhookAdminSecret,
  getWebhookReceiverBaseUrl,
} from "@/lib/inventoryWebhookProxyEnv";

export async function proxyJsonToReceiver(
  upstreamPath: string,
  opts: {
    method?: string;
    query?: URLSearchParams;
    body?: unknown;
  } = {}
): Promise<Response> {
  const base = getWebhookReceiverBaseUrl().replace(/\/+$/, "");
  const secret = getWebhookAdminSecret();
  if (!base || !secret) {
    return new Response(
      JSON.stringify({
        error: {
          code: "CONFIG",
          message:
            "Falta WEBHOOK_RECEIVER_BASE_URL o WEBHOOK_ADMIN_SECRET / ADMIN_SECRET para el proxy.",
        },
      }),
      { status: 503, headers: { "Content-Type": "application/json" } }
    );
  }
  const path = upstreamPath.startsWith("/") ? upstreamPath : `/${upstreamPath}`;
  const url = new URL(`${base}${path}`);
  const q = opts.query;
  if (q) {
    q.forEach((value, key) => {
      url.searchParams.set(key, value);
    });
  }

  const method = opts.method ?? "GET";
  const init: RequestInit = {
    method,
    headers: {
      "X-Admin-Secret": secret,
      ...(opts.body !== undefined ? { "Content-Type": "application/json" } : {}),
    },
    body: opts.body !== undefined ? JSON.stringify(opts.body) : undefined,
    cache: "no-store",
  };

  try {
    return await fetch(url.toString(), {
      ...init,
      dispatcher: inventoryUpstreamAgent,
    } as RequestInit);
  } catch {
    return await fetch(url.toString(), init);
  }
}

export async function nextJsonFromUpstream(up: Response): Promise<NextResponse> {
  const text = await up.text();
  let json: unknown;
  try {
    json = text ? JSON.parse(text) : {};
  } catch {
    json = { ok: false, error: text || up.statusText };
  }
  return NextResponse.json(json, {
    status: up.status,
    headers: { "Content-Type": "application/json" },
  });
}

