import { NextRequest, NextResponse } from "next/server";
import {
  normalizeInventoryImageKey,
  productImageStoragePrefix,
} from "@/lib/productImageUrl";
import { getFirebaseStorageBucket } from "@/lib/firebaseAdminApp";

export const runtime = "nodejs";

function safeSkuSegment(sku: string): string {
  return normalizeInventoryImageKey(sku).replace(/[/\\?%*:|"<>]/g, "_");
}

/**
 * POST { sku: string, index: 1-9 }
 * Elimina `{prefix}/{SKU}_{index}.webp` del bucket. Silencioso si el objeto no existe.
 */
export async function POST(req: NextRequest) {
  let body: { sku?: unknown; index?: unknown };
  try {
    body = await req.json();
  } catch {
    return NextResponse.json(
      { error: { code: "BAD_JSON", message: "JSON inválido" } },
      { status: 400 }
    );
  }

  const sku = normalizeInventoryImageKey(String(body?.sku ?? ""));
  const index = Number(body?.index);

  if (!sku) {
    return NextResponse.json(
      { error: { code: "NO_SKU", message: "Falta SKU" } },
      { status: 400 }
    );
  }
  if (!Number.isFinite(index) || index < 1 || index > 9) {
    return NextResponse.json(
      { error: { code: "BAD_INDEX", message: "Índice debe ser entre 1 y 9" } },
      { status: 400 }
    );
  }

  const prefix = productImageStoragePrefix();
  const safe = safeSkuSegment(sku);
  const objectPath = `${prefix}/${safe}_${index}.webp`;

  try {
    const bucket = getFirebaseStorageBucket();
    await bucket.file(objectPath).delete({ ignoreNotFound: true });
  } catch (e) {
    const msg = e instanceof Error ? e.message : String(e);
    if (msg.includes("FALTA_FIREBASE_SERVICE_ACCOUNT_JSON")) {
      return NextResponse.json(
        {
          error: {
            code: "CONFIG",
            message:
              "Firebase no configurado: define FIREBASE_SERVICE_ACCOUNT_JSON en el servidor.",
          },
        },
        { status: 503 }
      );
    }
    return NextResponse.json(
      { error: { code: "STORAGE", message: msg } },
      { status: 500 }
    );
  }

  return NextResponse.json({ ok: true, path: objectPath });
}
