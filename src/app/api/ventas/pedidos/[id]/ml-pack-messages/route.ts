import type { NextRequest } from "next/server";
import { NextResponse } from "next/server";

export const runtime = "nodejs";

const BACKEND_URL =
  process.env.BACKEND_URL ??
  process.env.WEBHOOK_RECEIVER_BASE_URL ??
  "http://localhost:3001";

function base() {
  return BACKEND_URL.replace(/\/+$/, "");
}

function fwdAuth(req: NextRequest) {
  const cookieHeader = req.headers.get("cookie") ?? "";
  const authHeader = req.headers.get("authorization") ?? "";
  return {
    Accept: "application/json",
    ...(authHeader ? { Authorization: authHeader } : {}),
    ...(cookieHeader ? { Cookie: cookieHeader } : {}),
  };
}

/** GET — mensajes pack ML desde BD; ?sync=1 opcional */
export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  const sp = new URLSearchParams();
  const sync = req.nextUrl.searchParams.get("sync");
  const limit = req.nextUrl.searchParams.get("limit");
  if (sync) sp.set("sync", sync);
  if (limit) sp.set("limit", limit);
  const q = sp.toString();
  const url = `${base()}/api/sales/${encodeURIComponent(id)}/ml-pack-messages${q ? `?${q}` : ""}`;
  const res = await fetch(url, { method: "GET", headers: fwdAuth(req), cache: "no-store" });
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

/** POST — enviar texto al comprador (post_sale) */
export async function POST(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  let body: unknown = {};
  try {
    body = await req.json();
  } catch {
    body = {};
  }
  const res = await fetch(`${base()}/api/sales/${encodeURIComponent(id)}/ml-pack-messages/send`, {
    method: "POST",
    headers: { ...fwdAuth(req), "Content-Type": "application/json" },
    body: JSON.stringify(body),
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
