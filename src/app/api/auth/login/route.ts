import type { NextRequest } from "next/server";
import { NextResponse } from "next/server";

export const runtime = "nodejs";

const BACKEND_URL =
  process.env.BACKEND_URL ??
  process.env.WEBHOOK_RECEIVER_BASE_URL ??
  "http://localhost:3001";

function backendBase(): string {
  const raw = BACKEND_URL.trim().replace(/\/+$/, "");
  if (!raw) return "http://localhost:3001";
  if (!/^https?:\/\//i.test(raw)) return `https://${raw}`;
  return raw;
}

export async function POST(req: NextRequest) {
  const base = backendBase();
  let body: unknown = {};
  try {
    body = await req.json();
  } catch {
    body = {};
  }

  let up: Response;
  try {
    up = await fetch(`${base}/api/auth/login`, {
      method: "POST",
      headers: { "Content-Type": "application/json", Accept: "application/json" },
      body: JSON.stringify(body),
      cache: "no-store",
    });
  } catch (e) {
    return NextResponse.json(
      { ok: false, message: String(e) },
      { status: 502 }
    );
  }

  const text = await up.text();
  let data: unknown;
  try {
    data = text ? JSON.parse(text) : {};
  } catch {
    data = { ok: false, message: text || up.statusText };
  }

  const response = NextResponse.json(data, { status: up.status });

  const setCookies = typeof up.headers.getSetCookie === "function"
    ? up.headers.getSetCookie()
    : [];
  if (setCookies.length) {
    for (const c of setCookies) {
      response.headers.append("set-cookie", c);
    }
  } else {
    const single = up.headers.get("set-cookie");
    if (single) response.headers.set("set-cookie", single);
  }

  return response;
}
