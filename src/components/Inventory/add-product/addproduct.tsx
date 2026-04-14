"use client";
/* eslint-disable @next/next/no-img-element */

import CommonFooter from "@/core/common/footer/commonFooter";
import CollapesIcon from "@/core/common/tooltip-content/collapes";
import RefreshIcon from "@/core/common/tooltip-content/refresh";
import AddBrand from "@/core/modals/inventory/addbrand";
import AddCategory from "@/core/modals/inventory/addcategory";
import Addunits from "@/core/modals/inventory/addunits";
import AddVariant from "@/core/modals/inventory/addvariant";
import AddVarientNew from "@/core/modals/inventory/addVarientNew";
import { all_routes } from "@/data/all_routes";
import { Alert, message } from "antd";
import {
  ArrowLeft,
  Info,
  PlusCircle,
  X,
  Image,
} from "react-feather";
import Link from "next/link";
import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { ProductFirebaseSlotImage } from "@/components/Inventory/ProductThumb";
import { inventoryPosProductFallbackPath } from "@/lib/inventoryPosPlaceholderPath";
import { normalizeInventoryImageKey } from "@/lib/productImageUrl";
import { fileToWebpBlob } from "@/lib/encodeImageWebpClient";
import Select from "react-select";
import Lightbox from "yet-another-react-lightbox";
import "yet-another-react-lightbox/styles.css";
export type InventoryProductDetail = {
  id: number;
  sku: string;
  name: string;
  description?: string | null;
  category?: string | null;
  brand?: string | null;
  unit_price_usd?: string | number | null;
  stock_qty?: string | number | null;
  stock_min?: string | number | null;
  stock_max?: string | number | null;
  /** Referencia de categoría Mercado Libre (p. ej. MLV…) si el backend la expone. */
  category_ml?: string | null;
};

/** Fila de `category_products` expuesta por GET /api/inventory/category-products. */
type CategoryProductRow = {
  id: number;
  category_descripcion: string;
  category_ml: string | null;
};

type SelectOption = { value: string; label: string };

/** Valor de `Unit` que muestra el campo `pcs_unit` (Piezas por Juego). */
const UNIT_VALUE_JUEGO_SET_COMBO = "juegoSetCombo";

function slugify(s: string) {
  return s
    .toLowerCase()
    .trim()
    .replace(/\s+/g, "-")
    .replace(/[^a-z0-9-]/g, "");
}

function mergeSelectOption(
  base: SelectOption[],
  extra?: string | null
): SelectOption[] {
  const v = (extra ?? "").trim();
  if (!v || v === "choose") return [...base];
  const lower = v.toLowerCase();
  if (
    base.some(
      (o) =>
        String(o.value).toLowerCase() === lower ||
        String(o.label).toLowerCase() === lower
    )
  ) {
    return [...base];
  }
  return [{ value: v, label: v }, ...base];
}

const CATEGORY_CHOOSE: SelectOption[] = [
  { value: "choose", label: "Choose" },
];

const BRAND_OPTIONS_BASE: SelectOption[] = [
  { value: "choose", label: "Choose" },
  { value: "nike", label: "Nike" },
  { value: "bolt", label: "Bolt" },
];

/** Tienda fija; si en el futuro hay más de una opción, el desplegable se habilita. */
const STORE_OPTIONS: SelectOption[] = [
  { value: "FULLCAR CJ CA", label: "FULLCAR CJ CA" },
];

/** Almacén fijo; misma lógica que Store. */
const WAREHOUSE_OPTIONS: SelectOption[] = [
  { value: "BELLO_MONTE", label: "BELLO_MONTE" },
];

export type AddProductComponentProps = {
  mode?: "create" | "edit";
  initialProduct?: InventoryProductDetail | null;
  loadError?: string | null;
};

export default function AddProductComponent({
  mode = "create",
  initialProduct = null,
  loadError = null,
}: AddProductComponentProps = {}) {
  const route = all_routes;
  const isEdit = mode === "edit";

  const [productName, setProductName] = useState("");
  const [slug, setSlug] = useState("");
  const [sku, setSku] = useState("");
  const [description, setDescription] = useState("");
  const [stockQty, setStockQty] = useState("");
  const [unitPrice, setUnitPrice] = useState("");
  const [stockMin, setStockMin] = useState("");
  const [categoryVal, setCategoryVal] = useState<SelectOption | null>(null);
  const [categoryRemoteBase, setCategoryRemoteBase] = useState<
    SelectOption[]
  >(() => [...CATEGORY_CHOOSE]);
  const [categoriesStatus, setCategoriesStatus] = useState<
    "idle" | "loading" | "ok" | "error"
  >("loading");
  const [categoriesError, setCategoriesError] = useState<string | null>(null);
  const [brandVal, setBrandVal] = useState<SelectOption | null>(null);
  const [storeVal, setStoreVal] = useState<SelectOption | null>(
    () => STORE_OPTIONS[0] ?? null
  );
  const [warehouseVal, setWarehouseVal] = useState<SelectOption | null>(
    () => WAREHOUSE_OPTIONS[0] ?? null
  );
  const [unitVal, setUnitVal] = useState<SelectOption | null>(null);
  const [pcsUnitVal, setPcsUnitVal] = useState<SelectOption | null>(null);
  /** Filas completas del catálogo (descripción + category_ml para MLV). */
  const [categoryMlRows, setCategoryMlRows] = useState<CategoryProductRow[]>(
    []
  );
  /** Texto mostrado: categoría de publicación ML Venezuela (MLV) asociada al producto. */
  const [predictedMlCategory, setPredictedMlCategory] = useState("");

  useEffect(() => {
    setStoreVal(STORE_OPTIONS[0] ?? null);
    setWarehouseVal(WAREHOUSE_OPTIONS[0] ?? null);
    if (!initialProduct) return;
    const name = initialProduct.name ?? "";
    setProductName(name);
    setSlug(slugify(name));
    setSku(initialProduct.sku ?? "");
    setDescription(initialProduct.description ?? "");
    setStockQty(
      initialProduct.stock_qty != null ? String(initialProduct.stock_qty) : ""
    );
    setUnitPrice(
      initialProduct.unit_price_usd != null &&
        !Number.isNaN(Number(initialProduct.unit_price_usd))
        ? String(Number(initialProduct.unit_price_usd))
        : ""
    );
    setStockMin(
      initialProduct.stock_min != null ? String(initialProduct.stock_min) : ""
    );
    const c = initialProduct.category?.trim();
    setCategoryVal(c ? { value: c, label: c } : null);
    const b = initialProduct.brand?.trim();
    setBrandVal(b ? { value: b, label: b } : null);
  }, [initialProduct]);

  useEffect(() => {
    if (unitVal?.value !== UNIT_VALUE_JUEGO_SET_COMBO) {
      setPcsUnitVal(null);
    }
  }, [unitVal]);

  /**
   * Portal del menú solo tras mount: en SSR y en el primer paint del cliente debe ser el mismo
   * valor (undefined); si usamos `document.body` solo en cliente, la hidratación no coincide con el HTML del servidor.
   */
  const [selectMenuPortalTarget, setSelectMenuPortalTarget] =
    useState<HTMLElement | null>(null);
  useEffect(() => {
    setSelectMenuPortalTarget(document.body);
  }, []);

  /** Menú react-select en `document.body` para que no lo recorte overflow del acordeón/tarjeta. */
  const reactSelectPortalProps = useMemo(
    () => ({
      menuPortalTarget: selectMenuPortalTarget ?? undefined,
      styles: {
        menuPortal: (base: Record<string, unknown>) => ({
          ...base,
          zIndex: 9999,
        }),
      },
    }),
    [selectMenuPortalTarget]
  );

  useEffect(() => {
    let cancelled = false;
    (async () => {
      setCategoriesStatus("loading");
      setCategoriesError(null);
      try {
        const res = await fetch("/api/inventory/category-products", {
          cache: "no-store",
        });
        const body = (await res.json()) as {
          data?: { categories?: CategoryProductRow[] };
          error?: { code?: string; message?: string };
        };
        if (cancelled) return;
        if (!res.ok) {
          const msg =
            body?.error?.message ||
            body?.error?.code ||
            `Error ${res.status}`;
          throw new Error(msg);
        }
        const rows = body.data?.categories ?? [];
        setCategoryMlRows(rows);
        const seen = new Set<string>();
        const fromApi: SelectOption[] = [];
        for (const r of rows) {
          const d = (r.category_descripcion ?? "").trim();
          if (!d) continue;
          const k = d.toLowerCase();
          if (seen.has(k)) continue;
          seen.add(k);
          fromApi.push({ value: d, label: d });
        }
        setCategoryRemoteBase([...CATEGORY_CHOOSE, ...fromApi]);
        setCategoriesStatus("ok");
      } catch (e) {
        if (!cancelled) {
          setCategoriesStatus("error");
          setCategoriesError(
            e instanceof Error ? e.message : "No se pudieron cargar categorías"
          );
          setCategoryRemoteBase([...CATEGORY_CHOOSE]);
          setCategoryMlRows([]);
        }
      }
    })();
    return () => {
      cancelled = true;
    };
  }, []);

  const categoryOptions = useMemo(
    () =>
      mergeSelectOption(
        categoryRemoteBase,
        initialProduct?.category ?? null
      ),
    [categoryRemoteBase, initialProduct]
  );

  const normalizeMlvHint = useCallback((raw: string) => {
    const t = raw.trim();
    if (!t) return "";
    const u = t.toUpperCase();
    if (u.startsWith("MLV")) return t;
    return `MLV-${t}`;
  }, []);

  const refreshPredictedMlCategory = useCallback(() => {
    const label = (categoryVal?.label ?? "").trim();
    if (!label || label.toLowerCase() === "choose") {
      setPredictedMlCategory("");
      message.warning("Elige una categoría de producto primero.");
      return;
    }
    const row = categoryMlRows.find(
      (r) =>
        (r.category_descripcion ?? "").trim().toLowerCase() ===
        label.toLowerCase()
    );
    const raw = (row?.category_ml ?? "").trim();
    if (!raw) {
      setPredictedMlCategory("");
      message.info(
        "No hay referencia ML en el catálogo para esta categoría (category_products.category_ml)."
      );
      return;
    }
    setPredictedMlCategory(normalizeMlvHint(raw));
    message.success("Categoría Mercado Libre actualizada desde el catálogo.");
  }, [categoryVal, categoryMlRows, normalizeMlvHint]);

  useEffect(() => {
    if (!categoryMlRows.length) return;
    const fromProduct = initialProduct?.category_ml?.trim();
    if (fromProduct) {
      setPredictedMlCategory(normalizeMlvHint(fromProduct));
      return;
    }
    const cat = initialProduct?.category?.trim();
    if (!cat) return;
    const row = categoryMlRows.find(
      (r) =>
        (r.category_descripcion ?? "").trim().toLowerCase() === cat.toLowerCase()
    );
    const raw = (row?.category_ml ?? "").trim();
    if (raw) setPredictedMlCategory(normalizeMlvHint(raw));
  }, [initialProduct, categoryMlRows, normalizeMlvHint]);

  const brandOptions = useMemo(
    () => mergeSelectOption(BRAND_OPTIONS_BASE, initialProduct?.brand ?? null),
    [initialProduct]
  );
  const subcategory = [
    { value: "choose", label: "Choose" },
    { value: "lenovo", label: "Lenovo" },
    { value: "electronics", label: "Electronics" },
  ];

  const unit = [
    { value: "choose", label: "Choose" },
    { value: "kg", label: "Kg" },
    { value: "pc", label: "Pc" },
    { value: UNIT_VALUE_JUEGO_SET_COMBO, label: "Juego Set combo" },
  ];
  const showPcsUnit = unitVal?.value === UNIT_VALUE_JUEGO_SET_COMBO;
  const sellingtype = [
    { value: "choose", label: "Choose" },
    { value: "transactionalSelling", label: "Transactional selling" },
    { value: "solutionSelling", label: "Solution selling" },
  ];
  const barcodesymbol = [
    { value: "choose", label: "Choose" },
    { value: "code34", label: "Code34" },
    { value: "code35", label: "Code35" },
    { value: "code36", label: "Code36" },
  ];
  const [pendingImages, setPendingImages] = useState<
    { blob: Blob; preview: string }[]
  >([]);
  const [uploadingImages, setUploadingImages] = useState(false);
  const pendingImagesRef = useRef(pendingImages);
  pendingImagesRef.current = pendingImages;

  /**
   * Slots de galería en Firebase: null = resolviéndose, true = existe, false = no existe.
   * Se resetea cuando cambia el SKU en edición.
   */
  const [resolvedSlots, setResolvedSlots] = useState<Record<number, boolean | null>>({});
  /** URL real resuelta por slot (para el lightbox). */
  const [resolvedUrls, setResolvedUrls] = useState<Record<number, string>>({});
  /** Índices (1-9) marcados para eliminar al guardar. */
  const [markedForDelete, setMarkedForDelete] = useState<Set<number>>(new Set());
  /** Incrementar para forzar re-sondeo de galería tras guardar. */
  const [galleryKey, setGalleryKey] = useState(0);

  /** Estado del lightbox */
  const [lightboxOpen, setLightboxOpen] = useState(false);
  const [lightboxIndex, setLightboxIndex] = useState(0);

  useEffect(() => {
    if (!isEdit) return;
    setResolvedSlots({});
    setResolvedUrls({});
    setMarkedForDelete(new Set());
  }, [sku, isEdit]);

  const handleSlotResolved = useCallback((n: number, has: boolean, url?: string) => {
    setResolvedSlots((prev) => ({ ...prev, [n]: has }));
    if (has && url) setResolvedUrls((prev) => ({ ...prev, [n]: url }));
  }, []);

  const toggleMarkDelete = useCallback((n: number) => {
    setMarkedForDelete((prev) => {
      const next = new Set(prev);
      if (next.has(n)) next.delete(n);
      else next.add(n);
      return next;
    });
  }, []);

  /**
   * Slides para el lightbox: fotos Firebase existentes (orden numérico) + pendientes nuevas.
   */
  const lightboxSlides = useMemo(() => {
    const firebase = Array.from({ length: 9 }, (_, i) => i + 1)
      .filter((n) => resolvedSlots[n] === true && resolvedUrls[n])
      .map((n) => ({ src: resolvedUrls[n], alt: `Foto ${n}` }));
    const pending = pendingImages.map((img, idx) => ({
      src: img.preview,
      alt: `Nueva ${idx + 1}`,
    }));
    return [...firebase, ...pending];
  }, [resolvedSlots, resolvedUrls, pendingImages]);

  const openLightbox = useCallback(
    (src: string) => {
      const idx = lightboxSlides.findIndex((s) => s.src === src);
      setLightboxIndex(idx >= 0 ? idx : 0);
      setLightboxOpen(true);
    },
    [lightboxSlides]
  );

  useEffect(() => {
    return () => {
      pendingImagesRef.current.forEach((p) => URL.revokeObjectURL(p.preview));
    };
  }, []);

  const removePendingAt = (idx: number) => {
    setPendingImages((prev) => {
      const copy = [...prev];
      const removed = copy.splice(idx, 1)[0];
      if (removed) URL.revokeObjectURL(removed.preview);
      return copy;
    });
  };

  const handleImageFiles = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files ? Array.from(e.target.files) : [];
    e.target.value = "";
    if (!files.length) return;

    if (!normalizeInventoryImageKey(sku)) {
      message.warning("Indica el SKU antes de añadir imágenes.");
      return;
    }

    const remaining = 9 - pendingImagesRef.current.length;
    if (remaining <= 0) {
      message.warning("Máximo 9 imágenes.");
      return;
    }

    const part = files.slice(0, remaining);
    const built: { blob: Blob; preview: string }[] = [];
    for (const f of part) {
      try {
        const blob = await fileToWebpBlob(f);
        built.push({ blob, preview: URL.createObjectURL(blob) });
      } catch {
        message.error(`No se pudo convertir a WebP: ${f.name}`);
      }
    }
    if (!built.length) return;

    setPendingImages((p) => {
      const space = 9 - p.length;
      if (space <= 0) {
        built.forEach((b) => URL.revokeObjectURL(b.preview));
        return p;
      }
      const take = built.slice(0, space);
      if (take.length < built.length) {
        built.slice(take.length).forEach((b) => URL.revokeObjectURL(b.preview));
        message.warning("Solo caben 9 imágenes en total.");
      }
      return [...p, ...take];
    });
  };

  const uploadPendingToFirebase = async () => {
    const k = normalizeInventoryImageKey(sku);
    if (!k) {
      message.error("El SKU es obligatorio para nombrar las imágenes.");
      return;
    }
    const hasDelete = markedForDelete.size > 0;
    const hasUpload = pendingImages.length > 0;
    if (!hasDelete && !hasUpload) {
      message.info("No hay cambios de imágenes pendientes.");
      return;
    }

    setUploadingImages(true);
    try {
      // 1. Eliminar los slots marcados
      if (hasDelete) {
        for (const n of Array.from(markedForDelete).sort()) {
          const res = await fetch("/api/inventory/product-images/delete", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ sku: k, index: n }),
          });
          const data = (await res.json().catch(() => ({}))) as {
            error?: { message?: string };
          };
          if (!res.ok) {
            throw new Error(
              data?.error?.message ?? `Error al eliminar foto ${n}`
            );
          }
        }
      }

      // 2. Subir nuevas imágenes
      if (hasUpload) {
        for (let i = 0; i < pendingImages.length; i++) {
          const fd = new FormData();
          fd.append("file", pendingImages[i].blob, `${k}_${i + 1}.webp`);
          fd.append("sku", k);
          fd.append("index", String(i + 1));
          const res = await fetch("/api/inventory/product-images/upload", {
            method: "POST",
            body: fd,
          });
          const data = (await res.json().catch(() => ({}))) as {
            error?: { message?: string };
          };
          if (!res.ok) {
            throw new Error(
              data?.error?.message ?? `Error HTTP ${res.status}`
            );
          }
        }
      }

      const parts: string[] = [];
      if (hasDelete) parts.push(`${markedForDelete.size} foto(s) eliminada(s)`);
      if (hasUpload) parts.push(`${pendingImages.length} foto(s) guardada(s)`);
      message.success(parts.join(" · "));

      pendingImages.forEach((p) => URL.revokeObjectURL(p.preview));
      setPendingImages([]);
      setMarkedForDelete(new Set());
      // Forzar re-sondeo de la galería
      setResolvedSlots({});
      setResolvedUrls({});
      setGalleryKey((k) => k + 1);
    } catch (err) {
      message.error(
        err instanceof Error ? err.message : "Error al guardar imágenes"
      );
    } finally {
      setUploadingImages(false);
    }
  };

  return (
    <>
      <div className="page-wrapper">
        <div className="content">
          <div className="page-header">
            <div className="add-item d-flex">
              <div className="page-title">
                <h4>{isEdit ? "Edit Product" : "Create Product"}</h4>
                <h6>
                  {isEdit
                    ? "Update product details"
                    : "Create new product"}
                </h6>
              </div>
            </div>
            <ul className="table-top-head">
              <RefreshIcon />
              <CollapesIcon />
              <li>
                <div className="page-btn">
                  <Link href={route.productlist} className="btn btn-secondary">
                    <ArrowLeft className="me-2" />
                    Back to Product
                  </Link>
                </div>
              </li>
            </ul>
          </div>
          {loadError ? (
            <Alert type="error" message={loadError} className="mb-3" showIcon />
          ) : null}
          {/* /add */}
          <form
            className="add-product-form"
            onSubmit={(ev) => {
              ev.preventDefault();
              void uploadPendingToFirebase();
            }}
          >
            <div className="add-product">
              <div
                className="accordions-items-seperate"
                id="accordionSpacingExample"
              >
                <div className="accordion-item border mb-4">
                  <h2 className="accordion-header" id="headingSpacingOne">
                    <div
                      className="accordion-button collapsed bg-white"
                      data-bs-toggle="collapse"
                      data-bs-target="#SpacingOne"
                      aria-expanded="true"
                      aria-controls="SpacingOne"
                    >
                      <div className="d-flex align-items-center justify-content-between flex-fill">
                        <h5 className="d-flex align-items-center">
                          <Info className="text-primary me-2" />
                          <span>Product Information</span>
                        </h5>
                      </div>
                    </div>
                  </h2>
                  <div
                    id="SpacingOne"
                    className="accordion-collapse collapse show"
                    aria-labelledby="headingSpacingOne"
                  >
                    <div className="accordion-body border-top">
                      <div className="row">
                        <div className="col-sm-6 col-12">
                          <div className="mb-3">
                            <label className="form-label">
                              Store<span className="text-danger ms-1">*</span>
                            </label>
                            <Select {...reactSelectPortalProps}
                              instanceId="add-product-store"
                              className="react-select"
                              classNamePrefix="react-select"
                              options={STORE_OPTIONS}
                              value={storeVal}
                              onChange={(opt) => {
                                if (STORE_OPTIONS.length > 1) {
                                  setStoreVal(opt);
                                }
                              }}
                              isDisabled={STORE_OPTIONS.length <= 1}
                              isClearable={STORE_OPTIONS.length > 1}
                              placeholder="Choose"
                            />
                          </div>
                        </div>
                        <div className="col-sm-6 col-12">
                          <div className="mb-3">
                            <label className="form-label">
                              Warehouse
                              <span className="text-danger ms-1">*</span>
                            </label>
                            <Select {...reactSelectPortalProps}
                              instanceId="add-product-warehouse"
                              className="react-select"
                              classNamePrefix="react-select"
                              options={WAREHOUSE_OPTIONS}
                              value={warehouseVal}
                              onChange={(opt) => {
                                if (WAREHOUSE_OPTIONS.length > 1) {
                                  setWarehouseVal(opt);
                                }
                              }}
                              isDisabled={WAREHOUSE_OPTIONS.length <= 1}
                              isClearable={WAREHOUSE_OPTIONS.length > 1}
                              placeholder="Choose"
                            />
                          </div>
                        </div>
                      </div>
                      {isEdit ? (
                        <div className="row">
                          <div className="col-sm-6 col-12">
                            <div className="mb-3">
                              <label className="form-label">
                                Product Name
                                <span className="text-danger ms-1">*</span>
                              </label>
                              <input
                                type="text"
                                className="form-control"
                                value={productName}
                                onChange={(e) => setProductName(e.target.value)}
                              />
                            </div>
                          </div>
                          <div className="col-sm-6 col-12">
                            <div className="mb-3">
                              <label className="form-label">
                                SKU<span className="text-danger ms-1">*</span>
                              </label>
                              <input
                                type="text"
                                className="form-control"
                                value={sku}
                                onChange={(e) => setSku(e.target.value)}
                                readOnly
                              />
                            </div>
                          </div>
                        </div>
                      ) : (
                        <>
                          <div className="row">
                            <div className="col-sm-6 col-12">
                              <div className="mb-3">
                                <label className="form-label">
                                  Product Name
                                  <span className="text-danger ms-1">*</span>
                                </label>
                                <input
                                  type="text"
                                  className="form-control"
                                  value={productName}
                                  onChange={(e) => {
                                    const v = e.target.value;
                                    setProductName(v);
                                    setSlug(slugify(v));
                                  }}
                                />
                              </div>
                            </div>
                            <div className="col-sm-6 col-12">
                              <div className="mb-3">
                                <label className="form-label">
                                  Slug<span className="text-danger ms-1">*</span>
                                </label>
                                <input
                                  type="text"
                                  className="form-control"
                                  value={slug}
                                  onChange={(e) => setSlug(e.target.value)}
                                />
                              </div>
                            </div>
                          </div>
                          <div className="row">
                            <div className="col-sm-6 col-12">
                              <div className="mb-3">
                                <label className="form-label">
                                  SKU<span className="text-danger ms-1">*</span>
                                </label>
                                <input
                                  type="text"
                                  className="form-control"
                                  value={sku}
                                  onChange={(e) => setSku(e.target.value)}
                                />
                              </div>
                            </div>
                            <div className="col-sm-6 col-12">
                              <div className="mb-3">
                                <label className="form-label">
                                  Selling Type
                                  <span className="text-danger ms-1">*</span>
                                </label>
                                <Select {...reactSelectPortalProps}
                                  instanceId="add-product-selling-type"
                                  className="react-select"
                                  options={sellingtype}
                                  placeholder="Choose"
                                />
                              </div>
                            </div>
                          </div>
                        </>
                      )}
                      <div className="addservice-info">
                        {categoriesStatus === "error" && categoriesError ? (
                          <Alert
                            type="warning"
                            showIcon
                            className="mb-3"
                            message={categoriesError}
                          />
                        ) : null}
                        <div className="row">
                          <div className="col-sm-6 col-12">
                            <div className="mb-3">
                              <div className="add-newplus">
                                <label
                                  className="form-label"
                                  htmlFor="inventory-category-select"
                                >
                                  Category
                                  <span className="text-danger ms-1">*</span>
                                </label>
                                <Link
                                  href="#"
                                  data-bs-toggle="modal"
                                  data-bs-target="#add-units-category"
                                >
                                  <PlusCircle
                                    size={14}
                                    data-feather="plus-circle"
                                    className="plus-down-add"
                                  />
                                  <span>Add New</span>
                                </Link>
                              </div>
                              <Select {...reactSelectPortalProps}
                                inputId="inventory-category-select"
                                className="react-select"
                                classNamePrefix="react-select"
                                options={categoryOptions}
                                placeholder={
                                  categoriesStatus === "loading"
                                    ? "Cargando categorías…"
                                    : "Choose"
                                }
                                value={categoryVal}
                                onChange={(opt) =>
                                  setCategoryVal(
                                    opt as SelectOption | null
                                  )
                                }
                                isDisabled={categoriesStatus === "loading"}
                                isLoading={categoriesStatus === "loading"}
                              />
                            </div>
                          </div>
                          <div className="col-sm-6 col-12">
                            <div className="mb-3">
                              <label className="form-label">
                                Sub Category
                                <span className="text-danger ms-1">*</span>
                              </label>
                              <Select {...reactSelectPortalProps}
                                instanceId="add-product-subcategory"
                                className="react-select"
                                options={subcategory}
                                placeholder="Choose"
                              />
                            </div>
                          </div>
                        </div>
                      </div>
                      <div className="add-product-new">
                        <div className="row">
                          <div className="col-sm-6 col-12">
                            <div className="mb-3">
                              <div className="add-newplus">
                                <label className="form-label">
                                  Brand
                                  <span className="text-danger ms-1">*</span>
                                </label>
                                <Link
                                  href="#"
                                  data-bs-toggle="modal"
                                  data-bs-target="#add-brand"
                                >
                                  <PlusCircle
                                    size={14}
                                    data-feather="plus-circle"
                                    className="plus-down-add"
                                  />
                                  <span>Add New</span>
                                </Link>
                              </div>
                              <Select {...reactSelectPortalProps}
                                instanceId="add-product-brand"
                                className="react-select"
                                options={brandOptions}
                                placeholder="Choose"
                                value={brandVal}
                                onChange={(opt) =>
                                  setBrandVal(opt as SelectOption | null)
                                }
                              />
                            </div>
                          </div>
                          <div className="col-sm-6 col-12">
                            <div className="mb-3 add-product-observation">
                              <label className="form-label">Observación</label>
                              <textarea
                                className="form-control add-product-observation-input"
                                rows={1}
                                value={description}
                                onChange={(e) => setDescription(e.target.value)}
                              />
                            </div>
                          </div>
                        </div>
                      </div>
                      {!isEdit ? (
                        <div className="row">
                          <div className="col-lg-6 col-sm-6 col-12">
                            <div className="mb-3">
                              <label className="form-label">
                                Barcode Symbology
                                <span className="text-danger ms-1">*</span>
                              </label>
                              <Select {...reactSelectPortalProps}
                                instanceId="add-product-barcode-symbology"
                                className="react-select"
                                options={barcodesymbol}
                                placeholder="Choose"
                              />
                            </div>
                          </div>
                          <div className="col-lg-6 col-sm-6 col-12">
                            <div className="mb-3">
                              <label className="form-label">
                                Item Code
                                <span className="text-danger ms-1">*</span>
                              </label>
                              <input type="text" className="form-control" />
                            </div>
                          </div>
                        </div>
                      ) : null}
                      <div className="row">
                        <div className="col-sm-6 col-12">
                          <div className="mb-3">
                            <div className="add-newplus">
                              <label className="form-label">
                                Unit
                                <span className="text-danger ms-1">*</span>
                              </label>
                            </div>
                            <Select {...reactSelectPortalProps}
                              instanceId="add-product-unit"
                              className="react-select"
                              classNamePrefix="react-select"
                              options={unit}
                              value={unitVal}
                              onChange={(opt) =>
                                setUnitVal(opt as SelectOption | null)
                              }
                              placeholder="Choose"
                            />
                          </div>
                        </div>
                        {showPcsUnit ? (
                          <div
                            className="col-sm-6 col-12"
                            data-field="pcs_unit"
                          >
                            <div className="mb-3">
                              <label className="form-label" htmlFor="pcs_unit">
                                Piezas por Juego
                                <span className="text-danger ms-1">*</span>
                              </label>
                              <Select {...reactSelectPortalProps}
                                instanceId="add-product-pcs-unit"
                                inputId="pcs_unit"
                                className="react-select"
                                classNamePrefix="react-select"
                                options={unit}
                                value={pcsUnitVal}
                                onChange={(opt) =>
                                  setPcsUnitVal(opt as SelectOption | null)
                                }
                                placeholder="Choose"
                              />
                            </div>
                          </div>
                        ) : (
                          <div className="col-sm-6 col-12">
                            <div className="mb-3">
                              <label
                                className="form-label"
                                htmlFor="predicted-ml-category"
                              >
                                Categoria Predicha Mercadolibre
                              </label>
                              <div className="input-group">
                                <input
                                  id="predicted-ml-category"
                                  type="text"
                                  className="form-control"
                                  readOnly
                                  value={predictedMlCategory}
                                  placeholder="Ej. MLV-… (Actualizar tras Category)"
                                />
                                <button
                                  type="button"
                                  className="btn btn-outline-primary"
                                  onClick={() => refreshPredictedMlCategory()}
                                >
                                  Actualizar
                                </button>
                              </div>
                            </div>
                          </div>
                        )}
                      </div>
                      {showPcsUnit ? (
                        <div className="row">
                          <div className="col-12">
                            <div className="mb-3">
                              <label
                                className="form-label"
                                htmlFor="predicted-ml-category"
                              >
                                Categoria Predicha Mercadolibre
                              </label>
                              <div className="input-group">
                                <input
                                  id="predicted-ml-category"
                                  type="text"
                                  className="form-control"
                                  readOnly
                                  value={predictedMlCategory}
                                  placeholder="Ej. MLV-… (Actualizar tras Category)"
                                />
                                <button
                                  type="button"
                                  className="btn btn-outline-primary"
                                  onClick={() => refreshPredictedMlCategory()}
                                >
                                  Actualizar
                                </button>
                              </div>
                            </div>
                          </div>
                        </div>
                      ) : null}
                      <div className="row">
                        <div className="col-lg-4 col-sm-6 col-12">
                          <div className="mb-3">
                            <label className="form-label">
                              Cantidad Ingresar
                              <span className="text-danger ms-1">*</span>
                            </label>
                            <input
                              type="text"
                              className="form-control"
                              value={stockQty}
                              onChange={(e) =>
                                setStockQty(e.target.value)
                              }
                            />
                          </div>
                        </div>
                        <div className="col-lg-4 col-sm-6 col-12">
                          <div className="mb-3">
                            <label className="form-label">
                              Precio costo
                              <span className="text-danger ms-1">*</span>
                            </label>
                            <input
                              type="text"
                              className="form-control"
                              value={unitPrice}
                              onChange={(e) =>
                                setUnitPrice(e.target.value)
                              }
                            />
                          </div>
                        </div>
                        <div className="col-lg-4 col-sm-6 col-12">
                          <div className="mb-3">
                            <label className="form-label">
                              Quantity Alert
                              <span className="text-danger ms-1">*</span>
                            </label>
                            <input
                              type="text"
                              className="form-control"
                              value={stockMin}
                              onChange={(e) =>
                                setStockMin(e.target.value)
                              }
                            />
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
                <div className="accordion-item border mb-4">
                  <h2 className="accordion-header" id="headingSpacingThree">
                    <div
                      className="accordion-button collapsed bg-white"
                      data-bs-toggle="collapse"
                      data-bs-target="#SpacingThree"
                      aria-expanded="true"
                      aria-controls="SpacingThree"
                    >
                      <div className="d-flex align-items-center justify-content-between flex-fill">
                        <h5 className="d-flex align-items-center">
                          <Image
                            data-feather="image"
                            className="text-primary me-2"
                          />
                          <span>Images</span>
                        </h5>
                      </div>
                    </div>
                  </h2>
                  <div
                    id="SpacingThree"
                    className="accordion-collapse collapse show"
                    aria-labelledby="headingSpacingThree"
                  >
                    <div className="accordion-body border-top">
                      <div className="text-editor add-list add">
                        <div className="col-lg-12">
                          {/* ── Galería ── */}
                          <div className="add-choosen add-choosen--product-images">

                            {/* 1 · Botón "Add Images" — siempre primero */}
                            <div className="add-product-image-upload-wrap">
                              <div className="image-upload image-upload-new">
                                <input
                                  type="file"
                                  accept="image/*"
                                  multiple
                                  disabled={
                                    !normalizeInventoryImageKey(sku) ||
                                    uploadingImages
                                  }
                                  onChange={handleImageFiles}
                                />
                                <div className="image-uploads">
                                  <PlusCircle
                                    size={14}
                                    data-feather="plus-circle"
                                    className="plus-down-add me-0"
                                  />
                                  <h4>Add Images</h4>
                                </div>
                              </div>
                            </div>

                            {/* 2 · Fotos existentes en Firebase (solo en edición) */}
                            {isEdit && normalizeInventoryImageKey(sku)
                              ? Array.from({ length: 9 }, (_, i) => {
                                  const n = i + 1;
                                  const skuKey = normalizeInventoryImageKey(sku);
                                  const stem = `${skuKey}_${n}`;
                                  const resolved = resolvedSlots[n] ?? null;
                                  const marked = markedForDelete.has(n);
                                  const fallback = inventoryPosProductFallbackPath(
                                    initialProduct?.id ?? null,
                                    sku
                                  );
                                  return (
                                    /* Oculto mientras resuelve o si no existe */
                                    <div
                                      key={`${stem}-${galleryKey}`}
                                      className="phone-img position-relative"
                                      style={{
                                        display: resolved === true ? undefined : "none",
                                      }}
                                    >
                                      {/* Clic en la imagen → lightbox */}
                                      <button
                                        type="button"
                                        className="border-0 bg-transparent p-0 d-block"
                                        style={{ cursor: "zoom-in" }}
                                        title="Ver imagen ampliada"
                                        onClick={() => {
                                          const url = resolvedUrls[n];
                                          if (url) openLightbox(url);
                                        }}
                                      >
                                        <ProductFirebaseSlotImage
                                          stem={stem}
                                          fallback={fallback}
                                          onResolved={(has, url) =>
                                            handleSlotResolved(n, has, url)
                                          }
                                          className="rounded border"
                                          style={{
                                            width: 96,
                                            height: 96,
                                            objectFit: "cover",
                                            opacity: marked ? 0.4 : 1,
                                            transition: "opacity .2s",
                                          }}
                                          alt={`Foto ${n}`}
                                        />
                                      </button>
                                      {/* Etiqueta "Eliminar" cuando está marcada */}
                                      {marked && (
                                        <div
                                          className="position-absolute top-0 start-0 w-100 d-flex justify-content-center"
                                          style={{ pointerEvents: "none", paddingTop: 6 }}
                                        >
                                          <span className="badge bg-danger">Eliminar</span>
                                        </div>
                                      )}
                                      {/* X para marcar/desmarcar eliminación */}
                                      <Link
                                        href="#"
                                        title={marked ? "Deshacer eliminación" : "Marcar para eliminar"}
                                        onClick={(e) => {
                                          e.preventDefault();
                                          toggleMarkDelete(n);
                                        }}
                                      >
                                        <X
                                          className="x-square-add remove-product"
                                          style={{ color: marked ? "#dc3545" : undefined }}
                                        />
                                      </Link>
                                    </div>
                                  );
                                })
                              : null}

                            {/* 3 · Nuevas imágenes pendientes de subir */}
                            {pendingImages.map((img, idx) => (
                              <div className="phone-img" key={img.preview}>
                                {/* Clic en preview → lightbox */}
                                <button
                                  type="button"
                                  className="border-0 bg-transparent p-0 d-block"
                                  style={{ cursor: "zoom-in" }}
                                  title="Ver imagen ampliada"
                                  onClick={() => openLightbox(img.preview)}
                                >
                                  <img
                                    src={img.preview}
                                    alt={`Vista ${idx + 1}`}
                                    style={{ width: 96, height: 96, objectFit: "cover" }}
                                    className="rounded border"
                                  />
                                </button>
                                <Link href="#" onClick={(e) => e.preventDefault()}>
                                  <X
                                    className="x-square-add remove-product"
                                    onClick={() => removePendingAt(idx)}
                                  />
                                </Link>
                              </div>
                            ))}

                            {!normalizeInventoryImageKey(sku) ? (
                              <p className="text-muted small mt-2 mb-0 add-choosen--product-images-hint w-100">
                                Completa el SKU para habilitar la subida (se
                                guardan como {`SKU_1.webp`}, {`SKU_2.webp`}… en la
                                carpeta del bucket configurada).
                              </p>
                            ) : null}
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
            <div className="col-lg-12">
              <div className="d-flex align-items-center justify-content-end mb-4">
                <button type="button" className="btn btn-secondary me-2">
                  Cancel
                </button>
                <button
                  type="submit"
                  className="btn btn-primary"
                  disabled={uploadingImages}
                >
                  {uploadingImages
                    ? "Subiendo…"
                    : isEdit
                      ? "Save Changes"
                      : "Guardar imágenes (Firebase)"}
                </button>
              </div>
            </div>
          </form>
          {/* /add */}
        </div>
        <CommonFooter />
      </div>
      <Addunits />
      <AddCategory />
      <AddVariant />
      <AddBrand />
      <AddVarientNew />
      <div className="modal fade" id="delete-modal">
        <div className="modal-dialog modal-dialog-centered">
          <div className="modal-content">
            <div className="page-wrapper-new p-0">
              <div className="content p-5 px-3 text-center">
                <span className="rounded-circle d-inline-flex p-2 bg-danger-transparent mb-2">
                  <i className="ti ti-trash fs-24 text-danger"></i>
                </span>
                <h4 className="fs-20 fw-bold mb-2 mt-1">Delete Attribute</h4>
                <p className="mb-0 fs-16">
                  Are you sure you want to delete Attribute?
                </p>
                <div className="modal-footer-btn mt-3 d-flex justify-content-center">
                  <button
                    type="button"
                    className="btn me-2 btn-secondary fs-13 fw-medium p-2 px-3 shadow-none"
                    data-bs-dismiss="modal"
                  >
                    Cancel
                  </button>
                  <button
                    type="button"
                    className="btn btn-primary fs-13 fw-medium p-2 px-3"
                  >
                    Yes Delete
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Lightbox para galería de imágenes (Firebase + pendientes) */}
      <Lightbox
        open={lightboxOpen}
        close={() => setLightboxOpen(false)}
        index={lightboxIndex}
        slides={lightboxSlides}
        on={{ view: ({ index }) => setLightboxIndex(index) }}
      />
    </>
  );
}
