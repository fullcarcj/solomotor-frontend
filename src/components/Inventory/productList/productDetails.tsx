"use client";
/* eslint-disable @next/next/no-img-element */

import Link from "next/link";
import { useSearchParams } from "next/navigation";
import { useEffect, useMemo, useRef, useState } from "react";
import Slider from "react-slick";
import "slick-carousel/slick/slick.css";
import "slick-carousel/slick/slick-theme.css";
import { Alert, Spin } from "antd";
import { ArrowLeft, Edit } from "react-feather";
import { all_routes } from "@/data/all_routes";
import type { InventoryProductDetail } from "@/components/Inventory/add-product/addproduct";
import { ProductThumb } from "@/components/Inventory/ProductThumb";
import { inventoryPosProductFallbackPath } from "@/lib/inventoryPosPlaceholderPath";
import {
  productBrandLabel,
  productCanonicalSku,
  productCategoryLabel,
  productDisplayName,
  productLegacySku,
  productLongDescription,
} from "@/lib/inventoryProductCompat";

type ProductDetailApi = InventoryProductDetail & {
  is_active?: boolean;
  source?: string | null;
};

function dash(v: unknown): string {
  if (v == null) return "—";
  const s = String(v).trim();
  return s || "—";
}

function formatPrice(v: string | number | null | undefined): string {
  const n = Number(v);
  if (v == null || Number.isNaN(n)) return "—";
  return `$${n.toFixed(2)}`;
}

function statusLabel(p: ProductDetailApi): string {
  if (typeof p.is_active === "boolean") {
    return p.is_active ? "Activo" : "Inactivo";
  }
  return "—";
}

const ProductDetailsComponent = () => {
  const searchParams = useSearchParams();
  const id = searchParams.get("id");
  const sliderRef = useRef<Slider | null>(null);
  const route = all_routes;

  const [product, setProduct] = useState<ProductDetailApi | null>(null);
  const [loadError, setLoadError] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!id || !/^\d+$/.test(id)) {
      setLoadError(
        "Falta un id válido. Abre el detalle desde la lista de productos (icono ojo) o usa /product-details?id=123."
      );
      setProduct(null);
      setLoading(false);
      return;
    }

    let cancelled = false;
    (async () => {
      setLoading(true);
      setLoadError(null);
      try {
        const res = await fetch(`/api/inventory/products/${id}`, {
          cache: "no-store",
        });
        const body = (await res.json()) as {
          data?: ProductDetailApi;
          error?: { message?: string; code?: string };
        };
        if (cancelled) return;
        if (!res.ok) {
          throw new Error(
            body?.error?.message ||
              body?.error?.code ||
              `Error ${res.status}`
          );
        }
        if (!body.data) throw new Error("Respuesta sin datos del producto");
        setProduct(body.data);
      } catch (e) {
        if (!cancelled) {
          setProduct(null);
          setLoadError(
            e instanceof Error ? e.message : "No se pudo cargar el producto"
          );
        }
      } finally {
        if (!cancelled) setLoading(false);
      }
    })();

    return () => {
      cancelled = true;
    };
  }, [id]);

  const settings = useMemo(
    () => ({
      dots: false,
      arrows: false,
      infinite: true,
      speed: 500,
      slidesToShow: 1,
      slidesToScroll: 1,
      responsive: [
        { breakpoint: 1170, settings: { slidesToShow: 1 } },
        { breakpoint: 800, settings: { slidesToShow: 1 } },
        { breakpoint: 0, settings: { slidesToShow: 1 } },
      ],
    }),
    []
  );

  const thumbFallback = useMemo(() => {
    if (!product?.id) return "/assets/img/products/pos-product-01.svg";
    return inventoryPosProductFallbackPath(product.id, productCanonicalSku(product));
  }, [product]);

  if (loading) {
    return (
      <div className="page-wrapper">
        <div className="content p-5 d-flex justify-content-center">
          <Spin size="large" tip="Cargando producto…" />
        </div>
      </div>
    );
  }

  if (loadError || !product) {
    return (
      <div className="page-wrapper">
        <div className="content">
          <div className="page-header">
            <div className="page-title">
              <h4>Detalle del producto</h4>
            </div>
            <div className="page-btn">
              <Link href={route.productlist} className="btn btn-primary">
                <ArrowLeft className="me-2" size={16} />
                Volver al listado
              </Link>
            </div>
          </div>
          <Alert type="error" message={loadError ?? "Producto no encontrado"} />
        </div>
      </div>
    );
  }

  const p = product;
  const displayName = productDisplayName(p) || "—";
  const sku = productCanonicalSku(p);
  const skuOld = productLegacySku(p);
  const categoryLabel = productCategoryLabel(p) || "—";
  const brandLabel = productBrandLabel(p) || "—";
  const longDescription = productLongDescription(p) || "—";
  const editHref = `${route.editproduct}?id=${p.id}`;

  return (
    <div className="page-wrapper">
      <div className="content">
        <div className="page-header">
          <div className="page-title">
            <h4>Detalle del producto</h4>
            <h6>{dash(displayName)}</h6>
          </div>
          <div className="page-btn d-flex gap-2">
            <Link href={route.productlist} className="btn btn-outline-light">
              <ArrowLeft className="me-2" size={16} />
              Listado
            </Link>
            <Link href={editHref} className="btn btn-primary">
              <Edit className="me-2" size={16} />
              Editar
            </Link>
          </div>
        </div>

        <div className="row">
          <div className="col-lg-8 col-sm-12">
            <div className="card">
              <div className="card-body">
                <div className="bar-code-view">
                  <div className="product-details-barcode">
                    <img
                      src="/assets/img/barcode/barcode1.png"
                      className="barcode"
                      alt=""
                    />
                    <img
                      src="/assets/img/barcode/barcode1-white.png"
                      className="barcode-white"
                      alt=""
                    />
                  </div>
                  <span className="text-muted small ms-2">SKU: {dash(sku)}</span>
                  <Link href="#" className="printimg">
                    <i className="ti ti-printer fs-24 text-dark" />
                  </Link>
                </div>
                <div className="productdetails">
                  <ul className="product-bar">
                    <li>
                      <h4>Producto</h4>
                      <h6>{dash(displayName)}</h6>
                    </li>
                    <li>
                      <h4>Categoría</h4>
                      <h6>{dash(categoryLabel)}</h6>
                    </li>
                    <li>
                      <h4>Subcategoría</h4>
                      <h6>—</h6>
                    </li>
                    <li>
                      <h4>Marca</h4>
                      <h6>{dash(brandLabel)}</h6>
                    </li>
                    <li>
                      <h4>Unidad</h4>
                      <h6>—</h6>
                    </li>
                    <li>
                      <h4>SKU</h4>
                      <h6>{dash(sku)}</h6>
                    </li>
                    <li>
                      <h4>Cantidad mínima</h4>
                      <h6>{dash(p.stock_min)}</h6>
                    </li>
                    <li>
                      <h4>Cantidad en stock</h4>
                      <h6>{dash(p.stock_qty)}</h6>
                    </li>
                    <li>
                      <h4>Stock máximo</h4>
                      <h6>{dash(p.stock_max)}</h6>
                    </li>
                    <li>
                      <h4>Impuesto</h4>
                      <h6>—</h6>
                    </li>
                    <li>
                      <h4>Descuento</h4>
                      <h6>—</h6>
                    </li>
                    <li>
                      <h4>Precio (USD)</h4>
                      <h6>{formatPrice(p.unit_price_usd)}</h6>
                    </li>
                    <li>
                      <h4>Estado</h4>
                      <h6>{statusLabel(p)}</h6>
                    </li>
                    <li>
                      <h4>Origen</h4>
                      <h6>{dash(p.source)}</h6>
                    </li>
                    <li>
                      <h4>Descripción</h4>
                      <h6>{dash(longDescription)}</h6>
                    </li>
                  </ul>
                </div>
              </div>
            </div>
          </div>
          <div className="col-lg-4 col-sm-12">
            <div className="card">
              <div className="card-body">
                <div className="slider-product-details">
                  <Slider
                    ref={sliderRef}
                    {...settings}
                    className="product-slide"
                  >
                    <div className="slider-product text-center">
                      <ProductThumb
                        sku={sku}
                        skuOld={skuOld}
                        fallback={thumbFallback}
                        className="img-fluid rounded"
                        alt={displayName}
                      />
                      <h4 className="text-dark mt-2">{dash(sku)}</h4>
                      <h6 className="text-dark text-muted">
                        Vista previa · Firebase (.webp, p. ej. sufijo _1)
                      </h6>
                    </div>
                  </Slider>
                  <div className="product-nav-controls d-flex align-items-center justify-content-between">
                    <button
                      type="button"
                      className="product-prev"
                      onClick={() => sliderRef.current?.slickPrev()}
                    >
                      <i className="fa fa-chevron-left" />
                    </button>
                    <button
                      type="button"
                      className="product-next"
                      onClick={() => sliderRef.current?.slickNext()}
                    >
                      <i className="fa fa-chevron-right" />
                    </button>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ProductDetailsComponent;
