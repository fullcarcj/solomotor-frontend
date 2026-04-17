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

/**
 * BFF: reenvía GET /api/menu al webhook-receiver con Authorization y Cookie del request.
 */
export async function GET(req: NextRequest) {
  const base = backendBase();

  const authHeader = req.headers.get("authorization") ?? "";
  const cookieHeader = req.headers.get("cookie") ?? "";

  let up: Response;
  try {
    up = await fetch(`${base}/api/menu`, {
      method: "GET",
      headers: {
        ...(authHeader ? { Authorization: authHeader } : {}),
        ...(cookieHeader ? { Cookie: cookieHeader } : {}),
        Accept: "application/json",
      },
      cache: "no-store",
    });
  } catch (e) {
    return NextResponse.json(
      { error: { message: String(e) } },
      { status: 502 }
    );
  }

  const text = await up.text();
  let json: unknown;
  try {
    json = text ? JSON.parse(text) : {};
  } catch {
    json = { error: text || up.statusText };
  }
  return NextResponse.json(json, { status: up.status });
}
