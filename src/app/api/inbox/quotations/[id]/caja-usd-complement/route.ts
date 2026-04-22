import type { NextRequest } from "next/server";
import { nextJsonFromUpstream, proxyJsonToReceiver } from "@/lib/webhookReceiverProxyFetch";

export const runtime = "nodejs";

type Ctx = { params: Promise<{ id: string }> };

/**
 * POST — Caja registra el complemento en USD (aprobado de inmediato) que completa el pago
 * junto con la parte en Bs ya conciliada. Libera el cierre para que el vendedor vea "CERRADO"
 * y el botón de crear orden CH-2.
 */
export async function POST(req: NextRequest, ctx: Ctx) {
  const { id } = await ctx.params;
  const body = await req.json().catch(() => ({}));
  const up = await proxyJsonToReceiver(
    `/api/inbox/quotations/${encodeURIComponent(id)}/caja-usd-complement`,
    { method: "POST", body }
  );
  return nextJsonFromUpstream(up);
}
