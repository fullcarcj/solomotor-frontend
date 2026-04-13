/**
 * SVG de placeholder en lista/detalle inventario. Solo existen en `public/` los números listados (no hay 12–17).
 */
const POS_PRODUCT_SVG_IDS = [1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 18] as const;

function skuSeed(sku: string): number {
  const t = String(sku).trim();
  if (!t) return 0;
  let h = 0;
  for (let i = 0; i < t.length; i++) {
    h = (h * 31 + t.charCodeAt(i)) | 0;
  }
  return Math.abs(h);
}

/**
 * Placeholder distinto por fila: mezcla `id` y `sku` para que no todo caiga en el mismo SVG si el API repite id o usa 0.
 */
export function inventoryPosProductFallbackPath(
  productId: number | null | undefined,
  sku?: string | null
): string {
  const id =
    productId != null && Number.isFinite(Number(productId))
      ? Math.trunc(Number(productId))
      : 0;
  const mix = id + skuSeed(String(sku ?? ""));
  const idx =
    mix !== 0
      ? Math.abs(mix) % POS_PRODUCT_SVG_IDS.length
      : skuSeed(String(sku ?? "")) % POS_PRODUCT_SVG_IDS.length;
  const n = POS_PRODUCT_SVG_IDS[idx];
  return `/assets/img/products/pos-product-${String(n).padStart(2, "0")}.svg`;
}
