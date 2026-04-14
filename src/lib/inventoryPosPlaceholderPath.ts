const BROKEN_PRODUCT_IMAGE_PATH = "/assets/img/products/broken-image.svg";

/**
 * Placeholder explícito de "imagen rota" para cuando no existe la foto del producto.
 */
export function inventoryPosProductFallbackPath(
  productId: number | null | undefined,
  sku?: string | null
): string {
  void productId;
  void sku;
  return BROKEN_PRODUCT_IMAGE_PATH;
}
