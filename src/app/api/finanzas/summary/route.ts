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

export async function GET(req: NextRequest) {
  const base = backendBase();
  const incoming = req.nextUrl.searchParams;
  const params = new URLSearchParams();
  const period = incoming.get("period");
  if (period) params.set("period", period);
  const from = incoming.get("from");
  if (from) params.set("from", from);
  const to = incoming.get("to");
  if (to) params.set("to", to);

  const upstreamUrl = `${base}/api/finance/summary${params.size ? `?${params}` : ""}`;

  try {
    const upstream = await fetch(upstreamUrl, {
      headers: {
        cookie: req.headers.get("cookie") ?? "",
        ...(req.headers.get("authorization")
          ? { authorization: req.headers.get("authorization")! }
          : {}),
      },
      cache: "no-store",
    });
    const json: unknown = await upstream.json().catch(() => ({}));
    return NextResponse.json(json, { status: upstream.status });
  } catch (err) {
    console.error("[BFF /api/finanzas/summary]", err);
    return NextResponse.json({ error: "Error de red al conectar con el backend." }, { status: 502 });
  }
}
