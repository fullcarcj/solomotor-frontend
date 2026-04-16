import type { NextRequest } from "next/server";
import { nextJsonFromUpstream, proxyJsonToReceiver } from "@/lib/webhookReceiverProxyFetch";

export const runtime = "nodejs";

type Ctx = { params: Promise<{ chatId: string }> };

export async function POST(req: NextRequest, ctx: Ctx) {
  const { chatId } = await ctx.params;
  const body = await req.json().catch(() => ({}));
  const up = await proxyJsonToReceiver(
    `/api/inbox/${encodeURIComponent(chatId)}/link-customer`,
    { method: "POST", body }
  );
  return nextJsonFromUpstream(up);
}
