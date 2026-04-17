import type { NextRequest } from "next/server";
import { NextResponse } from "next/server";
import { nextJsonFromUpstream, proxyJsonToReceiver } from "@/lib/webhookReceiverProxyFetch";
import {
  getQuotationsUpstreamPath,
  getWebhookAdminSecret,
  getWebhookReceiverBaseUrl,
} from "@/lib/inventoryWebhookProxyEnv";

export const runtime = "nodejs";

const BACKEND_URL =
  process.env.BACKEND_URL ??
  process.env.WEBHOOK_RECEIVER_BASE_URL ??
  "http://localhost:3001";

const FORWARD_KEYS = [
  "limit",
  "offset",
  "status",
  "cliente_id",
  "channel_id",
  "search",
  "fecha_desde",
  "fecha_hasta",
] as const;

function buildQuery(req: NextRequest): URLSearchParams {
  const { searchParams } = new URL(req.url);
  const params = new URLSearchParams();
  FORWARD_KEYS.forEach((k) => {
    const v = searchParams.get(k);
    if (v != null && v !== "") params.set(k, v);
  });
  return params;
}

/** Mismo patrón que inventario/inbox: receiver con X-Admin-Secret. */
function useReceiverProxy(): boolean {
  return Boolean(getWebhookReceiverBaseUrl() && getWebhookAdminSecret());
}

export async function GET(req: NextRequest) {
  const params = buildQuery(req);

  if (useReceiverProxy()) {
    const up = await proxyJsonToReceiver("/api/inbox/quotations", {
      method: "GET",
      query: params,
    });
    return nextJsonFromUpstream(up);
  }

  const base = BACKEND_URL.replace(/\/+$/, "");
  const cookieHeader = req.headers.get("cookie") ?? "";
  const authHeader = req.headers.get("authorization") ?? "";

  const res = await fetch(`${base}/api/inbox/quotations?${params}`, {
    method: "GET",
    headers: {
      Accept: "application/json",
      ...(authHeader ? { Authorization: authHeader } : {}),
      ...(cookieHeader ? { Cookie: cookieHeader } : {}),
    },
    cache: "no-store",
  });

  const text = await res.text();
  let data: unknown = {};
  if (text.trim()) {
    try {
      data = JSON.parse(text) as unknown;
    } catch {
      data = { error: { message: "Respuesta no JSON del servidor" } };
    }
  }
  return NextResponse.json(data, { status: res.status });
}

export async function POST(req: NextRequest) {
  let body: unknown = {};
  try {
    body = await req.json();
  } catch {
    body = {};
  }

  const upstreamPath = getQuotationsUpstreamPath();

  if (useReceiverProxy()) {
    const up = await proxyJsonToReceiver(upstreamPath, {
      method: "POST",
      body,
    });
    return nextJsonFromUpstream(up);
  }

  const base = BACKEND_URL.replace(/\/+$/, "");
  const cookieHeader = req.headers.get("cookie") ?? "";
  const authHeader = req.headers.get("authorization") ?? "";

  const res = await fetch(`${base}${upstreamPath}`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Accept: "application/json",
      ...(authHeader ? { Authorization: authHeader } : {}),
      ...(cookieHeader ? { Cookie: cookieHeader } : {}),
    },
    body: JSON.stringify(body),
    cache: "no-store",
  });

  const text = await res.text();
  let data: unknown = {};
  if (text.trim()) {
    try {
      data = JSON.parse(text) as unknown;
    } catch {
      data = { error: { message: text || res.statusText } };
    }
  }
  return NextResponse.json(data, { status: res.status });
}
