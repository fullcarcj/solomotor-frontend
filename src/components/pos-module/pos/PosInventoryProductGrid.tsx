"use client";

/* eslint-disable @next/next/no-img-element */
import Link from "next/link";
import CartCounter from "@/core/common/counter/counter";
import { ProductThumb } from "@/components/Inventory/ProductThumb";
import { inventoryPosProductFallbackPath } from "@/lib/inventoryPosPlaceholderPath";
import {
  productBrandLabel,
  productCanonicalSku,
  productCategoryLabel,
  productDisplayName,
  productLegacySku,
} from "@/lib/inventoryProductCompat";

export type PosInventoryApiProduct = {
  id?: number | string;
  product_id?: number | string;
  productId?: number | string;
  sku: string;
  sku_nuevo?: string | null;
  sku_old?: string | null;
  oem_original?: string | null;
  barcode?: string | null;
  name: string;
  nombre_corto?: string | null;
  descripcion_larga?: string | null;
  category: string | null;
  category_id?: number | string | null;
  subcategory_id?: number | string | null;
  brand: string | null;
  brand_id?: number | string | null;
  unit_type?: string | null;
  is_universal?: boolean | null;
  weight?: string | number | null;
  dimensions?: string | null;
  unit_price_usd: string | number | null;
  stock_qty?: string | number | null;
};

function parseProductIdFromApi(p: PosInventoryApiProduct): number | undefined {
  const raw = p.id ?? p.product_id ?? p.productId;
  if (raw == null || raw === "") return undefined;
  const n = typeof raw === "number" ? raw : Number(String(raw).trim());
  if (Number.isFinite(n) && n > 0) return Math.trunc(n);
  return undefined;
}

export function formatPosPrice(unitPriceUsd: string | number | null): string {
  const n = Number(unitPriceUsd);
  if (unitPriceUsd == null || Number.isNaN(n)) return "—";
  return `$${n.toFixed(2)}`;
}

/** Heurística por pestaña del tema; «all» no filtra. */
export function filterPosProductsByTab(
  products: PosInventoryApiProduct[],
  tabId: string
): PosInventoryApiProduct[] {
  if (tabId === "all") return products;
  const hay = (p: PosInventoryApiProduct) =>
    `${productDisplayName(p)} ${productCategoryLabel(p)} ${productBrandLabel(p)}`.toLowerCase();
  const tabKey = tabId === "headphone" ? "headphones" : tabId;
  const tests: Record<string, RegExp> = {
    headphones: /head|audio|earphone|airpod|headset|audífono|auricular/i,
    shoes: /shoe|zapato|calzado|footwear|nike|adidas/i,
    mobiles: /mobile|phone|iphone|android|celular|teléfono|móvil/i,
    watches: /watch|reloj|smartwatch/i,
    laptops: /laptop|notebook|macbook|portátil|chromebook/i,
    appliances: /appliance|electro|heladera|nevera|lavar|horno|micro|aire/i,
    homeneed: /home|hogar|casa|kitchen|cocina|decor|furniture|mueble|limpieza|laundry|baño/i,
  };
  const re = tests[tabKey];
  if (!re) return products;
  return products.filter((p) => re.test(hay(p)));
}

type Props = {
  products: PosInventoryApiProduct[];
  loading: boolean;
  error: string | null;
  onProductCardClick?: () => void;
  /** Maquetación del tema: POS clásico (pos-five) vs POS 3/4 (tarjeta compacta). */
  variant?: "pos5" | "pos4";
};

export default function PosInventoryProductGrid({
  products,
  loading,
  error,
  onProductCardClick,
  variant = "pos5",
}: Props) {
  const rowClass = variant === "pos4" ? "row row-cols-xxl-5 g-3" : "row g-3";
  if (loading) {
    return (
      <div className={rowClass}>
        <div className="col-12 text-center text-muted py-5">Cargando catálogo…</div>
      </div>
    );
  }
  if (error) {
    return (
      <div className={rowClass}>
        <div className="col-12 alert alert-danger mb-0" role="alert">
          {error}
        </div>
      </div>
    );
  }
  if (products.length === 0) {
    return (
      <div className={rowClass}>
        <div className="col-12 text-muted py-5 text-center">
          No hay productos para esta pestaña o la búsqueda.
        </div>
      </div>
    );
  }
  return (
    <div className={rowClass}>
      {products.map((p) => {
        const id = parseProductIdFromApi(p);
        const sku = productCanonicalSku(p);
        const skuOld = productLegacySku(p);
        const key =
          id != null
            ? `id-${id}`
            : `sku-${encodeURIComponent(sku || "unknown")}`;
        const fallback = inventoryPosProductFallbackPath(id, sku);
        const displayName = productDisplayName(p) || "—";
        const categoryLabel = productCategoryLabel(p) || "—";
        if (variant === "pos4") {
          const stock = p.stock_qty;
          const stockLabel =
            stock != null && String(stock).trim() !== ""
              ? `${String(stock).trim()} Pcs`
              : "—";
          return (
            <div key={key} className="col-sm-6 col-md-6 col-lg-4 col-xl-3 col-xxl">
              <div
                className="product-info card"
                onClick={onProductCardClick}
                tabIndex={0}
              >
                <Link href="#" className="product-image" onClick={(e) => e.preventDefault()}>
                  <ProductThumb
                    sku={sku}
                    skuOld={skuOld}
                    fallback={fallback}
                    className="img-fluid w-100"
                    alt={displayName || "Producto"}
                  />
                </Link>
                <div className="product-content">
                  <h6 className="fs-14 fw-bold mb-1">
                    <Link href="#" onClick={(e) => e.preventDefault()}>
                      {displayName}
                    </Link>
                  </h6>
                  <div className="d-flex align-items-center justify-content-between">
                    <h6 className="text-teal fs-14 fw-bold mb-0">
                      {formatPosPrice(p.unit_price_usd)}
                    </h6>
                    <p className="text-pink mb-0">{stockLabel}</p>
                  </div>
                </div>
              </div>
            </div>
          );
        }
        return (
          <div key={key} className="col-sm-6 col-md-6 col-lg-6 col-xl-4 col-xxl-3">
            <div
              className="product-info card mb-0"
              onClick={onProductCardClick}
              tabIndex={0}
            >
              <Link href="#" className="pro-img" onClick={(e) => e.preventDefault()}>
                <ProductThumb
                  sku={sku}
                  skuOld={skuOld}
                  fallback={fallback}
                  className="img-fluid"
                  alt={displayName || "Producto"}
                />
                <span>
                  <i className="ti ti-circle-check-filled" />
                </span>
              </Link>
              <h6 className="cat-name">
                <Link href="#" onClick={(e) => e.preventDefault()}>
                  {categoryLabel}
                </Link>
              </h6>
              <h6 className="product-name">
                <Link href="#" onClick={(e) => e.preventDefault()}>
                  {displayName}
                </Link>
              </h6>
              <div className="d-flex align-items-center justify-content-between price">
                <p className="text-gray-9 mb-0">{formatPosPrice(p.unit_price_usd)}</p>
                <div className="qty-item m-0">
                  <CartCounter />
                </div>
              </div>
            </div>
          </div>
        );
      })}
    </div>
  );
}
