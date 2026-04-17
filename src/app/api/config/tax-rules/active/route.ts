import { NextResponse } from "next/server";
import {
  getWebhookAdminSecret,
  getWebhookReceiverBaseUrl,
} from "@/lib/inventoryWebhookProxyEnv";

export const runtime = "nodejs";

export async function GET() {
  const base = getWebhookReceiverBaseUrl();
  const secret = getWebhookAdminSecret();
  if (!base)
    return NextResponse.json({ ok: false, error: "Falta WEBHOOK_RECEIVER_BASE_URL" }, { status: 503 });
  if (!secret)
    return NextResponse.json({ ok: false, error: "Falta WEBHOOK_ADMIN_SECRET" }, { status: 503 });

  let upRes: Response;
  try {
    upRes = await fetch(`${base}/api/config/tax-rules/active`, {
      method: "GET",
      headers: { "X-Admin-Secret": secret },
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
