"use client";

import { Suspense, useEffect, useState } from "react";
import { useSearchParams } from "next/navigation";
import { Alert, Spin } from "antd";
import AddProductComponent, {
  type InventoryProductDetail,
} from "@/components/Inventory/add-product/addproduct";

function EditProductInner() {
  const searchParams = useSearchParams();
  const id = searchParams.get("id");
  const [product, setProduct] = useState<InventoryProductDetail | null>(null);
  const [loadError, setLoadError] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!id || !/^\d+$/.test(id)) {
      setLoadError(
        "Falta un id válido en la URL. Usa /edit-product?id=123 desde la lista."
      );
      setLoading(false);
      return;
    }

    let cancelled = false;
    (async () => {
      try {
        const res = await fetch(`/api/inventory/products/${id}`, {
          cache: "no-store",
        });
        const body = (await res.json()) as {
          data?: InventoryProductDetail;
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
        setLoadError(null);
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

  if (loading) {
    return (
      <div className="page-wrapper p-5 d-flex justify-content-center">
        <Spin size="large" tip="Cargando producto…" />
      </div>
    );
  }

  return (
    <AddProductComponent
      mode="edit"
      initialProduct={product}
      loadError={loadError}
    />
  );
}

export default function EditProductPage() {
  return (
    <Suspense
      fallback={
        <div className="page-wrapper p-5 d-flex justify-content-center">
          <Spin size="large" tip="Cargando…" />
        </div>
      }
    >
      <EditProductInner />
    </Suspense>
  );
}
