import type { NextRequest } from "next/server";
import { nextJsonFromUpstream, proxyJsonToReceiver } from "@/lib/webhookReceiverProxyFetch";

export const runtime = "nodejs";

type Ctx = { params: Promise<{ chatId: string }> };

export async function GET(_req: NextRequest, ctx: Ctx) {
  const { chatId } = await ctx.params;
  const up = await proxyJsonToReceiver(
    `/api/inbox/${encodeURIComponent(chatId)}/linkable-orders`
  );
  return nextJsonFromUpstream(up);
}
