import type { NextRequest } from "next/server";
import { nextJsonFromUpstream, proxyJsonToReceiver } from "@/lib/webhookReceiverProxyFetch";

export const runtime = "nodejs";

type Ctx = { params: Promise<{ chatId: string }> };

export async function DELETE(_req: NextRequest, ctx: Ctx) {
  const { chatId } = await ctx.params;
  const up = await proxyJsonToReceiver(
    `/api/inbox/whitelist/mark-chat/${encodeURIComponent(chatId)}`,
    { method: "DELETE" }
  );
  return nextJsonFromUpstream(up);
}
