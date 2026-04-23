import type { NextRequest } from "next/server";
import { nextJsonFromUpstream, proxyJsonToReceiver } from "@/lib/webhookReceiverProxyFetch";

export const runtime = "nodejs";

type Ctx = { params: Promise<{ pid: string }> };

/** PATCH reemplazar ítems de un presupuesto existente. */
export async function PATCH(req: NextRequest, ctx: Ctx) {
  const { pid } = await ctx.params;
  const body = await req.json().catch(() => ({}));
  const up = await proxyJsonToReceiver(
    `/api/inbox/quotations/presupuesto/${encodeURIComponent(pid)}/items`,
    { method: "PATCH", body, forwardRequestHeaders: req.headers }
  );
  return nextJsonFromUpstream(up);
}
