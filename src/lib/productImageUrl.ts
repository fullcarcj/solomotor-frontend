/**
 * URL de imagen en Firebase Storage (formato REST).
 * `base` suele terminar en la carpeta codificada, p. ej.
 * `https://firebasestorage.googleapis.com/v0/b/<bucket>/o/products%2F`
 *
 * Objeto con carpeta: `{prefijo}/{SKU}.ext` (ver `productImageStoragePrefix()`).
 * Objeto en la raíz del bucket: `{SKU}.ext` → usa `firebaseProductImageUrlFlatRoot`.
 */
export function firebaseProductImageUrl(
  sku: string,
  base?: string | null,
  ext: "jpg" | "png" | "webp" = "jpg"
): string | null {
  const b = (base ?? "").trim().replace(/\/+$/, "");
  if (!b || !String(sku).trim()) return null;
  const pathOnly = b.split("?")[0];
  if (/\/v0\/b\/[^/]+\/o$/i.test(pathOnly.replace(/\/+$/, ""))) {
    return null;
  }
  const safeSku = encodeURIComponent(String(sku).trim());
  const suffix = b.includes("alt=media")
    ? ""
    : (b.includes("?") ? "&" : "?") + "alt=media";
  return `${b}${safeSku}.${ext}${suffix}`;
}

/**
 * Prefijo REST de Firebase Storage hasta `/o/...`.
 * En componentes cliente, Next suele inlined mejor `NEXT_PUBLIC_*`; `next.config` suele copiar ambas al build.
 */
export function productImageBaseUrl(): string {
  return (
    process.env.NEXT_PUBLIC_PRODUCT_IMAGE_BASE_URL ||
    process.env.PRODUCT_IMAGE_BASE_URL ||
    ""
  ).trim();
}

/** Si `base` es `.../o/{carpeta}%2F`, devuelve `{carpeta}` (p.ej. productos o products). */
function inferStoragePrefixFromBaseUrl(base: string): string | null {
  const b = base.trim();
  const m = b.match(/\/o\/([^?]+)/i);
  if (!m) return null;
  let encoded = m[1];
  if (!/%2F$/i.test(encoded) && !/\/$/.test(encoded)) return null;
  encoded = encoded.replace(/%2F$/i, "").replace(/\/$/, "");
  try {
    const folder = decodeURIComponent(encoded).replace(/\/$/, "");
    return folder || null;
  } catch {
    return null;
  }
}

/**
 * Carpeta (sin slashes) bajo la que están las imágenes `{SKU}.jpg` en el bucket.
 *
 * 1. `PRODUCT_IMAGE_STORAGE_PREFIX` / `NEXT_PUBLIC_*` si lo defines.
 * 2. Si no, se **infiere** desde `PRODUCT_IMAGE_BASE_URL` cuando termina en `.../o/nombreCarpeta%2F` (p. ej. legado `productos`).
 * 3. Si no se puede inferir, por defecto **`products`** (alineado con la tabla `products` en backend).
 */
export function productImageStoragePrefix(): string {
  const raw = (
    process.env.NEXT_PUBLIC_PRODUCT_IMAGE_STORAGE_PREFIX ||
    process.env.PRODUCT_IMAGE_STORAGE_PREFIX ||
    ""
  )
    .trim()
    .replace(/^\/+|\/+$/g, "");
  if (raw) return raw;

  const inferred = inferStoragePrefixFromBaseUrl(productImageBaseUrl());
  if (inferred) return inferred;

  return "products";
}

/**
 * Raíz `.../v0/b/<bucket>/o` para armar URLs con objeto codificado en un solo segmento.
 * Soporta `firebasestorage.googleapis.com` y host `*.firebasestorage.app`.
 */
export function firebaseStorageORootFromBase(base: string): string | null {
  const s = base.trim();
  const patterns = [
    /^(https:\/\/firebasestorage\.googleapis\.com\/v0\/b\/[^/]+\/o)/i,
    /^(https:\/\/[^/]+\.firebasestorage\.app\/v0\/b\/[^/]+\/o)/i,
  ];
  for (const re of patterns) {
    const m = s.match(re);
    if (m) return m[1];
  }
  return null;
}

/** Objeto en la raíz del bucket: `{sku}.{ext}` → `.../o/{encodeURIComponent(sku.ext)}?alt=media` */
export function firebaseProductImageUrlFlatRoot(
  sku: string,
  base: string | null | undefined,
  ext: "jpg" | "png" | "webp" = "jpg"
): string | null {
  const root = firebaseStorageORootFromBase(base ?? "");
  if (!root || !String(sku).trim()) return null;
  const name = `${String(sku).trim()}.${ext}`;
  return `${root}/${encodeURIComponent(name)}?alt=media`;
}

/** Variante URL: `.../o/` + encodeURIComponent(`{prefix}/{sku}.ext`) + ?alt=media */
export function firebaseProductImageUrlEncodedFullPath(
  sku: string,
  base: string | null | undefined,
  ext: "jpg" | "png" | "webp" = "jpg"
): string | null {
  const root = firebaseStorageORootFromBase(base ?? "");
  if (!root || !String(sku).trim()) return null;
  const prefix = productImageStoragePrefix();
  const path = `${prefix}/${String(sku).trim()}.${ext}`;
  const enc = encodeURIComponent(path);
  return `${root}/${enc}?alt=media`;
}

/** Extensiones probadas; `.webp` primero (común en catálogos actuales). */
const IMAGE_EXTS = ["webp", "jpg", "png"] as const;

const INVISIBLE_CHARS = /[\u200B-\u200D\uFEFF]/g;

/** Quita espacios raros/BOM en SKU o nombres pegados desde Excel. */
export function normalizeInventoryImageKey(s: string): string {
  return String(s ?? "").replace(INVISIBLE_CHARS, "").trim();
}

/** `.../o/productos%2F` (carpeta en la misma URL que usa Firebase en consola). */
function baseUsesEncodedFolderPath(base: string): boolean {
  const path = base.trim().split("?")[0].replace(/\/+$/, "");
  return /\/o\/.+%2F$/i.test(path);
}

/**
 * Posible nombre de objeto en Storage (sin extensión): una sola “palabra”, a menudo con `_`.
 * Evita usar descripciones largas con espacios; ayuda cuando el catálogo guarda el código de foto en `name` y el SKU es otro.
 */
export function isLikelyFirebaseImageBasename(s: string): boolean {
  const t = normalizeInventoryImageKey(s);
  if (t.length < 4 || t.length > 128) return false;
  if (/\s/.test(t)) return false;
  if (!/^[A-Za-z0-9][A-Za-z0-9_.-]*$/.test(t)) return false;
  return t.includes("_") || t.length >= 14;
}

/** Claves en orden: SKU; si el nombre del producto parece basename de Storage y difiere del SKU, también. */
export function inventoryImageSearchKeys(
  sku: string,
  productName?: string | null
): string[] {
  const keys: string[] = [];
  const seen = new Set<string>();
  const add = (raw: string | null | undefined) => {
    const k = normalizeInventoryImageKey(String(raw ?? ""));
    if (!k || seen.has(k)) return;
    seen.add(k);
    keys.push(k);
  };
  add(sku);
  const name = normalizeInventoryImageKey(String(productName ?? ""));
  if (
    name &&
    name !== normalizeInventoryImageKey(String(sku)) &&
    isLikelyFirebaseImageBasename(name)
  ) {
    add(name);
  }
  return keys;
}

/** URLs candidatas probando cada clave (p. ej. SKU y nombre “tipo archivo”). */
export function firebaseProductImageCandidateUrlsForRow(
  sku: string,
  productName: string | null | undefined,
  base: string
): string[] {
  const list: string[] = [];
  const push = (u: string | null | undefined) => {
    if (u && !list.includes(u)) list.push(u);
  };
  for (const key of inventoryImageSearchKeys(sku, productName)) {
    for (const u of firebaseProductImageCandidateUrls(key, base)) {
      push(u);
    }
  }
  return list;
}

/**
 * URLs candidatas sin duplicados. Si la base es `.../o/productos%2F`, la primera coincide con el enlace de la consola de Firebase.
 */
export function firebaseProductImageCandidateUrls(
  sku: string,
  base: string
): string[] {
  const list: string[] = [];
  const push = (u: string | null | undefined) => {
    if (u && !list.includes(u)) list.push(u);
  };

  const b = base.trim();
  const skuTrim = normalizeInventoryImageKey(String(sku));
  if (!b || !skuTrim) return list;

  const skuVariants = Array.from(
    new Set(
      [skuTrim, skuTrim.replace(/\s+/g, ""), skuTrim.toLowerCase()].filter(
        Boolean
      )
    )
  );

  const folderBase = baseUsesEncodedFolderPath(b);

  for (const s of skuVariants) {
    for (const ext of IMAGE_EXTS) {
      if (folderBase) {
        push(firebaseProductImageUrl(s, b, ext));
        push(firebaseProductImageUrlEncodedFullPath(s, b, ext));
        push(firebaseProductImageUrlFlatRoot(s, b, ext));
      } else {
        push(firebaseProductImageUrlFlatRoot(s, b, ext));
        push(firebaseProductImageUrl(s, b, ext));
        push(firebaseProductImageUrlEncodedFullPath(s, b, ext));
      }
    }
  }
  return list;
}
