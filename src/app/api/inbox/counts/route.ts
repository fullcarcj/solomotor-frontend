import { nextJsonFromUpstream, proxyJsonToReceiver } from "@/lib/webhookReceiverProxyFetch";

export const runtime = "nodejs";

export async function GET() {
  const up = await proxyJsonToReceiver("/api/inbox/counts");
  return nextJsonFromUpstream(up);
}
