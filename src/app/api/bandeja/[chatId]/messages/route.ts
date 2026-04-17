import type { NextRequest } from "next/server";
import { NextResponse } from "next/server";
export const runtime = "nodejs";
const BACKEND_URL = process.env.BACKEND_URL ?? process.env.WEBHOOK_RECEIVER_BASE_URL ?? "http://localhost:3001";
function base() { const r = BACKEND_URL.trim().replace(/\/+$/, ""); return /^https?:\/\//i.test(r) ? r : `https://${r}`; }
function hdr(req: NextRequest) {
  return { "Content-Type": "application/json", Accept: "application/json", cookie: req.headers.get("cookie") ?? "", ...(req.headers.get("authorization") ? { authorization: req.headers.get("authorization")! } : {}) };
}
export async function GET(req: NextRequest, { params }: { params: { chatId: string } }) {
  const p = new URLSearchParams();
  const beforeId = req.nextUrl.searchParams.get("before_id");
  const limit    = req.nextUrl.searchParams.get("limit");
  if (beforeId) p.set("before_id", beforeId);
  if (limit)    p.set("limit", limit);
  else          p.set("limit", "50");
  try {
    const up = await fetch(`${base()}/api/crm/chats/${encodeURIComponent(params.chatId)}/messages?${p}`, { headers: hdr(req), cache: "no-store" });
    return NextResponse.json(await up.json().catch(() => ({})), { status: up.status });
  } catch (e) { console.error("[BFF bandeja/messages GET]", e); return NextResponse.json({ error: "Error de red." }, { status: 502 }); }
}
export async function POST(req: NextRequest, { params }: { params: { chatId: string } }) {
  try {
    const body: unknown = await req.json().catch(() => ({}));
    const up = await fetch(`${base()}/api/crm/chats/${encodeURIComponent(params.chatId)}/messages`, { method: "POST", headers: hdr(req), body: JSON.stringify(body), cache: "no-store" });
    return NextResponse.json(await up.json().catch(() => ({})), { status: up.status });
  } catch (e) { console.error("[BFF bandeja/messages POST]", e); return NextResponse.json({ error: "Error de red." }, { status: 502 }); }
}
