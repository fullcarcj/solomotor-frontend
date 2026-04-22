import type { NextRequest } from "next/server";
import { nextJsonFromUpstream, proxyJsonToReceiver } from "@/lib/webhookReceiverProxyFetch";

export const runtime = "nodejs";

type Ctx = { params: Promise<{ id: string }> };

/**
 * GET → Lista de piernas de pago imputadas a la cotización.
 */
export async function GET(_req: NextRequest, ctx: Ctx) {
  const { id } = await ctx.params;
  const up = await proxyJsonToReceiver(
    `/api/inbox/quotations/${encodeURIComponent(id)}/allocations`,
    { method: "GET" }
  );
  return nextJsonFromUpstream(up);
}
