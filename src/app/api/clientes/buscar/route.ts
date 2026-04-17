import type { NextRequest } from "next/server";
import { NextResponse } from "next/server";
import { backendBase, bffHeaders, parseUpstreamJson } from "@/lib/backendBff";

export const runtime = "nodejs";

const FORWARD = ["id_type", "id_number", "company_id", "phone"] as const;

/** GET → backend GET /api/customers/search?… */
export async function GET(req: NextRequest) {
  const base = backendBase();
  const q = new URLSearchParams();
  const sp = req.nextUrl.searchParams;
  FORWARD.forEach((k) => {
    const v = sp.get(k);
    if (v != null && v !== "") q.set(k, v);
  });
  try {
    const upstream = await fetch(`${base}/api/customers/search?${q}`, {
      method: "GET",
      headers: bffHeaders(req),
      cache: "no-store",
    });
    const data = await parseUpstreamJson(upstream);
    return NextResponse.json(data, { status: upstream.status });
  } catch (e) {
    console.error("[BFF GET /api/clientes/buscar]", e);
    return NextResponse.json({ error: "Error de red." }, { status: 502 });
  }
}
