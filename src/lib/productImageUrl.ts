const INVISIBLE_CHARS = /[\u200B-\u200D\uFEFF]/g;

/** Quita espacios raros/BOM en SKU (debe coincidir con el nombre `SKU.webp` en Storage). */
export function normalizeInventoryImageKey(s: string): string {
  return String(s ?? "").replace(INVISIBLE_CHARS, "").trim();
}

/**
 * URL de imagen en Firebase Storage (formato REST).
 * Convención del bucket: `productos/{nombre}.webp`. Suele ser `{SKU}.webp` o `{SKU}_1.webp` si el catálogo guarda el SKU sin el índice de foto.
 * Base típica: `https://.../v0/b/<bucket>/o/productos%2F` → URL `...%2F` + encodeURIComponent(SKU) + `.webp?alt=media`.
 *
 * Objeto en la raíz del bucket: `{SKU}.ext` → `firebaseProductImageUrlFlatRoot`.
 */
export function firebaseProductImageUrl(
  sku: string,
  base?: string | null,
  ext: "jpg" | "png" | "webp" = "jpg"
): string | null {
  const b = (base ?? "").trim().replace(/\/+$/, "");
  const key = normalizeInventoryImageKey(String(sku));
  if (!b || !key) return null;
  const pathOnly = b.split("?")[0];
  if (/\/v0\/b\/[^/]+\/o$/i.test(pathOnly.replace(/\/+$/, ""))) {
    return null;
  }
  const safeSku = encodeURIComponent(key);
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
    process.env.VITE_IMG_BASE_URL ||
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
  const key = normalizeInventoryImageKey(String(sku));
  if (!root || !key) return null;
  const name = `${key}.${ext}`;
  return `${root}/${encodeURIComponent(name)}?alt=media`;
}

/** Variante URL: `.../o/` + encodeURIComponent(`{prefix}/{sku}.ext`) + ?alt=media */
export function firebaseProductImageUrlEncodedFullPath(
  sku: string,
  base: string | null | undefined,
  ext: "jpg" | "png" | "webp" = "jpg"
): string | null {
  const root = firebaseStorageORootFromBase(base ?? "");
  const key = normalizeInventoryImageKey(String(sku));
  if (!root || !key) return null;
  const prefix = productImageStoragePrefix();
  const path = `${prefix}/${key}.${ext}`;
  const enc = encodeURIComponent(path);
  return `${root}/${enc}?alt=media`;
}

/** Extensiones probadas; `.webp` primero (común en catálogos actuales). */
const IMAGE_EXTS = ["webp", "jpg", "png"] as const;

/** `.../o/productos%2F` (carpeta en la misma URL que usa Firebase en consola). */
function baseUsesEncodedFolderPath(base: string): boolean {
  const path = base.trim().split("?")[0].replace(/\/+$/, "");
  return /\/o\/.+%2F$/i.test(path);
}

/** Nombres de objeto sin extensión: SKU, SKU sin espacios, y `SKU_1`…`SKU_9` (p. ej. `01833_F0001_SO_1.webp`). */
function storageFilenameStemsFromSku(skuTrim: string): string[] {
  const seen = new Set<string>();
  const out: string[] = [];
  const add = (raw: string) => {
    const t = normalizeInventoryImageKey(raw);
    if (!t || seen.has(t)) return;
    seen.add(t);
    out.push(t);
  };
  add(skuTrim);
  add(skuTrim.replace(/\s+/g, ""));
  const maxPhotoIndex = 9;
  for (let i = 1; i <= maxPhotoIndex; i++) {
    add(`${skuTrim}_${i}`);
  }
  return out;
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

  /** Stems probados: SKU tal cual, sin espacios, y `SKU_1`…`SKU_9` (fotos numeradas en Storage). */
  const stems = storageFilenameStemsFromSku(skuTrim);

  const folderBase = baseUsesEncodedFolderPath(b);

  for (const s of stems) {
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

/**
 * URLs candidatas para un solo stem de objeto en Storage (p. ej. `MI-SKU_2` → `MI-SKU_2.webp`).
 * Usado en edición para mostrar cada foto numerada sin mezclar con el resto de variantes del SKU.
 */
export function firebaseProductImageCandidateUrlsForStem(
  stem: string,
  base: string
): string[] {
  const list: string[] = [];
  const push = (u: string | null | undefined) => {
    if (u && !list.includes(u)) list.push(u);
  };

  const b = base.trim();
  const s = normalizeInventoryImageKey(String(stem));
  if (!b || !s) return list;

  const folderBase = baseUsesEncodedFolderPath(b);

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
  return list;
}
