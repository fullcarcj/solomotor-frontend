/**
 * URL de imagen en Firebase Storage (formato REST).
 * `base` debe terminar en la carpeta codificada, p. ej.
 * `https://firebasestorage.googleapis.com/v0/b/<bucket>/o/productos%2F`
 *
 * Objeto esperado en el bucket: `productos/{SKU}.jpg` (cambia `ext` si usas .png).
 */
export function firebaseProductImageUrl(
  sku: string,
  base?: string | null,
  ext: "jpg" | "png" | "webp" = "jpg"
): string | null {
  const b = (base ?? "").trim().replace(/\/+$/, "");
  if (!b || !String(sku).trim()) return null;
  const safeSku = encodeURIComponent(String(sku).trim());
  const suffix = b.includes("alt=media")
    ? ""
    : (b.includes("?") ? "&" : "?") + "alt=media";
  return `${b}${safeSku}.${ext}${suffix}`;
}

export function productImageBaseUrl(): string {
  return (
    process.env.NEXT_PUBLIC_PRODUCT_IMAGE_BASE_URL ||
    process.env.PRODUCT_IMAGE_BASE_URL ||
    ""
  ).trim();
}
