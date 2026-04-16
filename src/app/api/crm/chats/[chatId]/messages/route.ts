import type { NextRequest } from "next/server";
import { nextJsonFromUpstream, proxyJsonToReceiver } from "@/lib/webhookReceiverProxyFetch";

export const runtime = "nodejs";

type Ctx = { params: Promise<{ chatId: string }> };

export async function GET(_req: NextRequest, ctx: Ctx) {
  const { chatId } = await ctx.params;
  const up = await proxyJsonToReceiver(`/api/crm/chats/${encodeURIComponent(chatId)}/messages`);
  return nextJsonFromUpstream(up);
}

export async function POST(req: NextRequest, ctx: Ctx) {
  const { chatId } = await ctx.params;
  const body = await req.json().catch(() => ({}));
  const up = await proxyJsonToReceiver(`/api/crm/chats/${encodeURIComponent(chatId)}/messages`, {
    method: "POST",
    body,
  });
  return nextJsonFromUpstream(up);
}
