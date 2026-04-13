import { Suspense } from "react";
import { Spin } from "antd";
import ProductDetailsComponent from "@/components/Inventory/productList/productDetails";

export default function ProductDetails() {
  return (
    <Suspense
      fallback={
        <div className="page-wrapper">
          <div className="content p-5 d-flex justify-content-center">
            <Spin size="large" tip="Cargando…" />
          </div>
        </div>
      }
    >
      <ProductDetailsComponent />
    </Suspense>
  );
}
