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
import { ExclamationCircleOutlined } from "@ant-design/icons";
import { Alert, message, Modal, Spin } from "antd";
import {
  ArrowLeft,
  Info,
  PlusCircle,
  X,
  Image,
} from "react-feather";
import Link from "next/link";
import { useRouter } from "next/navigation";
import {
  useCallback,
  useEffect,
  useMemo,
  useRef,
  useState,
  type FormEvent,
} from "react";
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
  /** Nuevo SKU (nomenclatura nueva). Mantener `sku` por compatibilidad. */
  sku_nuevo?: string | null;
  /** SKU histórico/legado. */
  sku_old?: string | null;
  /** OEM de fabricante para búsqueda técnica. */
  oem_original?: string | null;
  barcode?: string | null;
  name: string;
  /** Nombre corto comercial. Mantener `name` por compatibilidad. */
  nombre_corto?: string | null;
  description?: string | null;
  /** Descripción larga e-commerce. Mantener `description` por compatibilidad. */
  descripcion_larga?: string | null;
  category?: string | null;
  category_id?: number | string | null;
  subcategory_id?: number | string | null;
  brand?: string | null;
  brand_id?: number | string | null;
  unit_type?: string | null;
  is_universal?: boolean | null;
  weight?: string | number | null;
  dimensions?: string | null;
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

const SUBCATEGORY_CHOOSE: SelectOption[] = [
  { value: "choose", label: "Choose" },
];

/** Respuesta típica GET /api/inventory/subcategories → opciones react-select. */
function parseSubcategoriesFromApi(body: unknown): SelectOption[] {
  const b = body as {
    data?: { subcategories?: unknown[] };
    subcategories?: unknown[];
  };
  const arr = b?.data?.subcategories ?? b?.subcategories;
  if (!Array.isArray(arr)) return [];
  const out: SelectOption[] = [];
  for (const raw of arr) {
    if (!raw || typeof raw !== "object") continue;
    const o = raw as Record<string, unknown>;
    const id = o.id ?? o.subcategory_id;
    if (id == null) continue;
    const idStr = String(id).trim();
    if (!idStr) continue;
    const labelRaw =
      o.subcategory_descripcion ??
      o.name ??
      o.nombre ??
      o.label ??
      o.descripcion;
    const label =
      typeof labelRaw === "string" && labelRaw.trim()
        ? labelRaw.trim()
        : idStr;
    out.push({ value: idStr, label });
  }
  return out;
}

function categoryParentIdFromSelect(
  categoryVal: SelectOption | null,
  rows: CategoryProductRow[]
): number | null {
  const label = (categoryVal?.label ?? categoryVal?.value ?? "").trim();
  if (!label || label.toLowerCase() === "choose") return null;
  const row = rows.find(
    (r) =>
      (r.category_descripcion ?? "").trim().toLowerCase() ===
      label.toLowerCase()
  );
  return row?.id ?? null;
}

/** category_id del producto o resolución por nombre desde category_products. */
function initialCategoryParentId(
  product: InventoryProductDetail | null,
  rows: CategoryProductRow[]
): number | null {
  const raw = product?.category_id;
  if (raw != null && String(raw).trim() !== "") {
    const n = Number(raw);
    if (Number.isFinite(n) && n > 0) return Math.trunc(n);
  }
  const cat = product?.category?.trim();
  if (!cat || !rows.length) return null;
  const row = rows.find(
    (r) =>
      (r.category_descripcion ?? "").trim().toLowerCase() ===
      cat.toLowerCase()
  );
  return row?.id ?? null;
}

/** Respuesta 409 PATCH …/identity (y duplicado). */
type IdentityConflictPayload = {
  error: { code: string; message: string };
  product_id: number;
  sku: string;
  blocked_fields: string[];
  duplicate_url?: string | null;
};

/**
 * URL local del proxy Next para duplicar.
 * Si `duplicate_url` viene vacío → null (no se muestra botón Duplicar).
 */
function resolveDuplicateFetchPath(
  duplicateUrl: string | null | undefined
): string | null {
  const t = (duplicateUrl ?? "").trim();
  if (!t) return null;
  const rel = /\/api\/inventory\/products\/(\d+)\/duplicate\/?(?:\?.*)?$/i.exec(
    t
  );
  if (rel) return `/api/inventory/products/${rel[1]}/duplicate`;
  try {
    const u = new URL(t);
    const pathRel =
      /\/api\/inventory\/products\/(\d+)\/duplicate\/?$/i.exec(u.pathname);
    if (pathRel) return `/api/inventory/products/${pathRel[1]}/duplicate`;
  } catch {
    if (t.startsWith("/")) return t.split("?")[0] ?? t;
  }
  return null;
}

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

/** Número ≥ 0, `undefined` si vacío, `null` si inválido. */
function parseNonNegativeOptional(raw: string): number | undefined | null {
  const t = raw.trim();
  if (t === "") return undefined;
  const n = Number(t);
  if (Number.isNaN(n) || n < 0) return null;
  return n;
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

const MANUFACTURER_CHOOSE: SelectOption[] = [
  { value: "choose", label: "Choose" },
];

/** Fila de fabricantes (Manufacturers): `name` en BD. */
type ManufacturerRow = {
  id: number;
  name: string;
};

function parseManufacturersFromApi(body: unknown): ManufacturerRow[] {
  const b = body as {
    data?: { manufacturers?: unknown[]; items?: unknown[] };
    manufacturers?: unknown[];
    items?: unknown[];
  };
  const arr =
    b?.data?.manufacturers ??
    b?.data?.items ??
    b?.manufacturers ??
    b?.items ??
    [];
  if (!Array.isArray(arr)) return [];
  const out: ManufacturerRow[] = [];
  for (const raw of arr) {
    if (!raw || typeof raw !== "object") continue;
    const o = raw as Record<string, unknown>;
    const id = o.id ?? o.manufacturer_id;
    const nameRaw = o.name ?? o.manufacturer_name ?? o.label;
    if (id == null || typeof nameRaw !== "string") continue;
    const name = nameRaw.trim();
    if (!name) continue;
    const n = Number(id);
    if (!Number.isFinite(n) || n <= 0) continue;
    out.push({ id: Math.trunc(n), name });
  }
  return out;
}

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
  const router = useRouter();
  const isEdit = mode === "edit";

  const [productName, setProductName] = useState("");
  const [slug, setSlug] = useState("");
  const [sku, setSku] = useState("");
  const [skuNuevo, setSkuNuevo] = useState("");
  const [skuOld, setSkuOld] = useState("");
  const [oemOriginal, setOemOriginal] = useState("");
  const [barcode, setBarcode] = useState("");
  const [nombreCorto, setNombreCorto] = useState("");
  const [description, setDescription] = useState("");
  const [descripcionLarga, setDescripcionLarga] = useState("");
  const [brandId, setBrandId] = useState("");
  const [categoryId, setCategoryId] = useState("");
  const [subcategoryVal, setSubcategoryVal] = useState<SelectOption | null>(
    null
  );
  const [subcategoryOptions, setSubcategoryOptions] = useState<SelectOption[]>(
    () => [...SUBCATEGORY_CHOOSE]
  );
  const [subcategoriesStatus, setSubcategoriesStatus] = useState<
    "idle" | "loading" | "ok" | "error"
  >("idle");
  const [subcategoriesError, setSubcategoriesError] = useState<string | null>(
    null
  );
  const [conflictData, setConflictData] =
    useState<IdentityConflictPayload | null>(null);
  const [showConflictModal, setShowConflictModal] = useState(false);
  const [duplicating, setDuplicating] = useState(false);
  const [unitType, setUnitType] = useState("");
  const [isUniversal, setIsUniversal] = useState(false);
  const [weight, setWeight] = useState("");
  const [dimensions, setDimensions] = useState("");
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
  const [manufacturerRows, setManufacturerRows] = useState<ManufacturerRow[]>(
    []
  );
  const [manufacturersStatus, setManufacturersStatus] = useState<
    "idle" | "loading" | "ok" | "error"
  >("loading");
  const [manufacturersError, setManufacturersError] = useState<string | null>(
    null
  );
  const [manufacturerVal, setManufacturerVal] = useState<SelectOption | null>(
    null
  );
  const [vehicleBrandOptions, setVehicleBrandOptions] = useState<SelectOption[]>(
    [{ value: "choose", label: "Choose" }]
  );
  const [vehicleBrandsStatus, setVehicleBrandsStatus] = useState<
    "idle" | "loading" | "ok" | "error"
  >("loading");
  const [vehicleBrandVal, setVehicleBrandVal] = useState<SelectOption | null>(null);
  const [unitVal, setUnitVal] = useState<SelectOption | null>(null);
  const [pcsUnitVal, setPcsUnitVal] = useState<SelectOption | null>(null);
  /** Filas completas del catálogo (descripción + category_ml para MLV). */
  const [categoryMlRows, setCategoryMlRows] = useState<CategoryProductRow[]>(
    []
  );
  /** Texto mostrado: categoría de publicación ML Venezuela (MLV) asociada al producto. */
  const [predictedMlCategory, setPredictedMlCategory] = useState("");

  useEffect(() => {
    if (!initialProduct) return;
    const name = initialProduct.name ?? "";
    setProductName(name);
    setSlug(slugify(name));
    setSku(initialProduct.sku ?? "");
    setSkuNuevo(initialProduct.sku_nuevo ?? initialProduct.sku ?? "");
    setSkuOld(initialProduct.sku_old ?? "");
    setOemOriginal(initialProduct.oem_original ?? "");
    setBarcode(initialProduct.barcode ?? "");
    setNombreCorto(initialProduct.nombre_corto ?? initialProduct.name ?? "");
    setDescription(initialProduct.description ?? "");
    setDescripcionLarga(
      initialProduct.descripcion_larga ?? initialProduct.description ?? ""
    );
    setBrandId(
      initialProduct.brand_id != null ? String(initialProduct.brand_id) : ""
    );
    setCategoryId(
      initialProduct.category_id != null ? String(initialProduct.category_id) : ""
    );
    setUnitType(initialProduct.unit_type ?? "");
    setIsUniversal(Boolean(initialProduct.is_universal));
    setWeight(initialProduct.weight != null ? String(initialProduct.weight) : "");
    setDimensions(initialProduct.dimensions ?? "");
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

  useEffect(() => {
    let cancelled = false;
    void (async () => {
      setManufacturersStatus("loading");
      setManufacturersError(null);
      try {
        const res = await fetch("/api/inventory/manufacturers", {
          cache: "no-store",
        });
        const body = (await res.json()) as {
          data?: { manufacturers?: unknown[]; items?: unknown[] };
          error?: { message?: string; code?: string };
        };
        if (cancelled) return;
        if (!res.ok) {
          const msg =
            body?.error?.message ||
            body?.error?.code ||
            `Error ${res.status}`;
          throw new Error(msg);
        }
        setManufacturerRows(parseManufacturersFromApi(body));
        setManufacturersStatus("ok");
      } catch (e) {
        if (!cancelled) {
          setManufacturersStatus("error");
          setManufacturersError(
            e instanceof Error ? e.message : "No se pudieron cargar fabricantes"
          );
          setManufacturerRows([]);
        }
      }
    })();
    return () => {
      cancelled = true;
    };
  }, []);

  useEffect(() => {
    let cancelled = false;
    void (async () => {
      setVehicleBrandsStatus("loading");
      try {
        const res = await fetch("/api/inventory/vehicle-brands", {
          cache: "no-store",
        });
        const body = (await res.json()) as
          | unknown[]
          | {
              data?: unknown[] | null;
              items?: unknown[];
              brands?: unknown[];
              error?: { message?: string; code?: string };
            };
        if (cancelled) return;
        if (!res.ok) {
          const err = body as { error?: { message?: string; code?: string } };
          throw new Error(
            err?.error?.message || err?.error?.code || `Error ${res.status}`
          );
        }
        let arr: unknown[] = [];
        if (Array.isArray(body)) {
          arr = body;
        } else {
          const b = body as Record<string, unknown>;
          const d = b.data ?? b.items ?? b.brands;
          arr = Array.isArray(d) ? d : [];
        }
        const opts: SelectOption[] = [{ value: "choose", label: "Choose" }];
        for (const raw of arr) {
          if (!raw || typeof raw !== "object") continue;
          const o = raw as Record<string, unknown>;
          const name = o.name ?? o.brand_name ?? o.label;
          if (typeof name !== "string" || !name.trim()) continue;
          opts.push({ value: name.trim(), label: name.trim() });
        }
        setVehicleBrandOptions(opts);
        setVehicleBrandsStatus("ok");
      } catch (e) {
        if (!cancelled) {
          setVehicleBrandsStatus("error");
          setVehicleBrandOptions([{ value: "choose", label: "Choose" }]);
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

  /** ID de categoría padre: selección actual o producto en edición. */
  const effectiveParentId = useMemo(() => {
    const fromSelect = categoryParentIdFromSelect(
      categoryVal,
      categoryMlRows
    );
    if (fromSelect != null) return fromSelect;
    return initialCategoryParentId(initialProduct, categoryMlRows);
  }, [categoryVal, categoryMlRows, initialProduct]);

  const initialParentId = useMemo(
    () => initialCategoryParentId(initialProduct, categoryMlRows),
    [initialProduct, categoryMlRows]
  );

  useEffect(() => {
    const pid = categoryParentIdFromSelect(categoryVal, categoryMlRows);
    if (pid != null) setCategoryId(String(pid));
  }, [categoryVal, categoryMlRows]);

  useEffect(() => {
    const parentId = effectiveParentId;
    if (!parentId) {
      setSubcategoryOptions([...SUBCATEGORY_CHOOSE]);
      setSubcategoryVal(null);
      setSubcategoriesStatus("idle");
      setSubcategoriesError(null);
      return;
    }
    let cancelled = false;
    void (async () => {
      setSubcategoriesStatus("loading");
      setSubcategoriesError(null);
      try {
        const res = await fetch(
          `/api/inventory/subcategories?category_id=${encodeURIComponent(String(parentId))}`,
          { cache: "no-store" }
        );
        const body = (await res.json()) as {
          data?: { subcategories?: unknown[] };
          error?: { message?: string; code?: string };
          subcategories?: unknown[];
        };
        if (cancelled) return;
        if (!res.ok) {
          const msg =
            body?.error?.message ||
            body?.error?.code ||
            `Error ${res.status}`;
          throw new Error(msg);
        }
        const parsed = parseSubcategoriesFromApi(body);
        const opts =
          parsed.length > 0
            ? [...SUBCATEGORY_CHOOSE, ...parsed]
            : [...SUBCATEGORY_CHOOSE];
        setSubcategoryOptions(opts);
        const restoreSub =
          initialParentId != null &&
          parentId === initialParentId &&
          initialProduct?.subcategory_id != null;
        if (restoreSub) {
          const sid = String(initialProduct.subcategory_id).trim();
          const found = parsed.find((o) => o.value === sid);
          setSubcategoryVal(
            found ?? (sid ? { value: sid, label: sid } : null)
          );
        } else {
          setSubcategoryVal(null);
        }
        setSubcategoriesStatus("ok");
      } catch (e) {
        if (!cancelled) {
          setSubcategoriesStatus("error");
          setSubcategoriesError(
            e instanceof Error ? e.message : "Subcategorías no disponibles"
          );
          setSubcategoryOptions([...SUBCATEGORY_CHOOSE]);
          setSubcategoryVal(null);
        }
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [
    effectiveParentId,
    initialParentId,
    initialProduct?.id,
    initialProduct?.subcategory_id,
  ]);

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

  const manufacturerOptions = useMemo(() => {
    const base: SelectOption[] = [...MANUFACTURER_CHOOSE];
    const seen = new Set(base.map((o) => o.value));
    for (const r of manufacturerRows) {
      const v = String(r.id);
      if (!seen.has(v)) {
        seen.add(v);
        base.push({ value: v, label: r.name });
      }
    }
    const bid = initialProduct?.brand_id;
    const orphanLabel = initialProduct?.brand?.trim();
    if (bid != null && orphanLabel && !seen.has(String(bid))) {
      base.push({ value: String(bid), label: orphanLabel });
    }
    return base;
  }, [manufacturerRows, initialProduct?.brand_id, initialProduct?.brand]);

  useEffect(() => {
    if (manufacturersStatus !== "ok") return;
    if (!manufacturerRows.length || !initialProduct) return;
    const bid = initialProduct.brand_id;
    if (bid != null) {
      const row = manufacturerRows.find((r) => String(r.id) === String(bid));
      if (row) {
        setManufacturerVal({ value: String(row.id), label: row.name });
        setBrandId(String(row.id));
        setBrandVal({ value: row.name, label: row.name });
        return;
      }
    }
    const nm = initialProduct.brand?.trim();
    if (nm) {
      const row = manufacturerRows.find(
        (r) => r.name.trim().toLowerCase() === nm.toLowerCase()
      );
      if (row) {
        setManufacturerVal({ value: String(row.id), label: row.name });
        setBrandId(String(row.id));
        setBrandVal({ value: row.name, label: row.name });
      }
    }
  }, [
    initialProduct?.id,
    initialProduct?.brand_id,
    initialProduct?.brand,
    manufacturerRows,
    manufacturersStatus,
  ]);

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
  /** Guardado PATCH a BD + pipeline de imágenes (modo edición). */
  const [isSaving, setIsSaving] = useState(false);
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

  const uploadPendingToFirebase = async (opts?: {
    /** Si true, no muestra aviso cuando no hay cambios de imagen (p. ej. tras guardar solo datos en BD). */
    skipNoopMessage?: boolean;
  }) => {
    const k = normalizeInventoryImageKey(sku);
    if (!k) {
      message.error("El SKU es obligatorio para nombrar las imágenes.");
      return;
    }
    const hasDelete = markedForDelete.size > 0;
    const hasUpload = pendingImages.length > 0;
    if (!hasDelete && !hasUpload) {
      if (!opts?.skipNoopMessage) {
        message.info("No hay cambios de imágenes pendientes.");
      }
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

  const saveIdentityFields = async (
    productId: number,
    fields: {
      brand_id?: number;
      subcategory_id?: number;
      category_id?: number;
    }
  ): Promise<{ ok: boolean; conflict: boolean }> => {
    const res = await fetch(`/api/inventory/products/${productId}/identity`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(fields),
      cache: "no-store",
    });

    const rawText = await res.text();
    let parsed = {} as IdentityConflictPayload & {
      error?: { message?: string; code?: string };
    };
    if (rawText.trim()) {
      try {
        parsed = JSON.parse(rawText) as typeof parsed;
      } catch {
        parsed = {} as typeof parsed;
      }
    }

    if (res.status === 409) {
      setConflictData(parsed as IdentityConflictPayload);
      setShowConflictModal(true);
      return { ok: false, conflict: true };
    }

    if (!res.ok) {
      throw new Error(
        parsed.error?.message ?? "Error al actualizar identidad del producto"
      );
    }

    return { ok: true, conflict: false };
  };

  const handleDuplicate = async () => {
    if (!conflictData) return;
    const path = resolveDuplicateFetchPath(conflictData.duplicate_url);
    if (!path) return;
    setDuplicating(true);
    try {
      const res = await fetch(path, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: "{}",
        cache: "no-store",
      });
      if (!res.ok) {
        throw new Error("Error al duplicar el producto");
      }
      const raw = (await res.json()) as {
        data?: { id?: number; sku?: string };
        id?: number;
        sku?: string;
      };
      const newProduct = raw.data ?? raw;
      const newId = newProduct.id;
      const newSku = newProduct.sku ?? "";
      if (newId == null || !Number.isFinite(Number(newId))) {
        throw new Error("Respuesta de duplicado sin id válido");
      }
      setShowConflictModal(false);
      setConflictData(null);
      message.success({
        content: `Duplicado creado: ${newSku} — está inactivo, editalo antes de activar.`,
        duration: 6,
      });
      router.push(`${all_routes.editproduct}?id=${String(newId)}`);
    } catch (err) {
      message.error(
        err instanceof Error
          ? err.message
          : "No se pudo duplicar. Intentá de nuevo."
      );
    } finally {
      setDuplicating(false);
    }
  };

  const saveEditProductToDb = async () => {
    const id = initialProduct?.id;
    if (id == null || !Number.isFinite(Number(id))) {
      throw new Error("Falta ID del producto.");
    }
    const name = productName.trim();
    if (!name) {
      message.error("El nombre del producto es obligatorio.");
      throw new Error("VALIDATION");
    }
    if (oemOriginal.trim() === "") {
      message.error("El OEM es obligatorio.");
      throw new Error("VALIDATION");
    }
    if (
      !manufacturerVal ||
      String(manufacturerVal.value).toLowerCase() === "choose"
    ) {
      message.error("La marca del producto es obligatoria.");
      throw new Error("VALIDATION");
    }
    const unit = parseNonNegativeOptional(unitPrice);
    const sq = parseNonNegativeOptional(stockQty);
    const sm = parseNonNegativeOptional(stockMin);
    if (unit === null) {
      message.error("Precio costo inválido.");
      throw new Error("VALIDATION");
    }
    if (sq === null) {
      message.error("Cantidad inválida.");
      throw new Error("VALIDATION");
    }
    if (sm === null) {
      message.error("Quantity Alert inválido.");
      throw new Error("VALIDATION");
    }

    const category =
      categoryVal &&
      String(categoryVal.value).toLowerCase() !== "choose" &&
      String(categoryVal.label || categoryVal.value).trim()
        ? String(categoryVal.label || categoryVal.value).trim()
        : null;
    const brand =
      brandVal &&
      String(brandVal.value).toLowerCase() !== "choose" &&
      String(brandVal.label || brandVal.value).trim()
        ? String(brandVal.label || brandVal.value).trim()
        : null;

    const body: Record<string, unknown> = {
      name,
      description: description.trim() === "" ? null : description.trim(),
      category,
      brand,
    };
    if (skuNuevo.trim() !== "") body.sku_nuevo = skuNuevo.trim();
    if (skuOld.trim() !== "") body.sku_old = skuOld.trim();
    body.oem_original =
      oemOriginal.trim() === "" ? null : oemOriginal.trim();
    if (barcode.trim() !== "") body.barcode = barcode.trim();
    if (nombreCorto.trim() !== "") body.nombre_corto = nombreCorto.trim();
    if (descripcionLarga.trim() !== "") {
      body.descripcion_larga = descripcionLarga.trim();
    }
    if (brandId.trim() !== "") body.brand_id = brandId.trim();
    if (categoryId.trim() !== "") body.category_id = categoryId.trim();
    const subRaw = subcategoryVal?.value?.trim();
    if (
      subRaw &&
      subRaw.toLowerCase() !== "choose"
    ) {
      body.subcategory_id = subRaw;
    }
    if (unitType.trim() !== "") body.unit_type = unitType.trim();
    body.is_universal = Boolean(isUniversal);
    if (weight.trim() !== "") body.weight = weight.trim();
    if (dimensions.trim() !== "") body.dimensions = dimensions.trim();
    if (unit !== undefined) body.unit_price_usd = unit;
    if (sq !== undefined) body.stock_qty = sq;
    if (sm !== undefined) body.stock_min = sm;

    const res = await fetch(`/api/inventory/products/${id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(body),
      cache: "no-store",
    });
    let parsed: { data?: unknown; error?: { message?: string } };
    try {
      parsed = (await res.json()) as typeof parsed;
    } catch {
      throw new Error("Respuesta no JSON del servidor");
    }
    if (!res.ok) {
      throw new Error(
        parsed.error?.message ?? `Error al guardar producto (${res.status})`
      );
    }
    message.success("Datos del producto guardados en el servidor.");
  };

  const handleFormSubmit = async (ev: FormEvent) => {
    ev.preventDefault();
    if (isEdit && initialProduct?.id != null) {
      setIsSaving(true);
      try {
        const productId = initialProduct.id;
        const identityFields: Record<string, number> = {};
        const bi = Number(brandId.trim());
        if (brandId.trim() !== "" && Number.isFinite(bi) && bi > 0) {
          identityFields.brand_id = Math.trunc(bi);
        }
        const ci = Number(categoryId.trim());
        if (categoryId.trim() !== "" && Number.isFinite(ci) && ci > 0) {
          identityFields.category_id = Math.trunc(ci);
        }
        const subRaw = subcategoryVal?.value?.trim();
        if (
          subRaw &&
          subRaw.toLowerCase() !== "choose" &&
          Number.isFinite(Number(subRaw)) &&
          Number(subRaw) > 0
        ) {
          identityFields.subcategory_id = Math.trunc(Number(subRaw));
        }

        if (Object.keys(identityFields).length > 0) {
          try {
            const result = await saveIdentityFields(
              productId,
              identityFields as {
                brand_id?: number;
                subcategory_id?: number;
                category_id?: number;
              }
            );
            if (result.conflict) {
              return;
            }
          } catch (err) {
            if (err instanceof Error) {
              message.error(err.message);
            } else {
              message.error("Error al actualizar identidad del producto");
            }
            return;
          }
        }

        await saveEditProductToDb();
        await uploadPendingToFirebase({ skipNoopMessage: true });
      } catch (e) {
        if (e instanceof Error && e.message !== "VALIDATION") {
          message.error(e.message);
        }
      } finally {
        setIsSaving(false);
      }
      return;
    }
    void uploadPendingToFirebase();
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
          <form className="add-product-form" onSubmit={handleFormSubmit}>
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
                        <div className="col-sm-4 col-12">
                          <div className="mb-3">
                            <label className="form-label" htmlFor="inventory-oem-original">
                              OEM
                              <span className="text-danger ms-1">*</span>
                            </label>
                            <input
                              id="inventory-oem-original"
                              type="text"
                              className="form-control"
                              value={oemOriginal}
                              onChange={(e) => setOemOriginal(e.target.value)}
                              placeholder="Código OEM de fabricante"
                              autoComplete="off"
                            />
                          </div>
                        </div>
                        <div className="col-sm-4 col-12">
                          <div className="mb-3">
                            <label
                              className="form-label"
                              htmlFor="inventory-vehicle-brand-select"
                            >
                              Marca de vehículo
                            </label>
                            <Select {...reactSelectPortalProps}
                              inputId="inventory-vehicle-brand-select"
                              instanceId="add-product-vehicle-brand"
                              className="react-select"
                              classNamePrefix="react-select"
                              options={vehicleBrandOptions}
                              placeholder={
                                vehicleBrandsStatus === "loading"
                                  ? "Cargando marcas…"
                                  : "Choose"
                              }
                              value={vehicleBrandVal}
                              onChange={(opt) =>
                                setVehicleBrandVal(opt as SelectOption | null)
                              }
                              isDisabled={vehicleBrandsStatus === "loading"}
                              isLoading={vehicleBrandsStatus === "loading"}
                              isClearable
                            />
                          </div>
                        </div>
                        <div className="col-sm-4 col-12">
                          <div className="mb-3">
                            <div className="add-newplus">
                              <label
                                className="form-label"
                                htmlFor="inventory-manufacturer-select"
                              >
                                Marca del producto
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
                              inputId="inventory-manufacturer-select"
                              instanceId="add-product-manufacturer"
                              className="react-select"
                              classNamePrefix="react-select"
                              options={manufacturerOptions}
                              placeholder={
                                manufacturersStatus === "loading"
                                  ? "Cargando marcas…"
                                  : "Choose"
                              }
                              value={manufacturerVal}
                              onChange={(opt) => {
                                const o = opt as SelectOption | null;
                                setManufacturerVal(o);
                                if (
                                  !o ||
                                  String(o.value).toLowerCase() === "choose"
                                ) {
                                  setBrandId("");
                                  setBrandVal(null);
                                  return;
                                }
                                setBrandId(String(o.value));
                                setBrandVal({
                                  value: String(o.label),
                                  label: String(o.label),
                                });
                              }}
                              isDisabled={manufacturersStatus === "loading"}
                              isLoading={manufacturersStatus === "loading"}
                            />
                          </div>
                        </div>
                      </div>
                      {isEdit ? (
                        <div className="row">
                          <div className="col-sm-4 col-12">
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
                          <div className="col-sm-4 col-12">
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
                          <div className="col-sm-4 col-12">
                            <div className="mb-3">
                              <label className="form-label">SKU_FILEMAKER</label>
                              <input
                                type="text"
                                className="form-control"
                                value={skuOld}
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
                        {subcategoriesStatus === "error" && subcategoriesError ? (
                          <Alert
                            type="warning"
                            showIcon
                            className="mb-3"
                            message={`Subcategorías: ${subcategoriesError}`}
                          />
                        ) : null}
                        {manufacturersStatus === "error" && manufacturersError ? (
                          <Alert
                            type="warning"
                            showIcon
                            className="mb-3"
                            message={`Fabricantes: ${manufacturersError}`}
                          />
                        ) : null}
                        <div className="row">
                          <div className="col-sm-4 col-12">
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
                          <div className="col-sm-4 col-12">
                            <div className="mb-3">
                              <label className="form-label">
                                Sub Category
                                <span className="text-danger ms-1">*</span>
                              </label>
                              <Select {...reactSelectPortalProps}
                                instanceId="add-product-subcategory"
                                className="react-select"
                                classNamePrefix="react-select"
                                options={subcategoryOptions}
                                placeholder={
                                  !effectiveParentId
                                    ? "Elige una categoría primero"
                                    : subcategoriesStatus === "loading"
                                      ? "Cargando subcategorías…"
                                      : "Choose"
                                }
                                value={subcategoryVal}
                                onChange={(opt) =>
                                  setSubcategoryVal(opt as SelectOption | null)
                                }
                                isDisabled={
                                  !effectiveParentId ||
                                  subcategoriesStatus === "loading"
                                }
                                isLoading={subcategoriesStatus === "loading"}
                              />
                            </div>
                          </div>
                          <div className="col-sm-4 col-12">
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
                                  placeholder="Ej. MLV-…"
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
                      </div>
                      <div className="add-product-new">
                        <div className="row">
                          <div className="col-12">
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
                        ) : null}
                      </div>
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
                                  const oldKey = normalizeInventoryImageKey(skuOld);
                                  const stem = `${skuKey}_${n}`;
                                  const stemAlt =
                                    oldKey && oldKey !== skuKey
                                      ? `${oldKey}_${n}`
                                      : undefined;
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
                                          stemAlt={stemAlt}
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
                  disabled={uploadingImages || isSaving}
                >
                  {uploadingImages || isSaving
                    ? isEdit
                      ? "Guardando…"
                      : "Subiendo…"
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

      <Modal
        open={showConflictModal}
        onCancel={() => {
          if (duplicating) return;
          setShowConflictModal(false);
          setConflictData(null);
        }}
        footer={null}
        centered
        width={480}
        closable={!duplicating}
        maskClosable={!duplicating}
        title={null}
      >
        {conflictData ? (
          <div style={{ padding: "8px 0" }}>
            <div
              style={{
                display: "flex",
                alignItems: "center",
                gap: 12,
                marginBottom: 16,
              }}
            >
              <ExclamationCircleOutlined
                style={{ fontSize: 24, color: "#faad14" }}
              />
              <h3 style={{ margin: 0, fontSize: 16, fontWeight: 600 }}>
                No se puede cambiar la identidad del producto
              </h3>
            </div>

            <p style={{ color: "#595959", marginBottom: 12 }}>
              El producto <strong>{conflictData.sku}</strong> tiene movimientos
              registrados. Su marca, subcategoría y categoría no pueden
              modificarse.
            </p>

            <Alert
              type="info"
              showIcon
              message="¿Qué podés hacer?"
              description="Duplicá el producto para crear uno nuevo con los datos corregidos. El duplicado nace inactivo — editalo y activalo cuando esté listo."
              style={{ marginBottom: 20 }}
            />

            <p style={{ fontSize: 12, color: "#8c8c8c", marginBottom: 20 }}>
              SKU bloqueado: {conflictData.sku} · ID: {conflictData.product_id}
            </p>

            <div
              style={{
                display: "flex",
                gap: 8,
                justifyContent: "flex-end",
              }}
            >
              <button
                type="button"
                className="btn btn-secondary btn-sm"
                onClick={() => {
                  if (duplicating) return;
                  setShowConflictModal(false);
                  setConflictData(null);
                }}
                disabled={duplicating}
              >
                Cancelar
              </button>
              {resolveDuplicateFetchPath(conflictData.duplicate_url) ? (
                <button
                  type="button"
                  className="btn btn-primary btn-sm"
                  onClick={() => void handleDuplicate()}
                  disabled={duplicating}
                >
                  {duplicating ? (
                    <>
                      <Spin size="small" style={{ marginRight: 6 }} />
                      Duplicando…
                    </>
                  ) : (
                    "Duplicar producto"
                  )}
                </button>
              ) : null}
            </div>
          </div>
        ) : null}
      </Modal>
    </>
  );
}
