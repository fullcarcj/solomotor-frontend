import type { NextRequest } from "next/server";
import { nextJsonFromUpstream, proxyJsonToReceiver } from "@/lib/webhookReceiverProxyFetch";

export const runtime = "nodejs";

type Ctx = { params: Promise<{ chatId: string }> };

/** BFF → GET /api/crm/chats/:id/context (chat + customer + vehicles) */
export async function GET(_req: NextRequest, ctx: Ctx) {
  const { chatId } = await ctx.params;
  const up = await proxyJsonToReceiver(
    `/api/crm/chats/${encodeURIComponent(chatId)}/context`
  );
  return nextJsonFromUpstream(up);
}
