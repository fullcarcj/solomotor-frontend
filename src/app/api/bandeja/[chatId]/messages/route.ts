import type { NextRequest } from "next/server";
import { NextResponse } from "next/server";
import { isBandejaBffVerbose } from "@/lib/bandejaReceiverProxy";

export const runtime = "nodejs";

const BACKEND_URL = process.env.BACKEND_URL ?? process.env.WEBHOOK_RECEIVER_BASE_URL ?? "http://localhost:3001";

function base() {
  const r = BACKEND_URL.trim().replace(/\/+$/, "");
  return /^https?:\/\//i.test(r) ? r : `https://${r}`;
}

function hdr(req: NextRequest) {
  return {
    "Content-Type": "application/json",
    Accept: "application/json",
    cookie: req.headers.get("cookie") ?? "",
    ...(req.headers.get("authorization") ? { authorization: req.headers.get("authorization")! } : {}),
  };
}

type RouteCtx = { params: Promise<{ chatId: string }> };

export async function GET(req: NextRequest, ctx: RouteCtx) {
  const { chatId } = await ctx.params;
  const p = new URLSearchParams();
  const beforeId = req.nextUrl.searchParams.get("before_id");
  const limit = req.nextUrl.searchParams.get("limit");
  const markRead = req.nextUrl.searchParams.get("mark_read");
  if (beforeId) p.set("before_id", beforeId);
  if (limit) p.set("limit", limit);
  else p.set("limit", "50");
  if (markRead != null && String(markRead).trim() !== "") {
    p.set("mark_read", String(markRead).trim());
  }

  const targetUrl = `${base()}/api/crm/chats/${encodeURIComponent(chatId)}/messages?${p}`;
  if (isBandejaBffVerbose()) console.log("[BFF messages GET] URL:", targetUrl);

  try {
    const up = await fetch(targetUrl, { headers: hdr(req), cache: "no-store" });
    const text = await up.text();
    let data: unknown = {};
    try {
      data = text.trim() ? (JSON.parse(text) as unknown) : {};
    } catch {
      data = { raw: text.slice(0, 500) };
    }
    if (isBandejaBffVerbose()) {
      console.log("[BFF messages GET] receiver status:", up.status);
      console.log("[BFF messages GET] receiver response:", data);
    }
    return NextResponse.json(data, { status: up.status });
  } catch (e) {
    console.error("[BFF bandeja/messages GET]", e);
    return NextResponse.json({ error: "Error de red." }, { status: 502 });
  }
}

export async function POST(req: NextRequest, ctx: RouteCtx) {
  const { chatId } = await ctx.params;
  const body: unknown = await req.json().catch(() => ({}));
  const targetUrl = `${base()}/api/crm/chats/${encodeURIComponent(chatId)}/messages`;

  if (isBandejaBffVerbose()) {
    console.log("[BFF messages POST] URL:", targetUrl);
    console.log("[BFF messages POST] body:", body);
  }

  try {
    const up = await fetch(targetUrl, {
      method: "POST",
      headers: hdr(req),
      body: JSON.stringify(body),
      cache: "no-store",
    });
    const text = await up.text();
    let data: unknown = {};
    try {
      data = text.trim() ? (JSON.parse(text) as unknown) : {};
    } catch {
      data = { raw: text.slice(0, 500) };
    }
    if (isBandejaBffVerbose()) {
      console.log("[BFF messages POST] receiver status:", up.status);
      console.log("[BFF messages POST] receiver response:", data);
    }
    return NextResponse.json(data, { status: up.status });
  } catch (e) {
    console.error("[BFF bandeja/messages POST]", e);
    return NextResponse.json({ error: "Error de red." }, { status: 502 });
  }
}
