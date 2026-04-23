import type { NextRequest } from "next/server";
import { NextResponse } from "next/server";

export const runtime = "nodejs";

const BACKEND_URL =
  process.env.BACKEND_URL ??
  process.env.WEBHOOK_RECEIVER_BASE_URL ??
  "http://localhost:3001";

const DEFAULT_DAYS = 7;
const MAX_DAYS = 90;
const DEFAULT_LIMIT = 200;
const MAX_LIMIT = 500;

function clampInt(raw: string | null, def: number, max: number): number {
  if (raw == null || raw === "") return def;
  const n = Number.parseInt(String(raw), 10);
  if (!Number.isFinite(n) || n < 1) return def;
  return Math.min(n, max);
}

/**
 * BFF proxy → backend GET /api/ai-responder/ops-logs
 *
 * Query (acotados): `days`, `name_limit`, `receipt_limit`, `vision_limit`.
 * El receiver agrega name_analysis_logs, receipt_vision_logs, receipt_attempts, etc.
 */
export async function GET(req: NextRequest) {
  const base = BACKEND_URL.replace(/\/+$/, "");
  const cookieHeader = req.headers.get("cookie") ?? "";
  const authHeader = req.headers.get("authorization") ?? "";

  const url = new URL(req.url);
  const days = clampInt(url.searchParams.get("days"), DEFAULT_DAYS, MAX_DAYS);
  const nameLimit = clampInt(
    url.searchParams.get("name_limit"),
    DEFAULT_LIMIT,
    MAX_LIMIT
  );
  const receiptLimit = clampInt(
    url.searchParams.get("receipt_limit"),
    DEFAULT_LIMIT,
    MAX_LIMIT
  );
  const visionLimit = clampInt(
    url.searchParams.get("vision_limit"),
    DEFAULT_LIMIT,
    MAX_LIMIT
  );

  const upstream = new URL(`${base}/api/ai-responder/ops-logs`);
  upstream.searchParams.set("days", String(days));
  upstream.searchParams.set("name_limit", String(nameLimit));
  upstream.searchParams.set("receipt_limit", String(receiptLimit));
  upstream.searchParams.set("vision_limit", String(visionLimit));

  const res = await fetch(upstream.toString(), {
    method: "GET",
    headers: {
      Accept: "application/json",
      ...(authHeader ? { Authorization: authHeader } : {}),
      ...(cookieHeader ? { Cookie: cookieHeader } : {}),
    },
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
