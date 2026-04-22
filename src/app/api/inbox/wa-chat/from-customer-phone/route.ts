import type { NextRequest } from "next/server";
import { nextJsonFromUpstream, proxyJsonToReceiver } from "@/lib/webhookReceiverProxyFetch";

export const runtime = "nodejs";

/** POST → localizar/crear hilo WA por teléfono y opcionalmente enviar saludo outbound. */
export async function POST(req: NextRequest) {
  const body = await req.json().catch(() => ({}));
  const up = await proxyJsonToReceiver("/api/inbox/wa-chat/from-customer-phone", {
    method: "POST",
    body,
  });
  return nextJsonFromUpstream(up);
}
