import type { NextRequest } from "next/server";
import { nextJsonFromUpstream, proxyJsonToReceiver } from "@/lib/webhookReceiverProxyFetch";

export const runtime = "nodejs";

type Ctx = { params: Promise<{ id: string }> };

export async function PATCH(req: NextRequest, ctx: Ctx) {
  const { id } = await ctx.params;
  const body = await req.json().catch(() => ({}));
  const up = await proxyJsonToReceiver(
    `/api/inbox/quotations/${encodeURIComponent(id)}/status`,
    { method: "PATCH", body }
  );
  return nextJsonFromUpstream(up);
}
