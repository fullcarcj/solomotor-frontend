import { NextRequest, NextResponse } from "next/server";
import {
  getWebhookAdminSecret,
  getWebhookReceiverBaseUrl,
} from "@/lib/inventoryWebhookProxyEnv";

export const runtime = "nodejs";

async function upstream(path: string, method: string, body?: unknown) {
  const base = getWebhookReceiverBaseUrl();
  const secret = getWebhookAdminSecret();
  if (!base)
    return NextResponse.json({ ok: false, error: "Falta WEBHOOK_RECEIVER_BASE_URL" }, { status: 503 });
  if (!secret)
    return NextResponse.json({ ok: false, error: "Falta WEBHOOK_ADMIN_SECRET" }, { status: 503 });

  let upRes: Response;
  try {
    upRes = await fetch(`${base}${path}`, {
      method,
      headers: {
        "X-Admin-Secret": secret,
        ...(body !== undefined ? { "Content-Type": "application/json" } : {}),
      },
      body: body !== undefined ? JSON.stringify(body) : undefined,
      cache: "no-store",
    });
  } catch (e) {
    return NextResponse.json({ ok: false, error: String(e) }, { status: 502 });
  }

  const text = await upRes.text();
  let json: unknown;
  try { json = JSON.parse(text); } catch { json = { ok: false, error: text }; }
  return NextResponse.json(json, { status: upRes.status });
}

export async function GET(req: NextRequest) {
  const qs = req.nextUrl.searchParams.toString();
  return upstream(`/api/config/tax-rules${qs ? `?${qs}` : ""}`, "GET");
}

export async function PUT(req: NextRequest) {
  const body = await req.json().catch(() => ({}));
  return upstream("/api/config/tax-rules", "PUT", body);
}
