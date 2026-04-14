import { NextRequest, NextResponse } from "next/server";
import {
  normalizeInventoryImageKey,
  productImageStoragePrefix,
} from "@/lib/productImageUrl";
import { getFirebaseStorageBucket } from "@/lib/firebaseAdminApp";

export const runtime = "nodejs";

const MAX_BYTES = 12 * 1024 * 1024;

function safeSkuSegment(sku: string): string {
  return normalizeInventoryImageKey(sku).replace(/[/\\?%*:|"<>]/g, "_");
}

/**
 * POST multipart: `file` (webp), `sku`, `index` (1-9).
 * Objeto: `{prefix}/{SKU}_{index}.webp` — mismo criterio que las URLs candidatas del listado.
 */
export async function POST(req: NextRequest) {
  let form: FormData;
  try {
    form = await req.formData();
  } catch {
    return NextResponse.json(
      { error: { code: "BAD_FORM", message: "FormData inválido" } },
      { status: 400 }
    );
  }

  const file = form.get("file");
  const skuRaw = String(form.get("sku") ?? "");
  const indexRaw = String(form.get("index") ?? "1");

  if (!(file instanceof File)) {
    return NextResponse.json(
      { error: { code: "NO_FILE", message: "Falta el archivo" } },
      { status: 400 }
    );
  }

  const sku = normalizeInventoryImageKey(skuRaw);
  const index = Number.parseInt(indexRaw, 10);
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

  const buf = Buffer.from(await file.arrayBuffer());
  if (buf.length > MAX_BYTES) {
    return NextResponse.json(
      { error: { code: "TOO_LARGE", message: "Imagen demasiado grande (máx. 12 MB)" } },
      { status: 400 }
    );
  }

  const prefix = productImageStoragePrefix();
  const safe = safeSkuSegment(sku);
  const objectPath = `${prefix}/${safe}_${index}.webp`;

  try {
    const bucket = getFirebaseStorageBucket();
    await bucket.file(objectPath).save(buf, {
      contentType: "image/webp",
      resumable: false,
      metadata: {
        cacheControl: "public, max-age=31536000",
      },
    });
  } catch (e) {
    const msg = e instanceof Error ? e.message : String(e);
    if (msg.includes("FALTA_FIREBASE_SERVICE_ACCOUNT_JSON")) {
      return NextResponse.json(
        {
          error: {
            code: "CONFIG",
            message:
              "Subida no configurada: define FIREBASE_SERVICE_ACCOUNT_JSON en el servidor (y opcionalmente FIREBASE_STORAGE_BUCKET).",
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
