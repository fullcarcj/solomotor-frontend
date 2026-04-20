import type { NextRequest } from "next/server";
import { NextResponse } from "next/server";
import { formatUpstreamFetchError } from "@/lib/bffUpstreamError";

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
  const target = `${base}/api/auth/logout`;
  const cookieHeader = req.headers.get("cookie") ?? "";

  let up: Response;
  try {
    up = await fetch(target, {
      method: "POST",
      headers: {
        ...(cookieHeader ? { Cookie: cookieHeader } : {}),
        Accept: "application/json",
      },
      cache: "no-store",
      signal: AbortSignal.timeout(8_000),
    });
  } catch (e) {
    return NextResponse.json(
      { ok: false, ...formatUpstreamFetchError(e, target) },
      { status: 502 }
    );
  }

  const text = await up.text();
  let json: unknown = { ok: true };
  try {
    if (text) json = JSON.parse(text);
  } catch {
    json = { ok: up.ok, message: text };
  }

  const response = NextResponse.json(json, { status: up.ok ? 200 : up.status });

  const setCookies = typeof up.headers.getSetCookie === "function"
    ? up.headers.getSetCookie()
    : [];
  if (setCookies.length) {
    for (const c of setCookies) {
      response.headers.append("set-cookie", c);
    }
  }

  response.cookies.delete("token");

  return response;
}
