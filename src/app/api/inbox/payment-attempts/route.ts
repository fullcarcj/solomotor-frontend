import type { NextRequest } from "next/server";
import { nextJsonFromUpstream, proxyJsonToReceiver } from "@/lib/webhookReceiverProxyFetch";

export const runtime = "nodejs";

/** GET → comprobantes sin conciliar por chat_id y/o customer_id (webhook-receiver). */
export async function GET(req: NextRequest) {
  const up = await proxyJsonToReceiver("/api/inbox/payment-attempts", {
    query: req.nextUrl.searchParams,
    forwardRequestHeaders: req.headers,
  });
  return nextJsonFromUpstream(up);
}
