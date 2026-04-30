import type { NextRequest } from "next/server";
import { nextJsonFromUpstream, proxyJsonToReceiver } from "@/lib/webhookReceiverProxyFetch";

export const runtime = "nodejs";

type Ctx = { params: Promise<{ pid: string }> };

/** POST — conciliación manual directa: extracto ↔ cotización (sin payment_attempts). */
export async function POST(req: NextRequest, ctx: Ctx) {
  const { pid } = await ctx.params;
  const body = await req.json().catch(() => ({}));
  const up = await proxyJsonToReceiver(
    `/api/inbox/quotations/presupuesto/${encodeURIComponent(pid)}/link-bank-statement`,
    { method: "POST", body, forwardRequestHeaders: req.headers }
  );
  return nextJsonFromUpstream(up);
}
