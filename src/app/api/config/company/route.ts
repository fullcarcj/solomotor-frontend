import { NextRequest, NextResponse } from "next/server";
import {
  getWebhookAdminSecret,
  getWebhookReceiverBaseUrl,
} from "@/lib/inventoryWebhookProxyEnv";

export const runtime = "nodejs";

function missingEnvResponse(field: string) {
  return NextResponse.json(
    { ok: false, error: `Falta ${field} en las variables de entorno del servidor.` },
    { status: 503 }
  );
}

async function upstream(path: string, method: string, body?: unknown) {
  const base = getWebhookReceiverBaseUrl();
  const secret = getWebhookAdminSecret();
  if (!base) return missingEnvResponse("WEBHOOK_RECEIVER_BASE_URL");
  if (!secret) return missingEnvResponse("WEBHOOK_ADMIN_SECRET");

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
  return NextResponse.json(json, {
    status: upRes.status,
    headers: { "Content-Type": "application/json" },
  });
}

export async function GET() {
  return upstream("/api/config/company", "GET");
}

export async function PUT(req: NextRequest) {
  const body = await req.json().catch(() => ({}));
  return upstream("/api/config/company", "PUT", body);
}
