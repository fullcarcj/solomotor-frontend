import type { NextRequest } from "next/server";
import { nextJsonFromUpstream, proxyJsonToReceiver } from "@/lib/webhookReceiverProxyFetch";

export const runtime = "nodejs";

export async function GET(req: NextRequest) {
  const up = await proxyJsonToReceiver("/api/inbox", {
    query: req.nextUrl.searchParams,
  });
  return nextJsonFromUpstream(up);
}
