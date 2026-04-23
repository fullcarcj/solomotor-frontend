import type { NextRequest } from "next/server";
import { nextJsonFromUpstream, proxyJsonToReceiver } from "@/lib/webhookReceiverProxyFetch";

export const runtime = "nodejs";

type Ctx = { params: Promise<{ pid: string }> };

/** GET detalle de presupuesto + líneas (`/api/inbox/quotations/presupuesto/:id` en el receiver). */
export async function GET(req: NextRequest, ctx: Ctx) {
  const { pid } = await ctx.params;
  const up = await proxyJsonToReceiver(
    `/api/inbox/quotations/presupuesto/${encodeURIComponent(pid)}`,
    { forwardRequestHeaders: req.headers }
  );
  return nextJsonFromUpstream(up);
}
