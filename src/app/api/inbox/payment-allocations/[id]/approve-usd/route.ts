import type { NextRequest } from "next/server";
import { nextJsonFromUpstream, proxyJsonToReceiver } from "@/lib/webhookReceiverProxyFetch";

export const runtime = "nodejs";

type Ctx = { params: Promise<{ id: string }> };

/**
 * POST → Caja aprueba una pierna en USD de la cotización.
 * Requiere permiso fiscal:write o crm:write (SUPERUSER / admin-secret pasan siempre).
 */
export async function POST(req: NextRequest, ctx: Ctx) {
  const { id } = await ctx.params;
  void req; // no body requerido
  const up = await proxyJsonToReceiver(
    `/api/inbox/payment-allocations/${encodeURIComponent(id)}/approve-usd`,
    { method: "POST", body: {} }
  );
  return nextJsonFromUpstream(up);
}
