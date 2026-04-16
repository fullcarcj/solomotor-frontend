import type { NextRequest } from "next/server";
import { nextJsonFromUpstream, proxyJsonToReceiver } from "@/lib/webhookReceiverProxyFetch";

export const runtime = "nodejs";

export async function POST(req: NextRequest) {
  const body = await req.json().catch(() => ({}));
  const up = await proxyJsonToReceiver("/api/inbox/payments/confirm", {
    method: "POST",
    body,
  });
  return nextJsonFromUpstream(up);
}
