import type { NextRequest } from "next/server";
import { nextJsonFromUpstream, proxyJsonToReceiver } from "@/lib/webhookReceiverProxyFetch";

export const runtime = "nodejs";

type Ctx = { params: Promise<{ id: string }> };

/** POST → vincular comprobante WA a movimiento de extracto (Banesco). */
export async function POST(req: NextRequest, ctx: Ctx) {
  const { id } = await ctx.params;
  const body = await req.json().catch(() => ({}));
  const up = await proxyJsonToReceiver(
    `/api/inbox/payment-attempts/${encodeURIComponent(id)}/link-bank-statement`,
    { method: "POST", body }
  );
  return nextJsonFromUpstream(up);
}
