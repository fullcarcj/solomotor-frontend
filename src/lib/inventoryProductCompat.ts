import { normalizeInventoryImageKey } from "@/lib/productImageUrl";

type CompatProduct = {
  sku?: string | null;
  sku_nuevo?: string | null;
  sku_old?: string | null;
  name?: string | null;
  nombre_corto?: string | null;
  description?: string | null;
  descripcion_larga?: string | null;
  category?: string | null;
  brand?: string | null;
};

function clean(v: unknown): string {
  return String(v ?? "").trim();
}

/** SKU canónico para UI/operación; prioriza nuevo esquema sin romper legado. */
export function productCanonicalSku(p: CompatProduct): string {
  const v = clean(p.sku_nuevo) || clean(p.sku);
  return normalizeInventoryImageKey(v);
}

/** SKU legado para fallback de imágenes y trazabilidad. */
export function productLegacySku(p: CompatProduct): string {
  const v = clean(p.sku_old) || clean(p.sku);
  return normalizeInventoryImageKey(v);
}

/** Nombre corto para listas; fallback al nombre histórico. */
export function productDisplayName(p: CompatProduct): string {
  return clean(p.nombre_corto) || clean(p.name);
}

/** Descripción larga; acepta coexistencia entre campos viejo/nuevo. */
export function productLongDescription(p: CompatProduct): string {
  return clean(p.descripcion_larga) || clean(p.description) || clean(p.name);
}

export function productCategoryLabel(p: CompatProduct): string {
  return clean(p.category);
}

export function productBrandLabel(p: CompatProduct): string {
  return clean(p.brand);
}
