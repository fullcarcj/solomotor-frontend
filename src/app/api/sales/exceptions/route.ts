import type { NextRequest } from "next/server";
import { NextResponse } from "next/server";
import { receiverBase, receiverJsonHeaders } from "@/lib/bandejaReceiverProxy";

export const runtime = "nodejs";

/**
 * BFF proxy → backend GET /api/sales/exceptions  (listar con filtros)
 *                  POST /api/sales/exceptions  (crear excepción)
 * GET query passthrough: status, chat_id, cursor, limit
 * POST body: { chat_id, code, reason }
 */
export async function GET(req: NextRequest) {
  const { searchParams } = req.nextUrl;

  const qs = new URLSearchParams();
  const status = searchParams.get("status");
  const chatId = searchParams.get("chat_id");
  const cursor = searchParams.get("cursor");
  const limit = searchParams.get("limit");
  if (status) qs.set("status", status);
  if (chatId) qs.set("chat_id", chatId);
  if (cursor) qs.set("cursor", cursor);
  if (limit) qs.set("limit", limit);

  const qsStr = qs.toString();
  const url = `${receiverBase()}/api/sales/exceptions${qsStr ? `?${qsStr}` : ""}`;

  try {
    const up = await fetch(url, {
      method: "GET",
      headers: receiverJsonHeaders(req),
      cache: "no-store",
    });

    if (up.status >= 500) {
      console.error("[BFF sales/exceptions GET]", up.status, url);
      return NextResponse.json({ error: "Error interno del servidor" }, { status: 502 });
    }

    const text = await up.text();
    let data: unknown = {};
    try { data = text.trim() ? (JSON.parse(text) as unknown) : {}; }
    catch { data = { raw: text.slice(0, 500) }; }
    return NextResponse.json(data, { status: up.status });
  } catch (e) {
    console.error("[BFF sales/exceptions GET] red:", e);
    return NextResponse.json({ error: "Error de red." }, { status: 502 });
  }
}

export async function POST(req: NextRequest) {
  const url = `${receiverBase()}/api/sales/exceptions`;
  const bodyText = await req.text();

  try {
    const up = await fetch(url, {
      method: "POST",
      headers: receiverJsonHeaders(req),
      body: bodyText || "{}",
      cache: "no-store",
    });

    if (up.status >= 500) {
      console.error("[BFF sales/exceptions POST]", up.status, url);
      return NextResponse.json({ error: "Error interno del servidor" }, { status: 502 });
    }

    const text = await up.text();
    let data: unknown = {};
    try { data = text.trim() ? (JSON.parse(text) as unknown) : {}; }
    catch { data = { raw: text.slice(0, 500) }; }
    return NextResponse.json(data, { status: up.status });
  } catch (e) {
    console.error("[BFF sales/exceptions POST] red:", e);
    return NextResponse.json({ error: "Error de red." }, { status: 502 });
  }
}
