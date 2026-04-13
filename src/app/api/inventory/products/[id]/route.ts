import { NextRequest, NextResponse } from "next/server";

type RouteCtx = { params: Promise<{ id: string }> };

function proxyConfig() {
  const base = process.env.WEBHOOK_RECEIVER_BASE_URL?.trim().replace(/\/$/, "");
  const secret = process.env.WEBHOOK_ADMIN_SECRET?.trim();
  if (!base) {
    return {
      error: NextResponse.json(
        {
          error: {
            code: "CONFIG",
            message:
              "Falta WEBHOOK_RECEIVER_BASE_URL. Añádela en .env o .env.local y reinicia `next dev`.",
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
              "Falta WEBHOOK_ADMIN_SECRET (mismo valor que ADMIN_SECRET del backend).",
          },
        },
        { status: 503 }
      ),
    };
  }
  return { base, secret };
}

/**
 * Proxy GET → webhook-receiver /api/inventory/products/:id
 */
export async function GET(_req: NextRequest, context: RouteCtx) {
  const cfg = proxyConfig();
  if ("error" in cfg) return cfg.error;
  const { base, secret } = cfg;
  const { id } = await context.params;

  if (!/^\d+$/.test(id)) {
    return NextResponse.json(
      { error: { code: "INVALID_ID", message: "ID de producto inválido" } },
      { status: 400 }
    );
  }

  const upstream = await fetch(`${base}/api/inventory/products/${id}`, {
    method: "GET",
    headers: { "X-Admin-Secret": secret },
    cache: "no-store",
  });

  const body = await upstream.text();
  return new NextResponse(body, {
    status: upstream.status,
    headers: {
      "Content-Type":
        upstream.headers.get("Content-Type") ?? "application/json",
    },
  });
}

/**
 * Proxy DELETE → webhook-receiver /api/inventory/products/:id
 */
export async function DELETE(_req: NextRequest, context: RouteCtx) {
  const cfg = proxyConfig();
  if ("error" in cfg) return cfg.error;
  const { base, secret } = cfg;
  const { id } = await context.params;

  if (!/^\d+$/.test(id)) {
    return NextResponse.json(
      { error: { code: "INVALID_ID", message: "ID de producto inválido" } },
      { status: 400 }
    );
  }

  const upstream = await fetch(`${base}/api/inventory/products/${id}`, {
    method: "DELETE",
    headers: { "X-Admin-Secret": secret },
    cache: "no-store",
  });

  const body = await upstream.text();
  return new NextResponse(body, {
    status: upstream.status,
    headers: {
      "Content-Type":
        upstream.headers.get("Content-Type") ?? "application/json",
    },
  });
}
