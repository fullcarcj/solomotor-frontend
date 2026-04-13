/**
 * URL de imagen en Firebase Storage (formato REST).
 * `base` debe terminar en la carpeta codificada, p. ej.
 * `https://firebasestorage.googleapis.com/v0/b/<bucket>/o/productos%2F`
 */
export function firebaseProductImageUrl(
  sku: string,
  base?: string | null
): string | null {
  const b = (base ?? "").trim().replace(/\/+$/, "");
  if (!b || !String(sku).trim()) return null;
  const safeSku = encodeURIComponent(String(sku).trim());
  const suffix = b.includes("alt=media")
    ? ""
    : (b.includes("?") ? "&" : "?") + "alt=media";
  return `${b}${safeSku}.jpg${suffix}`;
}

export function productImageBaseUrl(): string {
  return (
    process.env.NEXT_PUBLIC_PRODUCT_IMAGE_BASE_URL ||
    process.env.PRODUCT_IMAGE_BASE_URL ||
    ""
  ).trim();
}
