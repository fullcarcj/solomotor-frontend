import type { NextRequest } from "next/server";
import { nextJsonFromUpstream, proxyJsonToReceiver } from "@/lib/webhookReceiverProxyFetch";

export const runtime = "nodejs";

type Ctx = { params: Promise<{ id: string }> };

/** POST → vincular comprobante WA a cotización (inventario_presupuesto). */
export async function POST(req: NextRequest, ctx: Ctx) {
  const { id } = await ctx.params;
  const body = await req.json().catch(() => ({}));
  const up = await proxyJsonToReceiver(
    `/api/inbox/payment-attempts/${encodeURIComponent(id)}/link-quotation`,
    { method: "POST", body }
  );
  return nextJsonFromUpstream(up);
}
