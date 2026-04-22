import type { NextRequest } from "next/server";
import { nextJsonFromUpstream, proxyJsonToReceiver } from "@/lib/webhookReceiverProxyFetch";

export const runtime = "nodejs";

/** Proxy → GET /api/inbox/bank-statements/pending-credits (créditos extracto sin match auto). */
export async function GET(req: NextRequest) {
  const up = await proxyJsonToReceiver("/api/inbox/bank-statements/pending-credits", {
    query: req.nextUrl.searchParams,
  });
  return nextJsonFromUpstream(up);
}
