import type { NextRequest } from "next/server";
import { nextJsonFromUpstream, proxyJsonToReceiver } from "@/lib/webhookReceiverProxyFetch";

export const runtime = "nodejs";

/** GET → buscar chat WA existente por teléfono (sin crear ni enviar saludo). */
export async function GET(req: NextRequest) {
  const up = await proxyJsonToReceiver("/api/inbox/wa-chat/by-phone", {
    query: req.nextUrl.searchParams,
  });
  return nextJsonFromUpstream(up);
}
